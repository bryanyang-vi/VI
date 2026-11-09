import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Bollobo } from "../components/Bollobo";
import { Confetti } from "../components/Extras";
import { Hills, SceneFade, SpeechBubble, Sky } from "../components/Scenery";
import { CHARACTERS, CharacterId, TEAM_NAME } from "../characters";
import { COLORS, fontFamily } from "../theme";

/* ------------------------------------------------------------------ */
/* 7. WAT HEB IK GELEERD?  (zoals het lesdoel in het werkschrift)       */
/* ------------------------------------------------------------------ */
export const LearnedScene: React.FC<{ duration: number; goal: string; examples: string[] }> = ({ duration, goal, examples }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - 5, fps, config: { damping: 13 } });

  return (
    <SceneFade duration={duration}>
      <AbsoluteFill style={{ background: "linear-gradient(135deg, #3A86FF, #7B5CFF)" }} />
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 110,
          width: 1220,
          height: 820,
          background: "white",
          borderRadius: 50,
          border: `12px solid ${COLORS.sun}`,
          transform: `scale(${card})`,
          fontFamily,
          color: COLORS.ink,
          padding: 60,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 30,
        }}
      >
        <div style={{ fontSize: 76, fontWeight: 700, color: COLORS.route }}>Wat heb ik geleerd?</div>
        <div style={{ fontSize: 66, fontWeight: 600 }}>{goal}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 20 }}>
          {examples.map((ex, i) => {
            const p = spring({ frame: frame - 40 - i * 25, fps, config: { damping: 11 } });
            return (
              <div
                key={ex}
                style={{
                  fontSize: 92,
                  fontWeight: 700,
                  background: ["#FFE5E3", "#E1ECFF", "#E8F7D4", "#FFF4CC"][i % 4],
                  borderRadius: 30,
                  padding: "6px 40px",
                  transform: `translateX(${(1 - p) * 1400}px)`,
                }}
              >
                {ex}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 90, top: 520 }}>
        <Bollobo character={CHARACTERS.splitser} size={400} talking={frame > 10 && frame < 80} look={1} />
      </div>
    </SceneFade>
  );
};

/* ------------------------------------------------------------------ */
/* 8. AFSLUITER                                                         */
/* ------------------------------------------------------------------ */
const TEAM: CharacterId[] = ["teller", "splitser", "kleuter"];

export const OutroScene: React.FC<{ duration: number; nextEpisode: string }> = ({ duration, nextEpisode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame: frame - 70, fps, config: { damping: 12 } });
  return (
    <SceneFade duration={duration}>
      <Sky top="#FF9F6B" bottom="#FFE3A8" />
      <Hills y={660} />
      {TEAM.map((id, i) => (
        <div key={id} style={{ position: "absolute", left: 470 + i * 360, top: 540 + (id === "kleuter" ? 80 : 0) }}>
          <Bollobo character={CHARACTERS[id]} size={320 * CHARACTERS[id].scale} waving talking={i === 1 && frame < 60} />
        </div>
      ))}
      <SpeechBubble text="Tot de volgende keer op de Rekenroute!" x={560} y={250} width={820} tail="down" />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          width: "100%",
          textAlign: "center",
          fontFamily,
          fontWeight: 700,
          fontSize: 46,
          color: "white",
          opacity: title,
          WebkitTextStroke: `6px ${COLORS.ink}`,
          paintOrder: "stroke fill",
        }}
      >
        Volgende keer bij {TEAM_NAME}: {nextEpisode}
      </div>
      <Confetti start={0} count={40} />
    </SceneFade>
  );
};
