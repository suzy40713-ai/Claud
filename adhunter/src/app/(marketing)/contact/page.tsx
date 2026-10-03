import { Mail } from "lucide-react";

import { ContactForm } from "@/components/marketing/contact-form";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description: "Une question sur AdHunter, ton abonnement ou tes données ? Écris-nous.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="container grid max-w-5xl gap-12 py-20 md:grid-cols-[1fr_1.3fr]">
      <div>
        <h1 className="text-4xl font-semibold">Contact</h1>
        <p className="mt-4 text-muted-foreground">Une question sur le produit, ton abonnement, une demande RGPD ou un partenariat ? Nous répondons sous 2 jours ouvrés.</p>
        <a href={`mailto:${siteConfig.contactEmail}`} className="mt-8 inline-flex items-center gap-2 text-sm text-foreground hover:text-violet-400">
          <Mail className="h-4 w-4" /> {siteConfig.contactEmail}
        </a>
      </div>
      <div className="surface p-6 sm:p-8">
        <ContactForm />
      </div>
    </section>
  );
}
