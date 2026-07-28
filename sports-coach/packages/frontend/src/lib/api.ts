import type {
  ActivityDTO,
  AuthResponse,
  DailyLogDTO,
  DailyLogPayload,
  OnboardingPayload,
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

  getActivities: () => request<{ activities: ActivityDTO[] }>("/activities"),
  getWeeklyVolume: () => request<{ weeklyVolume: WeeklyVolumePoint[] }>("/activities/weekly-volume"),
  importActivity: (file: File, sport: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("sport", sport);
    return request<{ activity: ActivityDTO }>("/activities/import", { method: "POST", body: form });
  },
};

export { ApiError };
