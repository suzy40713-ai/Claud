import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { REPS_REQUISES, FRAMES_PAR_DEFI, type RankStatusDTO } from "@sports-coach/shared";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { extractFrames, pickRecorderMimeType } from "./video-frames";

const RANK_EMOJIS = ["🥉", "🥈", "🥇", "💠", "💎"];
const MAX_RECORD_SECONDS = 20;

type Phase = "idle" | "camera" | "recording" | "processing" | "error";

export function RankChallengeCard() {
  const [status, setStatus] = useState<RankStatusDTO | null>(null);
  const [previousRang, setPreviousRang] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(MAX_RECORD_SECONDS);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.getRankStatus().then(setStatus);
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setPhase("camera");
      // Le <video> n'est monte qu'apres le changement de phase : on attache
      // le flux au prochain tick.
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setError("Impossible d'acceder a la camera. Verifie les autorisations de ton navigateur.");
      setPhase("error");
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = pickRecorderMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => handleRecordingStopped(mimeType ?? "video/webm");
    recorderRef.current = recorder;
    recorder.start();

    setSecondsLeft(MAX_RECORD_SECONDS);
    setPhase("recording");
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          stopRecording();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
  }

  async function handleRecordingStopped(mimeType: string) {
    stopStream();
    setPhase("processing");
    try {
      const videoBlob = new Blob(chunksRef.current, { type: mimeType });
      const frames = await extractFrames(videoBlob, FRAMES_PAR_DEFI);
      setPreviousRang(status?.rang ?? null);
      const updated = await api.submitPushupChallenge(frames);
      setStatus(updated);
      setPhase("idle");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'analyser cette video. Reessaie.");
      setPhase("error");
    }
  }

  function cancel() {
    stopStream();
    setPhase("idle");
  }

  if (!status) return null;

  const rangChange =
    phase === "idle" && previousRang !== null && previousRang !== status.rang ? status.rang - previousRang : 0;

  return (
    <div className="glass-card flex flex-col gap-4 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Defi de la semaine</p>
          <h2 className="text-lg font-bold">💪 {REPS_REQUISES} pompes</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-sm">
          <span className="text-2xl leading-none">{RANK_EMOJIS[status.rang]}</span>
          <span className="text-sm font-bold text-slate-800">{status.rangLabel}</span>
        </div>
      </div>

      <AnimatePresence>
        {rangChange !== 0 && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-sm font-semibold ${rangChange > 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            {rangChange > 0 ? `🎉 Tu passes ${status.rangLabel} !` : `Tu redescends en ${status.rangLabel}...`}
          </motion.p>
        )}
      </AnimatePresence>

      {phase === "idle" && (
        <>
          {status.defiCourant ? (
            <div
              className={`rounded-xl p-4 text-sm ${
                status.defiCourant.statut === "reussi"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <p className="font-bold">
                {status.defiCourant.statut === "reussi" ? "✅ Defi reussi cette semaine" : "❌ Defi rate cette semaine"}
                {" · "}
                {status.defiCourant.repsDetectees} pompes detectees
              </p>
              <p className="mt-1">{status.defiCourant.commentaire}</p>
              <p className="mt-2 text-xs text-slate-400">Rendez-vous la semaine prochaine pour un nouveau defi.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                Filme-toi en train de faire {REPS_REQUISES} pompes. L'IA verifie ta forme et ton rang evolue en
                consequence : reussi = tu montes d'un rang, rate ou pas envoye avant la fin de la semaine = tu
                redescends.
              </p>
              <Button onClick={startCamera}>🎥 Filmer mes pompes</Button>
            </>
          )}
        </>
      )}

      {phase === "camera" && (
        <div className="flex flex-col gap-3">
          <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-xl bg-black" />
          <div className="flex gap-2">
            <Button onClick={startRecording}>● Demarrer l'enregistrement</Button>
            <Button variant="ghost" onClick={cancel}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {phase === "recording" && (
        <div className="flex flex-col gap-3">
          <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-xl bg-black" />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-red-600">
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-red-600" /> Enregistrement... {secondsLeft}s
            </span>
            <Button onClick={stopRecording}>J'ai fini</Button>
          </div>
        </div>
      )}

      {phase === "processing" && (
        <p className="text-sm font-medium text-indigo-600">Analyse de ta serie en cours...</p>
      )}

      {phase === "error" && (
        <div className="flex flex-col gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            variant="secondary"
            onClick={() => {
              setPhase("idle");
              setError(null);
            }}
          >
            Retour
          </Button>
        </div>
      )}
    </div>
  );
}
