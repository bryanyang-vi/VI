"""
DE BOLLOBO'S — filmkwaliteit in Blender (Cycles)

Bouwt een Bollobo volledig procedureel op:
  * één doorlopend, organisch lijf (metaballs -> mesh), geen naden
  * een mond die echt in het gezicht is uitgesneden (boolean)
  * vacht met echte haren (particle hair, ~100k strengen), kort op het gezicht
  * ogen met iris, pupil en een glazen hoornvlies, oogleden voor expressie
  * kleren uit stof (breisel, strepen), rugzak, bril, pluimen, hoorntjes

Assen: Z omhoog, de figuur kijkt naar -Y. Voeten op z = 0, figuur ±2,6 hoog.
"""

import math
import bmesh
import bpy
from mathutils import Matrix, Quaternion, Vector

# ---------------------------------------------------------------------------
# Specificaties (naar de officiële tekeningen)
# ---------------------------------------------------------------------------
SPECS = {
    "paars": dict(
        fur=(0.62, 0.50, 0.86), fur_tip=(0.86, 0.80, 0.98), fur_dark=(0.38, 0.28, 0.62),
        iris=(0.32, 0.18, 0.08), head=1.0,
        horns=(0.66, 0.86, 0.96), top_tuft=[(1.0, 0.80, 0.15)] * 2,
        side_tufts=dict(color=(0.94, 0.96, 1.0), whiskers=True),
        torso=dict(kind="sweater", color=(0.66, 0.20, 0.13), belt=(1.0, 0.76, 0.12)),
        fangs=True,
    ),
    "oranje": dict(
        fur=(0.93, 0.56, 0.10), fur_tip=(1.0, 0.80, 0.38), fur_dark=(0.66, 0.34, 0.04),
        iris=(0.32, 0.18, 0.08), head=1.0,
        top_tuft=[(1.0, 0.82, 0.18)] * 3, side_tufts=dict(color=(1.0, 0.82, 0.18), whiskers=False),
        glasses=(0.38, 0.14, 0.36),
        torso=dict(kind="shirt", color=(1.0, 0.80, 0.20), stripe=(0.95, 0.62, 0.08)),
        backpack=(0.34, 0.14, 0.42), fangs=True,
    ),
    "kleuter": dict(
        fur=(0.33, 0.78, 0.70), fur_tip=(0.68, 0.95, 0.88), fur_dark=(0.15, 0.50, 0.45),
        iris=(0.30, 0.17, 0.08), head=1.14,
        horns=(0.58, 0.90, 0.83),
        top_tuft=[(0.95, 0.30, 0.28), (1.0, 0.58, 0.10), (1.0, 0.84, 0.20), (0.50, 0.80, 0.18), (0.22, 0.52, 1.0), (0.60, 0.36, 0.90)],
        side_tufts=dict(color=(0.34, 0.24, 0.56), whiskers=True),
        torso=dict(kind="coat", color=(0.94, 0.52, 0.14), stripe=(0.98, 0.70, 0.30), inner=(1.0, 0.84, 0.28)),
        fangs=False,
    ),
}

DEFAULT_POSE = dict(
    arm_l=0.25, arm_r=0.25, reach_l=0.15, reach_r=0.15, bend_l=0.35, bend_r=0.35,
    stride=0.0, mouth="smile", look=(0.0, 0.0), lids="open", brows="none",
    head_turn=0.0, head_tilt=0.0, lean=0.0,
)


# ---------------------------------------------------------------------------
# Hulpfuncties
# ---------------------------------------------------------------------------
def link(obj, coll):
    coll.objects.link(obj)
    return obj


def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m


def principled(m):
    return m.node_tree.nodes.get("Principled BSDF")


def set_input(node, names, value):
    for n in names if isinstance(names, (list, tuple)) else [names]:
        if n in node.inputs:
            node.inputs[n].default_value = value
            return True
    return False


def mat_basic(name, color, rough=0.5, coat=0.0, sss=0.0, sheen=0.0, metallic=0.0, emission=None, transmission=0.0, ior=1.45, alpha=1.0):
    m = new_mat(name)
    p = principled(m)
    set_input(p, "Base Color", (*color, 1.0))
    set_input(p, "Roughness", rough)
    set_input(p, "Metallic", metallic)
    set_input(p, ["Coat Weight", "Clearcoat"], coat)
    set_input(p, ["Subsurface Weight", "Subsurface"], sss)
    if sss:
        set_input(p, "Subsurface Radius", (0.3, 0.15, 0.08))
        set_input(p, "Subsurface Scale", 0.05)
    set_input(p, ["Sheen Weight", "Sheen"], sheen)
    set_input(p, ["Transmission Weight", "Transmission"], transmission)
    set_input(p, "IOR", ior)
    set_input(p, "Alpha", alpha)
    if emission is not None:
        set_input(p, ["Emission Color", "Emission"], (*emission[0], 1.0))
        set_input(p, "Emission Strength", emission[1])
    return m


