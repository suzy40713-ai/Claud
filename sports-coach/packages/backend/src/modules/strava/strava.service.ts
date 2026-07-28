import type { Sport } from "@sports-coach/shared";
import { env } from "../../lib/env.js";

const STRAVA_OAUTH_BASE = "https://www.strava.com/oauth";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const SCOPE = "activity:read_all";

export function isStravaConfigured(): boolean {
  return Boolean(env.stravaClientId && env.stravaClientSecret);
}

function ensureConfigured() {
  if (!isStravaConfigured()) {
    throw Object.assign(
      new Error("STRAVA_CLIENT_ID/STRAVA_CLIENT_SECRET non configures : l'import Strava est indisponible."),
      { statusCode: 503 }
    );
  }
}

export function buildAuthorizeUrl(): string {
  ensureConfigured();
  const params = new URLSearchParams({
    client_id: env.stravaClientId!,
    redirect_uri: env.stravaRedirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: SCOPE,
  });
  return `${STRAVA_OAUTH_BASE}/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  athlete?: { id: number };
}

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  athleteId?: string;
}

async function requestToken(body: Record<string, string>): Promise<StravaTokens> {
  ensureConfigured();
  const res = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.stravaClientId,
      client_secret: env.stravaClientSecret,
      ...body,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Echange de jeton Strava echoue (${res.status}): ${text}`);
  }

  const data = (await res.json()) as TokenResponse;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at * 1000),
    athleteId: data.athlete?.id !== undefined ? String(data.athlete.id) : undefined,
  };
}

export function exchangeAuthorizationCode(code: string): Promise<StravaTokens> {
  return requestToken({ code, grant_type: "authorization_code" });
}

export function refreshAccessToken(refreshToken: string): Promise<StravaTokens> {
  return requestToken({ refresh_token: refreshToken, grant_type: "refresh_token" });
}

export async function deauthorize(accessToken: string): Promise<void> {
  await fetch(`${STRAVA_OAUTH_BASE}/deauthorize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {
    // Best-effort : meme si la revocation cote Strava echoue, on supprime
    // les jetons localement pour deconnecter le compte.
  });
}

const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"]);
const RIDE_TYPES = new Set(["Ride", "VirtualRide", "MountainBikeRide", "GravelRide", "EBikeRide"]);

export interface RawStravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  distance: number; // metres
  moving_time: number; // secondes
  total_elevation_gain: number | null;
  average_heartrate: number | null;
  start_date: string; // ISO
}

export interface MappedStravaActivity {
  stravaId: string;
  sport: Sport;
  date: Date;
  duree: number;
  distance: number;
  denivele: number | null;
  fcMoyenne: number | null;
  rawData: RawStravaActivity;
}

/**
 * Convertit une activite Strava brute en donnee interne, ou null si le type
 * de sport n'est pas supporte par l'application (course a pied / velo
 * uniquement pour le MVP).
 */
export function mapStravaActivity(activity: RawStravaActivity): MappedStravaActivity | null {
  const type = activity.sport_type ?? activity.type;
  let sport: Sport;
  if (RUN_TYPES.has(type)) {
    sport = "course_a_pied";
  } else if (RIDE_TYPES.has(type)) {
    sport = "velo";
  } else {
    return null;
  }

  return {
    stravaId: String(activity.id),
    sport,
    date: new Date(activity.start_date),
    duree: Math.round(activity.moving_time),
    distance: activity.distance,
    denivele: activity.total_elevation_gain ?? null,
    fcMoyenne: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
    rawData: activity,
  };
}

export async function fetchRecentActivities(
  accessToken: string,
  sinceDate: Date
): Promise<RawStravaActivity[]> {
  const after = Math.floor(sinceDate.getTime() / 1000);
  const params = new URLSearchParams({ after: String(after), per_page: "100" });
  const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Recuperation des activites Strava echouee (${res.status}): ${text}`);
  }

  return (await res.json()) as RawStravaActivity[];
}
