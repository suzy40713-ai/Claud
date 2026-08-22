import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { CoachMessageDTO } from "@sports-coach/shared";
import { api, ApiError, streamCoachMessage } from "../../lib/api";
import { Button } from "../../components/ui/Button";

export function CoachPage() {
  const [messages, setMessages] = useState<CoachMessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .getCoachMessages()
      .then(({ messages }) => setMessages(messages))
      .finally(() => setLoading(false));
    api.getBillingStatus().then((s) => setPremium(s.premium));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    setError(null);

    const assistantId = `streaming-${Date.now()}`;
    let assistantDraft = "";

    try {
      await streamCoachMessage(content, (event) => {
        if (event.type === "user_message") {
          setMessages((prev) => [
            ...prev,
            event.message,
            { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString() },
          ]);
        } else if (event.type === "delta") {
          assistantDraft += event.text;
          const text = assistantDraft;
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m)));
        } else if (event.type === "done") {
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? event.message : m)));
        } else if (event.type === "error") {
          setError(event.error);
        }
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setPremium(false);
      } else {
        setError(err instanceof ApiError ? err.message : "Le coach IA est indisponible");
      }
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) return null;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-4 py-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">🤖 Coach IA</h1>
        <p className="text-sm text-slate-400">
          Pose une question sur ton entrainement. Pour toute douleur ou symptome, consulte un professionnel de sante.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Exemple : "Pourquoi je stagne sur mon 10k ?" ou "Je suis fatigue, je fais quand meme ma seance prevue ?"
          </p>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-base ${
                  m.role === "user" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.content || (m.role === "assistant" && sending ? "..." : "")}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {premium === false ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-sm">
          <span className="text-slate-600">Le coach IA conversationnel est une fonctionnalite premium.</span>
          <Link to="/abonnement">
            <Button variant="secondary">Passer premium</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ecris ton message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2.5"
          />
          <Button disabled={sending || !input.trim() || premium === null} onClick={handleSend}>
            {sending ? "..." : "Envoyer"}
          </Button>
        </div>
      )}
    </div>
  );
}