def ellipsoid_mesh(name, radii, segs=48, rings=32, hemi=None):
    """UV-bol als mesh; hemi='top'/'bottom' houdt de helft (in lokale z)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=1.0)
    if hemi:
        kill = [v for v in bm.verts if (v.co.z < -1e-4 if hemi == "top" else v.co.z > 1e-4)]
        bmesh.ops.delete(bm, geom=kill, context="VERTS")
    bmesh.ops.scale(bm, vec=Vector(radii), verts=bm.verts)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return me


def obj_from_mesh(name, me, coll, mat=None, loc=(0, 0, 0), rot=None, parent=None):
    o = bpy.data.objects.new(name, me)
    link(o, coll)
    if mat:
        o.data.materials.append(mat)
    o.location = loc
    if rot is not None:
        o.rotation_mode = "QUATERNION"
        o.rotation_quaternion = rot
    if parent:
        o.parent = parent
    return o


def tube_between(name, p0, p1, r0, r1, coll, mat, segs=32, cap=True):
    """Afgeronde, taps toelopende buis tussen twee punten (mouw, steeltje)."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    L = d.length
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=segs, radius1=r0, radius2=r1, depth=L)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    o = obj_from_mesh(name, me, coll, mat, loc=(p0 + p1) / 2, rot=q)
    return o


def add_subsurf(o, levels=2):
    m = o.modifiers.new("subsurf", "SUBSURF")
    m.levels = 1
    m.render_levels = levels
    return m


