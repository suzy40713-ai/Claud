"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { askAssistantAction } from "./actions";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Comment trouver mes 10 premiers clients ?",
  "Comment améliorer mon offre ?",
  "Quelle publicité tester en premier ?",
  "Quel canal marketing choisir ?",
  "Comment présenter mon produit en une phrase ?",
  "Que faire aujourd'hui pour vendre ?",
];

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
    const temp: ChatMessage = { id: `tmp-${++seq.current}`, role: "user", content: q };
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
              Je connais vos produits, vos analyses, votre stratégie et vos résultats : posez-moi
              vos questions de marketing et de vente.
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
            </div>
          </div>
        ))}
        {pending ? (
          <div className="flex justify-start" data-testid="assistant-thinking">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              <Spinner /> Réflexion en cours…
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
            placeholder={disabledReason ?? "Posez votre question marketing…"}
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
