import "./index.css";
import { Composition } from "remotion";
import { FPS, createExplainer } from "./Explainer";
import { animaux } from "./topics/animaux";
import { cerveau } from "./topics/cerveau";

// One composition per topic; render one with
// `npx remotion render <Id> out/<file>.mp4`.
const VIDEOS = [
  { id: "Cerveau", topic: cerveau },
  { id: "Animaux", topic: animaux },
].map((v) => ({ ...v, ...createExplainer(v.topic) }));

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {VIDEOS.map((v) => (
        <Composition
          key={v.id}
          id={v.id}
          component={v.Video}
          durationInFrames={v.durationInFrames}
          fps={FPS}
          width={1080}
          height={1920}
        />
      ))}
    </>
  );
};