def lathe_mesh(name, profile, segs=72, angle=2 * math.pi, start=0.0):
    """Draai een (r, z)-profiel rond de z-as (romp, trui, jas)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    closed = abs(angle - 2 * math.pi) < 1e-6
    n = segs if closed else segs + 1
    for i in range(n):
        a = start + angle * i / segs
        ring = [bm.verts.new((r * math.sin(a), -r * math.cos(a), z)) for (r, z) in profile]
        rings.append(ring)
    for i in range(n if closed else n - 1):
        a, b = rings[i], rings[(i + 1) % n]
        for j in range(len(profile) - 1):
            bm.faces.new((a[j], b[j], b[j + 1], a[j + 1]))
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    return me


# ---------------------------------------------------------------------------
# Materialen
# ---------------------------------------------------------------------------
def hair_material(name, color, tip, dark):
    m = new_mat(name)
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    hair = nt.nodes.new("ShaderNodeBsdfHairPrincipled")
    try:
        hair.parametrization = "COLOR"
    except Exception:
        pass
    info = nt.nodes.new("ShaderNodeHairInfo")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*[c * 0.55 for c in dark], 1)
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[1].color = (*tip, 1)
    ramp.color_ramp.elements[1].position = 1.0
    mid = ramp.color_ramp.elements.new(0.45)
    mid.color = (*color, 1)
    nt.links.new(info.outputs["Intercept"], ramp.inputs["Fac"])
    # kleine variatie per haar
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 0.25
    hsv = nt.nodes.new("ShaderNodeValToRGB")
    hsv.color_ramp.elements[0].color = (0.8, 0.8, 0.8, 1)
    hsv.color_ramp.elements[1].color = (1.1, 1.1, 1.1, 1)
    nt.links.new(info.outputs["Random"], hsv.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], mix.inputs[6])
    nt.links.new(hsv.outputs["Color"], mix.inputs[7])
    nt.links.new(mix.outputs[2], hair.inputs["Color"])
    set_input(hair, "Roughness", 0.42)
    set_input(hair, "Radial Roughness", 0.6)
    set_input(hair, "Coat", 0.05)
    nt.links.new(hair.outputs[0], out.inputs["Surface"])
    return m


def knit_material(name, color, stripe=None, stripe_axis="Z", stripe_scale=7.0):
    """Stof met breisel (rib) en optioneel strepen."""
    m = mat_basic(name, color, rough=0.85, sheen=0.6)
    nt = m.node_tree
    p = principled(m)
    tex = nt.nodes.new("ShaderNodeTexCoord")
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    wave.inputs["Scale"].default_value = 60.0
    wave.inputs["Distortion"].default_value = 1.5
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    bump.inputs["Distance"].default_value = 0.01
    nt.links.new(tex.outputs["Generated"], wave.inputs["Vector"])
    nt.links.new(wave.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    if stripe is not None:
        w2 = nt.nodes.new("ShaderNodeTexWave")
        w2.wave_type = "BANDS"
        w2.bands_direction = stripe_axis
        w2.inputs["Scale"].default_value = stripe_scale
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.interpolation = "CONSTANT"
        ramp.color_ramp.elements[0].color = (*color, 1)
        ramp.color_ramp.elements[1].position = 0.55
        ramp.color_ramp.elements[1].color = (*stripe, 1)
        obj = nt.nodes.new("ShaderNodeTexCoord")
        nt.links.new(obj.outputs["Object"], w2.inputs["Vector"])
        nt.links.new(w2.outputs["Fac"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
    return m


def eye_material(name, iris):
    """Oogwit met iris + pupil, getekend in objectcoördinaten (kijkt naar -Y)."""
    m = mat_basic(name, (0.95, 0.95, 0.93), rough=0.25, sss=0.1)
    nt = m.node_tree
    p = principled(m)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    # afstand tot de kijkas (x, z) en enkel aan de voorkant (y < 0)
    sx = nt.nodes.new("ShaderNodeMath"); sx.operation = "MULTIPLY"
    sz = nt.nodes.new("ShaderNodeMath"); sz.operation = "MULTIPLY"
    nt.links.new(sep.outputs[0], sx.inputs[0]); nt.links.new(sep.outputs[0], sx.inputs[1])
    nt.links.new(sep.outputs[2], sz.inputs[0]); nt.links.new(sep.outputs[2], sz.inputs[1])
    add = nt.nodes.new("ShaderNodeMath"); add.operation = "ADD"
    nt.links.new(sx.outputs[0], add.inputs[0]); nt.links.new(sz.outputs[0], add.inputs[1])
    sq = nt.nodes.new("ShaderNodeMath"); sq.operation = "SQRT"
    nt.links.new(add.outputs[0], sq.inputs[0])
    front = nt.nodes.new("ShaderNodeMath"); front.operation = "LESS_THAN"; front.inputs[1].default_value = 0.0
    nt.links.new(sep.outputs[1], front.inputs[0])
    # radiale streepjes in de iris
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 18.0
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position = 0.0; els[0].color = (0.005, 0.005, 0.01, 1)        # pupil
    e = els.new(0.36); e.color = (0.005, 0.005, 0.01, 1)
    e = els.new(0.40); e.color = (*[c * 1.6 for c in iris], 1)          # iris binnen (licht)
    e = els.new(0.70); e.color = (*[c * 0.7 for c in iris], 1)          # iris rand (donker)
    e = els.new(0.74); e.color = (0.02, 0.015, 0.01, 1)                 # limbusring
    els[1].position = 0.80; els[1].color = (0.95, 0.95, 0.93, 1)        # oogwit
    mapr = nt.nodes.new("ShaderNodeMapRange")
    mapr.inputs["From Min"].default_value = 0.0
    mapr.inputs["From Max"].default_value = 1.0
    nt.links.new(sq.outputs[0], mapr.inputs["Value"])
    # ruis een klein beetje mee mengen in de iris
    mixf = nt.nodes.new("ShaderNodeMath"); mixf.operation = "MULTIPLY_ADD"
    mixf.inputs[2].default_value = 0.0
    nt.links.new(noise.outputs["Fac"], mixf.inputs[0]); mixf.inputs[1].default_value = 0.03
    addf = nt.nodes.new("ShaderNodeMath"); addf.operation = "ADD"
    nt.links.new(mapr.outputs[0], addf.inputs[0]); nt.links.new(mixf.outputs[0], addf.inputs[1])
    nt.links.new(addf.outputs[0], ramp.inputs["Fac"])
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
    nt.links.new(front.outputs[0], mix.inputs["Factor"])
    mix.inputs[6].default_value = (0.95, 0.95, 0.93, 1)
    nt.links.new(ramp.outputs["Color"], mix.inputs[7])
    nt.links.new(mix.outputs[2], p.inputs["Base Color"])
    return m


# ---------------------------------------------------------------------------
# De figuur
# ---------------------------------------------------------------------------
def build_bollobo(spec_id, pose=None, location=(0, 0, 0), rot_z=0.0, scale=1.0, coll=None, hair_quality=1.0, name=None):
    spec = SPECS[spec_id]
    P = dict(DEFAULT_POSE)
    P.update(pose or {})
    name = name or spec_id
    coll = coll or bpy.context.scene.collection
    sub = bpy.data.collections.new(f"BOLLO_{name}")
    coll.children.link(sub)

    root = bpy.data.objects.new(f"{name}_root", None)
    link(root, sub)
    root.location = location
    root.rotation_euler = (0, 0, rot_z)
    root.scale = (scale, scale, scale)

    H = spec["head"]
    head_z = 1.98 + (H - 1) * 0.25

    # ---------------- skelet (posities) ----------------
    def arm_dirs(s, ang, reach, bend):
        d = Vector((0, 0, -1))
        d.rotate(Quaternion((0, 1, 0), -s * ang))
        d.rotate(Quaternion((1, 0, 0), -reach))
        f = d.copy()
        f.rotate(Quaternion((1, 0, 0), -bend))
        return d.normalized(), f.normalized()

    arms = {}
    for s, key in ((-1, "l"), (1, "r")):
        sh = Vector((s * 0.36, 0.0, 1.46))
        up, fo = arm_dirs(s, P[f"arm_{key}"], P[f"reach_{key}"], P[f"bend_{key}"])
        el = sh + up * 0.44
        wr = el + fo * 0.38
        arms[s] = (sh, el, wr, fo)

    legs = {}
    for s in (-1, 1):
        hip = Vector((s * 0.17, 0.0, 0.84))
        sw = P["stride"] * (1 if s < 0 else -1)
        d = Vector((0, 0, -1))
        d.rotate(Quaternion((1, 0, 0), -sw))
        ank = hip + d * 0.68
        legs[s] = (hip, ank)

    # hoofd-rotatie rond de nek
    neck_pivot = Vector((0, 0, head_z - 0.4 * H))
    head_rot = Quaternion((0, 0, 1), P["head_turn"]) @ Quaternion((0, 1, 0), P["head_tilt"])

    def hp(v):
        """punt in hoofdcoördinaten -> wereld (figuur)"""
        v = Vector(v) * H + Vector((0, 0, head_z))
        return neck_pivot + head_rot @ (v - neck_pivot)

    # ---------------- lijf als metaballs ----------------
    mb = bpy.data.metaballs.new(f"MB_{name}")
    mb.resolution = 0.05
    mb.render_resolution = 0.022
    mb.threshold = 0.6

    def ell(co, radii, stiff=2.0, rot=None):
        e = mb.elements.new(type="ELLIPSOID")
        e.co = co
        e.radius = 1.0
        e.size_x, e.size_y, e.size_z = radii
        e.stiffness = stiff
        if rot is not None:
            e.rotation = rot
        return e

    def caps(p0, p1, r, stiff=2.0):
        p0, p1 = Vector(p0), Vector(p1)
        e = mb.elements.new(type="CAPSULE")
        e.co = (p0 + p1) / 2
        e.radius = r
        e.size_x = (p1 - p0).length / 2
        e.rotation = Vector((1, 0, 0)).rotation_difference((p1 - p0).normalized())
        e.stiffness = stiff
        return e

    k = 1.32  # compensatie voor de metaball-drempel
    # hoofd, kaakplukken, kin
    ell(hp((0, 0, 0)), (0.56 * k, 0.46 * k, 0.46 * k), rot=head_rot)
    for s in (-1, 1):
        ell(hp((s * 0.37, -0.05, -0.17)), (0.28 * k, 0.26 * k, 0.22 * k), rot=head_rot)
    ell(hp((0, -0.09, -0.27)), (0.30 * k, 0.26 * k, 0.17 * k), rot=head_rot)
    # nek + romp + heupen (onder de kleren)
    caps(neck_pivot, neck_pivot + Vector((0, 0, -0.3)), 0.2 * k)
    ell((0, 0, 1.15), (0.36 * k, 0.29 * k, 0.42 * k))
    ell((0, 0, 0.86), (0.30 * k, 0.25 * k, 0.18 * k))
    # armen + handen + vingers
    for s, (sh, el, wr, fo) in arms.items():
        caps(sh, el, 0.105 * k)
        caps(el, wr, 0.095 * k)
        hand = wr + fo * 0.07
        ell(hand, (0.1 * k, 0.085 * k, 0.11 * k), rot=Vector((0, 0, -1)).rotation_difference(fo))
        side = Vector((1, 0, 0))
        for j, off in enumerate((-0.05, 0.0, 0.05)):
            base = hand + fo * 0.08 + side * off + Vector((0, -0.02, 0))
            caps(base, base + fo * 0.07, 0.03 * k, stiff=1.5)
        caps(hand + side * (-s * 0.07) + Vector((0, -0.05, 0.02)), hand + side * (-s * 0.11) + Vector((0, -0.09, 0.05)), 0.03 * k, 1.5)
    # benen + voeten + tenen
    for s, (hip, ank) in legs.items():
        caps(hip, ank, 0.12 * k)
        foot = ank + Vector((0, -0.07, -0.05))
        ell(foot, (0.16 * k, 0.24 * k, 0.085 * k))
        for off in (-0.09, 0.0, 0.09):
            ell(foot + Vector((off, -0.21, 0.0)), (0.055 * k, 0.065 * k, 0.05 * k), stiff=1.6)

    mbo = bpy.data.objects.new(f"MB_{name}", mb)
    link(mbo, sub)
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    body_me = bpy.data.meshes.new_from_object(mbo.evaluated_get(deps))
    bpy.data.objects.remove(mbo)
    body_me.name = f"{name}_body"
    for p in body_me.polygons:
        p.use_smooth = True

    skin_mat = mat_basic(f"{name}_skin", tuple(c * 0.75 for c in spec["fur"]), rough=0.7, sss=0.15)
    body = obj_from_mesh(f"{name}_body", body_me, sub, skin_mat, parent=root)

    # ---------------- mond uitsnijden ----------------
    mouth = P["mouth"]
    mouth_c = hp((0, -0.44, -0.18))
    mouth_dark = mat_basic(f"{name}_mouth", (0.20, 0.03, 0.06), rough=0.8)
    if mouth in ("open", "grin", "o"):
        w, h = {"open": (0.17, 0.13), "grin": (0.22, 0.10), "o": (0.07, 0.09)}[mouth]
        cutter_me = ellipsoid_mesh(f"{name}_mcut", (w, 0.14, h), 40, 24)
        cutter = obj_from_mesh(f"{name}_mcut", cutter_me, sub, mouth_dark, loc=mouth_c + head_rot @ Vector((0, 0.02, -h * 0.45 if mouth != "o" else 0)), rot=head_rot)
        body.data.materials.append(mouth_dark)
        bo = body.modifiers.new("mouth", "BOOLEAN")
        bo.operation = "DIFFERENCE"
        bo.object = cutter
        try:
            bo.solver = "EXACT"
            bo.material_mode = "TRANSFER"
        except Exception:
            pass
        bpy.context.view_layer.update()
        deps = bpy.context.evaluated_depsgraph_get()
        new_me = bpy.data.meshes.new_from_object(body.evaluated_get(deps))
        body.modifiers.clear()
        old = body.data
        body.data = new_me
        bpy.data.meshes.remove(old)
        bpy.data.objects.remove(cutter)
        # tanden + tong in de mondholte
        tooth = mat_basic(f"{name}_tooth", (0.98, 0.96, 0.9), rough=0.25, coat=0.4, sss=0.1)
        tongue = mat_basic(f"{name}_tongue", (0.9, 0.30, 0.38), rough=0.45, sss=0.3)
        if mouth != "o":
            n = 4 if mouth == "grin" else 3
            for i in range(n):
                x = (i - (n - 1) / 2) * (w * 1.15 / n)
                t = obj_from_mesh(f"{name}_tooth{i}", ellipsoid_mesh("t", (w / (n + 0.6), 0.03, 0.035), 16, 10), sub, tooth,
                                  loc=mouth_c + head_rot @ Vector((x, 0.0, -0.025)), rot=head_rot)
            if spec.get("fangs"):
                for s in (-1, 1):
                    me = bpy.data.meshes.new("fang")
                    bm = bmesh.new()
                    bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.022, radius2=0.002, depth=0.06)
                    bm.to_mesh(me); bm.free()
                    obj_from_mesh(f"{name}_fang", me, sub, tooth, loc=mouth_c + head_rot @ Vector((s * w * 0.72, -0.005, -h * 0.75)), rot=head_rot)
            obj_from_mesh(f"{name}_tongue", ellipsoid_mesh("tg", (w * 0.55, 0.08, 0.04)), sub, tongue,
                          loc=mouth_c + head_rot @ Vector((0, 0.05, -h * 0.85)), rot=head_rot)
    else:
        # gesloten glimlach: een donkere lijn in het gezicht
        pts = []
        for i in range(17):
            t = i / 16
            x = (t - 0.5) * (0.34 if mouth == "smile" else 0.2)
            z = -0.06 * math.sin(math.pi * t) if mouth == "smile" else 0.0
            pts.append(mouth_c + head_rot @ Vector((x, -0.015 - 0.03 * math.sin(math.pi * t), z)))
        for i in range(16):
            tube_between(f"{name}_lip{i}", pts[i], pts[i + 1], 0.014, 0.014, sub, mouth_dark, segs=10)
        if spec.get("fangs") and mouth == "smile":
            tooth = mat_basic(f"{name}_tooth", (0.98, 0.96, 0.9), rough=0.25, coat=0.4)
            me = bpy.data.meshes.new("fang")
            bm = bmesh.new()
            bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.02, radius2=0.002, depth=0.05)
            bm.to_mesh(me); bm.free()
            obj_from_mesh(f"{name}_fang", me, sub, tooth, loc=pts[12] + Vector((0, -0.01, -0.025)), rot=head_rot @ Quaternion((1, 0, 0), math.pi))

    # ---------------- ogen ----------------
    eye_mat = eye_material(f"{name}_eye", spec["iris"])
    cornea = mat_basic(f"{name}_cornea", (1, 1, 1), rough=0.0, transmission=1.0, ior=1.1, coat=1.0)
    lid_mat = mat_basic(f"{name}_lid", tuple(c * 0.85 for c in spec["fur"]), rough=0.8, sss=0.1)
    look = P["look"]
    eye_centers = []
    r = 0.135 * H
    lid_rot = {"wide": -2.15, "open": -1.55, "half": -0.55, "happy": -1.3}[P["lids"]]
    for s in (-1, 1):
        c = hp((s * 0.2, -0.37, 0.05))
        eye_centers.append(c)
        base_q = head_rot @ Quaternion((0, 0, 1), -s * 0.3)
        gaze = base_q @ Quaternion((0, 0, 1), look[0] * 0.45) @ Quaternion((1, 0, 0), look[1] * 0.25)
        e = obj_from_mesh(f"{name}_eye{s}", ellipsoid_mesh("eye", (r, r * 0.92, r * 1.05)), sub, eye_mat, loc=c, rot=gaze)
        obj_from_mesh(f"{name}_cornea{s}", ellipsoid_mesh("cor", (r * 1.015, r * 0.95, r * 1.065)), sub, cornea, loc=c, rot=gaze)
        # bovenooglid: halve bol, gekanteld
        lid_q = base_q @ Quaternion((1, 0, 0), lid_rot + math.pi / 2) if False else base_q @ Quaternion((1, 0, 0), -(lid_rot + math.pi / 2))
        obj_from_mesh(f"{name}_lid{s}", ellipsoid_mesh("lid", (r * 1.07, r * 1.07, r * 1.1), hemi="top"), sub, lid_mat, loc=c, rot=lid_q)
        if P["lids"] == "happy":
            obj_from_mesh(f"{name}_lidlo{s}", ellipsoid_mesh("lidlo", (r * 1.07, r * 1.07, r * 1.1), hemi="bottom"), sub, lid_mat, loc=c,
                          rot=base_q @ Quaternion((1, 0, 0), -0.75))
    # wenkbrauwen
    if P["brows"] != "none":
        brow_mat = mat_basic(f"{name}_brow", spec["fur_dark"], rough=0.9)
        ang = {"worried": -0.4, "determined": 0.35, "up": -0.1}[P["brows"]]
        for s, c in zip((-1, 1), eye_centers):
            mid = c + head_rot @ Vector((0, -0.07, r + (0.09 if P["brows"] == "up" else 0.06)))
            d = Vector((math.cos(s * ang), 0, math.sin(s * ang))) * 0.08
            tube_between(f"{name}_brow{s}", mid - d, mid + d, 0.028, 0.022, sub, brow_mat, segs=12)
    # neusje
    nose = mat_basic(f"{name}_nose", spec["fur_dark"], rough=0.3, coat=0.6)
    obj_from_mesh(f"{name}_nose", ellipsoid_mesh("nose", (0.05, 0.035, 0.035)), sub, nose, loc=hp((0, -0.49, -0.07)), rot=head_rot)

    # ---------------- bril ----------------
    if spec.get("glasses"):
        gm = mat_basic(f"{name}_glasses", spec["glasses"], rough=0.25, coat=1.0)
        lens = mat_basic(f"{name}_lens", (1, 1, 1), rough=0.0, transmission=1.0, ior=1.05)
        for s, c in zip((-1, 1), eye_centers):
            q = head_rot @ Quaternion((0, 0, 1), -s * 0.22) @ Quaternion((1, 0, 0), math.pi / 2)
            me = bpy.data.meshes.new("rim")
            bm = bmesh.new()
            bmesh.ops.create_circle(bm, segments=48, radius=1.0)
            bm.free()
            bpy.ops.mesh.primitive_torus_add(major_radius=0.165 * H, minor_radius=0.024, major_segments=64, minor_segments=12, location=c + head_rot @ Vector((0, -0.12, 0)))
            rim = bpy.context.active_object
            rim.name = f"{name}_rim{s}"
            for cl in rim.users_collection:
                cl.objects.unlink(rim)
            sub.objects.link(rim)
            rim.rotation_mode = "QUATERNION"
            rim.rotation_quaternion = q
            rim.data.materials.append(gm)
            for pp in rim.data.polygons:
                pp.use_smooth = True
            obj_from_mesh(f"{name}_lens{s}", ellipsoid_mesh("lens", (0.16 * H, 0.012, 0.16 * H)), sub, lens, loc=c + head_rot @ Vector((0, -0.12, 0)), rot=head_rot @ Quaternion((0, 0, 1), -s * 0.22))
        l, rr = eye_centers
        tube_between(f"{name}_bridge", l + head_rot @ Vector((0.16, -0.13, 0.02)), rr + head_rot @ Vector((-0.16, -0.13, 0.02)), 0.02, 0.02, sub, gm, 12)
        for s, c in zip((-1, 1), eye_centers):
            a = c + head_rot @ Vector((s * 0.16, -0.1, 0.02))
            b = hp((s * 0.55, 0.05, 0.02))
            tube_between(f"{name}_temple{s}", a, b, 0.017, 0.017, sub, gm, 10)

    # ---------------- hoorntjes ----------------
    if spec.get("horns"):
        hm = mat_basic(f"{name}_horn", spec["horns"], rough=0.35, coat=0.5, sss=0.2)
        for s in (-1, 1):
            b = hp((s * 0.33, -0.02, 0.33))
            t = hp((s * 0.45, 0.0, 0.58))
            tube_between(f"{name}_horn{s}", b, t, 0.085 * H, 0.008, sub, hm, 24)

    # ---------------- pluimen ----------------
    def tuft(base, direction, colors, spread, length, thin=False):
        n = len(colors)
        dirv = Vector(direction).normalized()
        side = dirv.cross(Vector((0, -1, 0)))
        if side.length < 1e-3:
            side = Vector((1, 0, 0))
        side.normalize()
        for i, col in enumerate(colors):
            a = 0 if n == 1 else -spread / 2 + spread * i / (n - 1)
            d = (dirv * math.cos(a) + side * math.sin(a)).normalized()
            L = length * (1 - abs(a) * 0.25)
            m = mat_basic(f"{name}_tuft{i}", col, rough=0.6, sss=0.15)
            mid = base + d * L * 0.5 + Vector((0, 0, 0.02))
            end = base + d * L
            tube_between(f"{name}_stalk{i}", base, mid, 0.016, 0.012, sub, m, 8)
            tube_between(f"{name}_stalk{i}b", mid, end, 0.012, 0.008, sub, m, 8)
            if not thin:
                q = Vector((0, 0, 1)).rotation_difference(d)
                obj_from_mesh(f"{name}_leaf{i}", ellipsoid_mesh("leaf", (0.05, 0.02, 0.11), 24, 16), sub, m, loc=end + d * 0.08, rot=q)

    tuft(hp((0, 0.0, 0.42)), head_rot @ Vector((0, 0.15, 1)), spec["top_tuft"], 1.2 if len(spec["top_tuft"]) > 3 else 0.8, 0.28 * H)
    st = spec.get("side_tufts")
    if st:
        for s in (-1, 1):
            tuft(hp((s * 0.6, 0.0, 0.02)), head_rot @ Vector((s, 0, 0.25)), [st["color"]] * 3, 0.7, 0.22 * H, thin=st["whiskers"])

    # ---------------- kleren ----------------
    t = spec["torso"]
    if t["kind"] == "sweater":
        cloth = knit_material(f"{name}_sweater", t["color"])
        prof = [(0.06, 0.6), (0.47, 0.62), (0.52, 0.8), (0.49, 1.1), (0.43, 1.36), (0.34, 1.52), (0.2, 1.6), (0.16, 1.62)]
    elif t["kind"] == "shirt":
        cloth = knit_material(f"{name}_shirt", t["color"], stripe=t["stripe"], stripe_axis="Z", stripe_scale=9)
        prof = [(0.06, 0.78), (0.38, 0.8), (0.41, 1.0), (0.41, 1.28), (0.35, 1.48), (0.2, 1.58), (0.16, 1.6)]
    else:
        cloth = knit_material(f"{name}_coat", t["color"], stripe=t["stripe"], stripe_axis="X", stripe_scale=14)
        prof = [(0.47, 0.5), (0.46, 0.8), (0.43, 1.1), (0.39, 1.3), (0.31, 1.44), (0.18, 1.5)]
    if t["kind"] == "coat":
        inner = knit_material(f"{name}_inner", t["inner"])
        im = lathe_mesh("inner", [(0.06, 0.78), (0.37, 0.8), (0.39, 1.1), (0.34, 1.36), (0.2, 1.46), (0.15, 1.48)])
        io = obj_from_mesh(f"{name}_inner", im, sub, inner, parent=root)
        add_subsurf(io)
        cm = lathe_mesh("coat", prof, segs=72, angle=2 * math.pi * 0.84, start=math.pi * 0.16)
    else:
        cm = lathe_mesh("torso", prof)
    co = obj_from_mesh(f"{name}_torso", cm, sub, cloth, parent=root)
    co.scale = (1, 0.86, 1)
    sol = co.modifiers.new("dikte", "SOLIDIFY")
    sol.thickness = 0.025
    add_subsurf(co)

    # mouwen
    for s, (sh, el, wr, fo) in arms.items():
        if t["kind"] == "shirt":
            tube_between(f"{name}_sleeve{s}", sh + (el - sh) * -0.05, sh + (el - sh) * 0.45, 0.16, 0.15, sub, cloth, 32)
        else:
            tube_between(f"{name}_sleeveU{s}", sh - (el - sh) * 0.08, el, 0.15, 0.13, sub, cloth, 32)
            tube_between(f"{name}_sleeveL{s}", el, wr - fo * 0.02, 0.13, 0.125, sub, cloth, 32)
            bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.035, location=wr - fo * 0.02)
            cuff = bpy.context.active_object
            for cl in cuff.users_collection:
                cl.objects.unlink(cuff)
            sub.objects.link(cuff)
            cuff.rotation_mode = "QUATERNION"
            cuff.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(fo)
            cuff.data.materials.append(cloth)
            for pp in cuff.data.polygons:
                pp.use_smooth = True

    # gordel + strik
    if t.get("belt"):
        bm_ = mat_basic(f"{name}_belt", t["belt"], rough=0.45, sheen=0.4)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.505, minor_radius=0.05, major_segments=72, location=(0, 0, 0.86))
        belt = bpy.context.active_object
        for cl in belt.users_collection:
            cl.objects.unlink(belt)
        sub.objects.link(belt)
        belt.scale = (1, 0.88, 1)
        belt.data.materials.append(bm_)
        for pp in belt.data.polygons:
            pp.use_smooth = True
        belt.parent = root
        for s in (-1, 1):
            o = obj_from_mesh(f"{name}_bow{s}", ellipsoid_mesh("bow", (0.13, 0.05, 0.075)), sub, bm_, loc=(s * 0.11, -0.47, 0.86),
                              rot=Quaternion((0, 1, 0), s * 0.5))
            o.parent = root
        o = obj_from_mesh(f"{name}_knot", ellipsoid_mesh("knot", (0.05, 0.05, 0.06)), sub, bm_, loc=(0, -0.49, 0.86))
        o.parent = root

    # rugzak
    if spec.get("backpack"):
        pm = mat_basic(f"{name}_pack", spec["backpack"], rough=0.55, sheen=0.3)
        o = obj_from_mesh(f"{name}_pack", ellipsoid_mesh("pack", (0.34, 0.2, 0.4)), sub, pm, loc=(0, 0.42, 1.15))
        o.parent = root
        o = obj_from_mesh(f"{name}_pocket", ellipsoid_mesh("pocket", (0.22, 0.09, 0.17)), sub, pm, loc=(0, 0.58, 1.02))
        o.parent = root
        for s in (-1, 1):
            pts = [Vector((s * 0.2, 0.2 - 0.62 * math.sin(math.pi * u / 8) * 0.45, 1.5 - 0.62 * u / 8)) for u in range(9)]
            for i in range(8):
                ob = tube_between(f"{name}_strap{s}{i}", pts[i], pts[i + 1], 0.032, 0.032, sub, pm, 10)
                ob.parent = root

    # klauwtjes
    claw = mat_basic(f"{name}_claw", (0.98, 0.95, 0.86), rough=0.3, coat=0.5)
    for s, (hip, ank) in legs.items():
        foot = ank + Vector((0, -0.07, -0.05))
        for off in (-0.09, 0.0, 0.09):
            b = foot + Vector((off, -0.27, -0.01))
            tube_between(f"{name}_claw", b, b + Vector((0, -0.05, -0.015)), 0.02, 0.003, sub, claw, 10)

    # alles wat geen parent heeft aan root hangen (behalve root zelf)
    for o in list(sub.objects):
        if o is not root and o.parent is None:
            mw = o.matrix_world.copy()
            o.parent = root
            o.matrix_parent_inverse = Matrix.Identity(4)
            o.matrix_basis = mw

    # ---------------- vacht ----------------
    add_fur(body, spec, name, eye_centers, mouth_c, hair_quality, arms=arms, head_center=hp((0, 0, 0)))
    return root


def add_fur(body, spec, name, eye_centers, mouth_c, quality, arms, head_center):
    me = body.data
    dens = body.vertex_groups.new(name="fur_density")
    length = body.vertex_groups.new(name="fur_length")
    for v in me.vertices:
        p = v.co
        w = 1.0
        L = 1.0
        # onder de kleren (romp) geen vacht nodig
        if 0.55 < p.z < 1.58 and abs(p.x) < 0.42 and abs(p.y) < 0.4:
            w = 0.0
        # vrij rond ogen en mond
        for c in eye_centers:
            dd = (p - c).length
            if dd < 0.2:
                w = 0.0
            elif dd < 0.3:
                w *= (dd - 0.2) / 0.1
                L = min(L, 0.4)
        dm = (p - mouth_c).length
        if dm < 0.24:
            w = 0.0
        elif dm < 0.33:
            w *= (dm - 0.24) / 0.09
            L = min(L, 0.4)
        # gezicht (voorkant hoofd): korte vacht
        if (p - head_center).length < 0.75 and p.y < head_center.y - 0.2:
            L = min(L, 0.5)
        # kaakplukken: langere, ruige vacht
        if p.z < head_center.z - 0.1 and p.z > head_center.z - 0.45 and abs(p.x) > 0.35:
            L = 1.6
        # handen/voeten: korter
        if p.z < 0.25:
            L = min(L, 0.55)
        dens.add([v.index], w, "REPLACE")
        length.add([v.index], max(0.05, min(1.0, L / 1.6)), "REPLACE")

    mod = body.modifiers.new("vacht", "PARTICLE_SYSTEM")
    psys = body.particle_systems[-1]
    st = psys.settings
    st.name = f"{name}_fur"
    st.type = "HAIR"
    st.use_advanced_hair = True
    st.count = int(4000 * quality)
    st.hair_length = 0.13
    st.hair_step = 5
    st.emit_from = "FACE"
    st.use_emit_random = True
    st.child_type = "INTERPOLATED"
    st.child_nbr = 2
    st.rendered_child_count = int(28 * quality)
    st.child_length = 1.0
    st.clump_factor = 0.35
    st.clump_shape = -0.2
    st.roughness_1 = 0.012
    st.roughness_1_size = 1.0
    st.roughness_endpoint = 0.03
    st.roughness_end_shape = 1.0
    st.root_radius = 1.0
    st.tip_radius = 0.0
    st.radius_scale = 0.007
    st.use_close_tip = True
    st.render_type = "PATH"
    st.display_step = 3
    st.render_step = 4
    # zwaartekracht/borstelrichting: haren licht naar beneden
    st.normal_factor = 1.0
    st.tangent_factor = 0.0
    try:
        st.object_align_factor = (0.0, 0.0, -0.035)
    except Exception:
        pass
    psys.vertex_group_density = "fur_density"
    psys.vertex_group_length = "fur_length"
    hm = hair_material(f"{name}_hairmat", spec["fur"], spec["fur_tip"], spec["fur_dark"])
    me.materials.append(hm)
    st.material = len(me.materials)
    return psys
