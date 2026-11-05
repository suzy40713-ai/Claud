import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Bloc de paramètres : titre et description à gauche (ordinateur), contenu à droite. */
export function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-4 border-b pb-8 last:border-b-0 lg:grid-cols-[260px_1fr] lg:gap-10", className)}>
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="min-w-0 rounded-xl border bg-card p-4 shadow-xs sm:p-6">{children}</div>
    </section>
  );
}

export function UpgradeNotice({ feature, plan = "Pro" }: { feature: string; plan?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary-soft p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-primary-soft-foreground">
        {feature} {feature.endsWith("s") ? "sont inclus" : "est inclus"} dans le forfait <strong>{plan}</strong>.
      </p>
      <Link href="/tableau-de-bord/abonnement" className="font-semibold whitespace-nowrap text-primary hover:underline">
        Voir les forfaits →
      </Link>
    </div>
  );
}
