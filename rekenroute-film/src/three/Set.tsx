import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { continueRender, delayRender } from "remotion";
import { fontFamily } from "../theme";

/* ------------------------------------------------------------------ */
/* Camera & licht                                                       */
/* ------------------------------------------------------------------ */
export const CameraRig: React.FC<{ position: [number, number, number]; target: [number, number, number]; fov?: number }> = ({
  position,
  target,
  fov = 40,
}) => {
  const { camera, invalidate } = useThree();
  useLayoutEffect(() => {
    camera.position.set(...position);
    (camera as THREE.PerspectiveCamera).fov = fov;
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    invalidate();
  }, [camera, position, target, fov, invalidate]);
  return null;
};

export const DayLights: React.FC<{ sun?: [number, number, number]; intensity?: number; warm?: string }> = ({
  sun = [8, 14, 9],
  intensity = 2.6,
  warm = "#FFF1D6",
}) => (
  <>
    <hemisphereLight args={["#CFEBFF", "#6FA84A", 1.1]} />
    <directionalLight
      position={sun}
      intensity={intensity}
      color={warm}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-22}
      shadow-camera-right={22}
      shadow-camera-top={22}
      shadow-camera-bottom={-22}
      shadow-bias={-0.0004}
      shadow-radius={4}
    />
    <directionalLight position={[-8, 5, 10]} intensity={0.6} color="#BFE3FF" />
  </>
);

/* ------------------------------------------------------------------ */
/* Tekst op een textuur (voor borden, schermen, de Tipkaart)            */
/* ------------------------------------------------------------------ */
/** Wacht tot het lettertype geladen is voordat we op canvas tekenen. */
export const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    document.fonts.load(`700 80px ${fontFamily}`).then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready;
};

export const useCanvasTexture = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[]) =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

export const font = (size: number, weight = 700) => `${weight} ${size}px ${fontFamily}, Arial, sans-serif`;

export const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/* ------------------------------------------------------------------ */
/* Landschap                                                            */
/* ------------------------------------------------------------------ */
export const Ground: React.FC<{ color?: string; y?: number; size?: number }> = ({ color = "#7CC657", y = 0, size = 300 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
    <planeGeometry args={[size, size]} />
    <meshStandardMaterial color={color} roughness={0.95} />
  </mesh>
);

export const Hill: React.FC<{ position: [number, number, number]; r: number; color?: string; flat?: number }> = ({
  position,
  r,
  color = "#6DBB4B",
  flat = 0.45,
}) => (
  <mesh position={position} scale={[1, flat, 1]} receiveShadow castShadow>
    <sphereGeometry args={[r, 48, 32]} />
    <meshStandardMaterial color={color} roughness={0.95} />
  </mesh>
);

export const Tree: React.FC<{ position: [number, number, number]; s?: number; color?: string }> = ({ position, s = 1, color = "#3E9B3A" }) => (
  <group position={position} scale={s}>
    <mesh position={[0, 0.9, 0]} castShadow>
      <cylinderGeometry args={[0.16, 0.24, 1.8, 12]} />
      <meshStandardMaterial color="#8A5A2B" roughness={0.9} />
    </mesh>
    {[
      [0, 2.3, 0, 1.0],
      [0.55, 1.9, 0.2, 0.7],
      [-0.5, 2.0, -0.1, 0.75],
      [0.1, 2.9, 0, 0.65],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} castShadow receiveShadow>
        <sphereGeometry args={[r, 24, 24]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    ))}
  </group>
);

export const Cloud: React.FC<{ position: [number, number, number]; s?: number }> = ({ position, s = 1 }) => (
  <group position={position} scale={s}>
    {[
      [0, 0, 0, 1.2],
      [1.3, -0.2, 0.1, 0.9],
      [-1.3, -0.25, 0, 0.85],
      [0.5, 0.5, -0.2, 0.9],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}>
        <sphereGeometry args={[r, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} roughness={1} />
      </mesh>
    ))}
  </group>
);

