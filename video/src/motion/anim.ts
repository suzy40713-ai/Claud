import { Easing, interpolate } from "remotion";

export const EASE = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

// 0 → 1 as `x` goes from `a` to `b`, clamped and eased.
export const ramp = (x: number, a: number, b: number, easing = EASE) =>
  interpolate(x, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// 0 → 1 → 0 over [a, b], for gestures that open then close (a yawn).
export const swell = (x: number, a: number, b: number) =>
  Math.sin(Math.PI * ramp(x, a, b, EASE_IN_OUT));

export const mix = (from: number, to: number, t: number) =>
  from + (to - from) * t;

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

export const caps = (s: string) =>
  s
    .toUpperCase()
    .replace(/« /g, "«")
    .replace(/ »/g, "»")
    .replace(/[ÀÂÇÈÊÎÔÙÛŒ«»…]/g, (c) => GLYPHS[c]);

export type Palette = { bg: string; ink: string; accent: string; pop: string };

// Props every illustration receives. `frame` is local to the scene and `p`
// is the progress of the explanation voice clip (0 at its start, 1 at its
// end, negative before), so visuals can land on the words they illustrate.
export type IllustrationProps = { frame: number; p: number; c: Palette };
