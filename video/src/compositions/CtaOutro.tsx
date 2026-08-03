import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { useFontsReady } from "../useFontsReady";

export interface CtaOutroProps {
  /** Texte du call-to-action, ex: "Abonne-toi pour plus de programmes" */
  text: string;
  handle: string;
}

export const CtaOutro: React.FC<CtaOutroProps> = ({ text, handle }) => {
  useFontsReady();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fontFamily = theme.font.family;

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 150 },
    durationInFrames: 16,
  });

  // Pulsation continue pour attirer l'oeil sur le bouton.
  const pulse = 1 + Math.sin(frame / 8) * 0.05;

  // La fleche "monte" en boucle vers le bouton follow.
  const arrowCycle = 30;
  const arrowT = (frame % arrowCycle) / arrowCycle;
  const arrowY = interpolate(arrowT, [0, 1], [30, -10]);
  const arrowOpacity = interpolate(
    arrowT,
    [0, 0.15, 0.85, 1],
    [0, 1, 1, 0]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
          textAlign: "center",
          padding: `0 ${theme.layout.safeMarginX}px`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontWeight: theme.font.weightBlack,
            fontSize: 72,
            color: theme.colors.ink,
            lineHeight: 1.15,
            marginBottom: 50,
          }}
        >
          {text}
        </div>

        <div
          style={{
            display: "inline-block",
            fontFamily,
            fontWeight: theme.font.weightBold,
            fontSize: 46,
            color: "#ffffff",
            background: theme.colors.accent,
            borderRadius: 999,
            padding: "26px 56px",
            transform: `scale(${pulse})`,
            boxShadow: `0 18px 40px ${theme.colors.accentSoft}`,
          }}
        >
          Suivre @{handle}
        </div>

        <div
          style={{
            marginTop: 34,
            fontSize: 90,
            color: theme.colors.accent,
            opacity: arrowOpacity,
            transform: `translateY(${arrowY}px)`,
          }}
        >
          ▲
        </div>
      </div>
    </AbsoluteFill>
  );
};
