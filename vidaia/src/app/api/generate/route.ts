import { requestSchema } from "@/lib/script";
import { currentAccount, generateVideo } from "@/server/account";

export const maxDuration = 120;

/** Génère une vidéo (script + voix) pour le compte connecté ; 1 crédit. */
export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account) return Response.json({ error: "Session expirée : reconnectez-vous." }, { status: 401 });
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Demande invalide." }, { status: 400 });
  const r = await generateVideo(account, parsed.data);
  if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
  return Response.json({ videoId: r.videoId, credits: r.credits });
}
