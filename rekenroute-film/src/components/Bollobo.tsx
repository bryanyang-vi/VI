import React from "react";
import { useCurrentFrame } from "remotion";
import { Character } from "../characters";
import { COLORS, fontFamily } from "../theme";

export type Emotion = "happy" | "surprised" | "thinking" | "cheer";

type Props = {
  character: Character;
  /** Breedte in pixels */
  size?: number;
  talking?: boolean;
  /** Huppelen op de plaats */
  bouncing?: boolean;
  /** Rechterarm zwaait */
  waving?: boolean;
  emotion?: Emotion;
  /** Kijkrichting -1 (links) tot 1 (rechts) */
  look?: number;
  /** Spiegelen zodat hij naar links kijkt */
  flip?: boolean;
  style?: React.CSSProperties;
};

/**
 * Een Bollobo: een rond, vriendelijk figuurtje met helm en badge.
 * Getekend in SVG zodat hij scherp blijft op elk formaat.
 */
export const Bollobo: React.FC<Props> = ({
  character,
  size = 300,
  talking = false,
  bouncing = false,
  waving = false,
  emotion = "happy",
  look = 0,
  flip = false,
  style,
}) => {
  const frame = useCurrentFrame();
  // Elk personage knippert op een ander moment
  const seed = character.id.length * 17;
  const blinkPhase = (frame + seed) % 110;
  const eyeScaleY = blinkPhase < 4 ? 0.12 : 1;

  const bounceY = bouncing ? -Math.abs(Math.sin((frame + seed) / 6)) * 34 : 0;
  const squash = bouncing
    ? 1 + Math.max(0, Math.cos((frame + seed) / 3)) * 0.04
    : 1 + Math.sin((frame + seed) / 18) * 0.015; // rustig ademen
  const mouthOpen = talking ? 6 + Math.abs(Math.sin(frame / 2.6)) * 18 : 0;

  const armWave = waving
    ? Math.sin(frame / 4) * 28 - 40
    : emotion === "cheer"
      ? -120 + Math.sin(frame / 3) * 15
      : Math.sin((frame + seed) / 20) * 6;
  const leftArm =
    emotion === "cheer"
      ? 120 - Math.sin(frame / 3) * 15
      : emotion === "thinking"
        ? 70
        : -Math.sin((frame + seed) / 20) * 6;

  const pupilX = look * 7;
  const pupilY = emotion === "thinking" ? -7 : 0;
  const s = size / 220;

  return (
    <div
      style={{
        width: size,
        height: size * 1.15,
        transform: `translateY(${bounceY}px) scaleX(${flip ? -1 : 1})`,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 220 253"
        width={size}
        height={size * 1.15}
        style={{ overflow: "visible" }}
      >
        {/* schaduw */}
        <ellipse
          cx="110"
          cy="246"
          rx={70 - Math.abs(bounceY / s) * 0.5}
          ry="9"
          fill="rgba(0,0,0,0.18)"
          transform={`translate(0 ${-bounceY / s})`}
        />
        <g
          transform={`translate(110 240) scale(${2 - squash} ${squash}) translate(-110 -240)`}
        >
          {/* voeten */}
          <ellipse cx="78" cy="232" rx="28" ry="14" fill={character.shade} />
          <ellipse cx="142" cy="232" rx="28" ry="14" fill={character.shade} />

          {/* linkerarm */}
          <g transform={`rotate(${leftArm} 36 150)`}>
            <ellipse cx="24" cy="168" rx="14" ry="30" fill={character.body} />
          </g>
          {/* rechterarm */}
          <g transform={`rotate(${armWave} 184 150)`}>
            <ellipse cx="196" cy="168" rx="14" ry="30" fill={character.body} />
          </g>

          {/* lijf */}
          <circle cx="110" cy="148" r="86" fill={character.body} />
          <ellipse cx="110" cy="178" rx="54" ry="44" fill="rgba(255,255,255,0.28)" />
          <ellipse cx="78" cy="98" rx="20" ry="12" fill="rgba(255,255,255,0.35)" transform="rotate(-30 78 98)" />

          {/* ogen */}
          {[80, 140].map((x) => (
            <g key={x} transform={`translate(${x} 128) scale(1 ${eyeScaleY}) translate(${-x} -128)`}>
              <ellipse
                cx={x}
                cy="128"
                rx="20"
                ry={emotion === "surprised" ? 27 : 24}
                fill={COLORS.white}
              />
              <circle cx={x + pupilX} cy={130 + pupilY} r="11" fill={COLORS.ink} />
              <circle cx={x + pupilX + 4} cy={125 + pupilY} r="4" fill={COLORS.white} />
            </g>
          ))}
          {/* wenkbrauwen bij nadenken */}
          {emotion === "thinking" ? (
            <>
              <path d="M62 96 Q80 86 98 96" stroke={COLORS.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M122 92 Q140 84 158 90" stroke={COLORS.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
            </>
          ) : null}

          {/* wangetjes */}
          <ellipse cx="58" cy="164" rx="13" ry="8" fill="#FF8FA3" opacity="0.7" />
          <ellipse cx="162" cy="164" rx="13" ry="8" fill="#FF8FA3" opacity="0.7" />

          {/* mond */}
          {talking ? (
            <ellipse cx="110" cy="176" rx="18" ry={mouthOpen / 2 + 3} fill="#7A1F2B" />
          ) : emotion === "surprised" ? (
            <ellipse cx="110" cy="178" rx="11" ry="13" fill="#7A1F2B" />
          ) : emotion === "thinking" ? (
            <path d="M96 178 Q110 172 124 180" stroke={COLORS.ink} strokeWidth="6" fill="none" strokeLinecap="round" />
          ) : (
            <path
              d={emotion === "cheer" ? "M84 166 Q110 206 136 166 Z" : "M88 168 Q110 192 132 168"}
              stroke={COLORS.ink}
              strokeWidth="6"
              fill={emotion === "cheer" ? "#7A1F2B" : "none"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* helm */}
          <path d="M44 92 Q110 6 176 92 Z" fill={character.hat} />
          <rect x="34" y="84" width="152" height="16" rx="8" fill={character.hat} />
          <rect x="34" y="84" width="152" height="6" rx="3" fill="rgba(255,255,255,0.35)" />
          <circle cx="110" cy="58" r="22" fill={COLORS.white} stroke={character.shade} strokeWidth="4" />
          <text
            x="110"
            y="58"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={fontFamily}
            fontWeight={700}
            fontSize={character.badge.length > 2 ? 15 : 26}
            fill={character.shade}
            transform={flip ? "translate(220 0) scale(-1 1)" : undefined}
          >
            {character.badge}
          </text>
        </g>
      </svg>
    </div>
  );
};
