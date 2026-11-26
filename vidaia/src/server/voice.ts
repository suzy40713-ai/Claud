import "server-only";
import type { Alignment } from "@/lib/script";
import { env } from "./env";

/** Voix off ElevenLabs avec minutage caractère par caractère. null si indisponible. */
export async function synthesize(
  text: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ audioBase64: string; alignment: Alignment } | null> {
  const e = env();
  if (!e.ELEVENLABS_API_KEY) return null;
  try {
    const res = await fetchImpl(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(e.ELEVENLABS_VOICE_ID)}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": e.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ text, model_id: e.ELEVENLABS_MODEL }),
        signal: AbortSignal.timeout(60_000),
      },
    );
    if (!res.ok) {
      console.error("[vidaia] ElevenLabs HTTP", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data = (await res.json()) as { audio_base64?: string; alignment?: Alignment };
    if (!data.audio_base64 || !data.alignment?.character_start_times_seconds?.length) return null;
    return { audioBase64: data.audio_base64, alignment: data.alignment };
  } catch (error) {
    console.error("[vidaia] ElevenLabs en échec", error);
    return null;
  }
}
