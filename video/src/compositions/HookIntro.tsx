import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { useFontsReady } from "../useFontsReady";

export interface HookIntroProps {
  /** Titre du hook, ex: "TOP 7 EXERCICES POUR..." */
  title: string;
  /** Image du personnage affichee en fin de hook (pose de transition/pause) */
  imageSrc: string;
  /** Rang de depart affiche en fond, ex: 7 pour un "Top 7" */
  startRank: number;
}

export const HookIntro: React.FC<HookIntroProps> = ({
  title,
  imageSrc,
  startRank,
}) => {
  useFontsReady();
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fontFamily = theme.font.family;

  // Le titre occupe la premiere moitie du hook, puis on bascule (zoom rapide)
  // sur le personnage pour la deuxieme moitie.
  const switchFrame = Math.round(durationInFrames * 0.55);

  const titleEnter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 160 },
    durationInFrames: 15,
  });
  const titleExit = interpolate(
    frame,
    [switchFrame - 6, switchFrame + 4],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const imageEnter = spring({
    frame: frame - switchFrame,
    fps,
    config: { damping: 12, stiffness: 200 },
    durationInFrames: 14,
  });

  const rankGhostOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      {/* Chiffre de depart en fond, discret, tout du long du hook */}
      <div
        style={{
          position: "absolute",
          top: 420,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily,
          fontWeight: theme.font.weightBlack,
          fontSize: theme.sizes.numberGhost,
          color: theme.colors.numberGhost,
          opacity: rankGhostOpacity,
        }}
      >
        {startRank}
      </div>

      {/* Titre d'accroche */}
      <div
        style={{
          position: "absolute",
          top: 130,
          left: theme.layout.safeMarginX,
          right: theme.layout.safeMarginX,
          textAlign: "center",
          opacity: titleEnter * titleExit,
          transform: `translateY(${interpolate(titleEnter, [0, 1], [30, 0])}px) scale(${interpolate(titleExit, [0, 1], [1.1, 1])})`,
        }}
      >
        <span
          style={{
            fontFamily,
            fontWeight: theme.font.weightBlack,
            fontSize: 78,
            lineHeight: 1.05,
            color: theme.colors.ink,
          }}
        >
          {title}
        </span>
      </div>

      {/* Pose de transition du personnage, arrive en zoom rapide */}
      <div
        style={{
          position: "absolute",
          top: 480,
          left: 0,
          right: 0,
          bottom: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: imageEnter,
          transform: `scale(${interpolate(imageEnter, [0, 1], [1.3, 1])})`,
        }}
      >
        <Img
          src={imageSrc}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    </AbsoluteFill>
  );
};
