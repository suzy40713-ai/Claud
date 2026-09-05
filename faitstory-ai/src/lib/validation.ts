import { z } from "zod";
import { VideoStyle, VoiceGender, SuspenseLevel } from "@/generated/prisma/enums";

export const createVideoSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(5, "Le sujet est trop court.")
    .max(200, "Le sujet est trop long (200 caracteres max)."),
  durationSec: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  style: z.enum([VideoStyle.SURVIE, VideoStyle.SCIENCE, VideoStyle.ASTUCE, VideoStyle.INSOLITE]),
  voiceGender: z.enum([VoiceGender.HOMME, VoiceGender.FEMME]),
  suspenseLevel: z.enum([SuspenseLevel.FAIBLE, SuspenseLevel.MOYEN, SuspenseLevel.FORT]),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
