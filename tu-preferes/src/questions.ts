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

export const EPISODES: Episode[] = [
  {
    id: "TuPreferes-Partie1",
    part: 1,
    hook: "Seulement 1% réussit\nla dernière 😈",
    hookSub: "Choisis avant la fin du chrono ⏱️",
    handle: "@tupreferes",
    questions: [
      {
        a: { emoji: "💸", text: "Gagner 10 000€ maintenant" },
        b: { emoji: "📈", text: "1€ qui double chaque jour pendant 30 jours" },
        percentA: 38,
      },
      {
        a: { emoji: "🧠", text: "Lire dans les pensées" },
        b: { emoji: "🫥", text: "Être invisible" },
        percentA: 57,
      },
      {
        a: { emoji: "📵", text: "Plus jamais de téléphone" },
        b: { emoji: "🍕", text: "Plus jamais de fast-food" },
        percentA: 21,
      },
      {
        a: { emoji: "⏪", text: "Revenir 10 ans en arrière" },
        b: { emoji: "⏩", text: "Voir 10 ans dans le futur" },
        percentA: 49,
      },
      {
        a: { emoji: "🏝️", text: "Vivre seul sur une île paradisiaque" },
        b: { emoji: "🏙️", text: "Vivre dans une ville sans jamais pouvoir sortir" },
        percentA: 63,
      },
      {
        a: { emoji: "🤐", text: "Dire tout ce que tu penses" },
        b: { emoji: "🙊", text: "Ne plus jamais pouvoir mentir" },
        percentA: 51,
      },
    ],
  },
  {
    id: "TuPreferes-Partie2",
    part: 2,
    hook: "Tu vas hésiter\nsur la dernière 😳",
    hookSub: "Compte tes réponses majoritaires 👇",
    handle: "@tupreferes",
    questions: [
      {
        a: { emoji: "🐉", text: "Avoir un dragon de compagnie" },
        b: { emoji: "🦄", text: "Avoir une licorne qui exauce 1 vœu par an" },
        percentA: 66,
      },
      {
        a: { emoji: "☀️", text: "Été toute l'année" },
        b: { emoji: "❄️", text: "Hiver toute l'année" },
        percentA: 72,
      },
      {
        a: { emoji: "🎤", text: "Chanter à chaque fois que tu parles" },
        b: { emoji: "💃", text: "Danser à chaque fois que tu marches" },
        percentA: 44,
      },
      {
        a: { emoji: "🧳", text: "Voyager gratuitement à vie" },
        b: { emoji: "🍽️", text: "Manger gratuitement à vie" },
        percentA: 58,
      },
      {
        a: { emoji: "👴", text: "Parler à ton toi de 80 ans" },
        b: { emoji: "👶", text: "Parler à ton toi de 8 ans" },
        percentA: 47,
      },
      {
        a: { emoji: "💔", text: "Perdre tous tes souvenirs" },
        b: { emoji: "🔮", text: "Connaître la date de ta mort" },
        percentA: 52,
      },
    ],
  },
];
