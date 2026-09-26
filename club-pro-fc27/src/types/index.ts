// Types coeur de la plateforme Club Pro FC 27

export type Poste =
  | "GB"
  | "DC"
  | "DD"
  | "DG"
  | "MDC"
  | "MC"
  | "MOC"
  | "AD"
  | "AG"
  | "BU";

export type Archetype =
  // Gardiens
  | "Gardien pur"
  | "Gardien-libéro"
  // Défenseurs
  | "Boss"
  | "Progresseur DC"
  | "Moteur"
  | "Maraudeur"
  // Milieux
  | "Recycler"
  | "Maestro"
  | "Créateur"
  | "Étincelle"
  // Attaquants
  | "Magicien"
  | "Finisseur"
  | "Cible";

export interface PlayStyle {
  fr: string;
  en: string;
}

export type Division =
  | "Division 10"
  | "Division 9"
  | "Division 8"
  | "Division 7"
  | "Division 6"
  | "Division 5"
  | "Division 4"
  | "Division 3"
  | "Division 2"
  | "Division 1"
  | "Élite"
  | "Champions";

export type StatutJoueur = "Libre" | "En club" | "En essai";

export type Region =
  | "France"
  | "Belgique"
  | "Suisse"
  | "Maroc"
  | "Sénégal"
  | "Côte d'Ivoire"
  | "Canada"
  | "Cameroun"
  | "Algérie"
  | "Tunisie";

export type Langue = "Français" | "Anglais" | "Arabe" | "Espagnol";

export interface Badge {
  id: string;
  label: string;
  icon: string; // lucide icon name
  color: string;
}

export interface HistoriqueClub {
  clubId: string;
  clubNom: string;
  clubLogo: string;
  periode: string;
  poste: Poste;
  statut: "Actuel" | "Ancien";
}

export interface VideoHighlight {
  id: string;
  titre: string;
  url: string;
  plateforme: "YouTube" | "Twitch" | "Upload";
  vues: number;
  date: string;
}

export interface Evaluation {
  id: string;
  parId: string;
  parPseudo: string;
  fairPlay: number;
  ponctualite: number;
  niveau: number;
  commentaire?: string;
  date: string;
}

export interface Joueur {
  id: string;
  pseudo: string;
  avatar: string; // capture du pro in-game
  bannerColor: string;
  poste: Poste;
  posteSecondaire?: Poste;
  archetype: Archetype;
  styleDeJeu: string;
  noteGlobale: number; // 0-99
  region: Region;
  disponibilite: string;
  statut: StatutJoueur;
  niveauPro: number; // 1-100+
  niveauProMax: number;
  division: Division;
  langues: Langue[];
  bio: string;
  followers: number;
  following: number;
  verifie: boolean;
  historiqueClubs: HistoriqueClub[];
  badges: Badge[];
  videos: VideoHighlight[];
  evaluations: Evaluation[];
  stats: {
    matchsJoues: number;
    buts: number;
    passesD: number;
    victoires: number;
    defaites: number;
    noteMoyenneMatch: number;
    tauxVictoire: number;
  };
}

export interface PosteRecherche {
  poste: Poste;
  archetype?: Archetype;
  niveauMin: number;
  pourvu: boolean;
}

export interface Club {
  id: string;
  nom: string;
  tag: string;
  logo: string;
  banniere: string;
  couleurPrincipale: string;
  couleurSecondaire: string;
  description: string;
  region: Region;
  palmares: string[];
  fondation: string;
  followers: number;
  verifie: boolean;
  vitrine?: boolean; // African FC
  classementElo: number;
  classementRang: number;
  effectif: string[]; // joueur ids
  posteRecherche: PosteRecherche[];
  stats: {
    matchsJoues: number;
    victoires: number;
    nuls: number;
    defaites: number;
    butsMarques: number;
    butsEncaisses: number;
  };
  resultats: ResultatMatch[];
}

export interface ResultatMatch {
  id: string;
  adversaireId: string;
  adversaireNom: string;
  adversaireLogo: string;
  score: string;
  scoreAdversaire: string;
  date: string;
  competition: string;
  resultat: "Victoire" | "Défaite" | "Nul";
}

export interface Post {
  id: string;
  auteurType: "joueur" | "club";
  auteurId: string;
  auteurNom: string;
  auteurAvatar: string;
  auteurVerifie: boolean;
  contenu: string;
  image?: string;
  video?: string;
  clipBut?: boolean;
  date: string;
  likes: number;
  commentaires: number;
  partages: number;
  liked?: boolean;
}

export interface Story {
  id: string;
  auteurId: string;
  auteurNom: string;
  auteurAvatar: string;
  vue: boolean;
  couleur: string;
}

export interface AnnonceRecrutement {
  id: string;
  type: "club" | "joueur";
  auteurId: string;
  auteurNom: string;
  auteurLogo: string;
  titre: string;
  poste: Poste;
  archetype?: Archetype;
  niveauMin: number;
  disponibilite: string;
  langues: Langue[];
  region: Region;
  description: string;
  date: string;
}

export interface Transfert {
  id: string;
  joueurId: string;
  joueurNom: string;
  joueurAvatar: string;
  clubDepartId?: string;
  clubDepartNom?: string;
  clubArriveeId: string;
  clubArriveeNom: string;
  clubArriveeLogo: string;
  poste: Poste;
  date: string;
  type: "Transfert" | "Arrivée libre" | "Prêt";
}

export interface LiveMatch {
  id: string;
  titre: string;
  clubDomicile: string;
  clubDomicileLogo: string;
  clubExterieur: string;
  clubExterieurLogo: string;
  scoreDomicile: number;
  scoreExterieur: number;
  minute: number;
  spectateurs: number;
  streamer: string;
  plateforme: "Twitch" | "YouTube" | "Natif";
  thumbnail: string;
  isLive: boolean;
  competition: string;
}

export interface ChatMessage {
  id: string;
  auteur: string;
  avatar: string;
  message: string;
  date: string;
  couleur?: string;
}

export interface Tournoi {
  id: string;
  nom: string;
  image: string;
  format: string;
  dateDebut: string;
  dateFin: string;
  clubsInscrits: number;
  clubsMax: number;
  cashprize?: string;
  sponsorise: boolean;
  statut: "À venir" | "En cours" | "Terminé";
  regles: string[];
  organisateur: string;
  bracket?: BracketMatch[];
  vainqueur?: string;
}

export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  clubA?: string;
  clubALogo?: string;
  clubB?: string;
  clubBLogo?: string;
  scoreA?: number;
  scoreB?: number;
  vainqueur?: string;
  statut: "À venir" | "En cours" | "Terminé";
}

export interface MatchRapide {
  id: string;
  format: "1v1" | "2v2" | "3v3" | "4v4";
  adversaire: string;
  adversaireAvatar: string;
  resultat: "Victoire" | "Défaite" | "Nul";
  score: string;
  date: string;
}

export interface Conversation {
  id: string;
  type: "prive" | "groupe";
  nom: string;
  avatar: string;
  dernierMessage: string;
  dateDernierMessage: string;
  nonLu: number;
  enLigne?: boolean;
}

export interface MessagePrive {
  id: string;
  conversationId: string;
  expediteur: string;
  contenu: string;
  date: string;
  moi: boolean;
}

export interface ClassementClub {
  rang: number;
  ancienRang: number;
  club: Club;
  elo: number;
  serie: ("V" | "D" | "N")[];
}
