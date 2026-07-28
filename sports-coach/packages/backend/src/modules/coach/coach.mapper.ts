import type { CoachMessage } from "@prisma/client";
import type { CoachMessageDTO } from "@sports-coach/shared";

export function toCoachMessageDTO(message: CoachMessage): CoachMessageDTO {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}
