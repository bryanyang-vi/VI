import React from "react";
import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, fontFamily } from "../theme";

/**
 * "Wat denk jij?"-moment: de kijker krijgt even tijd om zelf na te denken,
 * net zoals in interactieve kinderreeksen. Telt af van 3 naar 1.
 */
export const ThinkCountdown: React.FC<{ start: number; perStep?: number; right?: number; top?: number }> = ({
  start,
  perStep = 25,
  right = 110,
  top = 230,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - start;
  if (local < 0 || local >= perStep * 4) return null;
  const step = Math.floor(local / perStep);
  const within = local % perStep;
  const pop = spring({ frame: within, fps, config: { damping: 9, stiffness: 200 } });
  const label = step === 0 ? "Wat denk jij?" : String(4 - step);
  return (
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
        boxShadow: "0 14px 0 rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily,
        fontWeight: 700,
        color: COLORS.ink,
        fontSize: step === 0 ? 62 : 190,
        lineHeight: 1,
        transform: `scale(${pop}) rotate(${(1 - pop) * -20}deg)`,
        padding: 20,
      }}
    >
      {label}
    </div>
  );
};

/** Confetti voor de feestmomenten */
export const Confetti: React.FC<{ start?: number; count?: number }> = ({ start = 0, count = 90 }) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0) return null;
  const colors = ["#F25C54", "#3A86FF", "#8AC926", "#FFD23F", "#B388EB", "#FF8C42"];
  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const x = random(`x${i}`) * 1920;
        const speed = 6 + random(`s${i}`) * 8;
        const y = -60 + t * speed - random(`d${i}`) * 500;
        const sway = Math.sin((t + i * 7) / 9) * 30;
        const rot = t * (4 + random(`r${i}`) * 8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + sway,
              top: y,
              width: 18,
              height: 30,
              background: colors[i % colors.length],
              borderRadius: 4,
              transform: `rotate(${rot}deg)`,
            }}
          />
        );
      })}
    </>
  );
};

/** Grote getal-teller die oppopt (bijv. bij het tellen van plankjes) */
export const PopNumber: React.FC<{ n: number | string; x: number; y: number; at: number; color?: string; size?: number }> = ({
  n,
  x,
  y,
  at,
  color = COLORS.ink,
  size = 64,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const p = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 220 } });
  const lift = interpolate(frame - at, [0, 20], [20, 0], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + lift,
        transform: `translate(-50%, -50%) scale(${p})`,
        fontFamily,
        fontWeight: 700,
        fontSize: size,
        color,
        textShadow: "0 4px 0 white, 0 -4px 0 white, 4px 0 0 white, -4px 0 0 white",
      }}
    >
      {n}
    </div>
  );
};
