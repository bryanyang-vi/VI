import React from "react";
import { Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Bollobo } from "../components/Bollobo";
import { Confetti, PopNumber, ThinkCountdown } from "../components/Extras";
import { Banner, Hills, SceneFade, SpeechBubble, Sky } from "../components/Scenery";
import { CHARACTERS } from "../characters";
import { COLORS, fontFamily } from "../theme";

const Q: React.FC<{ children: React.ReactNode; solved: boolean }> = ({ children, solved }) => (
  <span
    style={{
      display: "inline-block",
      minWidth: 90,
      textAlign: "center",
      background: solved ? "#8AC926" : COLORS.sun,
      color: COLORS.ink,
      borderRadius: 20,
      padding: "0 18px",
      margin: "0 8px",
    }}
  >
    {children}
  </span>
);

/* ------------------------------------------------------------------ */
/* 5. DE BRUG VAN TIEN  —  6 + ? = 10                                   */
/* ------------------------------------------------------------------ */
export const BRIDGE = { have: 6, total: 10 };

export const BridgeScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { have, total } = BRIDGE;
  const missing = total - have;

  const bridgeLeft = 520;
  const bridgeRight = 1400;
  const plankW = (bridgeRight - bridgeLeft) / total;
  const deckY = 630;

  const COUNT_START = 15;
  const THINK_START = 170;
  const DROP_START = 280;
  const DROP_GAP = 18;
  const SOLVED = DROP_START + missing * DROP_GAP + 20;
  const solved = frame >= SOLVED;

  const waterShift = Math.sin(frame / 10) * 20;

  return (
    <SceneFade duration={duration}>
      <Sky />
      {/* rivier */}
      <div
        style={{
          position: "absolute",
          top: 760,
          height: 320,
          width: "100%",
          background: `repeating-linear-gradient(100deg, ${COLORS.water} 0 60px, #3DB5DD 60px 120px)`,
          backgroundPositionX: waterShift + frame * 2,
        }}
      />
      {/* kliffen */}
      <div style={{ position: "absolute", left: 0, top: deckY + 10, width: bridgeLeft, height: 500, background: COLORS.grass, borderTop: `24px solid ${COLORS.grassDark}`, borderRadius: "0 40px 0 0" }} />
      <div style={{ position: "absolute", left: bridgeRight, top: deckY + 10, width: 1920 - bridgeRight, height: 500, background: COLORS.grass, borderTop: `24px solid ${COLORS.grassDark}`, borderRadius: "40px 0 0 0" }} />
      {/* Telstad aan de overkant */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 1560 + i * 120, top: deckY - 110 - (i % 2) * 30 }}>
          <div style={{ width: 0, height: 0, borderLeft: "50px solid transparent", borderRight: "50px solid transparent", borderBottom: `50px solid ${["#F25C54", "#3A86FF", "#B388EB"][i]}` }} />
          <div style={{ width: 100, height: 70 + (i % 2) * 30, background: "#FFF3D6", border: "4px solid #E6CFA0" }} />
        </div>
      ))}

      {/* touwen van de brug */}
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <path d={`M${bridgeLeft} ${deckY - 70} Q960 ${deckY - 10} ${bridgeRight} ${deckY - 70}`} stroke={COLORS.woodDark} strokeWidth={8} fill="none" />
        {new Array(total + 1).fill(0).map((_, i) => (
          <line key={i} x1={bridgeLeft + i * plankW} y1={deckY - 66 + Math.sin((i / total) * Math.PI) * 30} x2={bridgeLeft + i * plankW} y2={deckY} stroke={COLORS.woodDark} strokeWidth={5} />
        ))}
      </svg>

      {/* plankjes */}
      {new Array(total).fill(0).map((_, i) => {
        const x = bridgeLeft + i * plankW + 4;
        const isMissing = i >= have;
        const dropAt = DROP_START + (i - have) * DROP_GAP;
        const drop = isMissing ? spring({ frame: frame - dropAt, fps, config: { damping: 11, stiffness: 160 } }) : 1;
        const y = deckY - (1 - drop) * 600;
        const show = !isMissing || frame >= dropAt;
        return (
          <React.Fragment key={i}>
            {/* lege plek */}
            {isMissing ? (
              <div style={{ position: "absolute", left: x, top: deckY, width: plankW - 8, height: 40, borderRadius: 8, border: "5px dashed rgba(255,255,255,0.9)", boxSizing: "border-box" }} />
            ) : null}
            {show ? (
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: plankW - 8,
                  height: 40,
                  borderRadius: 8,
                  background: isMissing ? "#E0A15A" : COLORS.wood,
                  borderBottom: `8px solid ${COLORS.woodDark}`,
                  boxSizing: "border-box",
                }}
              />
            ) : null}
            {/* tellen: 1 t.e.m. 6 */}
            {!isMissing ? <PopNumber n={i + 1} x={x + plankW / 2 - 4} y={deckY - 30} at={COUNT_START + i * 9} size={56} /> : null}
            {/* bijtellen: 1 t.e.m. 4 in het oranje */}
            {isMissing ? <PopNumber n={i - have + 1} x={x + plankW / 2 - 4} y={deckY - 30} at={dropAt + 6} color={COLORS.route} size={64} /> : null}
          </React.Fragment>
        );
      })}

      {/* de ploeg op de linkeroever */}
      <div style={{ position: "absolute", left: 20, top: deckY - 228 }}>
        <Bollobo character={CHARACTERS.teller} size={200} look={1} emotion={solved ? "cheer" : frame > THINK_START && frame < DROP_START ? "thinking" : "happy"} bouncing={solved} />
      </div>
      <div style={{ position: "absolute", left: 180, top: deckY - 228 }}>
        <Bollobo character={CHARACTERS.splitser} size={200} look={1} talking={frame > 20 && frame < 100} emotion={solved ? "cheer" : frame > THINK_START && frame < DROP_START ? "thinking" : "happy"} bouncing={solved} />
      </div>
      <div style={{ position: "absolute", left: 345, top: deckY - 175 }}>
        <Bollobo character={CHARACTERS.kleuter} size={156} look={1} talking={frame > 115 && frame < 165} emotion={solved ? "cheer" : "happy"} bouncing={solved} />
      </div>

      <Sequence from={15} durationInFrames={100} layout="none">
        <SpeechBubble text="Er liggen maar 6 plankjes. We hebben er 10 nodig!" x={420} y={240} width={880} tail="left" />
      </Sequence>
      <Sequence from={115} durationInFrames={60} layout="none">
        <SpeechBubble text="Hoeveel plankjes moeten erbij?" x={420} y={260} width={760} tail="left" />
      </Sequence>
      <Sequence from={SOLVED} layout="none">
        <SpeechBubble text={`Juist! ${have} en ${missing} is samen ${total}!`} x={420} y={240} width={800} tail="left" color="#E6FFD1" />
      </Sequence>

      <ThinkCountdown start={THINK_START} />

      <Banner delay={90} top={40} bg={solved ? "#3E9A2E" : COLORS.ink}>
        {have} + <Q solved={solved}>{solved ? missing : "?"}</Q> = {total}
      </Banner>
      <Confetti start={SOLVED} count={70} />
    </SceneFade>
  );
};

