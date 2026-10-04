import {
  AbsoluteFill,
  Composition,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FPS = 30;
const HOOK = 120;
const FACT = 225;
const OUTRO = 165;

type Fact = { emoji: string; title: string; text: string; accent: string };

const FACTS: Fact[] = [
  {
    emoji: "⚡",
    title: "Il dévore ton énergie",
    text: "Ton cerveau pèse 2 % de ton corps… mais consomme environ 20 % de ton énergie.",
    accent: "#FFD23F",
  },
  {
    emoji: "👃",
    title: "Il efface ton nez",
    text: "Ton nez est dans ton champ de vision en permanence. Ton cerveau le gomme. Maintenant tu le vois.",
    accent: "#FF6B9A",
  },
  {
    emoji: "👁️",
    title: "Tu as un trou dans chaque œil",
    text: "Chaque œil a un point aveugle. Ton cerveau invente l'image manquante sans te le dire.",
    accent: "#4DD8FF",
  },
  {
    emoji: "🤭",
    title: "Impossible de te chatouiller",
    text: "Ton cerveau prédit tes propres gestes et coupe la sensation avant qu'elle arrive.",
    accent: "#9DFF6B",
  },
  {
    emoji: "🔁",
    title: "Le multitâche n'existe pas",
    text: "Il ne fait pas 2 choses à la fois : il saute de l'une à l'autre très vite… et perd du temps.",
    accent: "#FF9F43",
  },
  {
    emoji: "🔍",
    title: "Il te fait voir des « signes »",
    text: "Tu découvres un mot et tu le vois partout ? C'est l'illusion de fréquence, pas le destin.",
    accent: "#C08CFF",
  },
  {
    emoji: "🥱",
    title: "Il copie les baillements",
    text: "Le baillement est contagieux. Même lire le mot « bailler » peut suffire… Tu sens que ça monte ?",
    accent: "#FFD23F",
  },
];

const TOTAL = HOOK + FACTS.length * FACT + OUTRO;

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

const PopWords: React.FC<{
  text: string;
  start: number;
  perWord: number;
  size: number;
  color?: string;
  highlight?: string;
}> = ({ text, start, perWord, size, color = "#fff", highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = caps(text).split(" ");
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
        const f = frame - start - i * perWord;
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
      <div
        style={{
          fontSize: 260,
          transform: `scale(${brain * pulse}) rotate(${shake}deg)`,
        }}
      >
        🧠
      </div>
      <PopWords
        text="7 choses que ton cerveau te CACHE"
        start={4}
        perWord={4}
        size={110}
        highlight="#FFD23F"
      />
      <div style={{ opacity: interpolate(frame, [50, 60], [0, 1]) }}>
        <PopWords
          text="(le n°7 va marcher sur toi)"
          start={50}
          perWord={3}
          size={58}
          color="#FF6B9A"
        />
      </div>
    </AbsoluteFill>
  );
};

const FactScene: React.FC<{ fact: Fact; index: number }> = ({
  fact,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const exit = interpolate(frame, [FACT - 10, FACT], [1, 0], {
    extrapolateLeft: "clamp",
    easing: Easing.in(Easing.ease),
  });
  const numScale = spring({ frame, fps, config: { damping: 7, mass: 0.6 } });
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
          transform: `scale(${spring({ frame: frame - 8, fps, config: { damping: 12 } })})`,
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
          start={24}
          perWord={4}
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
  const pop = spring({ frame, fps, config: { damping: 9 } });
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
      <PopWords
        text="Tu as baillé ?"
        start={0}
        perWord={5}
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
          {caps("Écris « BAILLÉ » en commentaire 👇")}
        </span>
      </div>
      <PopWords
        text="Abonne-toi pour la partie 2 🧠"
        start={45}
        perWord={5}
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
      {FACTS.map((fact, i) => (
        <Sequence key={i} from={HOOK + i * FACT} durationInFrames={FACT}>
          <FactScene fact={fact} index={i} />
        </Sequence>
      ))}
      <Sequence from={HOOK + FACTS.length * FACT} durationInFrames={OUTRO}>
        <Outro />
      </Sequence>
      <ProgressBar />
    </AbsoluteFill>
  );
};
