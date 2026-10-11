import episodes from "./episodes.json";

export type Choice = {
  emoji: string;
  text: string;
};

export type Question = {
  a: Choice;
  b: Choice;
  // % de gens qui choisissent A (B = 100 - A). Mets des écarts serrés
  // (45-55) de temps en temps : ça fait débattre en commentaires.
  percentA: number;
  // Optionnel : texte lu par la voix off, si la lecture auto sonne mal
  voice?: string;
};

export type Episode = {
  id: string; // nom de la composition dans Remotion Studio
  part: number;
  // Accroche affichée pendant 1,5 s au début
  hook: string;
  hookSub: string;
  // Pseudo affiché dans le CTA final
  handle: string;
  questions: Question[];
};

// Le contenu est dans episodes.json (lu aussi par le script de voix off).
export const EPISODES: Episode[] = episodes;
