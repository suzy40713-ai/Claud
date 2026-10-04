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
import mouthData from "./mouth.json";
import script from "./script.json";
import voiceover from "./voiceover.json";
import { Scientist } from "./Scientist";

const FPS = 30;
// TikTok's Creator Rewards only pays for videos longer than one minute.
const MIN_TOTAL = Math.ceil(61.5 * FPS);

type Fact = (typeof script.facts)[number];

const clipFrames = (id: string) =>
  Math.ceil((voiceover as Record<string, number>)[id] * FPS);

// Timeline derived from the voice-over lengths (see scripts/voiceover.py).
const hookIntroAt = 6;
const hookTitleAt = hookIntroAt + clipFrames("hook_intro") + 6;
const hookSubAt = hookTitleAt + clipFrames("hook_title") + 6;
const HOOK = hookSubAt + clipFrames("hook_sub") + 16;

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

const outroQuestionAt = 6;
const outroCommentAt = outroQuestionAt + clipFrames("outro_question") + 8;
const outroFollowAt = outroCommentAt + clipFrames("outro_comment") + 8;
const OUTRO = Math.max(
  outroFollowAt + clipFrames("outro_follow") + 45,
  MIN_TOTAL - OUTRO_AT,
);

const TOTAL = OUTRO_AT + OUTRO;

// Every voice clip on the global timeline. `point` makes the scientist
// point at the board while it plays.
const CLIPS: { id: string; at: number; point: boolean }[] = [
  { id: "hook_intro", at: hookIntroAt, point: false },
  { id: "hook_title", at: hookTitleAt, point: true },
  { id: "hook_sub", at: hookSubAt, point: false },
  ...script.facts.flatMap((_, i) => [
    { id: `fact${i}_title`, at: factStarts[i] + FACT_TITLE_AT, point: false },
    {
      id: `fact${i}_text`,
      at: factStarts[i] + factTiming[i].textAt,
      point: true,
    },
  ]),
  { id: "outro_question", at: OUTRO_AT + outroQuestionAt, point: false },
  { id: "outro_comment", at: OUTRO_AT + outroCommentAt, point: true },
  { id: "outro_follow", at: OUTRO_AT + outroFollowAt, point: false },
];

const mouthAt = (frame: number) => {
  for (const clip of CLIPS) {
    const values = (mouthData as Record<string, number[]>)[clip.id];
    const f = frame - clip.at;
    if (f >= 0 && f < values.length) {
      return values[f];
    }
  }
  return 0;
};

const pointAt = (frame: number) =>
  Math.max(
    0,
    ...CLIPS.filter((c) => c.point).map((c) => {
      const end = c.at + clipFrames(c.id);
      const up = interpolate(frame, [c.at - 4, c.at + 6], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const down = interpolate(frame, [end, end + 10], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return Math.min(up, down);
    }),
  );

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

const CHALK = "#F4F1E8";
const chalkShadow = "0 0 8px rgba(255,255,255,0.35), 0 3px 0 rgba(0,0,0,0.35)";
const textShadow =
  "0 6px 0 rgba(0,0,0,0.55), 0 0 30px rgba(0,0,0,0.6), 0 0 2px #000";

// Chalkboard area, in video pixels.
const BOARD = { left: 40, top: 120, width: 1000, height: 960 };
const SCIENTIST = { left: 20, top: 1075, width: 500 };
const PROP = { left: 570, top: 1150, width: 370 };

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

const Classroom: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(180deg, #2E2447 0%, #241B3A 60%, #1A1430 100%)",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: BOARD.left,
        top: BOARD.top,
        width: BOARD.width,
        height: BOARD.height,
        boxSizing: "border-box",
        border: "20px solid #7A4A22",
        borderRadius: 18,
        background:
          "radial-gradient(ellipse at 40% 35%, #2C5E45 0%, #214A36 55%, #183828 100%)",
        boxShadow:
          "0 18px 40px rgba(0,0,0,0.45), inset 0 0 60px rgba(0,0,0,0.35)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: BOARD.left + 40,
        top: BOARD.top + BOARD.height - 6,
        width: BOARD.width - 80,
        height: 22,
        borderRadius: 6,
        background: "#5E3818",
      }}
    />
  </AbsoluteFill>
);

const OnBoard: React.FC<{ children: React.ReactNode; opacity?: number }> = ({
  children,
  opacity = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: BOARD.left + 20,
      top: BOARD.top + 20,
      width: BOARD.width - 40,
      height: BOARD.height - 40,
      boxSizing: "border-box",
      padding: "40px 60px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity,
    }}
  >
    {children}
  </div>
);

const Prop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: PROP.left,
      top: PROP.top,
      width: PROP.width,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    {children}
  </div>
);

