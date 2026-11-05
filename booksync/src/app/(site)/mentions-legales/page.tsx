import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { PUBLISHER } from "@/lib/legal";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales" updated="5 novembre 2026">
      <section>
        <h2>Éditeur du service</h2>
        <p>
          Le service BookSync est édité par {PUBLISHER.companyName}, {PUBLISHER.legalForm}, dont le
          siège social est situé {PUBLISHER.address}, immatriculée sous le numéro{" "}
          {PUBLISHER.registration}. Numéro de TVA intracommunautaire : {PUBLISHER.vat}.
        </p>
        <p>Directeur de la publication : {PUBLISHER.director}.</p>
        <p>Contact : {PUBLISHER.email}</p>
      </section>
      <section>
        <h2>Hébergement</h2>
        <p>
          L&apos;application est hébergée par Render Services, Inc., 525 Brannan Street, Suite 300,
          San Francisco, CA 94107, États-Unis, sur des serveurs situés dans l&apos;Union européenne
          (Francfort, Allemagne).
        </p>
        <p>
          Les données sont stockées par Supabase, Inc., dans une base de données située dans
          l&apos;Union européenne.
        </p>
      </section>
      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des éléments du service (marque, logo, interface, textes, code) est
          protégé par le droit de la propriété intellectuelle. Toute reproduction sans autorisation
          préalable est interdite.
        </p>
      </section>
      <section>
        <h2>Données personnelles</h2>
        <p>
          Le traitement des données personnelles est décrit dans notre{" "}
          <Link href="/confidentialite" className="text-primary underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>
    </LegalPage>
  );
}
