import {
  AbsoluteFill,
  Html5Audio,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Look, Scientist } from "./Scientist";
import {
  EASE,
  IllustrationProps,
  Palette,
  caps,
  mix,
  ramp,
} from "./motion/anim";
import { OutroArt } from "./motion/Illustrations";

export const FPS = 30;
// TikTok's Creator Rewards only pays for videos longer than one minute.
const MIN_TOTAL = Math.ceil(61.5 * FPS);

export type Script = {
  scientist: string;
  // `intro`, when set, is shown big over the first voice clip instead of
  // the host introducing themself.
  hook: { title: string; sub: string; intro?: string };
  facts: { title: string; text: string }[];
  outro: { question: string; comment: string; follow: string; typed: string };
};

// A photo shown full screen behind a fact, from public/<file> (`w`×`h`
// pixels). `x`/`y` are the subject's position in percent: the photo is
// cropped to 9:16 and shifted to bring it into the illustration area.
// `fadeFrom` drains its colour from that point of the explanation (0..1).
export type Photo = {
  file: string;
  w: number;
  h: number;
  credit: string;
  x?: number;
  y?: number;
  fadeFrom?: number;
  // "contain" shows the whole photo across the width, over a blurred copy,
  // for wide shots that cropping to 9:16 would cut.
  fit?: "cover" | "contain";
};

// One video subject: its script, the voice-over generated for it by
// scripts/voiceover.py, its colours and its illustrations (or photos, with
// motion design stickers as `factArts` on top).
export type Topic = {
  id: string;
  script: Script;
  voiceover: Record<string, number>;
  mouth: Record<string, number[]>;
  colors: { hook: Palette; facts: Palette[]; outro: Palette };
  // `cue` is the frame where the hook's title lands, for its punchline.
  HookArt: React.FC<IllustrationProps & { cue: number }>;
  factArts: React.FC<IllustrationProps>[];
  // One per fact: a photo, or several to cut between; null keeps that
  // fact's illustration on a plain colour.
  photos?: (Photo | Photo[] | null)[];
  look?: Look;
  // false hides the scientist avatar (voice-over only).
  host?: boolean;
  // Frames between cuts on photo scenes. Each cut moves to the next photo
  // or punches in on the same one, and facts change with a hard cut
  // instead of a colour wipe.
  cutEvery?: number;
};

export const NAVY = "#14132B";
export const CREAM = "#FFF6E5";

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
// Height the photo subject is moved to (middle of the illustration area).
const PHOTO_FOCUS_Y = 760;
// Where the colour wipes open from (centre of the illustration).
const WIPE_ORIGIN = { x: 540, y: 760 };

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

