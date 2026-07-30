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

// En web, l'API est appelee en relatif (meme origine, proxy Vite en dev).
// Dans l'app mobile packagee (Capacitor), il n'y a pas de backend sur la
// meme origine : VITE_API_URL doit pointer vers le backend deploye a la
// compilation (ex: VITE_API_URL=https://api.mon-domaine.com).
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

// Le cookie de session ne suffit pas partout : Safari/iOS bloque les
// cookies cross-site meme corrects (SameSite=None + Secure). Un token
// stocke cote client et envoye via un header Authorization fonctionne de
// maniere fiable sur tous les navigateurs et dans l'app mobile.
const AUTH_TOKEN_KEY = "vory_auth_token";

function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function authHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...authHeader(),
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
  const res = await fetch(`${API_BASE_URL}/api/coach/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeader() },
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
  register: async (email: string, password: string) => {
    const data = await request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) setAuthToken(data.token);
    return data;
  },
  login: async (email: string, password: string) => {
    const data = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) setAuthToken(data.token);
    return data;
  },
  logout: async () => {
    try {
      await request<void>("/auth/logout", { method: "POST" });
    } finally {
      clearAuthToken();
    }
  },
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
