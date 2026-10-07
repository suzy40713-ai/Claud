import { CREAM, NAVY, Topic } from "../../Explainer";
import { ramp } from "../../motion/anim";
import {
  EnergyArt,
  EyeArt,
  HookArt,
  MultitaskArt,
  NoseArt,
  SignsArt,
  TickleArt,
  YawnArt,
} from "../../motion/Illustrations";
import mouth from "./mouth.json";
import script from "./script.json";
import voiceover from "./voiceover.json";

// « 7 choses que ton cerveau te cache »
export const cerveau: Topic = {
  id: "cerveau",
  script,
  voiceover,
  mouth,
  colors: {
    hook: { bg: NAVY, ink: CREAM, accent: "#FFD23F", pop: "#FF5E8A" },
    facts: [
      { bg: "#FFD23F", ink: NAVY, accent: CREAM, pop: "#FF5E36" },
      { bg: "#FF8FAB", ink: NAVY, accent: "#FFD23F", pop: "#7B2FF7" },
      { bg: "#2EC4F1", ink: NAVY, accent: "#FFD23F", pop: "#FF5E8A" },
      { bg: "#8BE07A", ink: NAVY, accent: "#FFD23F", pop: "#FF5E8A" },
      { bg: "#FF9A3C", ink: NAVY, accent: "#7B2FF7", pop: "#FF5E8A" },
      { bg: "#B392F0", ink: NAVY, accent: "#FFD23F", pop: "#FF5E8A" },
      { bg: NAVY, ink: CREAM, accent: "#FFD23F", pop: "#FF5E8A" },
    ],
    outro: { bg: "#FF5E8A", ink: NAVY, accent: "#FFD23F", pop: CREAM },
  },
  HookArt: ({ frame, p, c, cue }) => (
    <HookArt
      frame={frame}
      p={p}
      c={c}
      grow={ramp(frame, 0, 28)}
      stamp={(frame - cue) / 8}
    />
  ),
  factArts: [
    EnergyArt,
    NoseArt,
    EyeArt,
    TickleArt,
    MultitaskArt,
    SignsArt,
    YawnArt,
  ],
};