/** De oranje Rekenroute als lint over de grond */
export const Road: React.FC<{ points: [number, number, number][]; width?: number }> = ({ points, width = 3.2 }) => {
  const { road, dashes } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const n = 200;
    const pos: number[] = [];
    const idx: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const side = new THREE.Vector3().crossVectors(tan, up).normalize().multiplyScalar(width / 2);
      pos.push(p.x + side.x, p.y + 0.03, p.z + side.z, p.x - side.x, p.y + 0.03, p.z - side.z);
      if (i < n) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const d: { p: THREE.Vector3; a: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const t = (i + 0.5) / 40;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      d.push({ p, a: Math.atan2(tan.x, tan.z) });
    }
    return { road: g, dashes: d };
  }, [points, width]);
  return (
    <group>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial color="#FF7A2F" roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
      {dashes.map((d, i) => (
        <mesh key={i} position={[d.p.x, d.p.y + 0.05, d.p.z]} rotation={[0, d.a, 0]} receiveShadow>
          <boxGeometry args={[0.18, 0.02, 0.8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

/** Getallenpaaltje langs de route */
export const NumberPost: React.FC<{ position: [number, number, number]; n: number | string; rotationY?: number; s?: number }> = ({
  position,
  n,
  rotationY = 0,
  s = 1,
}) => {
  const tex = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#FF7A2F";
      roundRect(ctx, 0, 0, w, h, 50);
      ctx.fill();
      ctx.lineWidth = 18;
      ctx.strokeStyle = "#fff";
      roundRect(ctx, 12, 12, w - 24, h - 24, 40);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = font(160);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), w / 2, h / 2 + 10);
    },
    [n],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={s}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.8, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 2.0, 0]} castShadow>
        <boxGeometry args={[0.95, 0.95, 0.12]} />
        <meshStandardMaterial color="#FF7A2F" />
      </mesh>
      <mesh position={[0, 2.0, 0.065]}>
        <planeGeometry args={[0.95, 0.95]} />
        <meshStandardMaterial map={tex} />
      </mesh>
    </group>
  );
};

/** Huisje van een dorp */
export const House: React.FC<{
  position: [number, number, number];
  wall?: string;
  roof?: string;
  s?: number;
  rotationY?: number;
  lit?: boolean;
}> = ({ position, wall = "#FFF1D2", roof = "#E8483F", s = 1, rotationY = 0, lit = false }) => (
  <group position={position} scale={s} rotation={[0, rotationY, 0]}>
    <mesh position={[0, 1, 0]} castShadow receiveShadow>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color={wall} roughness={0.85} />
    </mesh>
    <mesh position={[0, 2.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[1.75, 1.4, 4]} />
      <meshStandardMaterial color={roof} roughness={0.7} />
    </mesh>
    {/* deur */}
    <mesh position={[0, 0.6, 1.01]}>
      <planeGeometry args={[0.6, 1.1]} />
      <meshStandardMaterial color="#9B6234" />
    </mesh>
    {/* raampjes */}
    {[-0.6, 0.6].map((x) => (
      <mesh key={x} position={[x, 1.45, 1.01]}>
        <planeGeometry args={[0.45, 0.45]} />
        <meshStandardMaterial
          color={lit ? "#FFD27A" : "#8FD3FF"}
          emissive={lit ? "#FFB940" : "#000000"}
          emissiveIntensity={lit ? 1.6 : 0}
        />
      </mesh>
    ))}
  </group>
);

/** Rivier op de bodem van de kloof */
export const Water: React.FC<{ position: [number, number, number]; size: [number, number] }> = ({ position, size }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
    <planeGeometry args={size} />
    <meshPhysicalMaterial color="#2FB6E8" roughness={0.15} clearcoat={1} emissive="#0E6E9A" emissiveIntensity={0.25} />
  </mesh>
);
