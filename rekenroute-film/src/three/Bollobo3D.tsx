import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * 3D-WERKVERSIE VAN EEN BOLLOBO — "feature film"-stijl
 * Organische peervorm, zachte satijnen huid, grote expressieve ogen met iris en
 * oogleden, brede mond, armpjes met handjes en korte beentjes.
 * Wordt aangepast aan de officiële Bollobo-tekeningen zodra die binnen zijn.
 * Voeten staan op y = 0; het lijf is ±2,1 eenheden hoog.
 */

export type Mouth = "smile" | "open" | "o" | "flat" | "grin";
export type Accessory = "stripe" | "backpack" | "pompom" | "none";
export type BadgeShape = "bolt" | "plus" | "star";
export type Lids = "open" | "wide" | "half" | "happy";

export type BollLook = {
  body: string;
  belly: string;
  shade: string;
  hat: string;
  iris: string;
  badge: BadgeShape;
  accessory: Accessory;
};

export const LOOKS: Record<"vlug" | "wijs" | "pimpel", BollLook> = {
  vlug: { body: "#EE4B3F", belly: "#FF9C8C", shade: "#B3302A", hat: "#FFC928", iris: "#3E9BFF", badge: "bolt", accessory: "stripe" },
  wijs: { body: "#3B7EEB", belly: "#93BCFF", shade: "#2252A8", hat: "#FF8A2A", iris: "#E89B2A", badge: "plus", accessory: "backpack" },
  pimpel: { body: "#83C736", belly: "#CBEE98", shade: "#4F8A15", hat: "#A97BEB", iris: "#8A5AE0", badge: "star", accessory: "pompom" },
};

type Props = {
  look: BollLook;
  position?: [number, number, number];
  rotationY?: number;
  /** voor-/achteroverhellen (rad); negatief = naar achter (omhoog kijken) */
  lean?: number;
  /** zijwaarts kantelen (rad) */
  tilt?: number;
  scale?: number;
  /** armhoek rond de schouder: 0 = langs het lijf, PI = recht omhoog */
  armL?: number;
  armR?: number;
  mouth?: Mouth;
  /** kijkrichting van de pupillen, -1..1 */
  lookX?: number;
  lookY?: number;
  brows?: "none" | "worried" | "determined" | "up";
  lids?: Lids;
};

/* ------------------------------------------------------------------ */
/* Materialen                                                           */
/* ------------------------------------------------------------------ */
const lighten = (hex: string, amt: number) => {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color("#ffffff"), amt);
  return c;
};

/** Zachte, satijnen huid (geen plastic) met een lichte "sheen" zoals filmfiguren */
const skin = (color: string) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.55,
    sheen: 1,
    sheenRoughness: 0.45,
    sheenColor: lighten(color, 0.55),
    clearcoat: 0.12,
    clearcoatRoughness: 0.6,
  });

const cloth = (color: string) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.25 });

/* ------------------------------------------------------------------ */
/* Geometrie                                                            */
/* ------------------------------------------------------------------ */
/** Peervormig lijf via een lathe-profiel (breder onderaan, ronde kop) */
const makeBodyGeometry = () => {
  const ctrl = [
    [0.0, -0.98],
    [0.5, -0.94],
    [0.86, -0.78],
    [1.04, -0.48],
    [1.05, -0.12],
    [0.98, 0.26],
    [0.86, 0.62],
    [0.62, 0.92],
    [0.3, 1.07],
    [0.0, 1.1],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const spline = new THREE.SplineCurve(ctrl);
  const pts = spline.getPoints(60);
  pts[0].x = 0;
  pts[pts.length - 1].x = 0;
  return new THREE.LatheGeometry(pts, 96);
};

const smileGeometry = (w: number, depth: number) =>
  new THREE.TubeGeometry(
    new THREE.QuadraticBezierCurve3(new THREE.Vector3(-w, 0.04, 0), new THREE.Vector3(0, -depth, 0.05), new THREE.Vector3(w, 0.04, 0)),
    32,
    0.032,
    10,
    false,
  );

const starShape = () => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.45;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
};

