"""
Rendert een shot van De Rekenroute-ploeg in Blender/Cycles.

Gebruik (met de bpy-module):
  python render_shot.py --shot team --out team.png [--pct 50] [--samples 64] [--hair 1.0]

Look development (zoals in een animatiestudio):
  * licht: lage ochtendzon (warm key) + blauwe hemel (koele fill) + sterk tegenlicht (rim)
  * lens: 35-50 mm, lage camerahoek, ondiepe scherptediepte (f/2.8) voor het filmgevoel
  * kleur: AgX-tonemapping met "Punchy"-look, verzadigde maar zachte kleuren
"""

import argparse
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bollobo  # noqa: E402
from bollobo import ellipsoid_mesh, link, mat_basic, obj_from_mesh, tube_between  # noqa: E402


# ---------------------------------------------------------------------------
# Scène-opbouw
# ---------------------------------------------------------------------------
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    return sc


def setup_render(sc, pct, samples, out):
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.resolution_percentage = pct
    sc.render.filepath = out
    sc.render.image_settings.file_format = "PNG"
    cy = sc.cycles
    cy.device = "CPU"
    cy.samples = samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.02
    cy.use_denoising = True
    try:
        cy.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        pass
    cy.max_bounces = 6
    cy.diffuse_bounces = 3
    cy.glossy_bounces = 3
    cy.transmission_bounces = 6
    cy.transparent_max_bounces = 8
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    try:
        sc.cycles_curves.shape = "THICK"
    except Exception:
        pass
    sc.render.film_transparent = False
    vs = sc.view_settings
    try:
        vs.view_transform = "AgX"
        for look in ("AgX - Punchy", "Punchy", "AgX - Medium High Contrast"):
            try:
                vs.look = look
                break
            except Exception:
                continue
    except Exception:
        pass
    vs.exposure = 0.0


def world_sky(sc, sun_elev=18, sun_rot=210, strength=0.8):
    w = bpy.data.worlds.new("Sky")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes["Background"]
    sky = nt.nodes.new("ShaderNodeTexSky")
    ok = False
    for t in ("NISHITA", "MULTIPLE_SCATTERING", "SINGLE_SCATTERING", "HOSEK_WILKIE"):
        try:
            sky.sky_type = t
            ok = True
            break
        except Exception:
            continue
    try:
        sky.sun_elevation = math.radians(sun_elev)
        sky.sun_rotation = math.radians(sun_rot)
        sky.sun_disc = False
        sky.altitude = 200
        sky.air_density = 1.0
        sky.dust_density = 0.6
    except Exception:
        pass
    if ok:
        nt.links.new(sky.outputs[0], bg.inputs[0])
    else:
        bg.inputs[0].default_value = (0.45, 0.7, 1.0, 1)
    bg.inputs[1].default_value = strength
    return w


def sun(sc, coll, rot_deg, elev_deg, strength=4.0, color=(1.0, 0.86, 0.68), angle=4.0):
    ld = bpy.data.lights.new("Zon", "SUN")
    ld.energy = strength
    ld.color = color
    ld.angle = math.radians(angle)
    o = bpy.data.objects.new("Zon", ld)
    link(o, coll)
    o.rotation_euler = (math.radians(90 - elev_deg), 0, math.radians(rot_deg))
    return o


def area(coll, name, loc, target, power, size, color=(1, 1, 1)):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = power
    ld.size = size
    ld.color = color
    ld.shape = "DISK"
    o = bpy.data.objects.new(name, ld)
    link(o, coll)
    o.location = loc
    d = Vector(target) - Vector(loc)
    o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return o


def camera(sc, coll, loc, target, lens=40, fstop=2.8, focus=None):
    cd = bpy.data.cameras.new("Camera")
    cd.lens = lens
    cd.sensor_width = 36
    cam = bpy.data.objects.new("Camera", cd)
    link(cam, coll)
    cam.location = loc
    d = Vector(target) - Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = fstop
    cd.dof.focus_distance = (Vector(focus or target) - Vector(loc)).length
    sc.camera = cam
    return cam


