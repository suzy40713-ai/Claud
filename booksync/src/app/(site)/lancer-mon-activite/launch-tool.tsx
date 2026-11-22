"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, ExternalLink, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { activityLabel } from "@/domain/activities";
import {
  buildLaunchPlan,
  LAUNCH_ACTIVITIES,
  PLACE_LABELS,
  type LaunchActivity,
  type LaunchLevel,
  type LaunchPlace,
} from "@/domain/launch/plan";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";

function minutes(m: number) {
  return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ""}` : `${m} min`;
}

export function LaunchTool() {
  const [activity, setActivity] = useState<LaunchActivity>("onglerie");
  const [firstName, setFirstName] = useState("");
  const [city, setCity] = useState("");
  const [place, setPlace] = useState<LaunchPlace>("domicile");
  const [level, setLevel] = useState<LaunchLevel>("debutant");
  const plan = useMemo(
    () => buildLaunchPlan({ activity, firstName, city, place, level }),
    [activity, firstName, city, place, level],
  );
  const [chosen, setChosen] = useState<string | null>(null);
  const name = chosen && plan.names.includes(chosen) ? chosen : plan.names[0];
  const next = `/onboarding?nom=${encodeURIComponent(name)}&activite=${activity}`;
  const signUpHref = `/inscription?pro=1&redirection=${encodeURIComponent(next)}` as Route;

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:items-start">
      <form
        className="grid gap-4 rounded-3xl border bg-card p-6 shadow-sm lg:sticky lg:top-24"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Ton projet"
      >
        <p className="font-semibold">Ton projet</p>
        <Field id="activity" label="Ton métier">
          <NativeSelect
            id="activity"
            value={activity}
            onChange={(e) => setActivity(e.target.value as LaunchActivity)}
          >
            {LAUNCH_ACTIVITIES.map((a) => (
              <option key={a} value={a}>
                {activityLabel(a)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="firstName" label="Ton prénom">
          <Input
            id="firstName"
            value={firstName}
            maxLength={30}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Inès"
          />
        </Field>
        <Field id="city" label="Ta ville">
          <Input
            id="city"
            value={city}
            maxLength={40}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Lyon"
          />
        </Field>
        <Field id="place" label="Où tu travailles">
          <NativeSelect
            id="place"
            value={place}
            onChange={(e) => setPlace(e.target.value as LaunchPlace)}
          >
            {(Object.keys(PLACE_LABELS) as LaunchPlace[]).map((p) => (
              <option key={p} value={p}>
                {PLACE_LABELS[p]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Ton expérience</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["debutant", "Je débute"],
                ["confirme", "J'ai de l'expérience"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={level === v}
                onClick={() => setLevel(v)}
                className={cn(
                  "h-10 rounded-lg border text-sm font-medium",
                  level === v
                    ? "border-primary bg-primary-soft text-primary-soft-foreground"
                    : "hover:bg-subtle",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </form>

      <div className="grid gap-5" data-testid="launch-plan">
        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">1. Choisis ton nom</h2>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Idées de nom">
            {plan.names.map((n) => (
              <li key={n}>
                <button
                  type="button"
                  aria-pressed={n === name}
                  onClick={() => setChosen(n)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium",
                    n === name
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-subtle",
                  )}
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Avant de choisir, vérifie que le nom est libre sur Instagram et TikTok.
          </p>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">2. Tes prestations et tes prix de départ</h2>
          <ul className="mt-4 divide-y" data-testid="launch-services">
            {plan.services.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground"> · {minutes(s.durationMinutes)}</span>
                </span>
                <span className="font-semibold">{formatCents(s.priceCents)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Des exemples pour démarrer, pas une règle : regarde les prix près de chez toi et ajuste.
            {level === "debutant" ? " Un peu plus bas pour remplir ton agenda au début." : ""}
          </p>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">3. Ta bio Instagram / TikTok</h2>
            <CopyButton value={plan.bio} label="Copier la bio" />
          </div>
          <pre
            className="mt-4 rounded-xl bg-subtle p-4 font-sans text-sm whitespace-pre-wrap"
            data-testid="launch-bio"
          >
            {plan.bio}
          </pre>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">4. Ton plan sur 7 jours</h2>
          <ol className="mt-4 grid gap-4">
            {plan.checklist.map((step) => (
              <li key={step.title} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="text-sm">
                  <p className="font-medium">
                    <span className="text-muted-foreground">{step.day} · </span>
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">{step.detail}</p>
                  {step.link ? (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {step.link.replace("https://", "")} <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-xl bg-subtle p-4 text-sm">
            <p className="font-medium">Tes 3 premières idées de vidéos</p>
            <ul className="mt-2 grid list-disc gap-1 pl-5 text-muted-foreground">
              {plan.videos.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex flex-col items-center rounded-3xl bg-[#0a0a0c] px-6 py-10 text-center text-white">
          <Rocket className="size-9 text-[#8fb0ff]" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance">
            Crée ta page « {name} » maintenant
          </h2>
          <p className="mt-2 max-w-md text-white/60">
            Gratuit, sans carte bancaire. Tes prestations sont déjà prêtes : tes clientes peuvent
            réserver dès aujourd&apos;hui.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 rounded-full bg-white px-6 text-[#0a0a0c] hover:bg-white/90"
          >
            <Link href={signUpHref}>
              Créer ma page gratuite <ArrowRight />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
