import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { SAFE_RIGHT, SAFE_TOP } from "../config";
import { TEXT_FONT } from "../font";

// Barre de progression : montre au spectateur qu'il reste des questions
// (et que la dernière est "la plus dure") → il reste jusqu'au bout.
export const ProgressBar: React.FC<{
  index: number;
  total: number;
}> = ({ index, total }) => {
  const frame = useCurrentFrame();
  const isLast = index === total - 1;
  const fill = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: SAFE_TOP - 60,
        left: 60,
        right: SAFE_RIGHT,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 14,
              borderRadius: 7,
              background: "rgba(255,255,255,0.3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: i < index ? "100%" : i === index ? `${fill * 100}%` : 0,
                background: i === total - 1 ? "#ffd400" : "white",
              }}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          fontFamily: TEXT_FONT,
          fontSize: 44,
          color: isLast ? "#ffd400" : "white",
          textShadow: "0 4px 0 rgba(0,0,0,0.35)",
        }}
      >
        {isLast ? "🔥 LA PLUS DURE" : `QUESTION ${index + 1}/${total}`}
      </div>
    </div>
  );
};
