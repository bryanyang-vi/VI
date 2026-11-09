import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * 3D-WERKVERSIE VAN EEN BOLLOBO
 * Rond lijf, grote ogen, helm met badge. Wordt vervangen/aangepast zodra de
 * officiële tekeningen van de Bollobo's binnen zijn. Alle maten in "body radius" (1).
 */

export type Mouth = "smile" | "open" | "o" | "flat";
export type Accessory = "stripe" | "backpack" | "pompom" | "none";
export type BadgeShape = "bolt" | "plus" | "star";

export type BollLook = {
  body: string;
  belly: string;
  shade: string;
  hat: string;
  badge: BadgeShape;
  accessory: Accessory;
};

export const LOOKS: Record<"vlug" | "wijs" | "pimpel", BollLook> = {
  vlug: { body: "#F0473D", belly: "#FF9A8A", shade: "#B82E27", hat: "#FFC928", badge: "bolt", accessory: "stripe" },
  wijs: { body: "#2F7BF5", belly: "#8DB8FF", shade: "#1F55B5", hat: "#FF8A2A", badge: "plus", accessory: "backpack" },
  pimpel: { body: "#7CC52A", belly: "#C7EC8F", shade: "#4F8A15", hat: "#A97BEB", badge: "star", accessory: "pompom" },
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
  /** wenkbrauwen voor emotie */
  brows?: "none" | "worried" | "determined";
};

const glossy = (color: string, rough = 0.42) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: rough, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.2 });