const boltShape = () => {
  const s = new THREE.Shape();
  s.moveTo(0.2, 1);
  s.lineTo(-0.55, -0.1);
  s.lineTo(-0.05, -0.1);
  s.lineTo(-0.25, -1);
  s.lineTo(0.55, 0.15);
  s.lineTo(0.05, 0.15);
  s.closePath();
  return s;
};

const Badge: React.FC<{ shape: BadgeShape; color: string }> = ({ shape, color }) => {
  const geo = useMemo(() => {
    if (shape === "plus") return null;
    return new THREE.ExtrudeGeometry(shape === "star" ? starShape() : boltShape(), {
      depth: 0.25,
      bevelEnabled: true,
      bevelSize: 0.08,
      bevelThickness: 0.08,
      bevelSegments: 3,
    });
  }, [shape]);
  const mat = useMemo(() => cloth(color), [color]);
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.08, 40]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.3} clearcoat={0.5} />
      </mesh>
      <group position={[0, 0, 0.05]} scale={0.14}>
        {shape === "plus" ? (
          <>
            <mesh material={mat}>
              <boxGeometry args={[1.8, 0.6, 0.5]} />
            </mesh>
            <mesh material={mat}>
              <boxGeometry args={[0.6, 1.8, 0.5]} />
            </mesh>
          </>
        ) : (
          <mesh geometry={geo!} material={mat} />
        )}
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Oog met iris, pupil, glans en ooglid                                 */
/* ------------------------------------------------------------------ */
const LID_ROT: Record<Lids, number> = { wide: -2.1, open: -1.55, half: -0.45, happy: -1.3 };

