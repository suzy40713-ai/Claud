"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

import { DemoBadge } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateCreation } from "@/lib/actions/ai";
import type { AdCreation } from "@/lib/ai/schemas";

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("Copie impossible : sélectionne le texte manuellement.");
        }
      }}
      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      aria-label="Copier le texte"
    >
      {done ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function EditableText({ value, editing, onChange, multiline }: { value: string; editing: boolean; onChange: (v: string) => void; multiline?: boolean }) {
  if (!editing) return <p className="flex-1 whitespace-pre-line text-sm leading-relaxed">{value}</p>;
  return multiline ? (
    <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="flex-1 text-sm" />
  ) : (
    <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 text-sm" />
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function Row({ children, copy }: { children: React.ReactNode; copy: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-background/40 p-3">
      {children}
      <CopyButton text={copy} />
    </div>
  );
}

export function CreationView({ id, title, initial, isDemo }: { id: string; title: string; initial: AdCreation; isDemo: boolean }) {
  const [data, setData] = useState(initial);
  const [name, setName] = useState(title);
  const [baseline, setBaseline] = useState({ data: initial, name: title });
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  function update<K extends keyof AdCreation>(key: K, value: AdCreation[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }
  function setAt<T>(arr: T[], i: number, v: T) {
    return arr.map((x, j) => (j === i ? v : x));
  }

  function save() {
    start(async () => {
      const res = await updateCreation(id, name, data);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Modifications enregistrées");
      setBaseline({ data, name });
      setEditing(false);
    });
  }

  const all = [
    `# ${name}`,
    "## Accroches", ...data.hooks.map((h) => `- ${h}`),
    "## Textes", ...data.ad_copies.map((c) => `[${c.angle}]\n${c.text}`),
    "## CTA", ...data.ctas.map((c) => `- ${c}`),
    "## Concepts vidéo", ...data.video_concepts.map((v) => `${v.title} (${v.duration})\n${v.scenes.map((s) => `  • ${s}`).join("\n")}`),
    "## Visuels", ...data.visual_suggestions.map((v) => `- ${v}`),
    "## TikTok", data.platform_variants.tiktok, "## Instagram", data.platform_variants.instagram, "## Facebook", data.platform_variants.facebook,
  ].join("\n");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {editing ? (
          <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-sm" aria-label="Titre de la création" />
        ) : (
          <h2 className="flex items-center gap-2 text-lg font-semibold">{name} {isDemo && <DemoBadge />}</h2>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={async () => { await navigator.clipboard.writeText(all).catch(() => null); toast.success("Tout le contenu a été copié"); }}>
            <Copy /> Tout copier
          </Button>
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => { setData(baseline.data); setName(baseline.name); setEditing(false); }} disabled={pending}><X /> Annuler</Button>
              <Button variant="brand" size="sm" onClick={save} disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Enregistrer</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil /> Modifier</Button>
          )}
        </div>
      </div>
      {isDemo && <p className="text-xs text-warning">Résultat de démonstration — non généré par l'IA (clé API non configurée).</p>}
      <p className="text-xs text-muted-foreground">Contenus générés par IA : relis-les et vérifie chaque affirmation avant diffusion. Remplace les éléments entre [crochets] par des informations réelles.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Block title="5 accroches">
          {data.hooks.map((h, i) => (
            <Row key={i} copy={h}><EditableText value={h} editing={editing} onChange={(v) => update("hooks", setAt(data.hooks, i, v))} /></Row>
          ))}
        </Block>
        <Block title="3 appels à l'action">
          {data.ctas.map((c, i) => (
            <Row key={i} copy={c}><EditableText value={c} editing={editing} onChange={(v) => update("ctas", setAt(data.ctas, i, v))} /></Row>
          ))}
        </Block>
      </div>
      <Block title="3 textes publicitaires">
        <div className="grid gap-3 lg:grid-cols-3">
          {data.ad_copies.map((c, i) => (
            <div key={i} className="flex flex-col rounded-lg border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-violet-400">{c.angle}</span>
                <CopyButton text={c.text} />
              </div>
              <div className="mt-2 flex">
                <EditableText multiline value={c.text} editing={editing} onChange={(v) => update("ad_copies", setAt(data.ad_copies, i, { ...c, text: v }))} />
              </div>
            </div>
          ))}
        </div>
      </Block>
      <Block title="3 concepts de vidéos courtes">
        <div className="grid gap-3 lg:grid-cols-3">
          {data.video_concepts.map((v, i) => (
            <div key={i} className="rounded-lg border border-border bg-background/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{v.title} <span className="text-xs text-muted-foreground">· {v.duration}</span></p>
                <CopyButton text={`${v.title} (${v.duration})\n${v.scenes.map((s) => `• ${s}`).join("\n")}`} />
              </div>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
                {v.scenes.map((s, j) => <li key={j}>{s}</li>)}
              </ol>
            </div>
          ))}
        </div>
      </Block>
      <Block title="Suggestions de visuels">
        {data.visual_suggestions.map((v, i) => (
          <Row key={i} copy={v}><EditableText value={v} editing={editing} onChange={(x) => update("visual_suggestions", setAt(data.visual_suggestions, i, x))} /></Row>
        ))}
      </Block>
      <Block title="Variantes par plateforme">
        <div className="grid gap-3 lg:grid-cols-3">
          {(["tiktok", "instagram", "facebook"] as const).map((p) => (
            <div key={p} className="flex flex-col rounded-lg border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium capitalize">{p === "tiktok" ? "TikTok" : p === "instagram" ? "Instagram" : "Facebook"}</span>
                <CopyButton text={data.platform_variants[p]} />
              </div>
              <div className="mt-2 flex">
                <EditableText multiline value={data.platform_variants[p]} editing={editing} onChange={(v) => update("platform_variants", { ...data.platform_variants, [p]: v })} />
              </div>
            </div>
          ))}
        </div>
      </Block>
    </div>
  );
}
