import React from "react";
import { AbsoluteFill, Series, staticFile } from "remotion";
import { theme } from "../theme";
import { ExerciseSlide, ArrowDirection } from "./ExerciseSlide";
import { HookIntro } from "./HookIntro";
import { CtaOutro } from "./CtaOutro";
import { Watermark } from "./Watermark";

export interface ExerciseData {
  rank: number;
  name: string;
  /** Chemin relatif a public/, ex: "characters/squat.webp" */
  image: string;
  instructionSequence: string[];
  dureeSecondes: number;
  arrowDirection?: ArrowDirection;
}

export interface VideoData {
  hookTitle: string;
  watermarkHandle: string;
  ctaText: string;
  exercises: ExerciseData[];
}

export interface FullVideoProps {
  data: VideoData;
}

export function secondsToFrames(seconds: number): number {
  return Math.round(seconds * theme.timing.fps);
}

/** Duree totale (en frames) pour une donnee de video donnee : sert au
 * calculateMetadata de la Composition, pour que la duree s'ajuste
 * automatiquement au contenu du fichier JSON. */
export function computeTotalDurationInFrames(data: VideoData): number {
  const hook = secondsToFrames(theme.timing.hookSeconds);
  const cta = secondsToFrames(theme.timing.ctaSeconds);
  const exercises = data.exercises.reduce(
    (sum, ex) => sum + secondsToFrames(ex.dureeSecondes),
    0
  );
  return hook + exercises + cta;
}

export const FullVideo: React.FC<FullVideoProps> = ({ data }) => {
  const hookFrames = secondsToFrames(theme.timing.hookSeconds);
  const ctaFrames = secondsToFrames(theme.timing.ctaSeconds);
  const firstExercise = data.exercises[0];

  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={hookFrames}>
          <HookIntro
            title={data.hookTitle}
            imageSrc={staticFile(firstExercise.image)}
            startRank={firstExercise.rank}
          />
        </Series.Sequence>

        {data.exercises.map((ex) => {
          const dur = secondsToFrames(ex.dureeSecondes);
          return (
            <Series.Sequence key={ex.rank} durationInFrames={dur}>
              <ExerciseSlide
                rank={ex.rank}
                name={ex.name}
                imageSrc={staticFile(ex.image)}
                instructionSequence={ex.instructionSequence}
                arrowDirection={ex.arrowDirection ?? "down"}
                durationInFrames={dur}
              />
            </Series.Sequence>
          );
        })}

        <Series.Sequence durationInFrames={ctaFrames}>
          <CtaOutro text={data.ctaText} handle={data.watermarkHandle} />
        </Series.Sequence>
      </Series>

      <Watermark handle={data.watermarkHandle} />
    </AbsoluteFill>
  );
};
