import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TEXT_FONT } from "../font";

// Mini-CTA en plein milieu de la vidéo : ceux qui sont accrochés
// sont les plus susceptibles de s'abonner.
export const MidCta: React.FC<{ nextPart: number; duration: number }> = ({
  nextPart,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 12 } });
  const exit = interpolate(frame, [duration - 8, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(enter - exit, [0, 1], [-260, 0]);
  const bounce = 1 + Math.sin(frame / 4) * 0.03;

  return (
    <div
      style={{
        position: "absolute",
        // Centré sur la ligne de séparation : recouvre le badge "OU"
        // pendant la révélation, sans masquer les choix.
        top: 960 - 54,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${y}px) scale(${bounce})`,
      }}
    >
      <div
        style={{
          fontFamily: TEXT_FONT,
          fontSize: 48,
          color: "#111",
          background: "white",
          borderRadius: 999,
          padding: "22px 44px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <span
          style={{
            background: "#fe2c55",
            color: "white",
            borderRadius: 999,
            width: 64,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 54,
          }}
        >
          +
        </span>
        Abonne-toi pour la partie {nextPart} 👀
      </div>
    </div>
  );
};
