import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Rommelwind3D } from "../three/Bollobo3D";
import { BolloboFig as Bollobo3D, SPECS } from "../three/BolloboFig";

/** Werknamen uit het script gekoppeld aan de officiële Bollobo's (seizoen 1) */
const LOOKS = { vlug: SPECS.paars, wijs: SPECS.oranje, pimpel: SPECS.kleuter };
import {
  CameraRig,
  Cloud,
  DayLights,
  Ground,
  Hill,
  House,
  NumberPost,
  Road,
  Tree,
  Water,
  font,
  roundRect,
  useCanvasTexture,
  useFontsReady,
} from "../three/Set";
import { COLORS, fontFamily } from "../theme";

/* ------------------------------------------------------------------ */
/* Gemeenschappelijk kader: 3D-canvas + 2D-overlay                      */
/* ------------------------------------------------------------------ */
const Frame: React.FC<{
  sky: string;
  caption: string;
  children: React.ReactNode;
  overlay?: React.ReactNode;
  fog?: [string, number, number];
}> = ({ sky, caption, children, overlay, fog }) => {
  const { width, height } = useVideoConfig();
  const ready = useFontsReady();
  return (
    <AbsoluteFill style={{ background: sky }}>
      {ready ? (
        <ThreeCanvas
          width={width}
          height={height}
          shadows
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
          camera={{ fov: 40, near: 0.1, far: 400 }}
        >
          {fog ? <fog attach="fog" args={fog} /> : null}
          {children}
        </ThreeCanvas>
      ) : null}
      {overlay}
      <div
        style={{
          position: "absolute",
          left: 36,
          bottom: 30,
          fontFamily,
          fontWeight: 600,
          fontSize: 30,
          color: "white",
          background: "rgba(20,28,48,0.72)",
          padding: "10px 24px",
          borderRadius: 18,
        }}
      >
        {caption}
      </div>
    </AbsoluteFill>
  );
};

const Banner: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = COLORS.ink }) => (
  <div style={{ position: "absolute", top: 46, width: "100%", display: "flex", justifyContent: "center" }}>
    <div
      style={{
        background: bg,
        color: "white",
        fontFamily,
        fontWeight: 700,
        fontSize: 84,
        padding: "16px 56px",
        borderRadius: 40,
        border: "8px solid white",
        boxShadow: "0 12px 0 rgba(0,0,0,0.18)",
      }}
    >
      {children}
    </div>
  </div>
);

const Q: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ background: COLORS.sun, color: COLORS.ink, borderRadius: 20, padding: "0 22px", margin: "0 10px" }}>{children}</span>
);

const ThinkBubble: React.FC<{ text: string; right?: number; top?: number }> = ({ text, right = 90, top = 230 }) => (
  <div
    style={{
      position: "absolute",
      right,
      top,
      width: 340,
      height: 340,
      borderRadius: "50%",
      background: COLORS.sun,
      border: "12px solid white",
      boxShadow: "0 14px 0 rgba(0,0,0,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      fontFamily,
      fontWeight: 700,
      fontSize: 66,
      color: COLORS.ink,
      lineHeight: 1.05,
      transform: "rotate(-6deg)",
    }}
  >
    {text}
  </div>
);

/* ------------------------------------------------------------------ */
/* De brug over de kloof (sc. 5 t.e.m. 9)                               */
/* ------------------------------------------------------------------ */
type Plank = "on" | "ghost" | "gone" | "tilted";
const SLOT_X = (i: number) => -4.05 + i * 0.9;

const Gorge: React.FC = () => {
  const rock = "#C68A52";
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 10.25, -4.1, -2]} receiveShadow castShadow>
            <boxGeometry args={[11.5, 8, 24]} />
            <meshStandardMaterial color={rock} roughness={0.95} />
          </mesh>
          <mesh position={[s * 10.25, -0.12, -2]} receiveShadow>
            <boxGeometry args={[11.7, 0.3, 24.2]} />
            <meshStandardMaterial color="#7CC657" roughness={0.95} />
          </mesh>
        </group>
      ))}
      <Water position={[0, -6.5, -2]} size={[9.2, 40]} />
    </group>
  );
};

