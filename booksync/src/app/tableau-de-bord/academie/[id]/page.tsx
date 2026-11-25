import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { findLesson, nextLesson } from "@/domain/academy/lessons";
import { PLANS } from "@/domain/billing/plans";
import { canReadLesson, completedLessons } from "@/server/academy/progress";
import { requireOrg } from "@/server/auth/session";
import { LessonDoneButton } from "./done-button";

export const metadata: Metadata = { title: "Leçon" };

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = findLesson(id);
  if (!lesson) notFound();
  const ctx = await requireOrg();
  const open = canReadLesson(ctx, id);
  const done = (await completedLessons(ctx)).has(id);
  const next = nextLesson(id);
  return (
    <article className="mx-auto grid w-full max-w-2xl gap-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/tableau-de-bord/academie">
            <ArrowLeft /> Académie
          </Link>
        </Button>
        <h1
          className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
          data-testid="lesson-title"
        >
          {lesson.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{lesson.minutes} minutes de lecture</p>
      </div>
      {open ? (
        <>
          <div className="grid gap-4 text-[16px] leading-relaxed">
            {lesson.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <section className="rounded-2xl border bg-primary-soft p-5">
            <h2 className="font-semibold">À retenir</h2>
            <ul className="mt-2 grid list-disc gap-1 pl-5">
              {lesson.keyPoints.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Ton action maintenant</h2>
            <Button asChild className="mt-3">
              <Link href={lesson.action.href as Route}>
                {lesson.action.label} <ArrowRight />
              </Link>
            </Button>
          </section>
          <div className="flex flex-wrap gap-2">
            <LessonDoneButton lessonId={lesson.id} done={done} />
            {next ? (
              <Button asChild variant="ghost">
                <Link href={`/tableau-de-bord/academie/${next.id}` as Route}>
                  Leçon suivante <ArrowRight />
                </Link>
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <section
          className="grid gap-3 rounded-2xl border bg-card p-6 text-center"
          data-testid="lesson-locked"
        >
          <Lock className="mx-auto size-8 text-muted-foreground" />
          <p className="font-semibold">
            Cette leçon est incluse dans le forfait {PLANS[lesson.minPlan].name}.
          </p>
          <p className="text-sm text-muted-foreground">{lesson.paragraphs[0]}</p>
          <div>
            <Button asChild>
              <Link href="/tableau-de-bord/abonnement">Débloquer toute l&apos;Académie</Link>
            </Button>
          </div>
        </section>
      )}
    </article>
  );
}

export default function LessonPage(props: PageProps<"/tableau-de-bord/academie/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content params={props.params} />
    </Suspense>
  );
}
