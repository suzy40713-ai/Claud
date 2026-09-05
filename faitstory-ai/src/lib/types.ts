import type { VideoStatus, VideoStyle, VoiceGender, SuspenseLevel } from "@/generated/prisma/enums";

export interface ApiSource {
  title: string;
  url: string;
  extract: string;
}

export interface ApiScriptSections {
  hook: string;
  intro: string;
  developpement: string;
  suspense: string;
  conclusion: string;
}

export interface ApiScript {
  title: string;
  hashtags: string[];
  sections: ApiScriptSections;
  fullText: string;
  factChecked: boolean;
}

export interface ApiScene {
  index: number;
  narrationText: string;
  onScreenText: string;
  transition: "zoom-in" | "zoom-out";
  durationSec: number;
  visualDescription: string;
}

export interface ApiVideo {
  id: string;
  subject: string;
  durationSec: number;
  style: VideoStyle;
  voiceGender: VoiceGender;
  suspenseLevel: SuspenseLevel;
  status: VideoStatus;
  errorMessage: string | null;
  title: string | null;
  hook: string | null;
  script: ApiScript | null;
  scenes: ApiScene[] | null;
  sources: ApiSource[] | null;
  hashtags: string[] | null;
  videoPath: string | null;
  thumbnailPath: string | null;
  srtPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiVideoListItem {
  id: string;
  subject: string;
  title: string | null;
  status: VideoStatus;
  durationSec: number;
  style: VideoStyle;
  thumbnailPath: string | null;
  videoPath: string | null;
  createdAt: string;
}

export const PIPELINE_STEPS: { status: VideoStatus; label: string }[] = [
  { status: "RESEARCHING", label: "Recherche du sujet" },
  { status: "WRITING_SCRIPT", label: "Creation du script" },
  { status: "BUILDING_SCENES", label: "Creation des scenes" },
  { status: "GENERATING_VOICE", label: "Generation de la narration" },
  { status: "GENERATING_SUBTITLES", label: "Creation des sous-titres" },
  { status: "RENDERING", label: "Montage video" },
  { status: "DONE", label: "Video terminee" },
];

export const STYLE_LABELS: Record<VideoStyle, { label: string; emoji: string }> = {
  SURVIE: { label: "Survie", emoji: "🚨" },
  SCIENCE: { label: "Science", emoji: "🔬" },
  ASTUCE: { label: "Astuce", emoji: "💡" },
  INSOLITE: { label: "Insolite", emoji: "🤯" },
};

export const SUSPENSE_LABELS: Record<SuspenseLevel, string> = {
  FAIBLE: "Faible",
  MOYEN: "Moyen",
  FORT: "Fort",
};

export const VOICE_LABELS: Record<VoiceGender, string> = {
  HOMME: "Homme",
  FEMME: "Femme",
};

export const STATUS_LABELS: Record<VideoStatus, string> = {
  PENDING: "En attente",
  RESEARCHING: "Recherche du sujet",
  WRITING_SCRIPT: "Creation du script",
  BUILDING_SCENES: "Creation des scenes",
  GENERATING_VOICE: "Generation de la narration",
  GENERATING_SUBTITLES: "Creation des sous-titres",
  RENDERING: "Montage video",
  DONE: "Terminee",
  FAILED: "Echouee",
};
