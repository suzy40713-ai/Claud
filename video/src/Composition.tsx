import {
  AbsoluteFill,
  Composition,
  Html5Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import mouthData from "./mouth.json";
import script from "./script.json";
import voiceover from "./voiceover.json";
import { Scientist } from "./Scientist";
import { EASE, Palette, caps, mix, ramp } from "./motion/anim";
import {
  EnergyArt,
  EyeArt,
  HookArt,
  MultitaskArt,
  NoseArt,
  OutroArt,
  SignsArt,
  TickleArt,
  YawnArt,
} from "./motion/Illustrations";

const FPS = 30;
// TikTok's Creator Rewards only pays for videos longer than one minute.
const MIN_TOTAL = Math.ceil(61.5 * FPS);

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
const outroClickAt =
  outroFollowAt + Math.round(clipFrames("outro_follow") * 0.6);
const OUTRO = Math.max(
  outroFollowAt + clipFrames("outro_follow") + 45,
  MIN_TOTAL - OUTRO_AT,
);

const TOTAL = OUTRO_AT + OUTRO;

const CLIPS: { id: string; at: number }[] = [
  { id: "hook_intro", at: hookIntroAt },
  { id: "hook_title", at: hookTitleAt },
  { id: "hook_sub", at: hookSubAt },
  ...script.facts.flatMap((_, i) => [
    { id: `fact${i}_title`, at: factStarts[i] + FACT_TITLE_AT },
    { id: `fact${i}_text`, at: factStarts[i] + factTiming[i].textAt },
  ]),
  { id: "outro_question", at: OUTRO_AT + outroQuestionAt },
  { id: "outro_comment", at: OUTRO_AT + outroCommentAt },
  { id: "outro_follow", at: OUTRO_AT + outroFollowAt },
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

const NAVY = "#14132B";
const CREAM = "#FFF6E5";

const HOOK_COLORS: Palette = {
  bg: NAVY,
  ink: CREAM,
  accent: "#FFD23F",
  pop: "#FF5E8A",
};
const FACT_COLORS: Palette[] = [
  { bg: "#FFD23F", ink: NAVY, accent: CREAM, pop: "#FF5E36" },
  { bg: "#FF8FAB", ink: NAVY, accent: "#FFD23F", pop: "#7B2FF7" },
  { bg: "#2EC4F1", ink: NAVY, accent: "#FFD23F", pop: "#FF5E8A" },
  { bg: "#8BE07A", ink: NAVY, accent: "#FFD23F", pop: "#FF5E8A" },
  { bg: "#FF9A3C", ink: NAVY, accent: "#7B2FF7", pop: "#FF5E8A" },
  { bg: "#B392F0", ink: NAVY, accent: "#FFD23F", pop: "#FF5E8A" },
  { bg: NAVY, ink: CREAM, accent: "#FFD23F", pop: "#FF5E8A" },
];
const OUTRO_COLORS: Palette = {
  bg: "#FF5E8A",
  ink: NAVY,
  accent: "#FFD23F",
  pop: CREAM,
};

const SCENES = [
  { at: 0, c: HOOK_COLORS },
  ...factStarts.map((at, i) => ({ at, c: FACT_COLORS[i] })),
  { at: OUTRO_AT, c: OUTRO_COLORS },
];

const sceneAt = (frame: number) => {
  let index = 0;
  SCENES.forEach((s, i) => {
    if (frame >= s.at) {
      index = i;
    }
  });
  return index;
};

const FACT_ARTS = [
  EnergyArt,
  NoseArt,
  EyeArt,
  TickleArt,
  MultitaskArt,
  SignsArt,
  YawnArt,
];

const FONT = "TheBold";

const fontFace = `@font-face { font-family: '${FONT}'; src: url('${staticFile(
  "theboldfont.ttf",
)}') format('truetype'); }`;

// Layout, in video pixels. The bottom ~350px and the right edge stay clear
// for TikTok's own caption and buttons.
const AVATAR = { left: 60, top: 190, size: 180 };
const HEADER = { left: 270, top: 180, width: 750, height: 220 };
const ART = { left: 60, top: 430 };
const CAPTION = { left: 70, top: 1110, width: 940 };
// Where the colour wipes open from (centre of the illustration).
const WIPE_ORIGIN = { x: 540, y: 760 };

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

// Each scene opens with a circular wipe in its colour, led by a ring in the
// accent colour, over the previous scene's background.
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const index = sceneAt(frame);
  const scene = SCENES[index];
  const prev = SCENES[Math.max(index - 1, 0)].c;
  const local = frame - scene.at;
  const r = index === 0 ? 2400 : mix(0, 2400, ramp(local, 0, 18));
  const ring = index === 0 ? 2400 : mix(0, 2400, ramp(local, 0, 14));
  const circle = (radius: number) =>
    `circle(${radius}px at ${WIPE_ORIGIN.x}px ${WIPE_ORIGIN.y}px)`;
  return (
    <AbsoluteFill style={{ background: prev.bg }}>
      <AbsoluteFill
        style={{ background: scene.c.accent, clipPath: circle(ring) }}
      />
      <AbsoluteFill style={{ background: scene.c.bg, clipPath: circle(r) }}>
        <Decor frame={frame} color={scene.c.ink} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Slow drifting outlines that keep the background alive.
const Decor: React.FC<{ frame: number; color: string }> = ({
  frame,
  color,
}) => (
  <svg
    width={1080}
    height={1920}
    style={{ position: "absolute", opacity: 0.1 }}
  >
    <circle
      cx={940 + Math.sin(frame / 40) * 30}
      cy={1650}
      r={200}
      fill="none"
      stroke={color}
      strokeWidth={14}
    />
    <circle
      cx={120}
      cy={1560 + Math.cos(frame / 35) * 30}
      r={70}
      fill={color}
    />
    <g transform={`translate(980 470) rotate(${frame})`}>
      <rect x={-50} y={-8} width={100} height={16} rx={8} fill={color} />
      <rect x={-8} y={-50} width={16} height={100} rx={8} fill={color} />
    </g>
    <g transform={`translate(70 1080) rotate(${-frame * 0.8})`}>
      <rect
        x={-30}
        y={-30}
        width={60}
        height={60}
        rx={10}
        fill="none"
        stroke={color}
        strokeWidth={10}
      />
    </g>
  </svg>
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
  const c = SCENES[sceneAt(frame)].c;
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 60,
        right: 60,
        height: 14,
        borderRadius: 7,
        background: "rgba(255,255,255,0.3)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${(frame / TOTAL) * 100}%`,
          height: "100%",
          background: c.ink,
        }}
      />
    </div>
  );
};

