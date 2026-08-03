import "./index.css";
import { Composition, staticFile } from "remotion";
import { ExerciseSlide } from "./compositions/ExerciseSlide";

const FPS = 30;
const SLIDE_DURATION_SECONDS = 3.5;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Preview isolee du composant ExerciseSlide, pour validation avant
          d'enchainer sur le hook / CTA / assemblage complet. */}
      <Composition
        id="ExerciseSlidePreview"
        component={ExerciseSlide}
        durationInFrames={Math.round(SLIDE_DURATION_SECONDS * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          rank: 5,
          name: "SQUATS",
          imageSrc: staticFile("characters/squat.webp"),
          instructionSequence: ["EN RESPIRANT", "PROFONDEMENT"],
          arrowDirection: "down" as const,
          durationInFrames: Math.round(SLIDE_DURATION_SECONDS * FPS),
        }}
      />
    </>
  );
};
