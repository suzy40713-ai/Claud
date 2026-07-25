import { apiRequest } from "./api";

export type Me = {
  id: string;
  email: string;
  displayName: string | null;
  subscription: {
    plan: "free" | "pro" | "business";
    status: string;
    minutesQuota: number;
    currentPeriodEnd: string;
  } | null;
  minutesUsed: number;
};

type GetToken = () => Promise<string | null>;

export function getMe(getToken: GetToken) {
  return apiRequest<Me>("/api/me", { getToken });
}
