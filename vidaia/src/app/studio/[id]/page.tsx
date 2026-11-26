import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Theme, VideoRequest, VideoScript } from "@/lib/script";
import { videoDuration } from "@/lib/script";
import { currentAccount, getVideo } from "@/server/account";
import { Player } from "./player";

export const dynamic = "force-dynamic";

export default async function VideoPage(props: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) redirect("/connexion");
  const { id } = await props.params;
  const v = await getVideo(account.id, id);
  if (!v) notFound();
  const script = v.script as VideoScript;
  const request = v.request as VideoRequest;
  const voiceEnd = Number(v.voice_end);
  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-24">
      <Link href="/studio" className="text-sm muted hover:text-white">← Mon studio</Link>
      <h1 className="mt-3 text-2xl font-black">{script.hook}</h1>
      <Player
        script={script}
        theme={(request.theme ?? "violet") as Theme}
        timeline={{ starts: v.starts as number[], voiceEnd, duration: videoDuration(voiceEnd) }}
        audioBase64={v.audio_base64 as string}
      />
      <details className="card mt-8 p-5">
        <summary className="cursor-pointer font-bold">Texte de la voix off</summary>
        <div className="mt-3 grid gap-2 text-sm muted">
          <p>{script.hookVoice}</p>
          {script.points.map((p, i) => <p key={i}>{p.voice}</p>)}
          <p>{script.closingVoice}</p>
        </div>
      </details>
    </main>
  );
}
