import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Bollobo } from "../components/Bollobo";
import { Confetti } from "../components/Extras";
import { Hills, RouteSign, SceneFade, SpeechBubble, Sky } from "../components/Scenery";
import { CHARACTERS, CharacterId, TEAM_NAME } from "../characters";
import { COLORS, fontFamily } from "../theme";

const TEAM: CharacterId[] = ["teller", "splitser", "kleuter"];

/* ------------------------------------------------------------------ */
/* 1. TITELGENERIEK                                                      */
/* ------------------------------------------------------------------ */
export const TitleScene: React.FC<{ duration: number; episode: string }> = ({ duration, episode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame: frame - 10, fps, config: { damping: 10 } });
  const sub = spring({ frame: frame - 95, fps, config: { damping: 14 } });
  // De oranje route tekent zichzelf
  const dash = interpolate(frame, [0, 45], [2400, 0], { extrapolateRight: "clamp" });

  return (
    <SceneFade duration={duration}>
      <Sky top="#4FB8FF" bottom="#BDEBFF" />
      <Hills y={680} />
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <path
          d="M-50 900 C 300 760, 500 980, 900 860 S 1500 700, 1980 820"
          stroke={COLORS.route}
          strokeWidth={46}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={2400}
          strokeDashoffset={dash}
        />
        <path
          d="M-50 900 C 300 760, 500 980, 900 860 S 1500 700, 1980 820"
          stroke="white"
          strokeWidth={6}
          fill="none"
          strokeDasharray="30 30"
          strokeDashoffset={dash}
          opacity={0.8}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          top: 120,
          width: "100%",
          textAlign: "center",
          transform: `scale(${title}) rotate(${(1 - title) * -8}deg)`,
          fontFamily,
          fontWeight: 700,
          fontSize: 150,
          color: "white",
          WebkitTextStroke: `10px ${COLORS.ink}`,
          paintOrder: "stroke fill",
          textShadow: `0 14px 0 ${COLORS.route}`,
          letterSpacing: 2,
        }}
      >
        {TEAM_NAME}
      </div>

      {TEAM.map((id, i) => {
        const p = spring({ frame: frame - 40 - i * 12, fps, config: { damping: 9 } });
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: 520 + i * 340,
              top: 430 + (1 - p) * 700 + (id === "kleuter" ? 70 : 0),
            }}
          >
            <Bollobo character={CHARACTERS[id]} size={300 * CHARACTERS[id].scale} bouncing={frame > 60} emotion="cheer" />
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          bottom: 70,
          width: "100%",
          textAlign: "center",
          opacity: sub,
          transform: `translateY(${(1 - sub) * 40}px)`,
          fontFamily,
          fontWeight: 700,
          fontSize: 64,
          color: COLORS.ink,
        }}
      >
        <span style={{ background: "white", padding: "10px 40px", borderRadius: 30 }}>{episode}</span>
      </div>
      <Confetti start={60} count={60} />
    </SceneFade>
  );
};