const Bridge: React.FC<{ planks: Plank[]; flying?: number }> = ({ planks, flying = 0 }) => {
  const rope = useMemo(() => {
    return [-1.15, 1.15].map((z) => {
      const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-4.6, 1.25, z), new THREE.Vector3(0, 0.35, z), new THREE.Vector3(4.6, 1.25, z));
      return { z, geo: new THREE.TubeGeometry(c, 60, 0.05, 8, false), curve: c };
    });
  }, []);
  const wood = "#B9773A";
  return (
    <group>
      {/* palen */}
      {[-4.6, 4.6].map((x) =>
        [-1.15, 1.15].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.6, z]} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 1.4, 12]} />
            <meshStandardMaterial color="#8A5A2B" />
          </mesh>
        )),
      )}
      {rope.map((r) => (
        <group key={r.z}>
          <mesh geometry={r.geo} castShadow>
            <meshStandardMaterial color="#E9D3A8" roughness={0.9} />
          </mesh>
          {planks.map((_, i) => {
            const t = (SLOT_X(i) + 4.6) / 9.2;
            const p = r.curve.getPoint(t);
            return (
              <mesh key={i} position={[SLOT_X(i), p.y / 2, r.z]}>
                <cylinderGeometry args={[0.025, 0.025, p.y, 6]} />
                <meshStandardMaterial color="#E9D3A8" />
              </mesh>
            );
          })}
        </group>
      ))}
      {/* touwen onder de planken */}
      {[-1.0, 1.0].map((z) => (
        <mesh key={z} position={[0, -0.1, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 9.2, 8]} />
          <meshStandardMaterial color="#E9D3A8" />
        </mesh>
      ))}
      {planks.map((st, i) => {
        if (st === "gone") return null;
        if (st === "ghost")
          return (
            <mesh key={i} position={[SLOT_X(i), -0.02, 0]}>
              <boxGeometry args={[0.8, 0.14, 2.4]} />
              <meshStandardMaterial color="#FFE15A" emissive="#FFD21F" emissiveIntensity={1.6} transparent opacity={0.6} />
            </mesh>
          );
        return (
          <mesh
            key={i}
            position={[SLOT_X(i), st === "tilted" ? -0.35 : 0, st === "tilted" ? 0.3 : 0]}
            rotation={st === "tilted" ? [0.25, 0, -0.55] : [0, 0, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.8, 0.16, 2.4]} />
            <meshStandardMaterial color={i % 2 ? wood : "#C4844A"} roughness={0.8} />
          </mesh>
        );
      })}
      {/* rondvliegende plankjes (Rommelwind) */}
      {new Array(flying).fill(0).map((_, k) => (
        <mesh key={k} position={[0.6 + k * 1.5, 1.6 + k * 1.1, 0.6 - k * 0.5]} rotation={[0.6 + k, 0.4 * k, 1.1 + k * 0.7]} castShadow>
          <boxGeometry args={[0.8, 0.16, 2.4]} />
          <meshStandardMaterial color="#C4844A" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

const Tiendorp: React.FC<{ lit?: boolean }> = ({ lit }) => (
  <group>
    <House position={[8, 0, -5]} roof="#E8483F" s={0.9} rotationY={-0.4} lit={lit} />
    <House position={[11, 0, -8]} roof="#2F7BF5" s={1.1} rotationY={-0.2} lit={lit} />
    <House position={[13.5, 0, -4]} roof="#A97BEB" s={0.85} rotationY={-0.6} lit={lit} />
    <Tree position={[6.5, 0, -9]} s={1.1} />
    <Tree position={[15, 0, -10]} s={1.3} />
    {/* vlaggetjes */}
    {new Array(7).fill(0).map((_, i) => (
      <mesh key={i} position={[6.8 + i * 0.7, 2.9 - Math.sin((i / 6) * Math.PI) * 0.4, -3]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.18, 0.4, 3]} />
        <meshStandardMaterial color={["#F0473D", "#FFC928", "#2F7BF5", "#7CC52A", "#A97BEB", "#FF8A2A", "#F0473D"][i]} />
      </mesh>
    ))}
  </group>
);

const BackHills: React.FC = () => (
  <group>
    <Hill position={[-30, -2, -60]} r={22} color="#67B246" />
    <Hill position={[5, -4, -70]} r={26} color="#5FA840" />
    <Hill position={[40, -2, -55]} r={20} color="#71BC4E" />
    <Cloud position={[-18, 14, -50]} s={2.2} />
    <Cloud position={[16, 17, -60]} s={2.6} />
    <Cloud position={[38, 12, -45]} s={1.8} />
  </group>
);

/** De Tipkaart (onthoudkader) die uit de Tiprugzak zweeft */
const TipCard: React.FC<{ position: [number, number, number]; top: number; a: number; b: number }> = ({ position, top, a, b }) => {
  const tex = useCanvasTexture(
    1024,
    720,
    (ctx, w, h) => {
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, 0, 0, w, h, 70);
      ctx.fill();
      ctx.lineWidth = 26;
      ctx.strokeStyle = "#FFC928";
      roundRect(ctx, 13, 13, w - 26, h - 26, 60);
      ctx.stroke();
      ctx.fillStyle = "#FF7A2F";
      ctx.font = font(64);
      ctx.textAlign = "center";
      ctx.fillText("Tip van de Bollo's", w / 2, 110);
      // splitsbeen
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(w / 2, 300);
      ctx.lineTo(w / 2 - 190, 440);
      ctx.moveTo(w / 2, 300);
      ctx.lineTo(w / 2 + 190, 440);
      ctx.stroke();
      const box = (cx: number, cy: number, txt: string, fill: string, ink: string) => {
        ctx.fillStyle = fill;
        roundRect(ctx, cx - 95, cy - 80, 190, 160, 36);
        ctx.fill();
        ctx.lineWidth = 12;
        ctx.strokeStyle = COLORS.ink;
        ctx.stroke();
        ctx.fillStyle = ink;
        ctx.font = font(120);
        ctx.textBaseline = "middle";
        ctx.fillText(txt, cx, cy + 6);
        ctx.textBaseline = "alphabetic";
      };
      box(w / 2, 230, String(top), "#FF7A2F", "#fff");
      box(w / 2 - 230, 530, String(a), "#fff", COLORS.ink);
      box(w / 2 + 230, 530, String(b), "#C9F29B", COLORS.ink);
    },
    [top, a, b],
  );
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[3.4, 2.4]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 1]} intensity={6} distance={6} color="#FFE7A0" />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* KF1 — De ploeg op de Rekenroute (themalied / sc. 4)                  */
/* ------------------------------------------------------------------ */
const Bollohuis: React.FC<{ position: [number, number, number]; s?: number }> = ({ position, s = 1 }) => (
  <group position={position} scale={s}>
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[4, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshPhysicalMaterial color="#FFF2DA" roughness={0.5} clearcoat={0.3} />
    </mesh>
    {/* oranje band */}
    <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[3.82, 0.22, 16, 80]} />
      <meshStandardMaterial color="#FF7A2F" />
    </mesh>
    {/* ronde deur */}
    <mesh position={[0, 1.2, 3.8]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[1.2, 1.2, 0.3, 48]} />
      <meshStandardMaterial color="#2F7BF5" />
    </mesh>
    {/* ronde ramen */}
    {[-2.4, 2.4].map((x) => (
      <mesh key={x} position={[x, 2.2, 2.75]} rotation={[Math.PI / 2 - 0.5, 0, x > 0 ? -0.6 : 0.6]}>
        <cylinderGeometry args={[0.55, 0.55, 0.2, 32]} />
        <meshStandardMaterial color="#8FD3FF" emissive="#5FB8F0" emissiveIntensity={0.3} />
      </mesh>
    ))}
    {/* toren met alarmlicht */}
    <mesh position={[0, 4.6, 0]} castShadow>
      <cylinderGeometry args={[0.6, 0.8, 1.6, 32]} />
      <meshStandardMaterial color="#FFC928" />
    </mesh>
    <mesh position={[0, 5.5, 0]}>
      <sphereGeometry args={[0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#FF3B3B" emissive="#FF2020" emissiveIntensity={0.6} />
    </mesh>
  </group>
);

export const KF1Team: React.FC = () => (
  <Frame
    sky="linear-gradient(#59B9FF, #CDEFFF 70%)"
    caption="Keyframe 1 · Sc. 4: Uitrukken op de Rekenroute"
    fog={["#CDEFFF", 40, 140]}
    overlay={
      <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center" }}>
        <span
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 120,
            color: "white",
            WebkitTextStroke: `10px ${COLORS.ink}`,
            paintOrder: "stroke fill",
            textShadow: "0 12px 0 #FF7A2F",
          }}
        >
          De Rekenroute-ploeg
        </span>
      </div>
    }
  >
    <CameraRig position={[0.4, 2.3, 11.5]} target={[0.6, 2.4, -6]} fov={44} />
    <DayLights sun={[10, 16, 12]} />
    <Ground />
    <BackHills />
    <Hill position={[7.5, -3.2, -24]} r={10} color="#74C150" />
    <Bollohuis position={[7.5, 1.1, -24]} s={1} />
    <Road
      points={[
        [-1, 0, 14],
        [0, 0, 6],
        [-1.5, 0, -2],
        [-6, 0, -10],
        [-2, 0, -20],
        [6, 0.6, -24],
      ]}
      width={3.4}
    />
    <NumberPost position={[4.6, 0, -0.5]} n={1} rotationY={-0.3} />
    <NumberPost position={[1.6, 0, -5.5]} n={2} rotationY={-0.3} />
    <NumberPost position={[-3.4, 0, -11.5]} n={3} rotationY={0.2} />
    <Tree position={[-6.5, 0, -2]} s={1.3} />
    <Tree position={[6, 0, -4]} s={1.1} color="#4CAA3F" />
    <Tree position={[-11, 0, -14]} s={1.6} />
    <Tree position={[14, 0, -14]} s={1.4} color="#4CAA3F" />
    {/* de ploeg */}
    <Bollobo3D spec={LOOKS.vlug} position={[-2.2, 0.35, 1.2]} rotationY={0.25} armR={2.7} armL={0.5} mouth="open" tilt={0.08} />
    <Bollobo3D spec={LOOKS.wijs} position={[0.3, 0, 0.6]} rotationY={0} armL={0.4} armR={2.1} mouth="smile" brows="up" lookX={0.4} />
    <Bollobo3D spec={LOOKS.pimpel} position={[2.3, 0.5, 1.6]} rotationY={-0.3} scale={0.75} armL={2.6} armR={2.6} mouth="grin" />
  </Frame>
);