const starShape = () => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.45;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
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
  const mat = useMemo(() => glossy(color, 0.3), [color]);
  return (
    <group>
      {/* witte badge-schijf */}
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
}) => {
  const bodyMat = useMemo(() => glossy(look.body), [look.body]);
  const bellyMat = useMemo(() => glossy(look.belly, 0.5), [look.belly]);
  const shadeMat = useMemo(() => glossy(look.shade, 0.5), [look.shade]);
  const hatMat = useMemo(() => glossy(look.hat, 0.3), [look.hat]);
  const inkMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#1B2238", roughness: 0.15, clearcoat: 1 }), []);
  const whiteMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.15, clearcoat: 1 }), []);
  const mouthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6E1424", roughness: 0.6 }), []);
  const cheekMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FF7E9A", roughness: 0.8, transparent: true, opacity: 0.75 }), []);

  const px = lookX * 0.09;
  const py = lookY * 0.08;

  return (
    // lijf staat met voeten op y=0
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <group position={[0, 1.05, 0]} rotation={[lean, 0, tilt]}>
        {/* lijf */}
        <mesh material={bodyMat} castShadow receiveShadow scale={[1, 0.96, 0.95]}>
          <sphereGeometry args={[1, 64, 64]} />
        </mesh>
        {/* buik */}
        <mesh material={bellyMat} position={[0, -0.45, 0.5]} scale={[0.58, 0.44, 0.46]}>
          <sphereGeometry args={[1, 48, 48]} />
        </mesh>

        {/* ogen */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.33, 0.14, 0.76]} rotation={[0, s * 0.28, 0]}>
            <mesh material={whiteMat} scale={[0.27, 0.32, 0.2]} castShadow>
              <sphereGeometry args={[1, 40, 40]} />
            </mesh>
            <mesh material={inkMat} position={[px, py - 0.02, 0.17]} scale={[0.15, 0.17, 0.08]}>
              <sphereGeometry args={[1, 32, 32]} />
            </mesh>
            <mesh material={whiteMat} position={[px + 0.05, py + 0.06, 0.24]} scale={0.045}>
              <sphereGeometry args={[1, 16, 16]} />
            </mesh>
            {brows !== "none" ? (
              <mesh
                material={inkMat}
                position={[0, 0.4, 0.1]}
                rotation={[0, 0, (brows === "worried" ? -0.35 : 0.35) * s]}
                scale={[0.2, 0.045, 0.05]}
              >
                <sphereGeometry args={[1, 16, 16]} />
              </mesh>
            ) : null}
          </group>
        ))}

        {/* wangetjes */}
        {[-1, 1].map((s) => (
          <mesh key={s} material={cheekMat} position={[s * 0.58, -0.12, 0.72]} rotation={[0, s * 0.6, 0]} scale={[0.14, 0.08, 0.04]}>
            <sphereGeometry args={[1, 24, 24]} />
          </mesh>
        ))}

        {/* mond */}
        <group position={[0, -0.24, 0.9]} rotation={[-0.25, 0, 0]}>
          {mouth === "smile" ? (
            <mesh material={inkMat} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.17, 0.035, 12, 32, Math.PI]} />
            </mesh>
          ) : mouth === "open" ? (
            <group>
              <mesh material={mouthMat} scale={[0.27, 0.22, 0.1]} position={[0, -0.02, 0]}>
                <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              </mesh>
              <mesh material={mouthMat} scale={[0.27, 0.025, 0.1]} position={[0, -0.02, 0]}>
                <sphereGeometry args={[1, 32, 16]} />
              </mesh>
              <mesh position={[0, -0.16, 0.04]} scale={[0.14, 0.06, 0.06]}>
                <sphereGeometry args={[1, 24, 16]} />
                <meshStandardMaterial color="#FF6B81" roughness={0.6} />
              </mesh>
            </group>
          ) : mouth === "o" ? (
            <mesh material={mouthMat} scale={[0.1, 0.13, 0.06]}>
              <sphereGeometry args={[1, 24, 24]} />
            </mesh>
          ) : (
            <mesh material={inkMat} scale={[0.14, 0.03, 0.03]}>
              <sphereGeometry args={[1, 16, 16]} />
            </mesh>
          )}
        </group>

        {/* armen (schouder op de zijkant, draaien rond z) */}
        {[
          { s: -1, a: armL },
          { s: 1, a: armR },
        ].map(({ s, a }) => (
          <group key={s} position={[s * 0.88, -0.05, 0.05]} rotation={[0, 0, s * a]}>
            <mesh material={bodyMat} position={[s * 0.06, -0.32, 0]} castShadow>
              <capsuleGeometry args={[0.15, 0.4, 8, 16]} />
            </mesh>
          </group>
        ))}

        {/* helm */}
        <group position={[0, 0.3, 0]}>
          <mesh material={hatMat} castShadow scale={[1.04, 0.82, 1.04]}>
            <sphereGeometry args={[1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh material={hatMat} position={[0, 0.0, 0.0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[1.03, 0.08, 16, 64]} />
          </mesh>
          {/* klep */}
          <mesh material={hatMat} position={[0, 0.0, 0.92]} rotation={[0.25, 0, 0]} scale={[0.75, 0.06, 0.4]}>
            <sphereGeometry args={[1, 32, 16]} />
          </mesh>
          {look.accessory === "stripe" ? (
            <mesh material={whiteMat} scale={[0.16, 0.835, 1.06]}>
              <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          ) : null}
          {look.accessory === "pompom" ? (
            <mesh material={whiteMat} position={[0, 0.86, 0]} scale={0.2} castShadow>
              <sphereGeometry args={[1, 24, 24]} />
            </mesh>
          ) : null}
          <group position={[0, 0.48, 0.74]} rotation={[-0.6, 0, 0]}>
            <Badge shape={look.badge} color={look.shade} />
          </group>
        </group>

        {/* Tiprugzak */}
        {look.accessory === "backpack" ? (
          <group position={[0, -0.05, -0.9]}>
            <mesh material={hatMat} castShadow scale={[0.62, 0.7, 0.35]}>
              <sphereGeometry args={[1, 32, 32]} />
            </mesh>
            <mesh material={shadeMat} position={[0, -0.12, -0.28]} scale={[0.42, 0.32, 0.14]}>
              <sphereGeometry args={[1, 24, 24]} />
            </mesh>
          </group>
        ) : null}
      </group>

      {/* voeten */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={shadeMat} position={[s * 0.4, 0.14, 0.18]} scale={[0.3, 0.17, 0.4]} castShadow>
          <sphereGeometry args={[1, 32, 32]} />
        </mesh>
      ))}
    </group>
  );
};

/** Rommelwind: speels windje van wervelende ringen met oogjes */
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
