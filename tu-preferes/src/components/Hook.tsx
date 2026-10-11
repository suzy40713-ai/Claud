import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLOR_A, COLOR_B, SAFE_RIGHT } from "../config";
import { TEXT_FONT } from "../font";

// Accroche (1,5 s) : promesse + boucle ouverte ("la dernière est la plus dure")
export const Hook: React.FC<{
  title: string;
  sub: string;
  part: number;
  duration: number;
}> = ({ title, sub, part, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 9, mass: 0.5 } });
  const wiggle = Math.sin(frame / 3) * 2.5;
  const subIn = spring({ frame: frame - 8, fps, config: { damping: 12 } });
  const out = interpolate(frame, [duration - 6, duration], [1, 0], {
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${COLOR_A} 0%, ${COLOR_A} 50%, ${COLOR_B} 50%, ${COLOR_B} 100%)`,
        alignItems: "center",
        justifyContent: "center",
        paddingRight: SAFE_RIGHT - 60,
        opacity: out,
      }}
    >
      <div
        style={{
          fontFamily: TEXT_FONT,
          fontSize: 60,
          color: "#111",
          background: "#ffd400",
          padding: "10px 30px",
          borderRadius: 20,
          marginBottom: 40,
          transform: `scale(${pop}) rotate(-4deg)`,
        }}
      >
        TU PRÉFÈRES… {part > 1 ? `PARTIE ${part}` : ""}
      </div>
      <div
        style={{
          fontFamily: TEXT_FONT,
          fontSize: 100,
          lineHeight: 1.08,
          color: "white",
          textAlign: "center",
          whiteSpace: "pre-line",
          textShadow: "0 8px 0 rgba(0,0,0,0.35)",
          transform: `scale(${pop}) rotate(${wiggle}deg)`,
          padding: "0 60px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: TEXT_FONT,
          fontSize: 50,
          color: "white",
          marginTop: 40,
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 40}px)`,
          textShadow: "0 5px 0 rgba(0,0,0,0.35)",
        }}
      >
        {sub}
      </div>
    </AbsoluteFill>
  );
};
