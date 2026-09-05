// Note: French possessive determiners (son/sa) agree with the gender of the
// possessed noun, not the owner's — so they are hardcoded per-noun in the
// arc templates below rather than stored on the character.
const CHARACTERS = [
  { name: 'Léa', pronoun: 'elle' },
  { name: 'Sarah', pronoun: 'elle' },
  { name: 'Emma', pronoun: 'elle' },
  { name: 'Chloé', pronoun: 'elle' },
  { name: 'Manon', pronoun: 'elle' },
  { name: 'Camille', pronoun: 'elle' },
  { name: 'Nathan', pronoun: 'il' },
  { name: 'Lucas', pronoun: 'il' },
  { name: 'Hugo', pronoun: 'il' },
  { name: 'Thomas', pronoun: 'il' },
  { name: 'Enzo', pronoun: 'il' },
  { name: 'Yanis', pronoun: 'il' },
];

const PLACES = [
  'une vieille maison de campagne isolée',
  'un appartement du 13e étage où {pronoun} venait d\'emménager',
  'un chalet abandonné en pleine forêt',
  'le sous-sol de l\'immeuble familial',
  'un grenier fermé depuis des années',
  'une chambre d\'hôtel tout au bout du couloir',
];

const OBJECTS = [
  'une clé rouillée qui n\'ouvrait aucune porte de la maison',
  'un journal intime rempli d\'une écriture qui n\'était pas la sienne',
  'une cassette vidéo sans aucune étiquette',
  'une boîte scellée avec du fil de fer',
  'un miroir ancien recouvert d\'un drap',
  'une vieille photo que {pronoun} ne se souvenait pas avoir prise',
];

const GENRES = {
  horreur: {
    label: 'horreur',
    suggestedStyle: 'cinematic',
    titles: [
      (c, p) => `😱 ${c.name} n'aurait jamais dû entrer dans ${p}`,
      (c) => `👻 Ce qui est arrivé à ${c.name} cette nuit-là reste inexpliqué`,
      (c) => `🔪 L'histoire de ${c.name} que personne ne veut croire`,
    ],
    arc: [
      (c, p, o) => `Tout a commencé un soir où ${c.name} rentrait seul${c.pronoun === 'elle' ? 'e' : ''} chez ${c.pronoun === 'elle' ? 'elle' : 'lui'}, sans se douter de rien.`,
      (c, p, o) => `En s'installant dans ${p}, ${c.pronoun} a tout de suite ressenti un malaise qu'${c.pronoun === 'il' ? 'il' : 'elle'} n'arrivait pas à s'expliquer.`,
      (c, p, o) => `En fouillant dans un vieux carton, ${c.pronoun} est tombé${c.pronoun === 'elle' ? 'e' : ''} sur ${o}.`,
      (c, p, o) => `Un frisson ${c.pronoun === 'il' ? "l'a parcouru" : "l'a parcourue"} en remarquant que cet objet n'aurait jamais dû se trouver là.`,
      (c, p, o) => `La nuit suivante, un bruit sourd est venu ${withDe(p)}, comme un pas lent qui traînait au sol.`,
      (c, p, o) => `${c.name} a essayé de se convaincre que c'était juste la maison qui craquait.`,
      (c, p, o) => `Mais chaque nuit, le même bruit revenait depuis ${p}, un peu plus proche.`,
      (c, p, o) => `Au bout d'une semaine, ${c.name} a fini par céder à la peur et s'est approché${c.pronoun === 'elle' ? 'e' : ''} ${withDe(p)} pour en avoir le cœur net.`,
      (c, p, o) => `Ce qu'${c.pronoun} a découvert dépassait tout ce qu'${c.pronoun} avait pu imaginer.`,
      (c, p, o) => `${c.pronoun === 'il' ? 'Il' : 'Elle'} a compris qu'${o} n'était pas un objet oublié, mais un avertissement laissé par quelqu'un d'autre.`,
      (c, p, o) => `Son sang s'est glacé quand ${c.pronoun} a enfin compris ce que ça signifiait vraiment.`,
      (c, p, o) => `${c.name} a voulu fuir cette nuit-là, mais il était déjà trop tard pour reculer.`,
      (c, p, o) => `Depuis, plus personne n'a osé remettre les pieds dans ${p}.`,
      () => `Si cette histoire t'a donné des frissons, abonne-toi pour la partie 2 👻`,
    ],
  },
  mystere: {
    label: 'mystère',
    suggestedStyle: 'cinematic',
    titles: [
      (c) => `🔍 Personne n'a jamais résolu le mystère de ${c.name}`,
      (c, p) => `🕵️ Ce que ${c.name} a trouvé dans ${p} a changé son enquête`,
      (c) => `❓ L'énigme de ${c.name} que la police n'a jamais élucidée`,
    ],
    arc: [
      (c) => `${c.name} menait sa petite enquête depuis des semaines, sans jamais imaginer où ça ${c.pronoun === 'il' ? 'le' : 'la'} mènerait.`,
      (c, p) => `Tout est parti d'un détail étrange qu'${c.pronoun} avait remarqué dans ${p}.`,
      (c, p, o) => `En creusant un peu plus, ${c.pronoun} a mis la main sur ${o}.`,
      (c, p, o) => `Cet objet contenait un indice que personne d'autre n'avait jamais remarqué.`,
      (c) => `${c.name} a recoupé les informations et une première piste sérieuse a enfin émergé.`,
      (c, p) => `${c.pronoun === 'il' ? 'Il' : 'Elle'} est retourné${c.pronoun === 'elle' ? 'e' : ''} sur place, dans ${p}, pour vérifier une dernière hypothèse.`,
      () => `C'est à ce moment précis que tout a commencé à ne plus avoir aucun sens.`,
      (c) => `Une personne que ${c.name} croyait hors de cause était en réalité au centre de toute l'histoire.`,
      (c, p, o) => `Cet indice prouvait un lien que ${c.name} avait toujours refusé de voir.`,
      (c) => `${c.name} a dû choisir entre garder le silence ou révéler une vérité qui allait tout changer.`,
      (c) => `Ce qu'${c.pronoun} a décidé de faire a surpris absolument tout le monde autour ${c.pronoun === 'elle' ? "d'elle" : "de lui"}.`,
      (c, p) => `Aujourd'hui encore, ${p} garde une partie du secret que ${c.name} n'a jamais totalement percé.`,
      () => `Abonne-toi pour la suite de l'enquête, tu ne devineras jamais qui était vraiment derrière tout ça 🔍`,
    ],
  },
  temoignage: {
    label: 'témoignage',
    suggestedStyle: 'realistic',
    titles: [
      (c) => `😳 Ce qui est vraiment arrivé à ${c.name}, ${c.pronoun === 'il' ? "il" : "elle"} ne l'a raconté qu'une fois`,
      (c) => `💬 Le témoignage de ${c.name} qui a fait le tour de son entourage`,
      (c) => `🫢 ${c.name} pensait vivre une vie normale, jusqu'à ce jour-là`,
    ],
    arc: [
      (c) => `${c.name} pensait vivre une vie parfaitement normale, sans jamais s'attendre à ce qui allait suivre.`,
      (c, p) => `Un jour comme un autre, alors qu'${c.pronoun} rangeait ${p}, tout a basculé.`,
      (c, p, o) => `${c.pronoun === 'il' ? 'Il' : 'Elle'} est tombé${c.pronoun === 'elle' ? 'e' : ''} sur ${o}, et rien qu'en le regardant, ${c.pronoun} a compris qu'un secret lui avait été caché.`,
      (c) => `${c.name} a d'abord pensé à un malentendu, avant de réaliser que ce n'en était pas un.`,
      (c) => `${c.pronoun === 'il' ? 'Il' : 'Elle'} a posé des questions autour ${c.pronoun === 'il' ? 'de lui' : "d'elle"}, et les réponses évasives ont confirmé ses craintes.`,
      (c, p, o) => `Cet objet racontait une version des faits que ${c.name} n'avait jamais connue.`,
      (c) => `${c.pronoun === 'il' ? 'Il' : 'Elle'} a dû faire face à une personne de confiance pour obtenir enfin des réponses claires.`,
      (c) => `La conversation qui a suivi a changé la façon dont ${c.name} voyait sa propre histoire.`,
      (c) => `${c.pronoun === 'il' ? 'Il' : 'Elle'} a mis du temps à digérer ce qu'${c.pronoun} venait d'apprendre sur sa propre famille.`,
      (c) => `Aujourd'hui, ${c.name} raconte son histoire pour que d'autres n'aient pas peur de poser les mêmes questions.`,
      () => `Abonne-toi si toi aussi tu as vécu quelque chose de similaire, cette histoire n'est que la première 💬`,
    ],
  },
};

