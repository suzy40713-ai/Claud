import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  COLOR_A,
  COLOR_B,
  Q_COUNTDOWN,
  Q_ENTER,
  SAFE_BOTTOM,
  SAFE_RIGHT,
  SAFE_TOP,
} from "../config";
import { TEXT_FONT } from "../font";
import type { Choice, Question as QuestionType } from "../questions";
import { ProgressBar } from "./ProgressBar";

const REVEAL_START = Q_ENTER + Q_COUNTDOWN;
const MID = 960;

const Half: React.FC<{
  choice: Choice;
  color: string;
  percent: number;
  side: "top" | "bottom";
  winner: boolean;
}> = ({ choice, color, percent, side, winner }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  const slide = interpolate(enter, [0, 1], [side === "top" ? -1100 : 1100, 0]);

  const revealFrame = frame - REVEAL_START;
  const reveal = spring({
    frame: revealFrame,
    fps,
    config: { damping: 200 },
    durationInFrames: 30,
  });
  const shownPercent = Math.round(percent * reveal);
  const isRevealed = revealFrame >= 0;

  // Petit "respire" permanent pour garder du mouvement à l'écran
  const breathe = 1 + Math.sin((frame / 30) * Math.PI) * 0.015;
  const winnerPop = isRevealed && winner
    ? spring({ frame: revealFrame - 18, fps, config: { damping: 8 } })
    : 0;

  // Zone de contenu (relative à la moitié), dans les safe zones TikTok,
  // en laissant de la place au chrono central.
  const insetTop = side === "top" ? SAFE_TOP + 70 : 110;
  const insetBottom = side === "top" ? 110 : SAFE_BOTTOM;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: side === "top" ? 0 : MID,
        height: MID,
        background: color,
        transform: `translateX(${slide}px)`,
        overflow: "hidden",
      }}
    >
      {/* Jauge de pourcentage qui se remplit */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${percent * reveal}%`,
          background: "rgba(0,0,0,0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 60,
          right: SAFE_RIGHT,
          top: insetTop,
          bottom: insetBottom,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          opacity: isRevealed && !winner ? interpolate(reveal, [0, 1], [1, 0.6]) : 1,
          transform: `scale(${breathe + winnerPop * 0.06})`,
        }}
      >
        <div style={{ fontSize: 130, lineHeight: 1, fontFamily: TEXT_FONT }}>
          {choice.emoji}
        </div>
        <div
          style={{
            fontFamily: TEXT_FONT,
            fontSize: choice.text.length > 30 ? 54 : 66,
            lineHeight: 1.1,
            color: "white",
            textAlign: "center",
            textShadow: "0 6px 0 rgba(0,0,0,0.3)",
            textTransform: "uppercase",
          }}
        >
          {choice.text}
        </div>
        {isRevealed ? (
          <div
            style={{
              fontFamily: TEXT_FONT,
              fontSize: 100,
              color: winner ? "#ffd400" : "white",
              textShadow: "0 7px 0 rgba(0,0,0,0.35)",
              transform: `scale(${interpolate(reveal, [0, 1], [0.4, 1])})`,
            }}
          >
            {shownPercent}%{winner ? " ✅" : ""}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const CenterBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const countdownFrame = frame - Q_ENTER;
  const inCountdown = countdownFrame >= 0 && countdownFrame < Q_COUNTDOWN;
  const secondsLeft = Math.ceil((Q_COUNTDOWN - countdownFrame) / fps);
  const progress = inCountdown ? countdownFrame / Q_COUNTDOWN : 1;

  // Pulse à chaque seconde du chrono
  const tick = inCountdown ? countdownFrame % fps : fps;
  const pulse = interpolate(tick, [0, 6, 12], [1.18, 1.05, 1], {
    extrapolateRight: "clamp",
  });
  const appear = spring({ frame: frame - 4, fps, config: { damping: 10 } });

  const size = 230;
  const r = 100;
  const circumference = 2 * Math.PI * r;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: MID,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        transform: `scale(${appear * pulse})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "#111",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        }}
      />
      <svg width={size} height={size} style={{ position: "absolute" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={secondsLeft <= 1 && inCountdown ? "#ff3b5c" : "#ffd400"}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * progress}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: TEXT_FONT,
          color: "white",
          fontSize: inCountdown ? 110 : 80,
        }}
      >
        {inCountdown ? secondsLeft : "OU"}
      </div>
    </div>
  );
};

export const Question: React.FC<{
  question: QuestionType;
  index: number;
  total: number;
}> = ({ question, index, total }) => {
  const percentA = question.percentA;
  const percentB = 100 - percentA;

  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <Half
        side="top"
        choice={question.a}
        color={COLOR_A}
        percent={percentA}
        winner={percentA >= percentB}
      />
      <Half
        side="bottom"
        choice={question.b}
        color={COLOR_B}
        percent={percentB}
        winner={percentB > percentA}
      />
      <CenterBadge />
      <ProgressBar index={index} total={total} />
    </AbsoluteFill>
  );
};