/* ------------------------------------------------------------------ */
/* KF2 — Alarm in het Bollohuis (sc. 2)                                 */
/* ------------------------------------------------------------------ */
const AlarmScreen: React.FC = () => {
  const tex = useCanvasTexture(
    1280,
    720,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#22305A");
      g.addColorStop(1, "#141C36");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#FF4D4D";
      ctx.font = font(190);
      ctx.textAlign = "center";
      ctx.fillText("HELP!", w / 2, 220);
      ctx.fillStyle = "#fff";
      ctx.font = font(66, 600);
      ctx.fillText("De brug naar Tiendorp", w / 2, 340);
      ctx.fillText("heeft gaten!", w / 2, 420);
      for (let i = 0; i < 10; i++) {
        const x = 190 + i * 92;
        if (i < 6) {
          ctx.fillStyle = "#C4844A";
          roundRect(ctx, x, 500, 80, 120, 14);
          ctx.fill();
        } else {
          ctx.setLineDash([14, 10]);
          ctx.strokeStyle = "#8FA3C7";
          ctx.lineWidth = 6;
          roundRect(ctx, x, 500, 80, 120, 14);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    },
    [],
  );
  const board = useCanvasTexture(
    700,
    560,
    (ctx, w, h) => {
      ctx.fillStyle = "#2E5E3A";
      roundRect(ctx, 0, 0, w, h, 40);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = font(64);
      ctx.textAlign = "center";
      ctx.fillText("Dagstarter", w / 2, 90);
      const die = (x: number, y: number, n: number) => {
        ctx.fillStyle = "#fff";
        roundRect(ctx, x, y, 220, 220, 36);
        ctx.fill();
        ctx.fillStyle = "#1B2238";
        const pts: Record<number, [number, number][]> = {
          1: [[110, 110]],
          5: [[55, 55], [165, 55], [110, 110], [55, 165], [165, 165]],
        };
        for (const [px, py] of pts[n]) {
          ctx.beginPath();
          ctx.arc(x + px, y + py, 24, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      die(70, 170, 5);
      die(410, 170, 1);
      ctx.fillStyle = "#FFE15A";
      ctx.font = font(90);
      ctx.fillText("+", w / 2, 300);
      ctx.fillText("= ?", w / 2, 520);
    },
    [],
  );
  return (
    <group>
      <mesh position={[0.8, 3.4, -3.85]} castShadow>
        <boxGeometry args={[6.6, 3.9, 0.3]} />
        <meshStandardMaterial color="#4A5A85" roughness={0.4} />
      </mesh>
      <mesh position={[0.8, 3.4, -3.69]}>
        <planeGeometry args={[6.0, 3.375]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[-5.6, 3.1, -3.9]}>
        <planeGeometry args={[3.1, 2.5]} />
        <meshStandardMaterial map={board} />
      </mesh>
    </group>
  );
};

export const KF2Alarm: React.FC = () => (
  <Frame sky="#3A1E26" caption="Keyframe 2 · Sc. 2: Alarm in het Bollohuis">
    <CameraRig position={[0, 2.4, 9.2]} target={[0, 2.3, -1]} fov={44} />
    <hemisphereLight args={["#FFE3C8", "#8A5A3A", 0.9]} />
    <directionalLight position={[4, 9, 8]} intensity={1.4} color="#FFE8CF" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
    {/* rood zwaailicht */}
    <mesh position={[0.8, 5.75, -3.5]}>
      <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#FF3030" emissive="#FF2020" emissiveIntensity={3} toneMapped={false} />
    </mesh>
    <pointLight position={[0.8, 5.2, -2.5]} intensity={60} distance={18} color="#FF3B3B" />
    <pointLight position={[-4, 3, 4]} intensity={25} distance={16} color="#FF5050" />
    {/* kamer */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#D79A5E" roughness={0.8} />
    </mesh>
    <mesh position={[0, 6, -4]} receiveShadow>
      <planeGeometry args={[30, 12]} />
      <meshStandardMaterial color="#FFE6C2" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0.3, -3.98]}>
      <planeGeometry args={[30, 0.6]} />
      <meshStandardMaterial color="#FF7A2F" />
    </mesh>
    <AlarmScreen />
    {/* rond raam */}
    <mesh position={[6.2, 3.6, -3.95]}>
      <circleGeometry args={[1.1, 48]} />
      <meshStandardMaterial color="#8FD3FF" emissive="#6CC0F5" emissiveIntensity={0.5} />
    </mesh>
    <Bollobo3D spec={LOOKS.vlug} position={[-2.6, 0, 1.4]} rotationY={0.35} armL={2.4} armR={2.4} mouth="o" brows="worried" lookX={0.5} lookY={0.6} />
    <Bollobo3D spec={LOOKS.wijs} position={[0.4, 0, 0.6]} rotationY={-0.2} lean={-0.15} armL={0.6} armR={1.2} mouth="o" brows="worried" lids="wide" lookY={0.8} />
    <Bollobo3D spec={LOOKS.pimpel} position={[2.8, 0, 1.8]} rotationY={-0.5} scale={0.75} armL={1.8} armR={1.8} mouth="o" lookY={0.7} lookX={-0.4} />
  </Frame>
);

/* ------------------------------------------------------------------ */
/* KF3 — Ik doe: Wijs toont de Tipkaart (sc. 6)                         */
/* ------------------------------------------------------------------ */
const BridgeWorld: React.FC<{ planks: Plank[]; flying?: number; lightTone?: string }> = ({ planks, flying }) => (
  <>
    <DayLights sun={[6, 14, 10]} />
    <Ground y={-12} color="#5FA840" />
    <BackHills />
    <Gorge />
    <Bridge planks={planks} flying={flying} />
    <Tiendorp />
    <Tree position={[-9, 0, -6]} s={1.4} />
    <Tree position={[-13, 0, -2]} s={1.1} color="#4CAA3F" />
  </>
);

export const KF3IkDoe: React.FC = () => (
  <Frame sky="linear-gradient(#5DBBFF, #D4F1FF 70%)" caption="Keyframe 3 · Sc. 6: Ik doe, Wijs toont de Tipkaart" fog={["#D4F1FF", 35, 120]}>
    <CameraRig position={[-3.2, 2.4, 11]} target={[-1.6, 1.2, 0]} fov={44} />
    <BridgeWorld planks={["on", "on", "on", "on", "on", "on", "ghost", "ghost", "ghost", "ghost"]} />
    <TipCard position={[0.2, 3.3, 0.8]} top={10} a={6} b={4} />
    <Bollobo3D spec={LOOKS.wijs} position={[-5.4, 0, 0.6]} rotationY={0.7} scale={0.85} armR={1.9} armL={0.3} mouth="open" lookX={0.6} lookY={0.4} />
    <Bollobo3D spec={LOOKS.vlug} position={[-8.3, 0, 0.9]} rotationY={0.5} scale={0.85} armL={0.3} armR={0.3} mouth="o" lookX={0.7} lookY={0.6} />
    <Bollobo3D spec={LOOKS.pimpel} position={[-6.3, 0, 2.9]} rotationY={0.35} scale={0.65} armL={1.2} armR={2.4} mouth="open" lookX={0.5} lookY={0.7} />
  </Frame>
);

/* ------------------------------------------------------------------ */
/* KF4 — Rommelwind slaat toe (sc. 7)                                   */
/* ------------------------------------------------------------------ */
export const KF4Rommelwind: React.FC = () => (
  <Frame sky="linear-gradient(#4FA6F0, #CBEBFF 75%)" caption="Keyframe 4 · Sc. 7: Rommelwind blaast de plankjes weg" fog={["#CBEBFF", 35, 120]}>
    <CameraRig position={[-6.5, 2.2, 12.5]} target={[-0.8, 2.2, -0.5]} fov={48} />
    <BridgeWorld planks={["on", "on", "on", "on", "on", "on", "on", "gone", "gone", "gone"]} flying={3} />
    <Rommelwind3D position={[4.2, 4.6, -1.8]} scale={1.2} rotationY={-0.7} />
    {/* windstreepjes */}
    {[0, 1, 2, 3].map((k) => (
      <mesh key={k} position={[0.5 + k * 0.6, 3 + k * 0.5, -0.5]} rotation={[0.3, 0.2, 0.4 + k * 0.2]}>
        <torusGeometry args={[0.8 + k * 0.2, 0.04, 8, 48, Math.PI * 0.8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.7} emissive="#ffffff" emissiveIntensity={0.4} />
      </mesh>
    ))}
    <Bollobo3D spec={LOOKS.pimpel} position={[-4.3, 0, 1.2]} rotationY={0.6} scale={0.65} armL={0.4} armR={2.6} mouth="open" brows="worried" lookX={0.6} lookY={0.9} />
    <Bollobo3D spec={LOOKS.vlug} position={[-5.6, 0, -0.2]} rotationY={0.5} scale={0.85} lean={-0.2} armL={2.8} armR={2.8} mouth="o" lookY={1} lookX={0.5} />
    <Bollobo3D spec={LOOKS.wijs} position={[-7.0, 0, 1.6]} rotationY={0.6} scale={0.85} armL={0.3} armR={0.8} mouth="flat" brows="worried" lookY={0.8} lookX={0.6} />
  </Frame>
);

/* ------------------------------------------------------------------ */
/* KF5 — Wij doen: Vlug vergist zich, "Wat denk jij?" (sc. 8)           */
/* ------------------------------------------------------------------ */
export const KF5WijDoen: React.FC = () => (
  <Frame
    sky="linear-gradient(#5DBBFF, #D4F1FF 70%)"
    caption="Keyframe 5 · Sc. 8: Wij doen, Vlug vergist zich"
    fog={["#D4F1FF", 35, 120]}
    overlay={
      <>
        <Banner>
          7 + <Q>?</Q> = 10
        </Banner>
        <ThinkBubble text="Wat denk jij?" right={110} top={300} />
      </>
    }
  >
    <CameraRig position={[1.5, 0.6, 10.5]} target={[0.6, -0.4, 0]} fov={44} />
    <BridgeWorld planks={["on", "on", "on", "on", "on", "on", "on", "on", "on", "tilted"]} />
    {/* Vlug hangt onder de brug aan één arm */}
    <Bollobo3D spec={LOOKS.vlug} position={[3.6, -2.75, 0.9]} rotationY={-0.2} tilt={0.15} scale={0.85} armR={3.0} armL={0.9} mouth="o" brows="worried" lookY={0.4} lookX={-0.6} />
    <Bollobo3D spec={LOOKS.wijs} position={[1.4, 0.08, 0.2]} rotationY={0.3} lean={0.25} scale={0.85} armR={1.4} armL={0.3} mouth="flat" lookY={-0.9} lookX={0.6} />
    <Bollobo3D spec={LOOKS.pimpel} position={[-0.3, 0.08, 0.6]} rotationY={0.15} scale={0.65} armL={0.3} armR={2.3} mouth="o" lookX={-1} lookY={0.2} />
  </Frame>
);

/* ------------------------------------------------------------------ */
/* KF6 — Jij doet: de lampionnen van Tiendorp (sc. 10)                  */
/* ------------------------------------------------------------------ */
const LANTERN_COLORS = ["#FF6B5A", "#FFC928", "#7CC52A", "#2F9BF5", "#B07BEB"];

const Lantern: React.FC<{ position: [number, number, number]; color: string; lit: boolean }> = ({ position, color, lit }) => (
  <group position={position}>
    <mesh position={[0, 0.7, 0]}>
      <cylinderGeometry args={[0.012, 0.012, 1.0, 6]} />
      <meshStandardMaterial color="#333" />
    </mesh>
    <mesh scale={[0.5, 0.42, 0.5]}>
      <sphereGeometry args={[1, 32, 24]} />
      <meshStandardMaterial
        color={lit ? color : "#B9B4CC"}
        emissive={lit ? color : "#000000"}
        emissiveIntensity={lit ? 2.2 : 0}
        roughness={0.6}
        toneMapped={!lit}
      />
    </mesh>
    {[0.42, -0.42].map((y) => (
      <mesh key={y} position={[0, y, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 20]} />
        <meshStandardMaterial color="#2A2A35" />
      </mesh>
    ))}
    {lit ? <pointLight intensity={12} distance={8} color={color} /> : null}
  </group>
);

export const KF6JijDoet: React.FC = () => (
  <Frame
    sky="linear-gradient(#1C2257, #5B3E8C 55%, #F28A5B)"
    caption="Keyframe 6 · Sc. 10: Jij doet, de lampionnen van Tiendorp"
    overlay={
      <Banner bg="#5B3E8C">
        2 + <Q>?</Q> = 10
      </Banner>
    }
  >
    <CameraRig position={[0, 2.0, 11.5]} target={[0, 3.2, 0]} fov={46} />
    <hemisphereLight args={["#9A8CE8", "#5A4450", 1.3]} />
    <directionalLight position={[-6, 6, 10]} intensity={0.7} color="#FFB98A" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
    <pointLight position={[0, 4.2, 5.5]} intensity={6} distance={12} color="#FFD9A0" />
    <Ground color="#A99584" />
    {/* plein met kasseien-cirkel */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
      <circleGeometry args={[7, 64]} />
      <meshStandardMaterial color="#C9B49E" roughness={0.9} />
    </mesh>
    <House position={[-8, 0, -4]} roof="#E8483F" rotationY={0.5} lit />
    <House position={[-4.5, 0, -8]} roof="#2F7BF5" s={1.2} rotationY={0.2} lit />
    <House position={[4.5, 0, -8]} roof="#A97BEB" s={1.1} rotationY={-0.2} lit />
    <House position={[8, 0, -4]} roof="#FF8A2A" rotationY={-0.5} lit />
    {/* palen met snoeren */}
    {[-4.6, 4.6].map((x) => (
      <mesh key={x} position={[x, 2.9, -1.5]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 5.8, 12]} />
        <meshStandardMaterial color="#6B4A2E" />
      </mesh>
    ))}
    {[5.6, 4.2].map((y) => (
      <mesh key={y} position={[0, y, -1.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 9.2, 6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    ))}
    {/* tienveld van lampionnen: 2 rijen van 5, er branden er 2 */}
    {new Array(10).fill(0).map((_, i) => {
      const row = Math.floor(i / 5);
      const col = i % 5;
      return <Lantern key={i} position={[-3.2 + col * 1.6, row === 0 ? 4.9 : 3.5, -1.5]} color={LANTERN_COLORS[col]} lit={i < 2} />;
    })}
    <Bollobo3D spec={LOOKS.vlug} position={[-2.8, 0, 2.2]} rotationY={0.3} lean={-0.3} scale={0.85} armL={0.3} armR={1.0} mouth="o" lookY={1} />
    <Bollobo3D spec={LOOKS.wijs} position={[0, 0, 2.8]} rotationY={0} lean={-0.25} scale={0.85} armL={0.4} armR={1.9} mouth="smile" lookY={1} />
    <Bollobo3D spec={LOOKS.pimpel} position={[2.6, 0, 2.4]} rotationY={-0.3} lean={-0.35} scale={0.65} armL={2.5} armR={2.5} mouth="open" lookY={1} />
  </Frame>
);

/* ------------------------------------------------------------------ */
/* KF0 — Personageblad: de ploeg naast elkaar                           */
/* ------------------------------------------------------------------ */
const NameTag: React.FC<{ left: string; name: string; role: string; color: string }> = ({ left, name, role, color }) => (
  <div style={{ position: "absolute", left, bottom: 120, transform: "translateX(-50%)", textAlign: "center", fontFamily }}>
    <div style={{ fontSize: 64, fontWeight: 700, color: "white", WebkitTextStroke: `7px ${color}`, paintOrder: "stroke fill" }}>{name}</div>
    <div style={{ fontSize: 34, fontWeight: 600, color: COLORS.ink, background: "white", borderRadius: 20, padding: "4px 22px", marginTop: 4 }}>{role}</div>
  </div>
);

export const KF0Personages: React.FC = () => (
  <Frame
    sky="radial-gradient(circle at 50% 40%, #FFFFFF, #DCEBFF 70%)"
    caption="Personageblad · de Bollobo's van de eerste graad + kleuterbollobo (werknamen)"
    overlay={
      <>
        <NameTag left="22%" name="Vlug" role="de doener" color="#6D52A6" />
        <NameTag left="50%" name="Wijs" role="de denker" color="#B8650C" />
        <NameTag left="78%" name="Pimpel" role="de speurneus" color="#2F8F80" />
      </>
    }
  >
    <CameraRig position={[0, 1.7, 8.8]} target={[0, 1.2, 0]} fov={34} />
    <hemisphereLight args={["#FFFFFF", "#B9C8E0", 1.2]} />
    <directionalLight position={[5, 9, 8]} intensity={2.6} color="#FFF4E2" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
    <directionalLight position={[-6, 4, 6]} intensity={0.8} color="#CFE6FF" />
    <directionalLight position={[0, 6, -10]} intensity={2.5} color="#FFFFFF" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[9, 64]} />
      <shadowMaterial opacity={0.18} />
    </mesh>
    <Bollobo3D spec={LOOKS.vlug} position={[-3.3, 0, 0]} rotationY={0.25} armL={0.4} armR={2.5} mouth="grin" brows="up" lookX={0.2} />
    <Bollobo3D spec={LOOKS.wijs} position={[0, 0, -0.4]} rotationY={0} armL={0.3} armR={1.3} mouth="smile" brows="determined" lids="half" />
    <Bollobo3D spec={LOOKS.pimpel} position={[3.1, 0, 0.3]} rotationY={-0.25} scale={0.75} armL={2.0} armR={2.0} mouth="open" brows="up" lids="wide" lookX={-0.2} />
  </Frame>
);

/* ------------------------------------------------------------------ */
/* KF7 — Close-up: Vlug en Wijs (emotie in het gezicht)                 */
/* ------------------------------------------------------------------ */
export const KF7Closeup: React.FC = () => (
  <Frame sky="linear-gradient(#5DBBFF, #D4F1FF 70%)" caption="Close-up · Sc. 5: Eerst kijken, dan rekenen" fog={["#D4F1FF", 25, 90]}>
    <CameraRig position={[0.2, 2.25, 4.4]} target={[0, 2.0, 0]} fov={38} />
    <DayLights sun={[6, 12, 10]} />
    <Ground />
    <BackHills />
    <Tree position={[-6, 0, -9]} s={1.5} />
    <Tree position={[7, 0, -11]} s={1.4} color="#4CAA3F" />
    <Bollobo3D spec={LOOKS.vlug} position={[-1.3, 0, 0]} rotationY={0.45} armL={0.3} armR={2.4} mouth="grin" brows="up" lookX={0.8} />
    <Bollobo3D spec={LOOKS.wijs} position={[1.35, 0, -0.3]} rotationY={-0.5} armL={0.3} armR={1.6} mouth="flat" brows="determined" lids="half" lookX={-0.8} />
  </Frame>
);