const Voices: React.FC = () => (
  <>
    {CLIPS.map((clip) => (
      <Sequence
        key={clip.id}
        from={clip.at}
        durationInFrames={clipFrames(clip.id) + 2}
      >
        <Html5Audio src={staticFile(`voiceover/${clip.id}.wav`)} />
      </Sequence>
    ))}
  </>
);

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const p = frame / TOTAL;
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
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
          background: "linear-gradient(90deg,#FFE066,#FF9EBB)",
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
  shadow?: string;
}> = ({
  text,
  start,
  over,
  size,
  color = CHALK,
  highlight,
  shadow = chalkShadow,
}) => {
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
              textShadow: shadow,
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
  const brain = spring({
    frame: frame - hookTitleAt,
    fps,
    config: { damping: 8 },
  });
  const tag = spring({
    frame: frame - hookIntroAt,
    fps,
    config: { damping: 10 },
  });
  const pulse = 1 + Math.sin(frame / 5) * 0.04;
  return (
    <AbsoluteFill>
      <OnBoard>
        <div style={{ fontSize: 200, transform: `scale(${brain * pulse})` }}>
          🧠
        </div>
        <div style={{ marginTop: 30 }}>
          <PopWords
            text={script.hook.title}
            start={hookTitleAt}
            over={clipFrames("hook_title")}
            size={100}
            highlight="#FFE066"
          />
        </div>
        <div style={{ marginTop: 40 }}>
          <PopWords
            text={script.hook.sub}
            start={hookSubAt}
            over={clipFrames("hook_sub")}
            size={56}
            color="#FF9EBB"
          />
        </div>
      </OnBoard>
      <Prop>
        <div
          style={{
            marginTop: 180,
            transform: `scale(${tag}) rotate(-4deg)`,
            background: "#fff",
            borderRadius: 24,
            padding: "18px 30px",
            boxShadow: "0 10px 0 rgba(0,0,0,0.35)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 60, color: "#2E2447" }}>
            {caps(script.scientist)} 🧪
          </div>
          <div style={{ fontSize: 34, color: "#7A4A22" }}>
            {caps("Cerveau & neurosciences")}
          </div>
        </div>
      </Prop>
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
  const propPop = spring({ frame: frame - 4, fps, config: { damping: 9 } });
  const emojiBob = Math.sin(frame / 8) * 12;
  return (
    <AbsoluteFill>
      <OnBoard opacity={exit}>
        <div
          style={{
            fontSize: 170,
            color: fact.accent,
            transform: `scale(${numScale})`,
            textShadow: chalkShadow,
            lineHeight: 1,
          }}
        >
          #{index + 1}
        </div>
        <div
          style={{
            marginTop: 26,
            padding: "12px 30px",
            borderRadius: 20,
            border: `5px solid ${fact.accent}`,
            transform: `scale(${titleScale}) rotate(-1.5deg)`,
          }}
        >
          <span
            style={{
              fontSize: 66,
              color: fact.accent,
              lineHeight: 1.1,
              textAlign: "center",
              display: "block",
              textShadow: chalkShadow,
            }}
          >
            {caps(fact.title)}
          </span>
        </div>
        <div style={{ marginTop: 44 }}>
          <PopWords
            text={fact.text}
            start={textAt}
            over={textFrames}
            size={56}
            highlight={fact.accent}
          />
        </div>
      </OnBoard>
      <Prop>
        <div
          style={{
            marginTop: 60,
            fontSize: 190,
            opacity: exit,
            transform: `scale(${propPop}) translateY(${emojiBob}px)`,
          }}
        >
          {fact.emoji}
        </div>
      </Prop>
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
    <AbsoluteFill>
      <OnBoard>
        <PopWords
          text={script.outro.question}
          start={outroQuestionAt}
          over={clipFrames("outro_question")}
          size={120}
          color="#FFE066"
        />
        <div
          style={{
            marginTop: 50,
            transform: `scale(${pop}) rotate(${wiggle}deg)`,
            background: "#fff",
            borderRadius: 30,
            padding: "26px 44px",
            boxShadow: "0 12px 0 rgba(0,0,0,0.35)",
          }}
        >
          <span
            style={{
              fontSize: 64,
              color: "#2E2447",
              textAlign: "center",
              display: "block",
            }}
          >
            {caps(script.outro.comment)}
          </span>
        </div>
        <div style={{ marginTop: 50 }}>
          <PopWords
            text={script.outro.follow}
            start={outroFollowAt}
            over={clipFrames("outro_follow")}
            size={70}
            color="#FF9EBB"
            shadow={textShadow}
          />
        </div>
      </OnBoard>
      <Prop>
        <div style={{ marginTop: 60, fontSize: 190 }}>🥱</div>
      </Prop>
    </AbsoluteFill>
  );
};

const Teacher: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: SCIENTIST.left,
        top: SCIENTIST.top,
      }}
    >
      <Scientist
        mouth={mouthAt(frame)}
        point={pointAt(frame)}
        width={SCIENTIST.width}
      />
    </div>
  );
};

export const BrainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: `${FONT}, sans-serif` }}>
      <style>{fontFace}</style>
      <Classroom />
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
      <Teacher />
      <ProgressBar />
      <Voices />
    </AbsoluteFill>
  );
};
