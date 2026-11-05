import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { CalendarCheck, BellRing, Globe2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { SystemStatus, SystemStatusSkeleton } from "./system-status";

const pillars = [
  {
    icon: CalendarCheck,
    title: "Agenda intelligent",
    text: "Horaires, pauses, congés et temps tampons : vos disponibilités calculées sans erreur.",
  },
  {
    icon: Globe2,
    title: "Réservation en ligne",
    text: "Une page de réservation élégante, pensée d'abord pour le mobile.",
  },
  {
    icon: BellRing,
    title: "Rappels automatiques",
    text: "Confirmations et rappels envoyés pour vous, pour réduire les rendez-vous manqués.",
  },
];

export default function HomePage() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--primary-soft),transparent)]"
      />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/connexion">Connexion</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/inscription">Essayer</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pt-14 pb-16 text-center sm:px-6 sm:pt-24">
        <Badge variant="primary" className="mb-6">
          En construction · version privée
        </Badge>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          La prise de <span className="whitespace-nowrap">rendez-vous</span>,{" "}
          <span className="text-primary">enfin simple.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          BookSync réunit votre agenda, votre page de réservation et vos rappels clients dans un
          seul outil, conçu pour les professionnels.
        </p>

        <ul className="mt-14 grid w-full gap-3 text-left sm:grid-cols-3 sm:gap-4">
          {pillars.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border bg-card p-5 shadow-xs">
              <span className="mb-4 inline-flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
                <Icon className="size-[18px]" />
              </span>
              <h2 className="font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 w-full max-w-sm">
          <Suspense fallback={<SystemStatusSkeleton />}>
            <SystemStatus />
          </Suspense>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © <CurrentYear /> BookSync
      </footer>
    </div>
  );
}

async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
