import {
  AbsoluteFill,
  Composition,
  Easing,
  Html5Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import script from "./script.json";
import voiceover from "./voiceover.json";

const FPS = 30;
// TikTok's Creator Rewards only pays for videos longer than one minute.
const MIN_TOTAL = Math.ceil(61.5 * FPS);

type Fact = (typeof script.facts)[number];

const clipFrames = (id: string) =>
  Math.ceil((voiceover as Record<string, number>)[id] * FPS);

// Timeline derived from the voice-over lengths (see scripts/voiceover.py).
const hookSubAt = 4 + clipFrames("hook_title") + 6;
const HOOK = hookSubAt + clipFrames("hook_sub") + 18;

const FACT_TITLE_AT = 8;
const factTiming = script.facts.map((_, i) => {
  const textAt = FACT_TITLE_AT + clipFrames(`fact${i}_title`) + 6;
  const textFrames = clipFrames(`fact${i}_text`);
  return { textAt, textFrames, length: textAt + textFrames + 14 };
});
const factStarts = factTiming.map(
  (_, i) => HOOK + factTiming.slice(0, i).reduce((sum, t) => sum + t.length, 0),
);
const OUTRO_AT = HOOK + factTiming.reduce((sum, t) => sum + t.length, 0);

const outroCommentAt = clipFrames("outro_question") + 8;
const outroFollowAt = outroCommentAt + clipFrames("outro_comment") + 8;
const OUTRO = Math.max(
  outroFollowAt + clipFrames("outro_follow") + 45,
  MIN_TOTAL - OUTRO_AT,
);

const TOTAL = OUTRO_AT + OUTRO;

const FONT = "TheBold";

const fontFace = `@font-face { font-family: '${FONT}'; src: url('${staticFile(
  "theboldfont.ttf",
)}') format('truetype'); }`;

// TheBold has no glyph for these, so swap them for close equivalents.
const GLYPHS: Record<string, string> = {
  À: "A",
  Â: "A",
  Ç: "C",
  È: "E",
  Ê: "E",
  Î: "I",
  Ô: "O",
  Ù: "U",
  Û: "U",
  Œ: "OE",
  "«": '"',
  "»": '"',
  "…": "...",
};

const caps = (s: string) =>
  s
    .toUpperCase()
    .replace(/« /g, "«")
    .replace(/ »/g, "»")
    .replace(/[ÀÂÇÈÊÎÔÙÛŒ«»…]/g, (c) => GLYPHS[c]);

const textShadow =
  "0 6px 0 rgba(0,0,0,0.55), 0 0 30px rgba(0,0,0,0.6), 0 0 2px #000";

export const MyComposition = () => {
  return (
    <Composition
      id="MyComp"
      component={BrainVideo}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};

const Voice: React.FC<{ id: string; at: number }> = ({ id, at }) => (
  <Sequence from={at} durationInFrames={clipFrames(id) + 2}>
    <Html5Audio src={staticFile(`voiceover/${id}.wav`)} />
  </Sequence>
);

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const angle = frame * 0.4;
  const dots = Array.from({ length: 28 }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const x = (seed / 233280) * 1080;
    const speed = 0.6 + ((i * 37) % 10) / 6;
    const y = 1920 - ((frame * speed * 2 + i * 137) % 2100);
    const size = 6 + ((i * 13) % 18);
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
        }}
      />
    );
  });
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, #120428 0%, #2b0b5c 45%, #0b1d4d 100%)`,
      }}
    >
      {dots}
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const p = frame / TOTAL;
  return (
    <div
      style={{
        position: "absolute",
        top: 70,
        left: 60,
        right: 60,
        height: 16,
        borderRadius: 8,
        background: "rgba(255,255,255,0.18)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${p * 100}%`,
          height: "100%",
          background: "linear-gradient(90deg,#FFD23F,#FF6B9A)",
        }}
      />
    </div>
  );
};

