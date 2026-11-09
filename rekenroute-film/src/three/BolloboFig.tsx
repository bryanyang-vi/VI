import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * DE OFFICIËLE BOLLOBO'S IN 3D
 * Harige monstertjes met oortjes/hoorntjes, pluimpjes op het hoofd, brede
 * kaak met vachtplukken, grote ogen, een grijns met tandjes, kleren en grote
 * voeten met drie tenen. Vacht wordt gemaakt met "fur shells" (laagjes).
 * Voeten staan op y = 0, figuur is ±2,5 eenheden hoog (zonder pluimen).
 */

/* ------------------------------------------------------------------ */
/* Specificaties per Bollobo                                            */
/* ------------------------------------------------------------------ */
export type Torso =
  | { kind: "sweater"; color: string; belt?: string }
  | { kind: "shirt"; color: string; stripe: string; shortSleeves?: boolean }
  | { kind: "coat"; color: string; stripe: string; inner: string };

export type BolloSpec = {
  id: string;
  fur: string;
  furTip: string;
  furDark: string;
  iris: string;
  /** relatieve hoofdgrootte (kleuter heeft een groter hoofd) */
  head: number;
  horns?: string;
  topTuft: string[];
  sideTufts?: { color: string; whiskers?: boolean };
  glasses?: string;
  torso: Torso;
  backpack?: string;
  fangs?: boolean;
};

export const SPECS: Record<"kleuter" | "oranje" | "paars", BolloSpec> = {
  kleuter: {
    id: "kleuter",
    fur: "#5CCDB8",
    furTip: "#A6F0E1",
    furDark: "#2F8F80",
    iris: "#3A2416",
    head: 1.14,
    horns: "#8FE3D3",
    topTuft: ["#F25C54", "#FF9F1C", "#FFD23F", "#8AC926", "#3A86FF", "#9B5DE5"],
    sideTufts: { color: "#5B3F8F", whiskers: true },
    torso: { kind: "coat", color: "#F0892A", stripe: "#F7B24C", inner: "#FFD54A" },
  },
  oranje: {
    id: "oranje",
    fur: "#F29A1F",
    furTip: "#FFCB6B",
    furDark: "#B8650C",
    iris: "#3A2416",
    head: 1.0,
    topTuft: ["#FFD23F", "#FFD23F", "#FFD23F"],
    sideTufts: { color: "#FFD23F" },
    glasses: "#6B2F63",
    torso: { kind: "shirt", color: "#FFD23F", stripe: "#F4B41A", shortSleeves: true },
    backpack: "#5E2A72",
    fangs: true,
  },
  paars: {
    id: "paars",
    fur: "#A98BDA",
    furTip: "#D9C8F5",
    furDark: "#6D52A6",
    iris: "#3A2416",
    head: 1.0,
    horns: "#A9DBF2",
    topTuft: ["#FFD23F", "#FFD23F"],
    sideTufts: { color: "#EEF4FF", whiskers: true },
    torso: { kind: "sweater", color: "#B8442E", belt: "#FFC928" },
    fangs: true,
  },
};

/* ------------------------------------------------------------------ */
/* Vacht (fur shells)                                                   */
/* ------------------------------------------------------------------ */
let furTexCache: THREE.Texture | null = null;
const furTexture = () => {
  if (furTexCache) return furTexCache;
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  // deterministische ruis (geen Math.random: elk frame identiek)
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 9000; i++) {
    const v = Math.floor(rnd() * 255);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.floor(rnd() * size), Math.floor(rnd() * size), 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 5);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  furTexCache = t;
  return t;
};

const SHELLS = 9;

/** Een bol (of ander lichaamsdeel) met vacht */
const Furry: React.FC<{
  geometry: THREE.BufferGeometry;
  spec: BolloSpec;
  length?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  dark?: boolean;
}> = ({ geometry, spec, length = 0.05, position, rotation, scale, dark }) => {
  const mats = useMemo(() => {
    const tex = furTexture();
    const base = new THREE.Color(dark ? spec.furDark : spec.fur).multiplyScalar(0.82);
    const tip = new THREE.Color(spec.furTip);
    const out: THREE.MeshStandardMaterial[] = [];
    for (let i = 0; i < SHELLS; i++) {
      const f = (i + 1) / SHELLS;
      out.push(
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(dark ? spec.furDark : spec.fur).lerp(tip, f * f * 0.75),
          alphaMap: tex,
          alphaTest: 0.08 + f * 0.82,
          roughness: 1,
        }),
      );
    }
    return { base: new THREE.MeshStandardMaterial({ color: base, roughness: 1 }), shells: out };
  }, [spec, dark]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry} material={mats.base} castShadow receiveShadow />
      {mats.shells.map((m, i) => {
        const s = 1 + (length * (i + 1)) / SHELLS;
        return <mesh key={i} geometry={geometry} material={m} scale={s} receiveShadow />;
      })}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Gezichtsdelen                                                        */