// The scientist's head in a round badge; her mouth follows the voice-over.
const Avatar: React.FC = () => {
  const frame = useCurrentFrame();
  const mouth = mouthAt(frame);
  const c = SCENES[sceneAt(frame)].c;
  const pop = ramp(frame, 0, 14);
  const scale = AVATAR.size / 280;
  return (
    <div
      style={{
        position: "absolute",
        left: AVATAR.left,
        top: AVATAR.top,
        width: AVATAR.size,
        transform: `scale(${pop})`,
      }}
    >
      <div
        style={{
          width: AVATAR.size,
          height: AVATAR.size,
          borderRadius: "50%",
          overflow: "hidden",
          position: "relative",
          background: "#BFE9FF",
          border: `8px solid ${CREAM}`,
          boxSizing: "border-box",
          boxShadow: `0 0 0 ${4 + mouth * 12}px ${c.accent}, 0 12px 30px rgba(0,0,0,0.3)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -70 * scale,
            top: -40 * scale,
          }}
        >
          <Scientist mouth={mouth} point={0} width={420 * scale} />
        </div>
      </div>
      <div
        style={{
          marginTop: -24,
          position: "relative",
          textAlign: "center",
        }}
      >
        <span
          style={{
            background: NAVY,
            color: CREAM,
            fontSize: 26,
            padding: "6px 14px",
            borderRadius: 14,
          }}
        >
          {caps(script.scientist)}
        </span>
      </div>
    </div>
  );
};

// Words slide up from behind a mask, spread across `over` frames so they
// follow the voice. Words with a digit get a highlight chip.
const MaskWords: React.FC<{
  text: string;
  start: number;
  over: number;
  size: number;
  c: Palette;
  color?: string;
  align?: "center" | "flex-start";
}> = ({ text, start, over, size, c, color = c.ink, align = "center" }) => {
  const frame = useCurrentFrame();
  const words = caps(text).split(" ");
  const step = Math.min(10, Math.max(2, (over * 0.9) / words.length));
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align,
        columnGap: size * 0.28,
        rowGap: size * 0.05,
      }}
    >
      {words.map((w, i) => {
        const t = ramp(frame - start - i * step, 0, 9, EASE);
        const chip = /\d/.test(w);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: size * 0.08,
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: size,
                lineHeight: 1.12,
                color: chip ? c.bg : color,
                background: chip ? c.ink : "transparent",
                borderRadius: chip ? size * 0.2 : 0,
                padding: chip ? `0 ${size * 0.18}px` : 0,
                transform: `translateY(${(1 - t) * 150}%)`,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

const Header: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: HEADER.left,
      top: HEADER.top,
      width: HEADER.width,
      height: HEADER.height,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "flex-start",
      gap: 12,
    }}
  >
    {children}
  </div>
);

const Art: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", left: ART.left, top: ART.top }}>
    {children}
  </div>
);

const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: CAPTION.left,
      top: CAPTION.top,
      width: CAPTION.width,
      display: "flex",
      flexDirection: "column",
      gap: 30,
    }}
  >
    {children}
  </div>
);

// Shrinks and fades a scene's content out over its last frames.
const SceneOut: React.FC<{
  length: number;
  children: React.ReactNode;
}> = ({ length, children }) => {
  const frame = useCurrentFrame();
  const out = ramp(frame, length - 9, length);
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - out,
        transform: `scale(${1 - out * 0.06})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const c = HOOK_COLORS;
  const stampAt = hookTitleAt + clipFrames("hook_title") * 0.75;
  return (
    <SceneOut length={HOOK}>
      <Header>
        <MaskWords
          text="Salut ! Moi c'est"
          start={hookIntroAt}
          over={10}
          size={44}
          c={c}
          color={c.accent}
          align="flex-start"
        />
        <MaskWords
          text={script.scientist}
          start={hookIntroAt + 12}
          over={6}
          size={104}
          c={c}
          align="flex-start"
        />
      </Header>
      <Art>
        <HookArt
          frame={frame}
          p={0}
          c={c}
          grow={ramp(frame, 0, 28)}
          stamp={(frame - stampAt) / 8}
        />
      </Art>
      <Caption>
        <MaskWords
          text={script.hook.title}
          start={hookTitleAt}
          over={clipFrames("hook_title")}
          size={92}
          c={c}
        />
        <MaskWords
          text={script.hook.sub}
          start={hookSubAt}
          over={clipFrames("hook_sub")}
          size={54}
          c={c}
          color={c.pop}
        />
      </Caption>
    </SceneOut>
  );
};

const FactScene: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const fact = script.facts[index];
  const c = FACT_COLORS[index];
  const { textAt, textFrames, length } = factTiming[index];
  const IllustrationArt = FACT_ARTS[index];
  const num = ramp(frame, 2, 12);
  return (
    <SceneOut length={length}>
      <Header>
        <div
          style={{
            transform: `translateX(${(1 - num) * -60}px)`,
            opacity: num,
            background: c.ink,
            color: c.bg,
            fontSize: 40,
            padding: "4px 18px",
            borderRadius: 14,
          }}
        >
          {`N°${index + 1} / 7`}
        </div>
        <MaskWords
          text={fact.title}
          start={FACT_TITLE_AT}
          over={clipFrames(`fact${index}_title`)}
          size={76}
          c={c}
          align="flex-start"
        />
      </Header>
      <Art>
        <IllustrationArt
          frame={frame}
          p={(frame - textAt) / textFrames}
          c={c}
        />
      </Art>
      <Caption>
        <MaskWords
          text={fact.text}
          start={textAt}
          over={textFrames}
          size={56}
          c={c}
        />
      </Caption>
    </SceneOut>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const c = OUTRO_COLORS;
  return (
    <AbsoluteFill>
      <Header>
        <MaskWords
          text={script.outro.question}
          start={outroQuestionAt}
          over={clipFrames("outro_question")}
          size={104}
          c={c}
          align="flex-start"
        />
      </Header>
      <Art>
        <OutroArt
          frame={frame}
          p={0}
          c={c}
          typed={ramp(frame, outroCommentAt + 4, outroCommentAt + 22, (x) => x)}
          click={(frame - outroClickAt) / 30}
        />
      </Art>
      <Caption>
        <MaskWords
          text={script.outro.comment}
          start={outroCommentAt}
          over={clipFrames("outro_comment")}
          size={50}
          c={c}
        />
        <MaskWords
          text={script.outro.follow}
          start={outroFollowAt}
          over={clipFrames("outro_follow")}
          size={50}
          c={c}
          color={CREAM}
        />
      </Caption>
    </AbsoluteFill>
  );
};

export const BrainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: `${FONT}, sans-serif` }}>
      <style>{fontFace}</style>
      <Backdrop />
      <Sequence durationInFrames={HOOK}>
        <Hook />
      </Sequence>
      {script.facts.map((_, i) => (
        <Sequence
          key={i}
          from={factStarts[i]}
          durationInFrames={factTiming[i].length}
        >
          <FactScene index={i} />
        </Sequence>
      ))}
      <Sequence from={OUTRO_AT} durationInFrames={OUTRO}>
        <Outro />
      </Sequence>
      <Avatar />
      <ProgressBar />
      <Voices />
    </AbsoluteFill>
  );
};