// Full-bleed photo with a slow push-in, darkened top and bottom so the
// header and the captions stay readable.
const PhotoLayer: React.FC<{
  photo: Photo;
  zoom: number;
  saturation?: number;
  dim?: number;
}> = ({ photo, zoom, saturation = 1, dim = 0 }) => {
  const contain = photo.fit === "contain";
  const scale =
    (contain ? 1080 / photo.w : Math.max(1080 / photo.w, 1920 / photo.h)) *
    zoom;
  const width = photo.w * scale;
  const height = photo.h * scale;
  const clamp = (v: number, min: number) => Math.min(0, Math.max(min, v));
  const left = contain
    ? 540 - ((photo.x ?? 50) / 100) * width
    : clamp(540 - ((photo.x ?? 50) / 100) * width, 1080 - width);
  const top = contain
    ? PHOTO_FOCUS_Y - ((photo.y ?? 50) / 100) * height
    : clamp(PHOTO_FOCUS_Y - ((photo.y ?? 50) / 100) * height, 1920 - height);
  return (
    <AbsoluteFill style={{ background: NAVY }}>
      {contain ? (
        <Img
          src={staticFile(photo.file)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: `blur(40px) brightness(0.6) saturate(${saturation})`,
            transform: "scale(1.2)",
          }}
        />
      ) : null}
      <Img
        src={staticFile(photo.file)}
        style={{
          position: "absolute",
          left,
          top,
          width,
          height,
          // Tailwind's preflight caps images at the container width.
          maxWidth: "none",
          filter: `saturate(${saturation})`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(10,10,25,0.75) 0%, rgba(10,10,25,0.35) 14%, rgba(10,10,25,0) 22%, rgba(10,10,25,0) 50%, rgba(10,10,25,0.6) 59%, rgba(10,10,25,0.82) 72%, rgba(10,10,25,0.88) 100%)`,
        }}
      />
      {dim > 0 ? (
        <AbsoluteFill style={{ background: `rgba(10,10,25,${dim})` }} />
      ) : null}
    </AbsoluteFill>
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
  shadow?: boolean;
}> = ({
  text,
  start,
  over,
  size,
  c,
  color = c.ink,
  align = "center",
  shadow = false,
}) => {
  const frame = useCurrentFrame();
  const words = caps(text).split(" ");
  const step = Math.min(10, Math.max(2, (over * 0.9) / words.length));
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align,
        width: "100%",
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
                textShadow:
                  shadow && !chip ? "0 3px 14px rgba(0,0,0,0.7)" : "none",
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

// `wide` takes the avatar's place too, when there is no host.
const Header: React.FC<{ children: React.ReactNode; wide?: boolean }> = ({
  children,
  wide = false,
}) => (
  <div
    style={{
      position: "absolute",
      left: wide ? CAPTION.left : HEADER.left,
      top: HEADER.top,
      width: wide ? CAPTION.width : HEADER.width,
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

// Builds the motion design video for one topic. The timeline is derived
// from the voice-over lengths, so every scene lasts as long as its narration.
export const createExplainer = (topic: Topic) => {
  const { script, voiceover, mouth, colors } = topic;

  const clipFrames = (id: string) => Math.ceil(voiceover[id] * FPS);

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
    (_, i) =>
      HOOK + factTiming.slice(0, i).reduce((sum, t) => sum + t.length, 0),
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
      const values = mouth[clip.id];
      const f = frame - clip.at;
      if (f >= 0 && f < values.length) {
        return values[f];
      }
    }
    return 0;
  };

  const SCENES = [
    { at: 0, c: colors.hook },
    ...factStarts.map((at, i) => ({ at, c: colors.facts[i] })),
    { at: OUTRO_AT, c: colors.outro },
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

  const cutEvery = topic.cutEvery;
  const host = topic.host !== false;

  const shotsFor = (fact: number): Photo[] => {
    const ph = topic.photos?.[fact];
    return ph ? (Array.isArray(ph) ? ph : [ph]) : [];
  };

  // The photo on screen `local` frames into a fact, and how long ago the
  // last cut was. Every pass through the photos alternates wide and punched-in.
  const shotAt = (fact: number, local: number) => {
    const shots = shotsFor(fact);
    if (!cutEvery) {
      return { photo: shots[0], since: local, punch: false, cut: 0 };
    }
    const cut = Math.floor(local / cutEvery);
    return {
      photo: shots[cut % shots.length],
      since: local - cut * cutEvery,
      punch: Math.floor(cut / shots.length) % 2 === 1,
      cut,
    };
  };

  const montage = (topic.photos ?? []).flatMap((ph) =>
    ph ? (Array.isArray(ph) ? ph : [ph]) : [],
  );

  // Each scene opens with a circular wipe in its colour, led by a ring in
  // the accent colour, over the previous scene's background (or with a
  // hard cut and a flash, when cutting between photos).
  const Backdrop: React.FC = () => {
    const frame = useCurrentFrame();
    const index = sceneAt(frame);
    const scene = SCENES[index];
    const prev = SCENES[Math.max(index - 1, 0)].c;
    const local = frame - scene.at;
    const hard = index === 0 || Boolean(cutEvery);
    const r = hard ? 2400 : mix(0, 2400, ramp(local, 0, 18));
    const ring = hard ? 2400 : mix(0, 2400, ramp(local, 0, 14));
    const circle = (radius: number) =>
      `circle(${radius}px at ${WIPE_ORIGIN.x}px ${WIPE_ORIGIN.y}px)`;
    const fact = index - 1;
    let layer = <Decor frame={frame} color={scene.c.ink} />;
    let flash = 0;
    if (montage.length > 0 && index === 0) {
      // Hook: rapid montage of every photo.
      const cut = 9;
      layer = (
        <PhotoLayer
          photo={montage[Math.floor(local / cut) % montage.length]}
          zoom={mix(1.3, 1.15, (local % cut) / cut)}
          dim={0.35}
        />
      );
    } else if (fact >= 0 && shotsFor(fact).length > 0) {
      const { textAt, textFrames, length } = factTiming[fact];
      const p = (local - textAt) / textFrames;
      const { photo, since, punch } = shotAt(fact, local);
      // On a cut: a short pop of extra zoom and a light flash.
      const pop = cutEvery ? 0.07 * (1 - ramp(since, 0, 6)) : 0;
      flash = cutEvery ? 0.35 * (1 - ramp(since, 0, 4)) : 0;
      const zoom = cutEvery
        ? (punch ? 1.5 : 1.12) * (1 + 0.06 * (since / cutEvery)) + pop
        : mix(1.12, 1.28, local / length);
      layer = (
        <PhotoLayer
          photo={photo}
          zoom={zoom}
          saturation={
            photo.fadeFrom === undefined
              ? 1
              : 1 - 0.6 * ramp(p, photo.fadeFrom, photo.fadeFrom + 0.12)
          }
        />
      );
    }
    return (
      <AbsoluteFill style={{ background: prev.bg }}>
        <AbsoluteFill
          style={{ background: scene.c.accent, clipPath: circle(ring) }}
        />
        <AbsoluteFill style={{ background: scene.c.bg, clipPath: circle(r) }}>
          {layer}
        </AbsoluteFill>
        {flash > 0 ? (
          <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />
        ) : null}
      </AbsoluteFill>
    );
  };

  const Voices: React.FC = () => (
    <>
      {CLIPS.map((clip) => (
        <Sequence
          key={clip.id}
          from={clip.at}
          durationInFrames={clipFrames(clip.id) + 2}
        >
          <Html5Audio
            src={staticFile(`voiceover/${topic.id}/${clip.id}.wav`)}
          />
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
    const open = mouthAt(frame);
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
            boxShadow: `0 0 0 ${4 + open * 12}px ${c.accent}, 0 12px 30px rgba(0,0,0,0.3)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -70 * scale,
              top: -40 * scale,
            }}
          >
            <Scientist
              mouth={open}
              point={0}
              width={420 * scale}
              look={topic.look}
            />
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

  const Hook: React.FC = () => {
    const frame = useCurrentFrame();
    const c = colors.hook;
    const HookArt = topic.HookArt;
    // The intro question lands big mid-screen, then moves up as the title
    // starts.
    const introPop = ramp(frame, hookIntroAt, hookIntroAt + 8);
    const introUp = ramp(frame, hookTitleAt - 4, hookTitleAt + 8);
    return (
      <SceneOut length={HOOK}>
        {script.hook.intro ? (
          <div
            style={{
              position: "absolute",
              left: CAPTION.left,
              width: CAPTION.width,
              top: mix(640, 190, introUp),
              transform: `scale(${mix(1.12, 1, introUp) * (0.6 + 0.4 * introPop)})`,
              transformOrigin: "50% 0%",
            }}
          >
            <MaskWords
              text={script.hook.intro}
              start={hookIntroAt}
              over={clipFrames("hook_intro")}
              size={110}
              c={c}
              color={c.accent}
              shadow
            />
          </div>
        ) : (
          <Header wide={!host}>
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
        )}
        <Art>
          <HookArt
            frame={frame}
            p={0}
            c={c}
            cue={hookTitleAt + clipFrames("hook_title") * 0.75}
          />
        </Art>
        <Caption>
          <MaskWords
            text={script.hook.title}
            start={hookTitleAt}
            over={clipFrames("hook_title")}
            size={92}
            c={c}
            shadow={montage.length > 0}
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
    const c = colors.facts[index];
    const { textAt, textFrames, length } = factTiming[index];
    const IllustrationArt = topic.factArts[index];
    const photo =
      shotsFor(index).length > 0 ? shotAt(index, frame).photo : undefined;
    const num = ramp(frame, 2, 12);
    return (
      <SceneOut length={cutEvery ? length + 20 : length}>
        <Header wide={!host}>
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
            {`N°${index + 1} / ${script.facts.length}`}
          </div>
          <MaskWords
            text={fact.title}
            start={FACT_TITLE_AT}
            over={clipFrames(`fact${index}_title`)}
            size={76}
            c={c}
            align="flex-start"
            shadow={Boolean(photo)}
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
            shadow={Boolean(photo)}
          />
        </Caption>
        {photo ? (
          <div
            style={{
              position: "absolute",
              right: 150,
              top: 1060,
              fontFamily: "sans-serif",
              fontSize: 22,
              color: CREAM,
              opacity: 0.8,
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            }}
          >
            {`Photo : ${photo.credit}`}
          </div>
        ) : null}
      </SceneOut>
    );
  };

  const Outro: React.FC = () => {
    const frame = useCurrentFrame();
    const c = colors.outro;
    return (
      <AbsoluteFill>
        <Header wide={!host}>
          <MaskWords
            text={script.outro.question}
            start={outroQuestionAt}
            over={clipFrames("outro_question")}
            size={script.outro.question.length > 18 ? 80 : 104}
            c={c}
            align="flex-start"
          />
        </Header>
        <Art>
          <OutroArt
            frame={frame}
            p={0}
            c={c}
            typedWord={script.outro.typed}
            typed={ramp(
              frame,
              outroCommentAt + 4,
              outroCommentAt + 22,
              (x) => x,
            )}
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

  const Video: React.FC = () => {
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
        {host ? <Avatar /> : null}
        <ProgressBar />
        <Voices />
      </AbsoluteFill>
    );
  };

  return { Video, durationInFrames: TOTAL };
};
