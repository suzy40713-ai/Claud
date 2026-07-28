import type {
  ActivityDTO,
  AuthResponse,
  BillingStatusDTO,
  CoachMessageDTO,
  DailyLogDTO,
  DailyLogPayload,
  OnboardingPayload,
  PlannedSessionDTO,
  SessionStatut,
  TrainingPlanResponse,
  UserProfileDTO,
  WeeklyVolumePoint,
} from "@sports-coach/shared";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? "Une erreur est survenue", res.status);
  }
  return data as T;
}

export type CoachStreamEvent =
  | { type: "user_message"; message: CoachMessageDTO }
  | { type: "delta"; text: string }
  | { type: "done"; message: CoachMessageDTO }
  | { type: "error"; error: string };

export async function streamCoachMessage(
  content: string,
  onEvent: (event: CoachStreamEvent) => void
): Promise<void> {
  const res = await fetch("/api/coach/messages", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error ?? "Le coach IA est indisponible", res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      onEvent(JSON.parse(line.slice("data: ".length)) as CoachStreamEvent);
    }
  }
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<AuthResponse>("/auth/me"),

  submitOnboarding: (payload: OnboardingPayload) =>
    request<{ user: UserProfileDTO }>("/users/onboarding", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  saveDailyLog: (payload: DailyLogPayload) =>
    request<{ log: DailyLogDTO }>("/daily-logs", { method: "POST", body: JSON.stringify(payload) }),
  getDailyLogs: (days = 14) => request<{ logs: DailyLogDTO[] }>(`/daily-logs?days=${days}`),
  getTodayLog: () => request<{ log: DailyLogDTO | null }>("/daily-logs/today"),

  getCoachMessages: () => request<{ messages: CoachMessageDTO[] }>("/coach/messages"),

  getActivities: () => request<{ activities: ActivityDTO[] }>("/activities"),
  getWeeklyVolume: () => request<{ weeklyVolume: WeeklyVolumePoint[] }>("/activities/weekly-volume"),
  importActivity: (file: File, sport: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("sport", sport);
    return request<{ activity: ActivityDTO }>("/activities/import", { method: "POST", body: form });
  },

  getTrainingPlan: () => request<TrainingPlanResponse>("/training-plan"),
  updateSessionStatut: (sessionId: string, statut: SessionStatut) =>
    request<{ seance: PlannedSessionDTO }>(`/training-plan/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ statut }),
    }),
  applySuggestion: (sessionId: string) =>
    request<{ seance: PlannedSessionDTO }>(`/training-plan/sessions/${sessionId}/apply-suggestion`, {
      method: "POST",
    }),

  getVapidPublicKey: () => request<{ publicKey: string }>("/push/vapid-public-key"),
  subscribeToPush: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    request<{ ok: true }>("/push/subscribe", { method: "POST", body: JSON.stringify(subscription) }),
  unsubscribeFromPush: (endpoint: string) =>
    request<void>("/push/subscribe", { method: "DELETE", body: JSON.stringify({ endpoint }) }),
  checkOverloadNow: () => request<{ sent: boolean }>("/push/check-now", { method: "POST" }),

  getStravaStatus: () =>
    request<{ configured: boolean; connected: boolean; lastSyncAt: string | null; premium: boolean }>(
      "/strava/status"
    ),
  getStravaAuthorizeUrl: () => request<{ url: string }>("/strava/authorize-url"),
  submitStravaCode: (code: string) =>
    request<{ connected: true }>("/strava/callback", { method: "POST", body: JSON.stringify({ code }) }),
  syncStrava: () => request<{ imported: number; totalFetched: number }>("/strava/sync", { method: "POST" }),
  disconnectStrava: () => request<void>("/strava/disconnect", { method: "DELETE" }),

  getBillingStatus: () => request<BillingStatusDTO>("/billing/status"),
  createCheckoutSession: () => request<{ url: string }>("/billing/create-checkout-session", { method: "POST" }),
  createPortalSession: () => request<{ url: string }>("/billing/create-portal-session", { method: "POST" }),
};

export { ApiError };
