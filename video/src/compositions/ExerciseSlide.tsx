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

const fontFamily = theme.font.family;

export type ArrowDirection = "up" | "down" | "up-down" | "left-right" | "none";

export interface ExerciseSlideProps {
  /** Rang affiche en tres grand format derriere le titre (ex: 5, 4, 3...) */
  rank: number;
  /** Nom de l'exercice, ecrit en arc de cercle autour du chiffre */
  name: string;
  /** Chemin vers l'image du personnage (via staticFile()) */
  imageSrc: string;
  /**
   * Textes d'instruction qui se succedent pendant le slide (ex:
   * ["EN RESPIRANT", "PROFONDEMENT"]). Repartis a parts egales sur la duree.
   */
  instructionSequence: string[];
  /** Sens des fleches superposees sur l'image */
  arrowDirection?: ArrowDirection;
  /** Duree totale du slide en frames (doit correspondre a la Sequence parente) */
  durationInFrames: number;
}

function ArcTitle({ text, radius }: { text: string; radius: number }) {
  // Le texte suit un arc au-dessus du chiffre fantome, centre horizontalement.
  const id = "arc-title-path";
  const cx = theme.layout.width / 2;
  const cy = radius + 40;
  // Demi-cercle superieur, de gauche a droite.
  const startX = cx - radius;
  const endX = cx + radius;
  return (
    <svg
      width={theme.layout.width}
      height={radius + 120}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <defs>
        <path
          id={id}
          d={`M ${startX} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${cy}`}
          fill="none"
        />
      </defs>
      <text
        fill={theme.colors.ink}
        fontFamily={fontFamily}
        fontWeight={theme.font.weightBlack}
        fontSize={theme.sizes.arcTitle}
        letterSpacing={4}
      >
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  );
}

function AnimatedArrow({
  direction,
  frame,
}: {
  direction: ArrowDirection;
  frame: number;
}) {
  if (direction === "none") return null;

  const cycle = 40; // boucle de l'animation, en frames
  const t = (frame % cycle) / cycle; // 0 -> 1 en boucle
  const bob = Math.sin(t * Math.PI * 2) * 22;
  const pulseOpacity = interpolate(
    Math.sin(t * Math.PI * 2),
    [-1, 1],
    [0.55, 1]
  );

  const arrowChar = "▼"; // triangle plein vers le bas, tourne selon le sens
  const rotation =
    direction === "up"
      ? 180
      : direction === "left-right"
        ? 90
        : direction === "up-down"
          ? 0
          : 0;

  const translateY =
    direction === "left-right" ? 0 : direction === "up" ? -bob : bob;
  const translateX = direction === "left-right" ? bob : 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: direction === "up" ? undefined : 90,
        top: direction === "up" ? 90 : undefined,
        left: "50%",
        transform: `translateX(-50%) translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`,
        fontSize: 90,
        color: theme.colors.accent,
        opacity: pulseOpacity,
        textShadow: "0 4px 18px rgba(255,45,111,0.45)",
      }}
    >
      {arrowChar}
    </div>
  );
}

function InstructionText({
  instructionSequence,
  durationInFrames,
  frame,
}: {
  instructionSequence: string[];
  durationInFrames: number;
  frame: number;
}) {
  const fps = 30;
  const n = Math.max(instructionSequence.length, 1);
  const perStep = durationInFrames / n;
  const stepIndex = Math.min(Math.floor(frame / perStep), n - 1);
  const stepStart = stepIndex * perStep;
  const localFrame = frame - stepStart;

  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 180 },
    durationInFrames: 12,
  });
  const opacity = interpolate(localFrame, [perStep - 8, perStep], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(enter, [0, 1], [24, 0]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 210,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: enter * opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <span
        style={{
          fontFamily,
          fontWeight: theme.font.weightBold,
          fontSize: theme.sizes.instruction,
          color: theme.colors.ink,
          letterSpacing: 1,
          padding: "10px 28px",
          borderRadius: 999,
          background: theme.colors.accentSoft,
        }}
      >
        {instructionSequence[stepIndex]}
      </span>
    </div>
  );
}

export const ExerciseSlide: React.FC<ExerciseSlideProps> = ({
  rank,
  name,
  imageSrc,
  instructionSequence,
  arrowDirection = "down",
  durationInFrames,
}) => {
  useFontsReady();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numberEnter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 140 },
    durationInFrames: 18,
  });
  const titleEnter = spring({
    frame: frame - 4,
    fps,
    config: { damping: 18, stiffness: 160 },
    durationInFrames: 18,
  });
  const imageEnter = spring({
    frame: frame - 8,
    fps,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 20,
  });

  // Legere respiration continue de l'image pour eviter un plan totalement figé.
  const breathe = 1 + Math.sin(frame / 18) * 0.012;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      {/* Chiffre geant en fond */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily,
          fontWeight: theme.font.weightBlack,
          fontSize: theme.sizes.numberGhost,
          color: theme.colors.numberGhost,
          lineHeight: 1,
          opacity: numberEnter,
          transform: `scale(${interpolate(numberEnter, [0, 1], [0.85, 1])})`,
        }}
      >
        {rank}
      </div>

      {/* Titre en arc au-dessus du chiffre */}
      <div
        style={{
          opacity: titleEnter,
          transform: `translateY(${interpolate(titleEnter, [0, 1], [-20, 0])}px)`,
        }}
      >
        <ArcTitle text={name} radius={330} />
      </div>

      {/* Illustration du personnage + fleches directionnelles */}
      <div
        style={{
          position: "absolute",
          top: 560,
          left: 0,
          right: 0,
          bottom: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: imageEnter,
          transform: `scale(${interpolate(imageEnter, [0, 1], [0.9, 1]) * breathe})`,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Img
            src={imageSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
          <AnimatedArrow direction={arrowDirection} frame={frame} />
        </div>
      </div>

      <InstructionText
        instructionSequence={instructionSequence}
        durationInFrames={durationInFrames}
        frame={frame}
      />
    </AbsoluteFill>
  );
};