/* ------------------------------------------------------------------ */
/* 2. ALARM IN DE REKENTOREN                                            */
/* ------------------------------------------------------------------ */
export const AlarmScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const alarmOn = Math.floor(frame / 8) % 2 === 0 && frame < 110;
  const shake = frame < 110 ? Math.sin(frame * 1.7) * 4 : 0;

  return (
    <SceneFade duration={duration}>
      {/* binnenkant van het hoofdkwartier */}
      <AbsoluteFill style={{ background: "linear-gradient(#FFE8C7, #FFD59A)" }} />
      <AbsoluteFill
        style={{
          background: alarmOn ? "rgba(255,60,60,0.22)" : "transparent",
        }}
      />
      {/* vloer */}
      <div style={{ position: "absolute", bottom: 0, height: 240, width: "100%", background: "#E0A96D" }} />
      {/* zwaailicht */}
      <div
        style={{
          position: "absolute",
          left: 1080,
          top: 30,
          width: 120,
          height: 80,
          borderRadius: "60px 60px 10px 10px",
          background: alarmOn ? "#FF3B3B" : "#A33",
          boxShadow: alarmOn ? "0 0 120px 40px rgba(255,59,59,0.7)" : "none",
        }}
      />
      {/* groot scherm */}
      <div
        style={{
          position: "absolute",
          left: 760,
          top: 150,
          width: 760,
          height: 420,
          borderRadius: 40,
          background: COLORS.ink,
          border: "18px solid #48557A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateX(${shake}px)`,
          fontFamily,
          color: "white",
          textAlign: "center",
          gap: 20,
        }}
      >
        <div style={{ fontSize: 110, fontWeight: 700, color: "#FF5A5A" }}>HELP!</div>
        <div style={{ fontSize: 54, fontWeight: 600, padding: "0 40px", opacity: frame > 30 ? 1 : 0 }}>
          De brug naar Telstad heeft gaten!
        </div>
        {/* klein brugje op het scherm */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, opacity: frame > 30 ? 1 : 0 }}>
          {new Array(10).fill(0).map((_, i) => (
            <div
              key={i}
              style={{ width: 44, height: 28, borderRadius: 6, background: i < 6 ? COLORS.wood : "transparent", border: `3px dashed ${i < 6 ? COLORS.wood : "#8FA3C7"}` }}
            />
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", left: 140, top: 560 }}>
        <Bollobo character={CHARACTERS.teller} size={330} talking={frame > 70 && frame < 150} emotion="surprised" look={0.6} bouncing={frame < 60} />
      </div>
      <div style={{ position: "absolute", left: 1560, top: 600 }}>
        <Bollobo character={CHARACTERS.splitser} size={300} emotion="surprised" look={-0.6} />
      </div>
      <SpeechBubble text="Alarm! Rekenroute-ploeg, kom vlug!" x={90} y={330} width={600} delay={70} tail="left" />
    </SceneFade>
  );
};

/* ------------------------------------------------------------------ */
/* 3. VOORSTELLING VAN DE PLOEG                                         */
/* ------------------------------------------------------------------ */
export const RollCallScene: React.FC<{ duration: number; id: CharacterId; bg: string }> = ({ duration, id, bg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = CHARACTERS[id];
  const slide = spring({ frame, fps, config: { damping: 13 } });
  const card = spring({ frame: frame - 12, fps, config: { damping: 12 } });
  // stralen op de achtergrond
  const rot = frame * 0.4;

  return (
    <SceneFade duration={duration}>
      <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: 560 - 1400,
            top: 540 - 1400,
            width: 2800,
            height: 2800,
            transform: `rotate(${rot}deg)`,
            background: `repeating-conic-gradient(rgba(255,255,255,0.18) 0deg 12deg, transparent 12deg 24deg)`,
            borderRadius: "50%",
          }}
        />
      </AbsoluteFill>

      <div style={{ position: "absolute", left: 260 + (1 - slide) * -900, top: 260 }}>
        <Bollobo character={c} size={520 * (0.6 + c.scale * 0.4)} waving talking={frame > 25 && frame < 70} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 960,
          top: 250,
          transform: `translateX(${(1 - card) * 1000}px) rotate(-3deg)`,
          fontFamily,
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 700, color: "white", WebkitTextStroke: `8px ${COLORS.ink}`, paintOrder: "stroke fill" }}>
          {c.name}
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 10,
            fontSize: 58,
            fontWeight: 600,
            color: COLORS.ink,
            background: "white",
            padding: "10px 34px",
            borderRadius: 26,
          }}
        >
          {c.role}
        </div>
      </div>
      <SpeechBubble text={c.catchphrase} x={960} y={620} width={780} delay={25} tail="left" />
    </SceneFade>
  );
};

/* ------------------------------------------------------------------ */
/* 4. OP DE REKENROUTE                                                  */
/* ------------------------------------------------------------------ */
export const RideScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const scroll = frame * 14;
  return (
    <SceneFade duration={duration}>
      <Sky />
      <Hills y={600} />
      {/* weg */}
      <div style={{ position: "absolute", top: 820, height: 200, width: "100%", background: COLORS.road }} />
      <div
        style={{
          position: "absolute",
          top: 910,
          height: 16,
          width: 4000,
          left: -(scroll % 160),
          background: "repeating-linear-gradient(90deg, white 0 90px, transparent 90px 160px)",
        }}
      />
      {/* getallenpaaltjes schuiven voorbij */}
      {new Array(10).fill(0).map((_, i) => {
        const x = 2000 + i * 420 - scroll;
        if (x < -200 || x > 2100) return null;
        return <RouteSign key={i} x={x} y={650} n={i + 1} />;
      })}
      {(["kleuter", "splitser", "teller"] as CharacterId[]).map((id, i) => (
        <div key={id} style={{ position: "absolute", left: 360 + i * 300, top: 600 + (id === "kleuter" ? 50 : 0) }}>
          <Bollobo character={CHARACTERS[id]} size={250 * CHARACTERS[id].scale} bouncing look={1} talking={id === "teller" && frame > 20 && frame < 80} />
        </div>
      ))}
      <SpeechBubble text="Hup, de Rekenroute op!" x={980} y={360} width={620} delay={20} tail="left" />
    </SceneFade>
  );
};
