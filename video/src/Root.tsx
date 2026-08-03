import "./index.css";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { ExerciseSlide } from "./compositions/ExerciseSlide";
import {
  FullVideo,
  FullVideoProps,
  VideoData,
  computeTotalDurationInFrames,
} from "./compositions/FullVideo";
import exercisesExample from "../data/exercises.example.json";
import { theme } from "./theme";

const FPS = theme.timing.fps;
const SLIDE_DURATION_SECONDS = 3.5;

const calculateFullVideoMetadata: CalculateMetadataFunction<
  FullVideoProps
> = ({ props }) => {
  return {
    durationInFrames: computeTotalDurationInFrames(props.data),
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Preview isolee du composant ExerciseSlide, pour ajuster un slide
          sans avoir a relancer tout l'assemblage. */}
      <Composition
        id="ExerciseSlidePreview"
        component={ExerciseSlide}
        durationInFrames={Math.round(SLIDE_DURATION_SECONDS * FPS)}
        fps={FPS}
        width={theme.layout.width}
        height={theme.layout.height}
        defaultProps={{
          rank: 5,
          name: "SQUATS",
          imageSrc: staticFile("characters/squat.webp"),
          instructionSequence: ["EN RESPIRANT", "PROFONDEMENT"],
          arrowDirection: "down" as const,
          durationInFrames: Math.round(SLIDE_DURATION_SECONDS * FPS),
        }}
      />

      {/* Video complete : Hook + liste d'exercices (fichier JSON) + CTA.
          La duree totale s'ajuste automatiquement au contenu du JSON. */}
      <Composition
        id="FullVideo"
        component={FullVideo}
        fps={FPS}
        width={theme.layout.width}
        height={theme.layout.height}
        durationInFrames={computeTotalDurationInFrames(
          exercisesExample as VideoData
        )}
        calculateMetadata={calculateFullVideoMetadata}
        defaultProps={{
          data: exercisesExample as VideoData,
        }}
      />
    </>
  );
};
