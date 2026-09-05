import type { VideoStyle, SuspenseLevel } from "@/generated/prisma/enums";
import type { ResearchResult } from "./research";

export interface ScriptSections {
  hook: string;
  intro: string;
  developpement: string;
  suspense: string;
  conclusion: string;
}

export interface GeneratedScript {
  title: string;
  hashtags: string[];
  sections: ScriptSections;
  fullText: string;
  // false when no Wikipedia source backed this script: the UI must show a
  // clear "unverified, double-check before publishing" warning in that case.
  factChecked: boolean;
}

// Rough pace of the espeak-ng narration used downstream; keeps generated
// scripts close to the requested duration once read aloud.
const WORDS_PER_SECOND = 2.3;
const CLOSING_WORD_RESERVE = 30;

const TITLE_PREFIX: Record<VideoStyle, string> = {
  SURVIE: "🚨",
  SCIENCE: "🔬",
  ASTUCE: "💡",
  INSOLITE: "🤯",
};

const BASE_HASHTAGS = ["#faitstory", "#pourtoi", "#fyp", "#tusavaispas"];
const STYLE_HASHTAGS: Record<VideoStyle, string[]> = {
  SURVIE: ["#survie", "#urgence", "#astucevie"],
  SCIENCE: ["#science", "#culturegenerale", "#saistu"],
  ASTUCE: ["#astuce", "#lifehack", "#tips"],
  INSOLITE: ["#insolite", "#curiosite", "#etonnant"],
};

const HOOKS: Record<VideoStyle, Record<SuspenseLevel, (subject: string) => string>> = {
  SURVIE: {
    FAIBLE: (s) => `Un reflexe simple a connaitre : ${s}.`,
    MOYEN: (s) => `Si ca t'arrive un jour, ca peut vraiment t'aider : ${s}.`,
    FORT: (s) => `Ca peut litteralement te sauver la vie : ${s}.`,
  },
  SCIENCE: {
    FAIBLE: (s) => `Voici ce que dit la science sur : ${s}.`,
    MOYEN: (s) => `Ce que tu crois savoir sur ${s} est probablement incomplet.`,
    FORT: (s) => `Personne ne t'a jamais vraiment explique ça : ${s}.`,
  },
  ASTUCE: {
    FAIBLE: (s) => `Une astuce simple sur : ${s}.`,
    MOYEN: (s) => `Cette astuce peut vraiment t'aider : ${s}.`,
    FORT: (s) => `Arrete tout, ça va changer ta facon de faire : ${s}.`,
  },
  INSOLITE: {
    FAIBLE: (s) => `Un fait curieux a decouvrir sur ${s}.`,
    MOYEN: (s) => `Tu ne connaissais surement pas ça sur ${s}.`,
    FORT: (s) => `Tu ne devineras jamais la verite sur ${s}.`,
  },
};

function lowerFirst(text: string): string {
  return text.length ? text[0].toLowerCase() + text.slice(1) : text;
}

function capitalizeFirst(text: string): string {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface GenerateScriptParams {
  subject: string;
  style: VideoStyle;
  suspenseLevel: SuspenseLevel;
  durationSec: number;
  research: ResearchResult;
}

/**
 * Builds a TikTok-paced script (hook/intro/developpement/suspense/conclusion)
 * around real Wikipedia sentences from `research` rather than inventing
 * facts: the surrounding hook/suspense/conclusion phrasing is generic style
 * dressing, the substantive claims come straight from the cited source.
 */
export function generateScript(params: GenerateScriptParams): GeneratedScript {
  const { subject, style, suspenseLevel, durationSec, research } = params;

  const hook = HOOKS[style][suspenseLevel](lowerFirst(subject));

  const allSentences = research.sources.flatMap((source) => splitIntoSentences(source.extract));
  const totalWordBudget = Math.round(durationSec * WORDS_PER_SECOND);

  const introSentences = allSentences.slice(0, 2);
  let intro = introSentences.join(" ") || `Voici un sujet qui merite qu'on s'y interesse : ${subject}.`;
  if (!research.verified) {
    intro = `Aucune source fiable n'a ete trouvee pour ce sujet : ce qui suit est general et doit etre verifie avant de faire confiance a ce contenu. ${intro}`;
  }

  const remainingSentences = allSentences.slice(introSentences.length);
  const developpementSentences: string[] = [];
  const usedWordsBeforeDev = countWords(hook) + countWords(intro);
  const hardBudget = totalWordBudget - CLOSING_WORD_RESERVE;
  let usedWords = usedWordsBeforeDev;
  for (const sentence of remainingSentences) {
    const w = countWords(sentence);
    if (usedWords + w > hardBudget) break;
    developpementSentences.push(sentence);
    usedWords += w;
  }
  const developpement =
    developpementSentences.join(" ") ||
    `${subject} reste un sujet sur lequel il faut rester prudent et bien s'informer aupres de sources fiables.`;

  const leftoverSentence = remainingSentences[developpementSentences.length];
  const suspense = leftoverSentence
    ? `Ce que peu de gens savent : ${leftoverSentence}`
    : `Ce sujet cache encore des details que beaucoup de monde ignore.`;

  const disclaimer =
    style === "SURVIE"
      ? " Rappel : ceci est une information generale, en cas d'urgence appelle le 15 ou le 112."
      : "";
  const conclusion = `Est-ce que toi aussi tu ignorais ça ? Dis-le en commentaire.${disclaimer}`;

  const sections: ScriptSections = { hook, intro, developpement, suspense, conclusion };
  const fullText = [hook, intro, developpement, suspense, conclusion].join(" ");

  return {
    title: `${TITLE_PREFIX[style]} ${capitalizeFirst(subject)}`,
    hashtags: [...BASE_HASHTAGS, ...STYLE_HASHTAGS[style]],
    sections,
    fullText,
    factChecked: research.verified,
  };
}