// Pops words in one by one, spread across `over` frames so the captions
// follow the voice-over.
const PopWords: React.FC<{
  text: string;
  start: number;
  over: number;
  size: number;
  color?: string;
  highlight?: string;
}> = ({ text, start, over, size, color = "#fff", highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = caps(text).split(" ");
  const step = Math.min(10, Math.max(2, (over * 0.9) / words.length));
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: size * 0.28,
        rowGap: size * 0.1,
      }}
    >
      {words.map((w, i) => {
        const f = frame - start - Math.round(i * step);
        const s = spring({ frame: f, fps, config: { damping: 12, mass: 0.5 } });
        const isNum = /\d/.test(w);
        return (
          <span
            key={i}
            style={{
              fontSize: size,
              lineHeight: 1.15,
              color: isNum && highlight ? highlight : color,
              opacity: f < 0 ? 0 : 1,
              transform: `scale(${s}) translateY(${(1 - s) * 30}px)`,
              display: "inline-block",
              textShadow,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brain = spring({ frame, fps, config: { damping: 8 } });
  const shake =
    Math.sin(frame * 1.3) *
    interpolate(frame, [0, 20], [12, 0], {
      extrapolateRight: "clamp",
    });
  const pulse = 1 + Math.sin(frame / 5) * 0.04;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "0 90px 250px",
        gap: 40,
      }}
    >
      <Voice id="hook_title" at={4} />
      <Voice id="hook_sub" at={hookSubAt} />
      <div
        style={{
          fontSize: 260,
          transform: `scale(${brain * pulse}) rotate(${shake}deg)`,
        }}
      >
        🧠
      </div>
      <PopWords
        text={script.hook.title}
        start={4}
        over={clipFrames("hook_title")}
        size={110}
        highlight="#FFD23F"
      />
      <PopWords
        text={script.hook.sub}
        start={hookSubAt}
        over={clipFrames("hook_sub")}
        size={58}
        color="#FF6B9A"
      />
    </AbsoluteFill>
  );
};

const FactScene: React.FC<{ fact: Fact; index: number }> = ({
  fact,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { textAt, textFrames, length } = factTiming[index];
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const exit = interpolate(frame, [length - 10, length], [1, 0], {
    extrapolateLeft: "clamp",
    easing: Easing.in(Easing.ease),
  });
  const numScale = spring({ frame, fps, config: { damping: 7, mass: 0.6 } });
  const titleScale = spring({
    frame: frame - FACT_TITLE_AT,
    fps,
    config: { damping: 12 },
  });
  const emojiBob = Math.sin(frame / 8) * 12;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "160px 110px 380px",
        opacity: exit,
        transform: `translateX(${(1 - enter) * 300}px)`,
      }}
    >
      <Voice id={`fact${index}_title`} at={FACT_TITLE_AT} />
      <Voice id={`fact${index}_text`} at={textAt} />
      <div
        style={{
          fontSize: 230,
          color: fact.accent,
          transform: `scale(${numScale})`,
          textShadow,
          lineHeight: 1,
        }}
      >
        #{index + 1}
      </div>
      <div
        style={{
          fontSize: 170,
          marginTop: 10,
          transform: `translateY(${emojiBob}px)`,
        }}
      >
        {fact.emoji}
      </div>
      <div
        style={{
          marginTop: 30,
          padding: "14px 34px",
          borderRadius: 24,
          background: fact.accent,
          transform: `scale(${titleScale})`,
        }}
      >
        <span
          style={{
            fontSize: 70,
            color: "#120428",
            lineHeight: 1.1,
            textAlign: "center",
            display: "block",
          }}
        >
          {caps(fact.title)}
        </span>
      </div>
      <div style={{ marginTop: 50 }}>
        <PopWords
          text={fact.text}
          start={textAt}
          over={textFrames}
          size={64}
          highlight={fact.accent}
        />
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - outroCommentAt,
    fps,
    config: { damping: 9 },
  });
  const wiggle = Math.sin(frame / 4) * 4;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "0 100px 300px",
        gap: 50,
      }}
    >
      <Voice id="outro_question" at={0} />
      <Voice id="outro_comment" at={outroCommentAt} />
      <Voice id="outro_follow" at={outroFollowAt} />
      <PopWords
        text={script.outro.question}
        start={0}
        over={clipFrames("outro_question")}
        size={120}
        color="#FFD23F"
      />
      <div
        style={{
          transform: `scale(${pop}) rotate(${wiggle}deg)`,
          background: "#fff",
          borderRadius: 30,
          padding: "26px 44px",
          boxShadow: "0 12px 0 rgba(0,0,0,0.35)",
        }}
      >
        <span
          style={{
            fontSize: 66,
            color: "#120428",
            textAlign: "center",
            display: "block",
          }}
        >
          {caps(script.outro.comment)}
        </span>
      </div>
      <PopWords
        text={script.outro.follow}
        start={outroFollowAt}
        over={clipFrames("outro_follow")}
        size={72}
        color="#FF6B9A"
      />
    </AbsoluteFill>
  );
};

export const BrainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: `${FONT}, sans-serif` }}>
      <style>{fontFace}</style>
      <Background />
      <Sequence durationInFrames={HOOK}>
        <Hook />
      </Sequence>
      {script.facts.map((fact, i) => (
        <Sequence
          key={i}
          from={factStarts[i]}
          durationInFrames={factTiming[i].length}
        >
          <FactScene fact={fact} index={i} />
        </Sequence>
      ))}
      <Sequence from={OUTRO_AT} durationInFrames={OUTRO}>
        <Outro />
      </Sequence>
      <ProgressBar />
    </AbsoluteFill>
  );
};