const BASE_HASHTAGS = ['#storytime', '#histoire', '#pourtoi', '#fyp', '#foryou'];
const GENRE_HASHTAGS = {
  horreur: ['#horreur', '#creepy', '#peur', '#hantise'],
  mystere: ['#mystere', '#enquete', '#suspense', '#thriller'],
  temoignage: ['#vecu', '#temoignage', '#confession', '#vraiehistoire'],
};

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// All PLACES entries start with "le ", "un " or "une " — contract/elide
// the preposition "de" accordingly ("de le" -> "du", "de un"/"de une" -> "d'un"/"d'une").
function withDe(phrase) {
  if (phrase.startsWith('le ')) return `du ${phrase.slice(3)}`;
  return `d'${phrase}`;
}

function fillPlaceholders(text, character) {
  return text.replace(/\{pronoun\}/g, character.pronoun);
}

/**
 * Procedurally builds one short story (title, per-scene sentences, caption
 * and hashtags) from a fixed narrative arc per genre with a randomized
 * character/place/object, so every run produces a different, gender-
 * consistent story without needing any paid LLM API.
 */
function generateStory(genreKey) {
  const key = genreKey && GENRES[genreKey] ? genreKey : pick(Object.keys(GENRES));
  const genre = GENRES[key];

  const character = pick(CHARACTERS);
  const place = fillPlaceholders(pick(PLACES), character);
  const object = fillPlaceholders(pick(OBJECTS), character);

  const sentences = genre.arc.map((line) => line(character, place, object));
  const title = pick(genre.titles)(character, place, object);
  const hashtags = [...BASE_HASHTAGS, ...GENRE_HASHTAGS[key]];

  const description = `${sentences[0]} ${sentences[1] || ''}`.trim();

  return {
    genre: genre.label,
    genreKey: key,
    suggestedStyle: genre.suggestedStyle,
    title,
    sentences,
    description,
    hashtags,
  };
}

module.exports = { generateStory, GENRES };
