import "server-only";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { findPack } from "@/lib/packs";
import { sceneStarts, voiceText, type VideoRequest } from "@/lib/script";
import { createToken, verifyToken } from "@/lib/tokens";
import { writeScript } from "./ai";
import { sql } from "./db";
import { accessEmail, sendEmail } from "./email";
import { env } from "./env";
import { synthesize } from "./voice";

export const SESSION_COOKIE = "vidaia_session";
const SESSION_TTL = 60 * 60 * 24 * 30;
const LINK_TTL = 60 * 60 * 24 * 7;

export type Account = { id: string; email: string; credits: number };

export function stripe() {
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new Error("Paiement indisponible : STRIPE_SECRET_KEY manquante.");
  return new Stripe(key);
}

export async function currentAccount(): Promise<Account | null> {
  const id = verifyToken(env().VIDAIA_SECRET, "session", (await cookies()).get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const [row] = await sql()<Account[]>`select id, email, credits from vid_account where id = ${id}`;
  return row ?? null;
}

export async function startSession(accountId: string) {
  (await cookies()).set(SESSION_COOKIE, createToken(env().VIDAIA_SECRET, "session", accountId, SESSION_TTL), {
    httpOnly: true,
    secure: env().APP_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

export function accessLink(accountId: string) {
  return `${env().APP_URL}/acces?t=${encodeURIComponent(createToken(env().VIDAIA_SECRET, "lien", accountId, LINK_TTL))}`;
}

export function accountFromLink(token: string | null) {
  return verifyToken(env().VIDAIA_SECRET, "lien", token);
}

/**
 * Valide un paiement Stripe et crédite le compte (une seule fois par paiement).
 * Retourne le compte, ou null si le paiement n'est pas confirmé.
 */
export async function finalizePurchase(sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  const s = await stripe().checkout.sessions.retrieve(sessionId);
  if (s.payment_status !== "paid") return null;
  // Lien de retour utilisable 24 h après le paiement seulement.
  if (Date.now() / 1000 - s.created > 60 * 60 * 24) return null;
  const pack = findPack(s.metadata?.pack);
  const email = (s.customer_details?.email ?? s.customer_email ?? "").trim().toLowerCase();
  if (!pack || !email) return null;
  const db = sql();
  const account = await db.begin(async (tx) => {
    const [acc] = await tx<{ id: string }[]>`
      insert into vid_account (email) values (${email})
      on conflict (email) do update set email = excluded.email
      returning id`;
    const inserted = await tx`
      insert into vid_purchase (stripe_session_id, account_id, pack, videos, amount_cents, waiver_at)
      values (${s.id}, ${acc.id}, ${pack.id}, ${pack.videos}, ${s.amount_total ?? pack.priceCents},
              ${s.metadata?.renonciation === "oui" ? new Date(s.created * 1000) : null})
      on conflict (stripe_session_id) do nothing
      returning stripe_session_id`;
    if (inserted.length > 0) {
      await tx`update vid_account set credits = credits + ${pack.videos} where id = ${acc.id}`;
    }
    return { id: acc.id, isNew: inserted.length > 0 };
  });
  if (account.isNew) {
    const m = accessEmail(accessLink(account.id));
    await sendEmail(email, m.subject, m.text, m.html);
  }
  return account.id;
}

export async function sendAccessLink(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const [acc] = await sql()<{ id: string }[]>`select id from vid_account where email = ${email}`;
  if (!acc) return;
  const m = accessEmail(accessLink(acc.id));
  await sendEmail(email, m.subject, m.text, m.html);
}

export type GenerateResult =
  | { ok: true; videoId: string; credits: number }
  | { ok: false; error: string; status: number };

/**
 * Génère une vidéo : réserve 1 crédit, écrit le script (Groq), crée la voix (ElevenLabs),
 * enregistre le tout. En cas d'échec, le crédit est rendu.
 */
export async function generateVideo(account: Account, r: VideoRequest): Promise<GenerateResult> {
  const db = sql();
  const [{ n }] = await db<{ n: number }[]>`
    select count(*)::int as n from vid_video where created_at >= date_trunc('day', now())`;
  if (n >= env().VIDEO_DAILY_CAP)
    return { ok: false, status: 429, error: "Beaucoup de demandes aujourd'hui : réessayez demain. Aucun crédit n'a été utilisé." };
  const reserved = await db<{ credits: number }[]>`
    update vid_account set credits = credits - 1 where id = ${account.id} and credits > 0 returning credits`;
  if (reserved.length === 0)
    return { ok: false, status: 402, error: "Plus de crédit : choisissez un pack pour continuer." };
  const refund = () => db`update vid_account set credits = credits + 1 where id = ${account.id}`;
  try {
    const script = await writeScript(r);
    if (!script) {
      await refund();
      return { ok: false, status: 503, error: "L'écriture du script n'a pas abouti. Réessayez : votre crédit est rendu." };
    }
    const voice = await synthesize(voiceText(script));
    if (!voice) {
      await refund();
      return { ok: false, status: 503, error: "La voix n'a pas pu être créée. Réessayez : votre crédit est rendu." };
    }
    const { starts, voiceEnd } = sceneStarts(script, voice.alignment);
    const [row] = await db<{ id: string }[]>`
      insert into vid_video (account_id, request, script, starts, voice_end, audio_base64)
      values (${account.id}, ${db.json(r)}, ${db.json(script)}, ${db.json(starts)}, ${voiceEnd}, ${voice.audioBase64})
      returning id`;
    return { ok: true, videoId: row.id, credits: reserved[0].credits };
  } catch (error) {
    console.error("[vidaia] génération en échec", error);
    await refund();
    return { ok: false, status: 500, error: "Erreur inattendue. Réessayez : votre crédit est rendu." };
  }
}

export async function listVideos(accountId: string) {
  return sql()<{ id: string; request: VideoRequest; script: { hook: string }; created_at: Date }[]>`
    select id, request, script, created_at from vid_video where account_id = ${accountId}
    order by created_at desc limit 50`;
}

export async function getVideo(accountId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await sql()`
    select id, request, script, starts, voice_end, audio_base64 from vid_video
    where id = ${id} and account_id = ${accountId}`;
  return row ?? null;
}