/* ------------------------------------------------------------------ */
export type Mouth = "smile" | "open" | "o" | "flat" | "grin";
export type Lids = "open" | "wide" | "half" | "happy";
const LID_ROT: Record<Lids, number> = { wide: -2.1, open: -1.5, half: -0.5, happy: -1.3 };

const Eye: React.FC<{ side: number; spec: BolloSpec; lookX: number; lookY: number; lids: Lids; lidMat: THREE.Material }> = ({
  side,
  spec,
  lookX,
  lookY,
  lids,
  lidMat,
}) => {
  const white = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", roughness: 0.12, clearcoat: 1 }), []);
  const iris = useMemo(() => new THREE.MeshPhysicalMaterial({ color: spec.iris, roughness: 0.2, clearcoat: 1 }), [spec.iris]);
  const ink = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#05070D", roughness: 0.1, clearcoat: 1 }), []);
  const r = 0.135;
  return (
    <group position={[side * 0.2, 0.05, 0.37]} rotation={[0, side * 0.3, 0]}>
      <mesh material={white} scale={[1, 1.05, 0.9]}>
        <sphereGeometry args={[r, 40, 40]} />
      </mesh>
      <group rotation={[-lookY * 0.25, lookX * 0.45, 0]} scale={[1, 1.05, 0.9]}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={iris}>
            <sphereGeometry args={[r * 1.01, 40, 20, 0, Math.PI * 2, 0, 0.72]} />
          </mesh>
          <mesh material={ink}>
            <sphereGeometry args={[r * 1.02, 32, 16, 0, Math.PI * 2, 0, 0.36]} />
          </mesh>
        </group>
      </group>
      <mesh material={white} position={[0.04, 0.05, 0.12]} scale={0.022}>
        <sphereGeometry args={[1, 12, 12]} />
      </mesh>
      {/* bovenooglid in vachtkleur (zware oogleden zoals in de tekeningen) */}
      <mesh material={lidMat} rotation={[LID_ROT[lids], 0, side * (lids === "half" ? -0.15 : 0.05)]} scale={[1.08, 1.12, 1.05]}>
        <sphereGeometry args={[r, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {lids === "happy" ? (
        <mesh material={lidMat} rotation={[Math.PI + 0.8, 0, 0]} scale={[1.08, 1.12, 1.05]}>
          <sphereGeometry args={[r, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ) : null}
    </group>
  );
};

const MouthMesh: React.FC<{ mouth: Mouth; fangs: boolean }> = ({ mouth, fangs }) => {
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4A0F1C", roughness: 0.7 }), []);
  const tooth = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#FFFDF4", roughness: 0.3, clearcoat: 0.5 }), []);
  const tongue = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FF6F86", roughness: 0.5 }), []);
  const line = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.17, 0.03, 0), new THREE.Vector3(0, -0.08, 0.03), new THREE.Vector3(0.17, 0.03, 0)),
        24,
        0.016,
        8,
        false,
      ),
    [],
  );
  const fang = (x: number, down: boolean) => (
    <mesh material={tooth} position={[x, down ? -0.005 : -0.05, 0.035]} rotation={[0, 0, down ? Math.PI : 0]}>
      <coneGeometry args={[0.022, 0.06, 10]} />
    </mesh>
  );
  if (mouth === "smile" || mouth === "flat")
    return (
      <group>
        <mesh geometry={line} material={dark} scale={mouth === "flat" ? [0.7, 0.2, 1] : 1} />
        {fangs && mouth === "smile" ? fang(0.1, true) : null}
      </group>
    );
  if (mouth === "o")
    return (
      <mesh material={dark} scale={[0.06, 0.08, 0.04]} position={[0, -0.03, 0]}>
        <sphereGeometry args={[1, 20, 20]} />
      </mesh>
    );
  const w = mouth === "grin" ? 0.22 : 0.17;
  const h = mouth === "grin" ? 0.12 : 0.15;
  return (
    <group>
      <mesh material={dark} scale={[w, h, 0.07]}>
        <sphereGeometry args={[1, 32, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
      <mesh material={dark} scale={[w, 0.015, 0.07]}>
        <sphereGeometry args={[1, 32, 10]} />
      </mesh>
      {(mouth === "grin" ? [-0.12, -0.04, 0.04, 0.12] : [-0.07, 0, 0.07]).map((x) => (
        <mesh key={x} material={tooth} position={[x, -0.018, 0.035]}>
          <boxGeometry args={[0.065, 0.04, 0.03]} />
        </mesh>
      ))}
      {fangs ? (
        <>
          {fang(-w * 0.72, false)}
          {fang(w * 0.72, false)}
        </>
      ) : null}
      <mesh material={tongue} position={[0, -h * 0.7, 0.03]} scale={[w * 0.5, 0.035, 0.04]}>
        <sphereGeometry args={[1, 20, 12]} />
      </mesh>
    </group>
  );
};

/** Pluim: steeltjes met blaadjes, waaiervormig */
const Tuft: React.FC<{ colors: string[]; spread: number; length: number; thin?: boolean }> = ({ colors, spread, length, thin }) => {
  const mats = useMemo(() => colors.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 })), [colors]);
  const n = colors.length;
  return (
    <group>
      {colors.map((_, i) => {
        const a = n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
        const L = length * (1 - Math.abs(a) * 0.25);
        return (
          <group key={i} rotation={[0, 0, a]}>
            <mesh material={mats[i]} position={[0, L / 2, 0]}>
              <cylinderGeometry args={[0.012, 0.018, L, 6]} />
            </mesh>
            {thin ? null : (
              <mesh material={mats[i]} position={[0, L + 0.06, 0]} scale={[0.045, 0.1, 0.02]}>
                <sphereGeometry args={[1, 16, 12]} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Kleren                                                               */
/* ------------------------------------------------------------------ */
const stripeTexture = (base: string, stripe: string, vertical: boolean, count: number) => {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = stripe;
  const step = 256 / count;
  for (let i = 0; i < count; i++) {
    if (vertical) ctx.fillRect(i * step, 0, step * 0.4, 256);
    else ctx.fillRect(0, i * step, 256, step * 0.45);
  }
  // breisel-ruis
  ctx.globalAlpha = 0.08;
  for (let y = 0; y < 256; y += 4) {
    ctx.fillStyle = y % 8 ? "#000" : "#fff";
    ctx.fillRect(0, y, 256, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
};

const knitTexture = (base: string) => {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  ctx.globalAlpha = 0.12;
  for (let x = 0; x < 128; x += 8) {
    ctx.fillStyle = "#000";
    ctx.fillRect(x, 0, 2, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 1);
  return t;
};

const lathe = (profile: [number, number][]) => {
  const spline = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
  return new THREE.LatheGeometry(spline.getPoints(40), 64);
};

/* ------------------------------------------------------------------ */
/* Figuur                                                               */
/* ------------------------------------------------------------------ */
export type FigProps = {
  spec: BolloSpec;
  position?: [number, number, number];
  rotationY?: number;
  lean?: number;
  tilt?: number;
  scale?: number;
  /** 0 = arm omlaag, PI = arm recht omhoog */
  armL?: number;
  armR?: number;
  /** arm naar voren (rad) */
  reachL?: number;
  reachR?: number;
  /** stap: + linkerbeen naar voor */
  stride?: number;
  mouth?: Mouth;
  lookX?: number;
  lookY?: number;
  brows?: "none" | "worried" | "determined" | "up";
  lids?: Lids;
  headTurn?: number;
};

export const BolloboFig: React.FC<FigProps> = ({
  spec,
  position = [0, 0, 0],
  rotationY = 0,
  lean = 0,
  tilt = 0,
  scale = 1,
  armL = 0.25,
  armR = 0.25,
  reachL = 0.15,
  reachR = 0.15,
  stride = 0,
  mouth = "smile",
  lookX = 0,
  lookY = 0,
  brows = "none",
  lids,
  headTurn = 0,
}) => {
  const geo = useMemo(
    () => ({
      sphere: new THREE.SphereGeometry(1, 40, 28),
      limb: new THREE.CapsuleGeometry(1, 2, 6, 16),
      sweater: lathe([
        [0.0, 0.62],
        [0.47, 0.64],
        [0.5, 0.82],
        [0.47, 1.1],
        [0.42, 1.36],
        [0.33, 1.52],
        [0.18, 1.6],
        [0.0, 1.61],
      ]),
      shirt: lathe([
        [0.0, 0.8],
        [0.36, 0.8],
        [0.4, 1.0],
        [0.4, 1.28],
        [0.34, 1.48],
        [0.18, 1.58],
        [0.0, 1.6],
      ]),
      coat: lathe([
        [0.0, 0.5],
        [0.46, 0.5],
        [0.45, 0.8],
        [0.42, 1.1],
        [0.38, 1.3],
        [0.3, 1.44],
        [0.16, 1.5],
        [0.0, 1.51],
      ]),
    }),
    [],
  );

  const lidMat = useMemo(() => new THREE.MeshStandardMaterial({ color: spec.fur, roughness: 0.9 }), [spec.fur]);
  const browMat = useMemo(() => new THREE.MeshStandardMaterial({ color: spec.furDark, roughness: 0.9 }), [spec.furDark]);
  const noseMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: spec.furDark, roughness: 0.4, clearcoat: 0.6 }), [spec.furDark]);
  const clawMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#FFF6E6", roughness: 0.3, clearcoat: 0.6 }), []);

  const torsoMat = useMemo(() => {
    const t = spec.torso;
    if (t.kind === "sweater") return new THREE.MeshStandardMaterial({ map: knitTexture(t.color), roughness: 0.95 });
    if (t.kind === "shirt") return new THREE.MeshStandardMaterial({ map: stripeTexture(t.color, t.stripe, false, 7), roughness: 0.8 });
    return new THREE.MeshStandardMaterial({ map: stripeTexture(t.color, t.stripe, true, 10), roughness: 0.85 });
  }, [spec.torso]);
  const sleeveMat = useMemo(() => new THREE.MeshStandardMaterial({ color: spec.torso.color, roughness: 0.9 }), [spec.torso.color]);
  const innerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: spec.torso.kind === "coat" ? spec.torso.inner : "#fff", roughness: 0.8 }),
    [spec.torso],
  );
  const accentMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: spec.torso.kind === "sweater" && spec.torso.belt ? spec.torso.belt : "#fff", roughness: 0.5, clearcoat: 0.3 }),
    [spec.torso],
  );
  const hornMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: spec.horns ?? "#fff", roughness: 0.35, clearcoat: 0.6 }), [spec.horns]);
  const glassesMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: spec.glasses ?? "#000", roughness: 0.3, clearcoat: 1 }), [spec.glasses]);
  const lensMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.15, clearcoat: 1 }),
    [],
  );
  const packMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: spec.backpack ?? "#000", roughness: 0.5, clearcoat: 0.3 }), [spec.backpack]);

  const lidState: Lids = lids ?? (brows === "determined" ? "half" : brows === "worried" || mouth === "o" ? "wide" : mouth === "grin" ? "happy" : "open");
  const sleeves = spec.torso.kind === "shirt" && spec.torso.shortSleeves ? "short" : "long";
  const torsoGeo = spec.torso.kind === "sweater" ? geo.sweater : spec.torso.kind === "shirt" ? geo.shirt : geo.coat;
  const H = spec.head;
  const headY = 1.98 + (H - 1) * 0.25;

  /* ---------- arm ---------- */
  const arm = (s: number, angle: number, reach: number) => (
    <group position={[s * 0.36, 1.46, 0]} rotation={[-reach, 0, s * angle]}>
      {/* bovenarm */}
      {sleeves === "long" ? (
        <mesh material={sleeveMat} geometry={geo.limb} position={[0, -0.22, 0]} scale={[0.12, 0.13, 0.12]} castShadow />
      ) : (
        <>
          <mesh material={sleeveMat} geometry={geo.sphere} position={[0, -0.08, 0]} scale={[0.15, 0.15, 0.15]} castShadow />
          <Furry spec={spec} geometry={geo.limb} position={[0, -0.25, 0]} scale={[0.085, 0.11, 0.085]} length={0.35} />
        </>
      )}
      {/* elleboog + onderarm (licht gebogen naar voren) */}
      <group position={[0, -0.44, 0]} rotation={[-0.35, 0, 0]}>
        {sleeves === "long" ? (
          <mesh material={sleeveMat} geometry={geo.limb} position={[0, -0.18, 0]} scale={[0.11, 0.11, 0.11]} castShadow />
        ) : (
          <Furry spec={spec} geometry={geo.limb} position={[0, -0.18, 0]} scale={[0.08, 0.1, 0.08]} length={0.35} />
        )}
        {/* hand met drie vingers en duim */}
        <group position={[0, -0.42, 0.02]}>
          <Furry spec={spec} geometry={geo.sphere} scale={[0.1, 0.1, 0.085]} length={0.25} />
          {[-0.05, 0, 0.05].map((x) => (
            <mesh key={x} material={lidMat} geometry={geo.limb} position={[x, -0.1, 0.02]} scale={[0.028, 0.035, 0.028]} castShadow />
          ))}
          <mesh material={lidMat} geometry={geo.limb} position={[-s * 0.08, -0.03, 0.06]} rotation={[0, 0, s * 0.8]} scale={[0.028, 0.03, 0.028]} />
        </group>
      </group>
    </group>
  );

  /* ---------- been ---------- */
  const leg = (s: number, swing: number) => (
    <group position={[s * 0.17, 0.82, 0]} rotation={[swing, 0, s * 0.04]}>
      <Furry spec={spec} geometry={geo.limb} position={[0, -0.36, 0]} scale={[0.125, 0.17, 0.125]} length={0.4} />
      {/* grote voet met drie tenen */}
      <group position={[0, -0.74, 0.08]} rotation={[-swing, 0, 0]}>
        <Furry spec={spec} geometry={geo.sphere} scale={[0.17, 0.09, 0.25]} length={0.25} dark />
        {[-0.09, 0, 0.09].map((x) => (
          <group key={x} position={[x, -0.02, 0.22]}>
            <Furry spec={spec} geometry={geo.sphere} scale={[0.06, 0.055, 0.07]} length={0.3} dark />
            <mesh material={clawMat} position={[0, -0.01, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.018, 0.05, 8]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {leg(-1, stride)}
      {leg(1, -stride)}

      <group position={[0, 0.8, 0]} rotation={[lean, 0, tilt]}>
        <group position={[0, -0.8, 0]}>
          {/* romp met kleren */}
          <mesh geometry={torsoGeo} material={torsoMat} scale={[1, 1, 0.85]} castShadow receiveShadow />
          {spec.torso.kind === "sweater" && spec.torso.belt ? (
            <group position={[0, 0.84, 0]}>
              <mesh material={accentMat} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.85, 1]}>
                <torusGeometry args={[0.5, 0.05, 12, 48]} />
              </mesh>
              {[-1, 1].map((s) => (
                <mesh key={s} material={accentMat} position={[s * 0.1, 0, 0.43]} rotation={[0, 0, s * 0.5]} scale={[0.13, 0.07, 0.04]}>
                  <sphereGeometry args={[1, 16, 12]} />
                </mesh>
              ))}
            </group>
          ) : null}
          {spec.torso.kind === "coat" ? (
            <mesh material={innerMat} position={[0, 1.18, 0.29]} rotation={[-0.25, 0, 0]} scale={[0.14, 0.3, 0.06]}>
              <sphereGeometry args={[1, 20, 16]} />
            </mesh>
          ) : null}
          {spec.backpack ? (
            <group position={[0, 1.15, -0.4]}>
              <mesh material={packMat} castShadow scale={[0.36, 0.42, 0.2]}>
                <sphereGeometry args={[1, 28, 24]} />
              </mesh>
              <mesh material={packMat} position={[0, -0.12, -0.16]} scale={[0.24, 0.2, 0.1]}>
                <sphereGeometry args={[1, 20, 16]} />
              </mesh>
              {[-1, 1].map((s) => (
                <mesh key={s} material={packMat} position={[s * 0.2, 0.05, 0.42]} rotation={[0.1, 0, 0]} scale={[1, 1.2, 1]}>
                  <torusGeometry args={[0.36, 0.028, 8, 32, Math.PI]} />
                </mesh>
              ))}
            </group>
          ) : null}

          {arm(-1, armL, reachL)}
          {arm(1, armR, reachR)}

          {/* hoofd */}
          <group position={[0, headY, 0]} rotation={[0, headTurn, 0]} scale={H}>
            <Furry spec={spec} geometry={geo.sphere} scale={[0.56, 0.45, 0.46]} length={0.09} />
            {/* brede kaak met vachtplukken */}
            {[-1, 1].map((s) => (
              <Furry key={s} spec={spec} geometry={geo.sphere} position={[s * 0.36, -0.17, 0.06]} scale={[0.27, 0.22, 0.26]} length={0.16} />
            ))}
            <Furry spec={spec} geometry={geo.sphere} position={[0, -0.26, 0.1]} scale={[0.3, 0.17, 0.26]} length={0.15} />
            {/* puntige vachtplukken langs de kaak */}
            {[-1, 1].map((s) =>
              [0, 1, 2, 3].map((k) => (
                <mesh
                  key={`${s}${k}`}
                  material={lidMat}
                  position={[s * (0.52 - k * 0.07), -0.22 - k * 0.07, 0.05 + k * 0.03]}
                  rotation={[0, 0, s * (2.0 + k * 0.25)]}
                >
                  <coneGeometry args={[0.05, 0.16, 8]} />
                </mesh>
              )),
            )}

            {/* ogen */}
            <Eye side={-1} spec={spec} lookX={lookX} lookY={lookY} lids={lidState} lidMat={lidMat} />
            <Eye side={1} spec={spec} lookX={lookX} lookY={lookY} lids={lidState} lidMat={lidMat} />
            {brows !== "none"
              ? [-1, 1].map((s) => (
                  <mesh
                    key={s}
                    material={browMat}
                    position={[s * 0.2, brows === "up" ? 0.26 : 0.22, 0.42]}
                    rotation={[0.2, s * 0.3, Math.PI / 2 + s * (brows === "worried" ? -0.4 : brows === "determined" ? 0.35 : -0.1)]}
                  >
                    <capsuleGeometry args={[0.025, 0.12, 6, 10]} />
                  </mesh>
                ))
              : null}
            {/* neusje */}
            <mesh material={noseMat} position={[0, -0.07, 0.47]} scale={[0.05, 0.035, 0.03]}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
            {/* mond */}
            <group position={[0, -0.18, 0.46]} rotation={[-0.15, 0, 0]}>
              <MouthMesh mouth={mouth} fangs={!!spec.fangs} />
            </group>

            {/* bril */}
            {spec.glasses ? (
              <group position={[0, 0.06, 0.5]}>
                {[-1, 1].map((s) => (
                  <group key={s} position={[s * 0.2, 0, 0]} rotation={[0, s * 0.25, 0]}>
                    <mesh material={glassesMat}>
                      <torusGeometry args={[0.16, 0.024, 12, 40]} />
                    </mesh>
                    <mesh material={lensMat}>
                      <circleGeometry args={[0.16, 32]} />
                    </mesh>
                  </group>
                ))}
                <mesh material={glassesMat} position={[0, 0.02, 0.01]} rotation={[0, 0, Math.PI / 2]}>
                  <capsuleGeometry args={[0.018, 0.06, 4, 8]} />
                </mesh>
                {[-1, 1].map((s) => (
                  <mesh key={s} material={glassesMat} position={[s * 0.42, 0.02, -0.2]} rotation={[0, s * -1.2, Math.PI / 2]}>
                    <capsuleGeometry args={[0.015, 0.4, 4, 8]} />
                  </mesh>
                ))}
              </group>
            ) : null}

            {/* hoorntjes */}
            {spec.horns
              ? [-1, 1].map((s) => (
                  <mesh key={s} material={hornMat} position={[s * 0.36, 0.36, 0.02]} rotation={[0, 0, s * -0.6]} castShadow>
                    <coneGeometry args={[0.085, 0.28, 16]} />
                  </mesh>
                ))
              : null}
            {/* pluim bovenop */}
            <group position={[0, 0.4, 0]}>
              <Tuft colors={spec.topTuft} spread={spec.topTuft.length > 3 ? 1.2 : 0.8} length={0.26} />
            </group>
            {/* zijpluimen */}
            {spec.sideTufts
              ? [-1, 1].map((s) => (
                  <group key={s} position={[s * 0.58, 0.02, 0]} rotation={[0, 0, s * -1.35]}>
                    <Tuft
                      colors={[spec.sideTufts!.color, spec.sideTufts!.color, spec.sideTufts!.color]}
                      spread={0.8}
                      length={spec.sideTufts!.whiskers ? 0.2 : 0.16}
                      thin={spec.sideTufts!.whiskers}
                    />
                  </group>
                ))
              : null}
          </group>
        </group>
      </group>
    </group>
  );
};
