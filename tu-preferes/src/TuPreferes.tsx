import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import { FPS, MID_CTA_AFTER, Q_ENTER } from "./config";
import { loadFont } from "./font";
import type { Episode } from "./questions";
import { buildTimeline, VOICE_DELAY } from "./timeline";
import { Hook } from "./components/Hook";
import { MidCta } from "./components/MidCta";
import { Outro, TAP_AT } from "./components/Outro";
import { Question } from "./components/Question";

loadFont();

const VOICE_VOLUME = 1;
const SFX_VOLUME = 0.35;
const TICK_VOLUME = 0.18;

// Joue un son à partir d'une frame donnée
const Sound: React.FC<{
  at: number;
  src: string;
  volume: number;
  name: string;
}> = ({ at, src, volume, name }) => (
  <Sequence from={at} name={name} layout="none">
    <Html5Audio src={staticFile(src)} volume={volume} />
  </Sequence>
);

export const TuPreferes: React.FC<{ episode: Episode }> = ({ episode }) => {
  const { questions } = episode;
  const timeline = buildTimeline(episode);
  const hasVoice = (key: string) => timeline.voice?.[key] !== undefined;
  const voice = (key: string, at: number) =>
    hasVoice(key) ? (
      <Sound
        key={`voice-${key}`}
        at={at + VOICE_DELAY}
        src={`voice/${episode.id}/${key}.wav`}
        volume={VOICE_VOLUME}
        name={`Voix ${key}`}
      />
    ) : null;

  const mid = timeline.questions[MID_CTA_AFTER];

  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <Sequence durationInFrames={timeline.hook} name="Accroche">
        <Hook
          title={episode.hook}
          sub={episode.hookSub}
          part={episode.part}
          duration={timeline.hook}
        />
      </Sequence>
      {voice("hook", 0)}

      {questions.map((q, i) => {
        const t = timeline.questions[i];
        const revealAt = t.start + Q_ENTER + t.countdown;
        // Un tick par seconde du chrono, calé sur le changement de chiffre
        const ticks: number[] = [];
        for (let f = t.countdown % FPS; f < t.countdown; f += FPS) {
          ticks.push(t.start + Q_ENTER + f);
        }
        return (
          <React.Fragment key={i}>
            <Sequence
              from={t.start}
              durationInFrames={t.duration}
              name={`Question ${i + 1}`}
            >
              <Question
                question={q}
                index={i}
                total={questions.length}
                countdown={t.countdown}
              />
            </Sequence>
            <Sound
              at={t.start}
              src="sfx/whoosh.wav"
              volume={SFX_VOLUME}
              name="Whoosh"
            />
            {ticks.map((at) => (
              <Sound
                key={at}
                at={at}
                src="sfx/tick.wav"
                volume={TICK_VOLUME}
                name="Tick"
              />
            ))}
            <Sound
              at={revealAt}
              src="sfx/ding.wav"
              volume={SFX_VOLUME}
              name="Ding"
            />
            {voice(`q${i}`, t.start)}
            {i === MID_CTA_AFTER && hasVoice("cta")
              ? voice("cta", revealAt)
              : voice(`r${i}`, revealAt)}
          </React.Fragment>
        );
      })}

      {mid && questions.length > MID_CTA_AFTER + 1 ? (
        <Sequence
          from={mid.start + Q_ENTER + mid.countdown}
          durationInFrames={mid.reveal}
          name="CTA milieu"
        >
          <MidCta nextPart={episode.part + 1} duration={mid.reveal} />
        </Sequence>
      ) : null}

      <Sequence
        from={timeline.outroStart}
        durationInFrames={timeline.outro}
        name="CTA final"
      >
        <Outro handle={episode.handle} nextPart={episode.part + 1} />
      </Sequence>
      <Sound
        at={timeline.outroStart + TAP_AT}
        src="sfx/pop.wav"
        volume={SFX_VOLUME * 1.5}
        name="Pop"
      />
      {voice("outro", timeline.outroStart)}
    </AbsoluteFill>
  );
};
