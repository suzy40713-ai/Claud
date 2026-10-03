import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ_ITEMS, Faq, Features, FinalCta, HowItWorks, Testimonials, Transparency } from "@/components/marketing/sections";
import { Button } from "@/components/ui/button";
import { DEFAULT_PLANS } from "@/lib/plans";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: { absolute: "AdHunter — Trouve les publicités gagnantes, crée des campagnes plus intelligentes" },
  description:
    "Explore les bibliothèques publicitaires officielles (Meta, TikTok), analyse les publicités de tes concurrents avec l'IA et crée des campagnes plus efficaces. Gratuit pour commencer.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteConfig.url,
      description: siteConfig.description,
      offers: Object.values(DEFAULT_PLANS).map((p) => ({
        "@type": "Offer",
        name: p.name,
        price: (p.priceCents / 100).toFixed(2),
        priceCurrency: "EUR",
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-radial-violet" aria-hidden />
        <div className="container relative pb-20 pt-20 text-center sm:pt-28">
          <Link
            href="/fonctionnalites"
            className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Sources officielles Meta &amp; TikTok · Analyse IA
            <ArrowRight className="h-3 w-3" />
          </Link>
          <h1 className="mx-auto mt-6 max-w-4xl animate-fade-in-up text-balance text-4xl font-semibold leading-[1.05] sm:text-6xl">
            <span className="text-gradient-brand">Trouve les publicités gagnantes.</span>
            <br />
            Crée des campagnes plus intelligentes.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-fade-in-up text-balance text-lg text-muted-foreground [animation-delay:100ms]">
            Découvre les stratégies publicitaires de ton marché, analyse les tendances et transforme tes découvertes en opportunités commerciales.
          </p>
          <div className="mt-10 flex animate-fade-in-up flex-col justify-center gap-3 [animation-delay:200ms] sm:flex-row">
            <Button asChild size="lg" variant="brand">
              <Link href="/signup">
                Commencer gratuitement <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/fonctionnalites">Découvrir la plateforme</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Gratuit, sans carte bancaire.</p>
          <div className="mt-16 animate-fade-in-up [animation-delay:300ms]">
            <DashboardPreview />
          </div>
        </div>
      </section>
      <Features />
      <HowItWorks />
      <Transparency />
      <Pricing />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  );
}
