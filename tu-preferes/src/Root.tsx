import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { FPS, totalDuration } from "./config";
import { EPISODES } from "./questions";
import { TuPreferes } from "./TuPreferes";

// Une composition par épisode (Partie 1, Partie 2…) dans la sidebar.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {EPISODES.map((episode) => (
        <Composition
          key={episode.id}
          id={episode.id}
          component={TuPreferes}
          durationInFrames={totalDuration(episode.questions.length)}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{ episode }}
        />
      ))}
    </>
  );
};
