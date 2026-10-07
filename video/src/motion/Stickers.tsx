import { Img, staticFile } from "remotion";
import { IllustrationProps, caps, ramp } from "./anim";

// Motion design stickers laid over a photo, in the 960×660 illustration box.
// Each pops in when the explanation reaches `at` (0..1) and leaves at `until`.
export type StickerSpec = {
  text: string;
  at: number;
  until?: number;
  x: number;
  y: number;
  rotate?: number;
  size?: number;
  // "pill" for a label, "badge" for a big round icon.
  kind?: "pill" | "badge";
  color?: string;
  ink?: string;
  // Shows this photo (path in public/) as a polaroid, with `text` below it.
  image?: string;
};

const Sticker: React.FC<{ s: StickerSpec; p: number; frame: number }> = ({
  s,
  p,
  frame,
}) => {
  const inT = ramp(p, s.at, s.at + 0.06);
  const outT = s.until === undefined ? 0 : ramp(p, s.until, s.until + 0.05);
  const scale = inT * (1 - outT);
  if (scale <= 0) {
    return null;
  }
  // Overshoot on entry, then a gentle wobble.
  const pop = 1 + 0.25 * Math.sin(Math.PI * inT) * (1 - inT * 0.5);
  const wobble = Math.sin(frame / 7 + s.x) * 3;
  const size = s.size ?? 54;
  const badge = s.kind === "badge";
  const hasLetters = /[a-zà-ÿ]/i.test(s.text);
  const label = hasLetters ? caps(s.text) : s.text;
  if (s.image) {
    return (
      <div
        style={{
          position: "absolute",
          left: s.x,
          top: s.y,
          transform: `translate(-50%, -50%) scale(${scale * pop}) rotate(${(s.rotate ?? -4) + wobble}deg)`,
          background: "#FFF6E5",
          padding: "14px 14px 0",
          borderRadius: 10,
          boxShadow: "0 16px 30px rgba(0,0,0,0.45)",
          textAlign: "center",
        }}
      >
        <Img
          src={staticFile(s.image)}
          style={{
            width: 340,
            height: 300,
            objectFit: "cover",
            display: "block",
          }}
        />
        <div
          style={{ fontSize: size, color: "#14132B", padding: "10px 0 12px" }}
        >
          {label}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        left: s.x,
        top: s.y,
        transform: `translate(-50%, -50%) scale(${scale * pop}) rotate(${(s.rotate ?? -4) + wobble}deg)`,
        background: s.color ?? "#FFF6E5",
        color: s.ink ?? "#14132B",
        fontSize: size,
        lineHeight: 1,
        whiteSpace: "nowrap",
        padding: badge ? 0 : `${size * 0.28}px ${size * 0.45}px`,
        width: badge ? size * 2.2 : undefined,
        height: badge ? size * 2.2 : undefined,
        borderRadius: badge ? "50%" : size * 0.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 0 rgba(0,0,0,0.3), 0 16px 30px rgba(0,0,0,0.35)",
      }}
    >
      {label}
    </div>
  );
};

export const stickers = (list: StickerSpec[]): React.FC<IllustrationProps> => {
  const Stickers: React.FC<IllustrationProps> = ({ frame, p }) => (
    <div style={{ position: "relative", width: 960, height: 660 }}>
      {list.map((s, i) => (
        <Sticker key={i} s={s} p={p} frame={frame} />
      ))}
    </div>
  );
  return Stickers;
};