const Eye: React.FC<{
  side: number;
  iris: string;
  skinMat: THREE.Material;
  lookX: number;
  lookY: number;
  lids: Lids;
}> = ({ side, iris, skinMat, lookX, lookY, lids }) => {
  const white = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }), []);
  const irisMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: iris, roughness: 0.2, clearcoat: 1, emissive: iris, emissiveIntensity: 0.12 }), [iris]);
  const ink = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#0E1324", roughness: 0.1, clearcoat: 1 }), []);
  // pupil draait mee met de kijkrichting
  const ry = lookX * 0.42;
  const rx = -lookY * 0.22;
  return (
    <group position={[side * 0.37, 0.2, 0.74]} rotation={[0, side * 0.32, 0]}>
      <mesh material={white} scale={[1, 1.12, 0.92]} castShadow>
        <sphereGeometry args={[0.3, 48, 48]} />
      </mesh>
      <group rotation={[rx, ry, 0]} scale={[1, 1.12, 0.92]}>
        {/* iris + pupil als bolkapjes op het oogwit (pool naar voren) */}
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={irisMat}>
            <sphereGeometry args={[0.303, 48, 24, 0, Math.PI * 2, 0, 0.62]} />
          </mesh>
          <mesh material={ink}>
            <sphereGeometry args={[0.306, 32, 16, 0, Math.PI * 2, 0, 0.3]} />
          </mesh>
        </group>
      </group>
      {/* glans (blijft op dezelfde plek, zoals een lichtreflectie) */}
      <mesh material={white} position={[0.08, 0.11, 0.27]} scale={0.042}>
        <sphereGeometry args={[1, 16, 16]} />
      </mesh>
      <mesh material={white} position={[-0.05, -0.05, 0.285]} scale={0.018}>
        <sphereGeometry args={[1, 12, 12]} />
      </mesh>
      {/* bovenooglid (in huidskleur) */}
      <mesh material={skinMat} rotation={[LID_ROT[lids], 0, side * (lids === "half" ? -0.12 : 0)]} scale={[1.06, 1.18, 1.0]}>
        <sphereGeometry args={[0.31, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* onderooglid bij "happy" (lachende ogen) */}
      {lids === "happy" ? (
        <mesh material={skinMat} rotation={[Math.PI + 0.75, 0, 0]} scale={[1.06, 1.18, 1.0]}>
          <sphereGeometry args={[0.31, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ) : null}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* De Bollobo                                                            */
/* ------------------------------------------------------------------ */
export const Bollobo3D: React.FC<Props> = ({
  look,
  position = [0, 0, 0],
  rotationY = 0,
  lean = 0,
  tilt = 0,
  scale = 1,
  armL = 0.25,
  armR = 0.25,
  mouth = "smile",
  lookX = 0,
  lookY = 0,
  brows = "none",
  lids,
}) => {
  const bodyGeo = useMemo(() => makeBodyGeometry(), []);
  const bodyMat = useMemo(() => skin(look.body), [look.body]);
  const bellyMat = useMemo(() => skin(look.belly), [look.belly]);
  const shadeMat = useMemo(() => skin(look.shade), [look.shade]);
  const hatMat = useMemo(() => cloth(look.hat), [look.hat]);
  const whiteCloth = useMemo(() => cloth("#FFFFFF"), []);
  const inkMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#2A0F18", roughness: 0.4 }), []);
  const mouthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5A1020", roughness: 0.7 }), []);
  const toothMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#FFFDF5", roughness: 0.25, clearcoat: 0.6 }), []);
  const tongueMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FF6F86", roughness: 0.5 }), []);
  const cheekMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FF7E9A", roughness: 0.9, transparent: true, opacity: 0.45 }), []);
  const smileGeo = useMemo(() => smileGeometry(0.26, 0.16), []);
  const flatGeo = useMemo(() => smileGeometry(0.15, 0.0), []);

  const lidState: Lids = lids ?? (brows === "determined" ? "half" : brows === "worried" || mouth === "o" ? "wide" : mouth === "grin" ? "happy" : "open");

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* beentjes + voeten */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.42, 0, 0.05]}>
          <mesh material={bodyMat} position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.23, 0.36, 24]} />
          </mesh>
          <mesh material={shadeMat} position={[0, 0.12, 0.12]} scale={[0.3, 0.15, 0.4]} castShadow>
            <sphereGeometry args={[1, 32, 32]} />
          </mesh>
        </group>
      ))}

      <group position={[0, 1.38, 0]} rotation={[lean, 0, tilt]}>
        {/* lijf */}
        <mesh geometry={bodyGeo} material={bodyMat} castShadow receiveShadow scale={[1, 1, 0.9]} />
        {/* buik */}
        <mesh material={bellyMat} position={[0, -0.58, 0.42]} scale={[0.62, 0.42, 0.5]}>
          <sphereGeometry args={[1, 48, 48]} />
        </mesh>

        {/* ogen */}
        <Eye side={-1} iris={look.iris} skinMat={bodyMat} lookX={lookX} lookY={lookY} lids={lidState} />
        <Eye side={1} iris={look.iris} skinMat={bodyMat} lookX={lookX} lookY={lookY} lids={lidState} />

        {/* wenkbrauwen */}
        {brows !== "none"
          ? [-1, 1].map((s) => (
              <mesh
                key={s}
                material={shadeMat}
                position={[s * 0.37, brows === "up" ? 0.6 : 0.55, 0.78]}
                rotation={[0.2, s * 0.3, Math.PI / 2 + s * (brows === "worried" ? -0.4 : brows === "determined" ? 0.35 : -0.1)]}
              >
                <capsuleGeometry args={[0.045, 0.22, 6, 12]} />
              </mesh>
            ))
          : null}

        {/* wangetjes */}
        {[-1, 1].map((s) => (
          <mesh key={s} material={cheekMat} position={[s * 0.62, -0.12, 0.68]} rotation={[0, s * 0.75, 0]} scale={[0.16, 0.09, 0.05]}>
            <sphereGeometry args={[1, 24, 24]} />
          </mesh>
        ))}

        {/* mond */}
        <group position={[0, -0.2, 0.94]} rotation={[-0.1, 0, 0]}>
          {mouth === "smile" ? <mesh geometry={smileGeo} material={inkMat} /> : null}
          {mouth === "flat" ? <mesh geometry={flatGeo} material={inkMat} /> : null}
          {mouth === "o" ? (
            <mesh material={mouthMat} scale={[0.11, 0.14, 0.06]} position={[0, -0.04, 0]}>
              <sphereGeometry args={[1, 24, 24]} />
            </mesh>
          ) : null}
          {mouth === "open" || mouth === "grin" ? (
            <group>
              {/* mondholte: halve ellips */}
              <mesh material={mouthMat} scale={mouth === "grin" ? [0.36, 0.2, 0.12] : [0.3, 0.26, 0.12]}>
                <sphereGeometry args={[1, 40, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              </mesh>
              <mesh material={mouthMat} scale={mouth === "grin" ? [0.36, 0.03, 0.12] : [0.3, 0.03, 0.12]}>
                <sphereGeometry args={[1, 40, 12]} />
              </mesh>
              {/* boventandjes */}
              {(mouth === "grin" ? [-0.18, -0.06, 0.06, 0.18] : [-0.12, 0, 0.12]).map((x) => (
                <mesh key={x} material={toothMat} position={[x, -0.035, 0.06]}>
                  <boxGeometry args={[0.1, 0.07, 0.05]} />
                </mesh>
              ))}
              {/* tong */}
              <mesh material={tongueMat} position={[0, mouth === "grin" ? -0.14 : -0.19, 0.05]} scale={[0.16, 0.06, 0.07]}>
                <sphereGeometry args={[1, 24, 16]} />
              </mesh>
            </group>
          ) : null}
        </group>

        {/* armen met handjes */}
        {[
          { s: -1, a: armL },
          { s: 1, a: armR },
        ].map(({ s, a }) => (
          <group key={s} position={[s * 0.92, -0.2, 0.05]} rotation={[0, 0, s * a]}>
            <mesh material={bodyMat} position={[s * 0.04, -0.28, 0]} rotation={[0, 0, s * 0.12]} castShadow>
              <capsuleGeometry args={[0.13, 0.36, 8, 16]} />
            </mesh>
            {/* handje (want) + duimpje */}
            <mesh material={bodyMat} position={[s * 0.08, -0.62, 0.02]} scale={[0.17, 0.19, 0.15]} castShadow>
              <sphereGeometry args={[1, 24, 24]} />
            </mesh>
            <mesh material={bodyMat} position={[s * -0.06, -0.55, 0.1]} scale={[0.07, 0.09, 0.07]}>
              <sphereGeometry args={[1, 16, 16]} />
            </mesh>
          </group>
        ))}

        {/* helm (uniform van de ploeg) */}
        <group position={[0, 0.66, -0.02]} rotation={[-0.12, 0, 0]}>
          <mesh material={hatMat} castShadow scale={[0.86, 0.6, 0.84]}>
            <sphereGeometry args={[1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh material={hatMat} rotation={[Math.PI / 2, 0, 0]} scale={[0.86, 0.84, 1]} castShadow>
            <torusGeometry args={[1.0, 0.07, 16, 64]} />
          </mesh>
          <mesh material={hatMat} position={[0, -0.02, 0.8]} rotation={[0.3, 0, 0]} scale={[0.55, 0.05, 0.3]}>
            <sphereGeometry args={[1, 32, 16]} />
          </mesh>
          {look.accessory === "stripe" ? (
            <mesh material={whiteCloth} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.855, 0.835, 1]}>
              <torusGeometry args={[0.985, 0.05, 12, 64]} />
            </mesh>
          ) : null}
          {look.accessory === "pompom" ? (
            <mesh material={whiteCloth} position={[0, 0.64, 0]} scale={0.18} castShadow>
              <sphereGeometry args={[1, 24, 24]} />
            </mesh>
          ) : null}
          <group position={[0, 0.36, 0.64]} rotation={[-0.55, 0, 0]} scale={0.85}>
            <Badge shape={look.badge} color={look.shade} />
          </group>
        </group>

        {/* Tiprugzak */}
        {look.accessory === "backpack" ? (
          <group position={[0, -0.15, -0.88]}>
            <mesh material={hatMat} castShadow scale={[0.6, 0.66, 0.34]}>
              <sphereGeometry args={[1, 32, 32]} />
            </mesh>
            <mesh material={cloth(look.shade)} position={[0, -0.14, -0.26]} scale={[0.4, 0.3, 0.14]}>
              <sphereGeometry args={[1, 24, 24]} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} material={cloth(look.shade)} position={[s * 0.42, 0.25, 0.55]} rotation={[0.3, 0, s * 0.2]}>
                <torusGeometry args={[0.55, 0.035, 8, 32, Math.PI * 0.7]} />
              </mesh>
            ))}
          </group>
        ) : null}
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Rommelwind                                                           */
/* ------------------------------------------------------------------ */
export const Rommelwind3D: React.FC<{ position?: [number, number, number]; scale?: number; rotationY?: number }> = ({
  position = [0, 0, 0],
  scale = 1,
  rotationY = 0,
}) => {
  const swirl = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#DDF4FF",
        roughness: 0.2,
        transmission: 0.2,
        transparent: true,
        opacity: 0.85,
        clearcoat: 1,
        emissive: "#9AD8FF",
        emissiveIntensity: 0.25,
      }),
    [],
  );
  const ink = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#1B2238", roughness: 0.1, clearcoat: 1 }), []);
  const white = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.1 }), []);
  const rings = [
    { y: 0.9, r: 1.0, t: 0.32, rot: 0.2 },
    { y: 0.25, r: 0.75, t: 0.26, rot: -0.3 },
    { y: -0.3, r: 0.5, t: 0.2, rot: 0.4 },
    { y: -0.75, r: 0.28, t: 0.14, rot: -0.2 },
  ];
  return (
    <group position={position} scale={scale} rotation={[0, rotationY, 0]}>
      {rings.map((g, i) => (
        <mesh key={i} material={swirl} position={[Math.sin(i * 1.4) * 0.15, g.y, 0]} rotation={[Math.PI / 2 + g.rot, 0, i * 0.8]} castShadow>
          <torusGeometry args={[g.r, g.t, 24, 64, Math.PI * 1.75]} />
        </mesh>
      ))}
      {/* kop */}
      <mesh material={swirl} position={[0, 1.15, 0]} scale={[0.95, 0.7, 0.8]}>
        <sphereGeometry args={[1, 48, 48]} />
      </mesh>
      {/* krul */}
      <mesh material={swirl} position={[0.3, 1.9, -0.1]} rotation={[0, 0, 0.6]}>
        <torusGeometry args={[0.28, 0.08, 16, 48, Math.PI * 1.5]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.32, 1.25, 0.62]}>
          <mesh material={white} scale={[0.2, 0.24, 0.12]}>
            <sphereGeometry args={[1, 32, 32]} />
          </mesh>
          <mesh material={ink} position={[s * -0.03, -0.02, 0.1]} scale={[0.11, 0.13, 0.06]}>
            <sphereGeometry args={[1, 24, 24]} />
          </mesh>
          <mesh material={ink} position={[0, 0.3, 0.05]} rotation={[0, 0, s * 0.4]} scale={[0.16, 0.035, 0.04]}>
            <sphereGeometry args={[1, 16, 16]} />
          </mesh>
        </group>
      ))}
      {/* ondeugende grijns */}
      <mesh material={ink} position={[0.05, 0.9, 0.72]} rotation={[0, 0, Math.PI + 0.25]}>
        <torusGeometry args={[0.18, 0.035, 12, 32, Math.PI * 0.9]} />
      </mesh>
    </group>
  );
};
