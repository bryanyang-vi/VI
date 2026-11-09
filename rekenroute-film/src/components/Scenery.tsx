import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, fontFamily } from "../theme";

export const Sky: React.FC<{ top?: string; bottom?: string }> = ({
  top = COLORS.skyTop,
  bottom = COLORS.skyBottom,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${top}, ${bottom})` }}>
      {/* zon */}
      <div
        style={{
          position: "absolute",
          right: 160,
          top: 90,
          width: 170,
          height: 170,
          borderRadius: "50%",
          background: COLORS.sun,
          boxShadow: `0 0 ${60 + Math.sin(frame / 10) * 15}px ${COLORS.sun}`,
        }}
      />
      {/* wolken */}
      {[
        { y: 120, s: 1, speed: 0.6, x0: 100 },
        { y: 240, s: 0.7, speed: 0.4, x0: 900 },
        { y: 70, s: 0.85, speed: 0.5, x0: 1500 },
      ].map((c, i) => {
        const x = ((c.x0 + frame * c.speed) % 2300) - 300;
        return <Cloud key={i} x={x} y={c.y} scale={c.s} />;
      })}
    </AbsoluteFill>
  );
};

export const Cloud: React.FC<{ x: number; y: number; scale: number }> = ({ x, y, scale }) => (
  <svg
    width={260 * scale}
    height={110 * scale}
    viewBox="0 0 260 110"
    style={{ position: "absolute", left: x, top: y }}
  >
    <g fill="white" opacity="0.95">
      <circle cx="70" cy="70" r="40" />
      <circle cx="125" cy="50" r="50" />
      <circle cx="185" cy="70" r="38" />
      <rect x="40" y="70" width="180" height="40" rx="20" />
    </g>
  </svg>
);

export const Hills: React.FC<{ y?: number }> = ({ y = 640 }) => (
  <svg
    viewBox="0 0 1920 440"
    width={1920}
    height={440}
    style={{ position: "absolute", left: 0, top: y }}
    preserveAspectRatio="none"
  >
    <path d="M0 120 Q300 0 640 100 T1300 80 T1920 110 V440 H0 Z" fill={COLORS.grassDark} />
    <path d="M0 190 Q420 80 900 170 T1920 160 V440 H0 Z" fill={COLORS.grass} />
  </svg>
);

/** Kleine wit-oranje paaltjes langs de route met getallen erop */
export const RouteSign: React.FC<{ x: number; y: number; n: number }> = ({ x, y, n }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 90, alignItems: "center", display: "flex", flexDirection: "column" }}>
    <div
      style={{
        width: 90,
        height: 90,
        borderRadius: 18,
        background: COLORS.route,
        border: "6px solid white",
        color: "white",
        fontFamily,
        fontWeight: 700,
        fontSize: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 0 rgba(0,0,0,0.15)",
      }}
    >
      {n}
    </div>
    <div style={{ width: 12, height: 80, background: "white" }} />
  </div>
);

/** Spreekwolk die met een veertje verschijnt */
export const SpeechBubble: React.FC<{
  text: string;
  x: number;
  y: number;
  width?: number;
  delay?: number;
  tail?: "left" | "right" | "down";
  color?: string;
}> = ({ text, x, y, width = 640, delay = 0, tail = "down", color = "white" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 160 } });
  if (frame < delay) return null;
  const tailStyle: React.CSSProperties =
    tail === "down"
      ? { left: width / 2 - 24, bottom: -34, borderTop: `40px solid ${color}`, borderLeft: "24px solid transparent", borderRight: "24px solid transparent" }
      : tail === "left"
        ? { left: 40, bottom: -34, borderTop: `40px solid ${color}`, borderRight: "34px solid transparent" }
        : { right: 40, bottom: -34, borderTop: `40px solid ${color}`, borderLeft: "34px solid transparent" };
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        transform: `scale(${pop})`,
        transformOrigin: tail === "left" ? "10% 120%" : tail === "right" ? "90% 120%" : "50% 120%",
      }}
    >
      <div
        style={{
          background: color,
          borderRadius: 40,
          padding: "28px 40px",
          fontFamily,
          fontWeight: 600,
          fontSize: 50,
          lineHeight: 1.2,
          color: COLORS.ink,
          textAlign: "center",
          boxShadow: "0 10px 0 rgba(0,0,0,0.12)",
        }}
      >
        {text}
      </div>
      <div style={{ position: "absolute", width: 0, height: 0, ...tailStyle }} />
    </div>
  );
};

/** Zachte in- en uitfade voor een scène */
export const SceneFade: React.FC<{ duration: number; children: React.ReactNode }> = ({ duration, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, duration - 10, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/** Grote vraag-kaart onderaan of bovenaan het beeld */
export const Banner: React.FC<{ children: React.ReactNode; top?: number; delay?: number; bg?: string }> = ({
  children,
  top = 60,
  delay = 0,
  bg = COLORS.ink,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${(1 - p) * -260}px)`,
      }}
    >
      <div
        style={{
          background: bg,
          color: "white",
          fontFamily,
          fontWeight: 700,
          fontSize: 76,
          padding: "22px 60px",
          borderRadius: 36,
          border: "8px solid white",
          boxShadow: "0 12px 0 rgba(0,0,0,0.15)",
        }}
      >
        {children}
      </div>
    </div>
  );
};
