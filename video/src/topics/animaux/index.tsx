import { CREAM, NAVY, Photo, Topic } from "../../Explainer";
import { SuperStampArt } from "../../motion/Animals";
import { stickers } from "../../motion/Stickers";
import mouth from "./mouth.json";
import script from "./script.json";
import voiceover from "./voiceover.json";

const RED = "#E63946";
const BLUE = "#2E6BFF";

// Photos from iNaturalist open data, licensed CC0 or CC BY (commercial use
// allowed, with credit); the credits are shown on screen and listed in
// PUBLIER-TIKTOK.md for the video description.
const photo = (
  name: string,
  w: number,
  h: number,
  credit: string,
  x: number,
  y: number,
  extra: Partial<Photo> = {},
): Photo => ({
  file: `photos/animaux/${name}.jpg`,
  w,
  h,
  credit,
  x,
  y,
  ...extra,
});

const photoScene = (accent: string) => ({
  bg: NAVY,
  ink: CREAM,
  accent,
  pop: CREAM,
});

// « 7 animaux avec de vrais super-pouvoirs » : opens on « Le savais-tu ? »,
// real photos cut every second, male voice-over without an on-screen host.
export const animaux: Topic = {
  id: "animaux",
  script,
  voiceover,
  mouth,
  look: "man",
  colors: {
    hook: { bg: NAVY, ink: CREAM, accent: "#FFD23F", pop: "#FF5E8A" },
    facts: [
      photoScene("#7B2FF7"),
      photoScene("#7FD4F5"),
      photoScene("#2EC4F1"),
      photoScene("#6BCB77"),
      photoScene("#FF5E8A"),
      photoScene("#FFD23F"),
      photoScene("#C08CFF"),
    ],
    outro: { bg: "#FF5E8A", ink: NAVY, accent: "#FFD23F", pop: CREAM },
  },
  photos: [
    [
      photo("poulpe", 1615, 1920, "desertnaturalist (CC BY)", 58, 48),
      photo("poulpe-2", 1648, 1920, "Erin McKittrick (CC BY)", 45, 32),
    ],
    [
      photo("loutres", 1920, 1920, "Daniel Levitis (CC BY)", 52, 42),
      photo("loutre-2", 1440, 1920, "Caleb Krueger (CC BY)", 55, 40),
      photo("loutres-3", 1440, 1920, "marmottled (CC BY)", 40, 62),
    ],
    [
      photo("tardigrade", 1368, 1368, "Robert Martin (CC BY)", 55, 52, {
        fit: "contain",
      }),
      photo("tardigrade-2", 1779, 1920, "Zihao Wang (CC BY)", 50, 50, {
        fit: "contain",
      }),
      photo("tardigrade-3", 1179, 1839, "Mark Stluka (CC BY)", 50, 45),
    ],
    [
      photo("crocodile", 1440, 1920, "Christine Loew (CC BY)", 55, 38),
      photo("crocodile-2", 1440, 1920, "Yves Bas (CC BY)", 25, 66),
      photo("crocodile-3", 1440, 1920, "Louis Imbeau (CC BY)", 55, 60),
      photo("crocodile-4", 1440, 1920, "M Rutherford (CC BY)", 45, 50),
    ],
    [
      photo("flamant", 1492, 1920, "Jean-Paul Boerekamps (CC0)", 46, 38, {
        fadeFrom: 0.8,
      }),
      photo("flamant-2", 1537, 1920, "Daniel Benefiel (CC BY)", 50, 62, {
        fadeFrom: 0.8,
      }),
      photo("flamant-3", 1615, 1920, "Paul Hoekman (CC BY)", 55, 40, {
        fadeFrom: 0.8,
      }),
    ],
    [
      photo("wombats", 1440, 1920, "Kai Squires (CC BY)", 30, 45),
      photo("wombat-crottes", 1920, 1750, "Jesse Rorabaugh (CC0)", 55, 45),
      photo("wombat-2", 1000, 1334, "Tony Ladson (CC BY)", 40, 60),
      photo("wombat-3", 1277, 1920, "Andrew Thornhill (CC BY)", 55, 55),
    ],
    [
      photo("turritopsis", 1920, 1440, "Luca Davenport-Thomas (CC BY)", 48, 50),
      photo("turritopsis-2", 1920, 1551, "Lisa Bennett (CC BY)", 50, 55),
      photo("turritopsis-3", 1600, 1200, "Jacqui Geux (CC BY)", 45, 50),
    ],
  ],
  host: false,
  cutEvery: 30,
  HookArt: SuperStampArt,
  factArts: [
    stickers([
      { text: "❤️", at: 0.02, x: 150, y: 90, kind: "badge", size: 56 },
      { text: "❤️", at: 0.12, x: 300, y: 70, kind: "badge", size: 56 },
      { text: "❤️", at: 0.32, x: 450, y: 90, kind: "badge", size: 56 },
      {
        text: "Sang bleu 💧",
        at: 0.66,
        x: 260,
        y: 585,
        color: BLUE,
        ink: CREAM,
      },
      {
        text: "Cu",
        at: 0.8,
        x: 820,
        y: 110,
        kind: "badge",
        size: 70,
        color: BLUE,
        ink: CREAM,
      },
    ]),
    stickers([
      { text: "Zzz", at: 0, x: 800, y: 80, rotate: 8 },
      { text: "🤝", at: 0.2, x: 480, y: 110, kind: "badge", size: 64 },
      { text: "❤️", at: 0.42, x: 190, y: 110, kind: "badge", size: 56 },
    ]),
    stickers([
      { text: "🔬 < 1 mm", at: 0.05, until: 0.45, x: 260, y: 585 },
      { text: "🚀 2007", at: 0.45, x: 760, y: 110, color: "#FFD23F" },
      {
        text: "Vivant ✓",
        at: 0.82,
        x: 300,
        y: 585,
        color: "#6BCB77",
        ink: NAVY,
      },
    ]),
    stickers([
      { text: "👅 Membrane", at: 0.2, until: 0.75, x: 300, y: 585 },
      {
        text: "✕",
        at: 0.78,
        x: 810,
        y: 110,
        kind: "badge",
        size: 80,
        color: RED,
        ink: CREAM,
      },
      { text: "Impossible", at: 0.82, x: 300, y: 585, color: RED, ink: CREAM },
    ]),
    stickers([
      { text: "🦐", at: 0.1, x: 820, y: 120, kind: "badge", size: 64 },
      { text: "🌿", at: 0.2, x: 140, y: 150, kind: "badge", size: 64 },
      {
        text: "= Rose",
        at: 0.45,
        until: 0.8,
        x: 760,
        y: 585,
        color: "#FF5E8A",
        ink: CREAM,
      },
      { text: "Sans : il pâlit", at: 0.84, x: 320, y: 585 },
    ]),
    stickers([
      { text: "🟫 Cubes", at: 0.35, x: 220, y: 585 },
      { text: "🚩 Territoire", at: 0.8, x: 250, y: 90, color: RED, ink: CREAM },
    ]),
    stickers([
      { text: "Bébé 🔁 Adulte", at: 0.45, x: 480, y: 590 },
      {
        text: "∞",
        at: 0.88,
        x: 810,
        y: 110,
        kind: "badge",
        size: 90,
        color: "#C08CFF",
        ink: NAVY,
      },
    ]),
  ],
};
