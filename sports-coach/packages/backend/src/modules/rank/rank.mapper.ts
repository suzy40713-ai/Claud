import type { PushupChallenge } from "@prisma/client";
import type { PushupChallengeDTO, ChallengeStatut } from "@sports-coach/shared";

export function toPushupChallengeDTO(challenge: PushupChallenge): PushupChallengeDTO {
  return {
    id: challenge.id,
    semaineDebut: challenge.semaineDebut.toISOString().slice(0, 10),
    statut: challenge.statut as ChallengeStatut,
    repsDetectees: challenge.repsDetectees,
    formeValide: challenge.formeValide,
    commentaire: challenge.commentaire,
    createdAt: challenge.createdAt.toISOString(),
  };
}
