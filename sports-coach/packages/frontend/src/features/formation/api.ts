// En web, l'API est appelee en relatif (proxy Vite en dev) ; en production, VITE_API_URL pointe vers le serveur.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export interface Lesson { title: string; body: string; ex: string | null }
export interface Module { title: string; intro: string; lessons: Lesson[] }
export interface CourseContent { meta: { modules: number; lessons: number; exercises: number }; modules: Module[] }

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Erreur inattendue."), { status: res.status });
  return data as T;
}

export const formationApi = {
  status: () => call<{ configured: boolean; priceCents: number; currency: string }>("/api/formation/status"),
  checkout: () => call<{ url: string }>("/api/formation/create-checkout-session", { method: "POST", body: JSON.stringify({ waiver: true }) }),
  confirm: (sessionId: string) => call<{ token: string; email: string | null }>(`/api/formation/confirm?session_id=${encodeURIComponent(sessionId)}`),
  content: (token: string) => call<CourseContent>(`/api/formation/content?acces=${encodeURIComponent(token)}`),
  pdfUrl: (token: string) => `${API_BASE_URL}/api/formation/pdf?acces=${encodeURIComponent(token)}`,
  lead: (email: string) => call<{ ok: boolean }>("/api/leads/capture", { method: "POST", body: JSON.stringify({ email, source: "studio-cartoon-apercu" }) }),
};

export function formatPrice(cents: number, currency = "eur"): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: currency.toUpperCase() });
}