def ground(coll, size=120, grass=True, grass_density=1.0, keep_clear=None):
    me = bpy.data.meshes.new("grond")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=240, y_segments=240, size=size / 2)
    # zacht glooiend terrein, vlak bij de camera
    for v in bm.verts:
        x, y = v.co.x, v.co.y
        far = max(0.0, (y - 6) / 40)
        v.co.z = far * (2.2 * math.sin(x * 0.09) + 1.6 * math.sin(x * 0.05 + 1.3) + 1.2 * math.cos(y * 0.08)) * min(1.0, far)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    g = mat_basic("gras-bodem", (0.20, 0.42, 0.10), rough=0.95)
    o = obj_from_mesh("grond", me, coll, g)
    if grass:
        vg = o.vertex_groups.new(name="gras")
        for v in me.vertices:
            w = 1.0 if (-14 < v.co.x < 14 and -10 < v.co.y < 26) else 0.0
            if keep_clear and keep_clear(v.co):
                w = 0.0
            vg.add([v.index], w, "REPLACE")
        o.modifiers.new("gras", "PARTICLE_SYSTEM")
        ps = o.particle_systems[-1]
        st = ps.settings
        st.type = "HAIR"
        st.use_advanced_hair = True
        st.count = int(60000 * grass_density)
        st.hair_length = 0.22
        st.child_type = "INTERPOLATED"
        st.rendered_child_count = 6
        st.child_nbr = 1
        st.roughness_1 = 0.05
        st.roughness_endpoint = 0.06
        st.clump_factor = 0.2
        st.root_radius = 1.0
        st.tip_radius = 0.0
        st.radius_scale = 0.02
        st.use_close_tip = True
        st.render_step = 3
        ps.vertex_group_density = "gras"
        gm = bpy.data.materials.new("gras")
        gm.use_nodes = True
        nt = gm.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        info = nt.nodes.new("ShaderNodeHairInfo")
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = (0.07, 0.20, 0.03, 1)
        ramp.color_ramp.elements[1].color = (0.45, 0.78, 0.18, 1)
        nt.links.new(info.outputs["Intercept"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.6
        try:
            bsdf.inputs["Subsurface Weight"].default_value = 0.3
        except Exception:
            pass
        nt.links.new(bsdf.outputs[0], out.inputs["Surface"])
        me.materials.append(gm)
        st.material = 2
    return o


def road(coll, pts, width=3.0):
    cu = bpy.data.curves.new("route", "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    cu.extrude = 0.04
    cu.bevel_depth = 0.0
    o = bpy.data.objects.new("route", cu)
    link(o, coll)
    # breedte via een vlak profiel
    prof = bpy.data.curves.new("profiel", "CURVE")
    ps = prof.splines.new("POLY")
    ps.points.add(1)
    ps.points[0].co = (-width / 2, 0, 0, 1)
    ps.points[1].co = (width / 2, 0, 0, 1)
    po = bpy.data.objects.new("profiel", prof)
    link(po, coll)
    po.hide_render = True
    cu.bevel_mode = "OBJECT"
    cu.bevel_object = po
    m = mat_basic("route", (0.95, 0.38, 0.08), rough=0.8)
    # witte middenstreep via een golfpatroon
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    uv = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(uv.outputs["UV"], sep.inputs[0])
    o.data.use_uv_as_generated = True
    mid = nt.nodes.new("ShaderNodeMath"); mid.operation = "SUBTRACT"; mid.inputs[1].default_value = 0.5
    nt.links.new(sep.outputs[1], mid.inputs[0])
    ab = nt.nodes.new("ShaderNodeMath"); ab.operation = "ABSOLUTE"
    nt.links.new(mid.outputs[0], ab.inputs[0])
    lt = nt.nodes.new("ShaderNodeMath"); lt.operation = "LESS_THAN"; lt.inputs[1].default_value = 0.03
    nt.links.new(ab.outputs[0], lt.inputs[0])
    dash = nt.nodes.new("ShaderNodeMath"); dash.operation = "SINE"
    sc = nt.nodes.new("ShaderNodeMath"); sc.operation = "MULTIPLY"; sc.inputs[1].default_value = 120
    nt.links.new(sep.outputs[0], sc.inputs[0])
    nt.links.new(sc.outputs[0], dash.inputs[0])
    gt = nt.nodes.new("ShaderNodeMath"); gt.operation = "GREATER_THAN"; gt.inputs[1].default_value = 0.0
    nt.links.new(dash.outputs[0], gt.inputs[0])
    both = nt.nodes.new("ShaderNodeMath"); both.operation = "MULTIPLY"
    nt.links.new(lt.outputs[0], both.inputs[0]); nt.links.new(gt.outputs[0], both.inputs[1])
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
    nt.links.new(both.outputs[0], mix.inputs["Factor"])
    mix.inputs[6].default_value = (0.95, 0.38, 0.08, 1)
    mix.inputs[7].default_value = (0.98, 0.96, 0.92, 1)
    nt.links.new(mix.outputs[2], p.inputs["Base Color"])
    o.data.materials.append(m)
    return o


def tree(coll, loc, s=1.0, hue=0):
    trunk = mat_basic("stam", (0.30, 0.17, 0.08), rough=0.9)
    leaf = mat_basic(f"blad{hue}", [(0.16, 0.48, 0.10), (0.22, 0.55, 0.12), (0.12, 0.40, 0.12)][hue % 3], rough=0.7, sss=0.25, sheen=0.3)
    x, y, z = loc
    tube_between("stam", (x, y, z), (x, y, z + 2.4 * s), 0.28 * s, 0.16 * s, coll, trunk, 24)
    blobs = [(0, 0, 3.2, 1.5), (0.9, 0.3, 2.7, 1.1), (-0.9, -0.2, 2.8, 1.15), (0.2, 0.5, 4.0, 1.0), (-0.3, -0.6, 3.7, 0.9)]
    for i, (bx, by, bz, r) in enumerate(blobs):
        me = ellipsoid_mesh("kruin", (r * s, r * s, r * s * 0.9), 48, 32)
        o = obj_from_mesh("kruin", me, coll, leaf, loc=(x + bx * s, y + by * s, z + bz * s))
        d = o.modifiers.new("knobbels", "DISPLACE")
        tex = bpy.data.textures.new(f"kn{i}", "CLOUDS")
        tex.noise_scale = 0.35
        d.texture = tex
        d.strength = 0.18 * s
        sub = o.modifiers.new("glad", "SUBSURF")
        sub.render_levels = 1


def cloud(coll, loc, s=1.0):
    m = mat_basic("wolk", (1, 1, 1), rough=1.0, sss=0.6)
    for bx, bz, r in [(0, 0, 1.6), (1.6, -0.3, 1.2), (-1.7, -0.4, 1.1), (0.6, 0.7, 1.2)]:
        obj_from_mesh("wolk", ellipsoid_mesh("w", (r * s, r * s * 0.8, r * s * 0.85)), coll, m, loc=(loc[0] + bx * s, loc[1], loc[2] + bz * s))


def bollohuis(coll, loc, s=1.0):
    x, y, z = loc
    wall = mat_basic("bollohuis", (0.98, 0.93, 0.84), rough=0.5, coat=0.2)
    orange = mat_basic("oranje-band", (0.95, 0.40, 0.08), rough=0.5)
    blue = mat_basic("deur", (0.15, 0.42, 0.95), rough=0.4, coat=0.3)
    red = mat_basic("alarm", (1.0, 0.1, 0.08), rough=0.3, emission=((1.0, 0.15, 0.1), 3.0))
    obj_from_mesh("koepel", ellipsoid_mesh("k", (4 * s, 4 * s, 4 * s), 64, 40, hemi="top"), coll, wall, loc=(x, y, z))
    bpy.ops.mesh.primitive_torus_add(major_radius=3.85 * s, minor_radius=0.2 * s, major_segments=96, location=(x, y, z + 1.2 * s))
    t = bpy.context.active_object
    t.data.materials.append(orange)
    obj_from_mesh("deur", ellipsoid_mesh("d", (1.2 * s, 0.2 * s, 1.2 * s), 48, 24), coll, blue, loc=(x, y - 3.9 * s, z + 0.9 * s))
    tube_between("toren", (x, y, z + 3.6 * s), (x, y, z + 5.2 * s), 0.8 * s, 0.6 * s, coll, mat_basic("toren", (1.0, 0.76, 0.12), rough=0.45), 32)
    obj_from_mesh("lamp", ellipsoid_mesh("l", (0.55 * s, 0.55 * s, 0.55 * s), 32, 16, hemi="top"), coll, red, loc=(x, y, z + 5.2 * s))


def number_post(coll, loc, n):
    """Getallenpaaltje met een getal (tekstobject)."""
    x, y, z = loc
    white = mat_basic("paal", (0.95, 0.95, 0.95), rough=0.5)
    orange = mat_basic("bord", (0.95, 0.40, 0.08), rough=0.45, coat=0.3)
    tube_between("paal", (x, y, z), (x, y, z + 1.6), 0.06, 0.06, coll, white, 16)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z + 2.0))
    b = bpy.context.active_object
    b.scale = (0.9, 0.12, 0.9)
    b.data.materials.append(orange)
    bev = b.modifiers.new("bevel", "BEVEL")
    bev.width = 0.12
    bev.segments = 6
    cu = bpy.data.curves.new("getal", "FONT")
    cu.body = str(n)
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.size = 0.7
    cu.extrude = 0.02
    t = bpy.data.objects.new("getal", cu)
    link(t, coll)
    t.location = (x, y - 0.08, z + 2.0)
    t.rotation_euler = (math.radians(90), 0, 0)
    t.data.materials.append(white)


# ---------------------------------------------------------------------------
# Shots
# ---------------------------------------------------------------------------
def shot_team(sc, hair):
    coll = sc.collection
    world_sky(sc, sun_elev=16, sun_rot=150, strength=0.9)
    sun(sc, coll, rot_deg=150, elev_deg=22, strength=4.5)
    # tegenlicht (rim) van achter-links
    area(coll, "Rim", (-5, 7, 5), (0, 0, 1.6), 2200, 6, (1.0, 0.93, 0.85))
    # zachte vul van voor (zoals een grote reflector op de set)
    area(coll, "Fill", (2, -9, 3), (0, 0, 1.5), 900, 8, (0.85, 0.92, 1.0))

    clear = lambda p: abs(p.x - (-0.4 + 0.08 * p.y)) < 1.7 and p.y < 22  # de weg vrij van gras
    ground(coll, keep_clear=clear, grass_density=hair)
    road(coll, [(-0.8, -12, 0.03), (0.2, -2, 0.03), (-1.2, 6, 0.03), (-5, 14, 0.4), (-1, 22, 1.2), (6, 26, 1.8)], width=2.8)
    bollohuis(coll, (7.5, 30, 1.0), 1.0)
    for loc, s, h in [((-6.5, 4, 0), 1.2, 0), ((6.5, 8, 0), 1.0, 1), ((-12, 14, 0.5), 1.5, 2), ((13, 18, 0.8), 1.4, 0), ((-3, 28, 1.6), 1.2, 1)]:
        tree(coll, loc, s, h)
    number_post(coll, (2.4, 1.5, 0), 1)
    number_post(coll, (1.4, 8, 0), 2)
    cloud(coll, (-14, 60, 16), 2.0)
    cloud(coll, (16, 70, 20), 2.6)
    cloud(coll, (2, 80, 26), 1.8)

    bollobo.build_bollobo("paars", dict(arm_l=0.5, arm_r=2.6, reach_r=0.1, bend_r=0.5, mouth="grin", brows="up", look=(0.2, 0.1), lids="open",
                                        head_tilt=0.08, stride=0.15), location=(-1.9, -0.6, 0), rot_z=math.radians(-18), coll=coll, hair_quality=hair, name="vlug")
    bollobo.build_bollobo("oranje", dict(arm_l=0.3, arm_r=1.5, reach_r=0.5, bend_r=0.6, mouth="smile", brows="determined", lids="half", look=(0.1, 0.0),
                                         head_tilt=-0.05), location=(0.2, -0.1, 0), rot_z=math.radians(5), coll=coll, hair_quality=hair, name="wijs")
    bollobo.build_bollobo("kleuter", dict(arm_l=2.4, arm_r=2.4, reach_l=0.3, reach_r=0.3, mouth="open", brows="up", lids="wide", look=(-0.3, 0.2),
                                          head_tilt=-0.1), location=(2.0, -0.9, 0), rot_z=math.radians(22), scale=0.72, coll=coll, hair_quality=hair, name="pimpel")
    camera(sc, coll, loc=(0.4, -9.2, 1.25), target=(0.2, 0, 1.75), lens=42, fstop=3.2, focus=(0.2, -0.3, 1.9))


def shot_closeup(sc, hair):
    coll = sc.collection
    world_sky(sc, sun_elev=20, sun_rot=140, strength=0.9)
    sun(sc, coll, rot_deg=140, elev_deg=25, strength=4.0)
    area(coll, "Rim", (-3, 5, 4), (0, 0, 2.0), 1600, 4, (1.0, 0.93, 0.85))
    area(coll, "Rim2", (4, 5, 3.5), (0, 0, 2.0), 900, 3, (0.85, 0.92, 1.0))
    area(coll, "Fill", (0, -6, 2.5), (0, 0, 2.0), 500, 6, (1.0, 0.97, 0.94))
    ground(coll, grass_density=hair * 0.6)
    for loc, s, h in [((-7, 12, 0), 1.6, 0), ((8, 15, 0.4), 1.4, 1), ((1, 24, 1), 1.8, 2)]:
        tree(coll, loc, s, h)
    cloud(coll, (-10, 50, 14), 2.0)
    cloud(coll, (12, 55, 17), 2.2)
    bollobo.build_bollobo("paars", dict(arm_l=0.4, arm_r=2.5, reach_r=0.2, bend_r=0.5, mouth="grin", brows="up", look=(0.7, 0.05), lids="open",
                                        head_turn=math.radians(10)), location=(-1.15, 0, 0), rot_z=math.radians(-30), coll=coll, hair_quality=hair, name="vlug")
    bollobo.build_bollobo("oranje", dict(arm_l=0.3, arm_r=1.4, reach_r=0.6, bend_r=0.9, mouth="smile", brows="determined", lids="half", look=(-0.7, 0.0),
                                         head_turn=math.radians(-12)), location=(1.15, 0.2, 0), rot_z=math.radians(32), coll=coll, hair_quality=hair, name="wijs")
    camera(sc, coll, loc=(0.1, -4.6, 2.05), target=(0, 0, 2.0), lens=55, fstop=2.2, focus=(-0.9, -0.4, 2.05))


def shot_turntable(sc, hair, who="paars"):
    """Studiobeeld van één figuur (look development)."""
    coll = sc.collection
    w = world_sky(sc, strength=0.0)
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.82, 0.88, 0.96, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.6
    area(coll, "Key", (3, -4, 4), (0, 0, 1.5), 1200, 3, (1.0, 0.95, 0.88))
    area(coll, "Rim", (-3, 4, 3.5), (0, 0, 1.8), 1400, 2.5)
    area(coll, "Fill", (-4, -3, 1.5), (0, 0, 1.3), 300, 4, (0.85, 0.92, 1.0))
    floor = mat_basic("vloer", (0.85, 0.88, 0.94), rough=0.8)
    bpy.ops.mesh.primitive_plane_add(size=40)
    bpy.context.active_object.data.materials.append(floor)
    bollobo.build_bollobo(who, dict(arm_l=0.35, arm_r=0.35, mouth="open", lids="open", brows="up"), coll=coll, hair_quality=hair, name=who)
    camera(sc, coll, loc=(0, -7, 1.5), target=(0, 0, 1.35), lens=55, fstop=4.0)


SHOTS = {"team": shot_team, "closeup": shot_closeup, "studio": shot_turntable}


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument("--shot", default="team")
    ap.add_argument("--who", default="paars")
    ap.add_argument("--out", required=True)
    ap.add_argument("--pct", type=int, default=50)
    ap.add_argument("--samples", type=int, default=64)
    ap.add_argument("--hair", type=float, default=1.0)
    ap.add_argument("--blend", default="")
    a = ap.parse_args(argv)
    sc = reset()
    setup_render(sc, a.pct, a.samples, os.path.abspath(a.out))
    if a.shot == "studio":
        shot_turntable(sc, a.hair, a.who)
    else:
        SHOTS[a.shot](sc, a.hair)
    if a.blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(a.blend))
    bpy.ops.render.render(write_still=True)
    print("KLAAR", a.out)


if __name__ == "__main__":
    main()
