"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Check, Clock3, Sparkles, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { askAssistantAction, decideAssistantActionAction } from "./actions";

export type ChatAction = {
  id: string;
  summary: string;
  status: "pending" | "done" | "failed" | "expired" | "cancelled";
  warning: string | null;
  error: string | null;
};
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions: ChatAction[];
};

const SUGGESTIONS = [
  "Quels sont mes rendez-vous demain ?",
  "Combien de créneaux sont libres vendredi ?",
  "Prépare mon planning de demain.",
  "Quels clients n'ont pas repris rendez-vous ?",
  "Quels sont mes services les plus réservés ?",
  "Décale le rendez-vous de Thomas à 15 heures.",
];

const ACTION_STATUS: Record<ChatAction["status"], { label: string; icon: typeof Check }> = {
  pending: { label: "À confirmer", icon: Clock3 },
  done: { label: "Effectuée", icon: Check },
  failed: { label: "Échec", icon: XCircle },
  expired: { label: "Expirée", icon: Clock3 },
  cancelled: { label: "Abandonnée", icon: X },
};

function ActionCard({ action }: { action: ChatAction }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(action.status);
  const s = ACTION_STATUS[status];
  const decide = (confirm: boolean) =>
    startTransition(async () => {
      const res = await decideAssistantActionAction(action.id, confirm);
      if (res.ok) {
        setStatus(confirm ? "done" : "cancelled");
        toast.success(res.message);
      } else {
        toast.error(res.error);
        router.refresh();
      }
    });
  return (
    <div className="mt-2 rounded-lg border bg-subtle p-3" data-testid="assistant-action">
      <div className="flex flex-col-reverse items-start gap-2 sm:flex-row sm:justify-between">
        <p className="text-sm font-medium">{action.summary}</p>
        <Badge
          variant={status === "done" ? "success" : status === "pending" ? "warning" : "neutral"}
        >
          <s.icon className="size-3" aria-hidden /> {s.label}
        </Badge>
      </div>
      {action.warning && status === "pending" ? (
        <p className="mt-1 text-[13px] text-warning">{action.warning}</p>
      ) : null}
      {action.error ? <p className="mt-1 text-[13px] text-destructive">{action.error}</p> : null}
      {status === "pending" ? (
        <div className="mt-3 flex gap-2">
          <Button size="sm" disabled={pending} onClick={() => decide(true)}>
            {pending ? <Spinner /> : <Check />} Confirmer
          </Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => decide(false)}>
            Annuler
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function AssistantChat({
  initial,
  disabledReason,
}: {
  initial: ChatMessage[];
  disabledReason: string | null;
}) {
  const [messages, setMessages] = useState(initial);
  const [question, setQuestion] = useState("");
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const router = useRouter();

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || pending || disabledReason) return;
    setQuestion("");
    const temp: ChatMessage = { id: `tmp-${++seq.current}`, role: "user", content: q, actions: [] };
    setMessages((m) => [...m, temp]);
    startTransition(async () => {
      const res = await askAssistantAction(q);
      if (res.ok) {
        setMessages((m) => [
          ...m,
          {
            id: res.data.id,
            role: "assistant",
            content: res.data.content,
            actions: res.data.actions,
          },
        ]);
      } else {
        toast.error(res.error);
        setMessages((m) => m.filter((x) => x.id !== temp.id));
        setQuestion(q);
      }
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-[60dvh] flex-col rounded-2xl border bg-card shadow-xs">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Sparkles className="size-5" />
            </span>
            <p className="font-semibold">Que puis-je faire pour vous ?</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Je réponds à partir de vos vraies données et je vous demande toujours confirmation
              avant de modifier un rendez-vous.
            </p>
          </div>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            data-testid={`assistant-${m.role}`}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line sm:max-w-[85%]",
                m.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted",
              )}
            >
              {m.content}
              {m.actions.map((a) => (
                <ActionCard key={a.id} action={a} />
              ))}
            </div>
          </div>
        ))}
        {pending ? (
          <div className="flex justify-start" data-testid="assistant-thinking">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              <Spinner /> Analyse de vos données…
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="border-t p-3 sm:p-4">
        {!disabledReason ? (
          <div className="mb-3 scrollbar-none flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending}
                onClick={() => send(s)}
                className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(question);
          }}
        >
          <Textarea
            aria-label="Votre question"
            rows={1}
            maxLength={500}
            value={question}
            disabled={Boolean(disabledReason)}
            placeholder={disabledReason ?? "Posez une question sur vos rendez-vous…"}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(question);
              }
            }}
            className="max-h-32 min-h-10 resize-none"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Envoyer"
            disabled={pending || !question.trim() || Boolean(disabledReason)}
          >
            {pending ? <Spinner /> : <ArrowUp />}
          </Button>
        </form>
      </div>
    </div>
  );
}
