import type { User } from "@prisma/client";
import type { UserProfileDTO } from "@sports-coach/shared";

export function toUserProfileDTO(user: User): UserProfileDTO {
  return {
    id: user.id,
    email: user.email,
    objectif: user.objectif,
    sportsPratiques: user.sportsPratiques,
    niveau: user.niveau,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt.toISOString(),
  };
}
