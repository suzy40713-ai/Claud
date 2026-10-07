import { CREAM, NAVY, Topic } from "../../Explainer";
import {
  CrocArt,
  FlamingoArt,
  JellyArt,
  OctopusArt,
  OtterArt,
  PawHookArt,
  TardigradeArt,
  WombatArt,
} from "../../motion/Animals";
import mouth from "./mouth.json";
import script from "./script.json";
import voiceover from "./voiceover.json";

// « 7 animaux avec de vrais super-pouvoirs »
export const animaux: Topic = {
  id: "animaux",
  script,
  voiceover,
  mouth,
  colors: {
    hook: { bg: NAVY, ink: CREAM, accent: "#FFD23F", pop: "#FF5E8A" },
    facts: [
      { bg: "#FFB347", ink: NAVY, accent: "#7B2FF7", pop: "#2E6BFF" },
      { bg: "#7FD4F5", ink: NAVY, accent: "#8B5A2B", pop: "#FF5E8A" },
      { bg: "#0E1A3A", ink: CREAM, accent: "#FFD23F", pop: "#2EC4F1" },
      { bg: "#B6E87A", ink: NAVY, accent: "#2F8F4E", pop: "#FF7A9C" },
      { bg: "#BFE9FF", ink: NAVY, accent: "#FF5E8A", pop: "#FF8A3D" },
      { bg: "#FFD23F", ink: NAVY, accent: "#8B5A2B", pop: "#6B4423" },
      { bg: "#1B1B4B", ink: CREAM, accent: "#C08CFF", pop: "#7FE3FF" },
    ],
    outro: { bg: "#FF5E8A", ink: NAVY, accent: "#FFD23F", pop: CREAM },
  },
  HookArt: PawHookArt,
  factArts: [
    OctopusArt,
    OtterArt,
    TardigradeArt,
    CrocArt,
    FlamingoArt,
    WombatArt,
    JellyArt,
  ],
};
