import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  HOOK_DURATION,
  MID_CTA_AFTER,
  OUTRO_DURATION,
  Q_COUNTDOWN,
  Q_ENTER,
  Q_REVEAL,
  QUESTION_DURATION,
} from "./config";
import { loadFont } from "./font";
import type { Episode } from "./questions";
import { Hook } from "./components/Hook";
import { MidCta } from "./components/MidCta";
import { Outro } from "./components/Outro";
import { Question } from "./components/Question";

loadFont();

export const TuPreferes: React.FC<{ episode: Episode }> = ({ episode }) => {
  const { questions } = episode;
  const outroStart = HOOK_DURATION + questions.length * QUESTION_DURATION;
  const midCtaStart =
    HOOK_DURATION + MID_CTA_AFTER * QUESTION_DURATION + Q_ENTER + Q_COUNTDOWN;

  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <Sequence durationInFrames={HOOK_DURATION} name="Accroche">
        <Hook title={episode.hook} sub={episode.hookSub} part={episode.part} />
      </Sequence>

      {questions.map((q, i) => (
        <Sequence
          key={i}
          from={HOOK_DURATION + i * QUESTION_DURATION}
          durationInFrames={QUESTION_DURATION}
          name={`Question ${i + 1}`}
        >
          <Question question={q} index={i} total={questions.length} />
        </Sequence>
      ))}

      {questions.length > MID_CTA_AFTER + 1 ? (
        <Sequence
          from={midCtaStart}
          durationInFrames={Q_REVEAL}
          name="CTA milieu"
        >
          <MidCta nextPart={episode.part + 1} duration={Q_REVEAL} />
        </Sequence>
      ) : null}

      <Sequence
        from={outroStart}
        durationInFrames={OUTRO_DURATION}
        name="CTA final"
      >
        <Outro handle={episode.handle} nextPart={episode.part + 1} />
      </Sequence>
    </AbsoluteFill>
  );
};