/* ------------------------------------------------------------------ */
/* 6. FEEST IN TELSTAD  —  splitsen: 10 = 3 + ?                          */
/* ------------------------------------------------------------------ */
export const BALLOONS = { have: 3, total: 10 };

const BALLOON_COLORS = ["#F25C54", "#3A86FF", "#8AC926", "#FFD23F", "#B388EB", "#FF8C42", "#F25C54", "#3A86FF", "#8AC926", "#FFD23F"];

export const BalloonScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { have, total } = BALLOONS;
  const missing = total - have;

  const THINK_START = 190;
  const FILL_START = 300;
  const FILL_GAP = 11;
  const SOLVED = FILL_START + missing * FILL_GAP + 15;
  const solved = frame >= SOLVED;

  const legs = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const answerPop = spring({ frame: frame - SOLVED, fps, config: { damping: 9 } });

  return (
    <SceneFade duration={duration}>
      <Sky top="#FFC6E0" bottom="#FFF1D6" />
      <Hills y={700} />
      {/* vlaggetjes */}
      <svg width={1920} height={140} style={{ position: "absolute", top: 0 }}>
        <path d="M0 20 Q960 120 1920 20" stroke="#fff" strokeWidth={4} fill="none" />
        {new Array(16).fill(0).map((_, i) => {
          const x = 60 + i * 120;
          const y = 20 + Math.sin((x / 1920) * Math.PI) * 50;
          return <path key={i} d={`M${x - 30} ${y} L${x + 30} ${y} L${x} ${y + 55} Z`} fill={BALLOON_COLORS[i % 10]} />;
        })}
      </svg>

      {/* SPLITSBEEN */}
      <div style={{ position: "absolute", left: 200, top: 150, width: 640, height: 420, background: "rgba(255,255,255,0.92)", borderRadius: 40, boxShadow: "0 12px 0 rgba(0,0,0,0.1)" }}>
        <svg width={640} height={420} style={{ position: "absolute" }}>
          <line x1={320} y1={150} x2={320 - 150 * legs} y2={150 + 110 * legs} stroke={COLORS.ink} strokeWidth={10} strokeLinecap="round" />
          <line x1={320} y1={150} x2={320 + 150 * legs} y2={150 + 110 * legs} stroke={COLORS.ink} strokeWidth={10} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", left: 245, top: 30, width: 150, height: 130, borderRadius: 30, background: COLORS.route, color: "white", fontFamily, fontWeight: 700, fontSize: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {total}
        </div>
        <div style={{ position: "absolute", left: 95, top: 255, width: 150, height: 130, borderRadius: 30, border: `8px solid ${COLORS.ink}`, background: "white", color: COLORS.ink, fontFamily, fontWeight: 700, fontSize: 96, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", opacity: legs }}>
          {have}
        </div>
        <div style={{ position: "absolute", left: 395, top: 255, width: 150, height: 130, borderRadius: 30, border: `8px solid ${COLORS.ink}`, background: solved ? "#C9F29B" : COLORS.sun, color: COLORS.ink, fontFamily, fontWeight: 700, fontSize: 96, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", opacity: legs }}>
          <span style={{ transform: `scale(${solved ? answerPop : 1})` }}>{solved ? missing : "?"}</span>
        </div>
      </div>

      {/* TIENVELD MET BALLONNEN (2 rijen van 5) */}
      <div style={{ position: "absolute", left: 960, top: 150, width: 800, height: 420, background: "rgba(255,255,255,0.92)", borderRadius: 40, boxShadow: "0 12px 0 rgba(0,0,0,0.1)" }}>
        {new Array(total).fill(0).map((_, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const cx = 90 + col * 155;
          const cy = 110 + row * 200;
          const isNew = i >= have;
          const at = FILL_START + (i - have) * FILL_GAP;
          const inflate = isNew ? spring({ frame: frame - at, fps, config: { damping: 8, stiffness: 180 } }) : 1;
          const bob = Math.sin((frame + i * 13) / 12) * 6;
          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: cx - 50, top: cy - 70, width: 100, height: 120, borderRadius: "50%", border: `5px dashed ${isNew && frame < at ? "#C3C9D6" : "transparent"}`, boxSizing: "border-box" }} />
              {(!isNew || frame >= at) && (
                <div style={{ position: "absolute", left: cx - 50, top: cy - 70 + bob, width: 100, height: 120, transform: `scale(${inflate})`, transformOrigin: "50% 100%" }}>
                  <div style={{ width: 100, height: 120, borderRadius: "50%", background: BALLOON_COLORS[i], boxShadow: "inset -14px -10px 0 rgba(0,0,0,0.12)" }} />
                  <div style={{ position: "absolute", left: 30, top: 22, width: 20, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }} />
                  <div style={{ position: "absolute", left: 49, top: 120, width: 2, height: 50, background: "#666" }} />
                </div>
              )}
              {isNew ? <PopNumber n={i - have + 1} x={cx} y={cy - 12} at={at + 4} color={COLORS.ink} size={52} /> : null}
            </React.Fragment>
          );
        })}
      </div>

      {/* de ploeg */}
      <div style={{ position: "absolute", left: 60, top: 790 }}>
        <Bollobo character={CHARACTERS.teller} size={190} talking={frame > 15 && frame < 105} emotion={solved ? "cheer" : frame > THINK_START && frame < FILL_START ? "thinking" : "happy"} bouncing={solved} look={1} />
      </div>
      <div style={{ position: "absolute", left: 270, top: 790 }}>
        <Bollobo character={CHARACTERS.splitser} size={190} talking={frame > SOLVED && frame < SOLVED + 60} emotion={solved ? "cheer" : frame > THINK_START && frame < FILL_START ? "thinking" : "happy"} bouncing={solved} look={1} />
      </div>
      <div style={{ position: "absolute", left: 470, top: 840 }}>
        <Bollobo character={CHARACTERS.kleuter} size={150} talking={frame > 115 && frame < 185} emotion={solved ? "cheer" : "happy"} bouncing={solved} look={1} />
      </div>

      <Sequence from={15} durationInFrames={100} layout="none">
        <SpeechBubble text="Voor het feest hebben we 10 ballonnen nodig. Er zijn er al 3." x={700} y={720} width={1000} tail="left" />
      </Sequence>
      <Sequence from={115} durationInFrames={75} layout="none">
        <SpeechBubble text="Hoeveel moeten we er nog opblazen?" x={700} y={740} width={900} tail="left" />
      </Sequence>
      <Sequence from={SOLVED} layout="none">
        <SpeechBubble text={`10 splits je in ${have} en ${missing}!`} x={700} y={740} width={820} tail="left" color="#E6FFD1" />
      </Sequence>

      <ThinkCountdown start={THINK_START} right={140} top={640} />
      <Confetti start={SOLVED} count={80} />
    </SceneFade>
  );
};

