import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { PLANS, formatPrice } from "@/domain/billing/plans";
import { PUBLISHER } from "@/lib/legal";

export const metadata: Metadata = { title: "Conditions générales" };

export default function TermsPage() {
  return (
    <LegalPage title="Conditions générales d'utilisation et de vente" updated="5 novembre 2026">
      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions régissent l&apos;utilisation du service BookSync, logiciel en ligne de gestion et de prise
          de rendez-vous édité par {PUBLISHER.companyName} (« BookSync »), par les professionnels (« l&apos;Abonné ») et par
          leurs clients lorsqu&apos;ils réservent un rendez-vous (« le Client final »).
        </p>
      </section>
      <section>
        <h2>2. Création de compte</h2>
        <p>
          L&apos;Abonné crée un compte avec une adresse email valide qu&apos;il confirme, ou via son compte Google. Il est
          responsable de la confidentialité de ses identifiants et de toute activité réalisée depuis son compte. Il peut
          inviter des collaborateurs, qui accèdent au service selon le rôle attribué (propriétaire, administrateur, employé).
        </p>
      </section>
      <section>
        <h2>3. Forfaits et prix</h2>
        <p>Le service est proposé selon les forfaits suivants (prix TTC, facturation mensuelle) :</p>
        <ul>
          {Object.values(PLANS).map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong> — {p.priceCents ? `${formatPrice(p.priceCents)} par mois` : "gratuit"} :{" "}
              {p.highlights.join(", ").toLowerCase()}.
            </li>
          ))}
        </ul>
        <p>
          Les abonnements payants sont réglés par carte bancaire via Stripe. Ils sont reconduits tacitement chaque mois et
          peuvent être résiliés à tout moment depuis l&apos;espace « Abonnement » ; la résiliation prend effet à la fin de la
          période en cours, sans remboursement de la période entamée. En cas de changement de forfait, la différence est
          calculée au prorata. En cas de défaut de paiement, le compte repasse au forfait Free ; aucune donnée n&apos;est
          supprimée.
        </p>
        <p>
          Conformément à l&apos;article L221-28 du Code de la consommation, l&apos;Abonné professionnel ne bénéficie pas du
          droit de rétractation ; il peut toutefois résilier à tout moment dans les conditions ci-dessus.
        </p>
      </section>
      <section>
        <h2>4. Réservations des Clients finaux</h2>
        <p>
          Les Clients finaux réservent sans créer de compte. Ils reçoivent un lien personnel leur permettant de modifier ou
          d&apos;annuler leur rendez-vous dans le délai fixé par l&apos;Abonné. Aucun paiement n&apos;est effectué en ligne :
          la prestation est réglée directement auprès de l&apos;Abonné, qui reste seul responsable de ses prestations, de
          ses prix et de ses conditions d&apos;annulation.
        </p>
      </section>
      <section>
        <h2>5. Obligations de l&apos;Abonné</h2>
        <ul>
          <li>Utiliser le service conformément à la loi et ne pas y enregistrer de contenu illicite.</li>
          <li>
            Ne pas enregistrer de données de santé ou de données sensibles au sens de l&apos;article 9 du RGPD dans les notes
            clients.
          </li>
          <li>Informer ses clients du traitement de leurs données, dont il est responsable de traitement.</li>
        </ul>
      </section>
      <section>
        <h2>6. Disponibilité et responsabilité</h2>
        <p>
          BookSync met en œuvre les moyens raisonnables pour assurer la disponibilité et la sécurité du service, sans
          garantie d&apos;absence d&apos;interruption. Sa responsabilité est limitée aux dommages directs et plafonnée au
          montant payé par l&apos;Abonné au cours des douze derniers mois.
        </p>
      </section>
      <section>
        <h2>7. Données personnelles</h2>
        <p>
          BookSync agit en qualité de sous-traitant pour les données des Clients finaux traitées pour le compte de
          l&apos;Abonné, et de responsable de traitement pour les données de compte de l&apos;Abonné. Les détails figurent
          dans la politique de confidentialité.
        </p>
      </section>
      <section>
        <h2>8. Résiliation et suppression du compte</h2>
        <p>
          L&apos;Abonné peut exporter ses données puis supprimer son compte à tout moment depuis ses paramètres. La
          suppression est définitive. BookSync peut suspendre un compte en cas de manquement grave aux présentes conditions.
        </p>
      </section>
      <section>
        <h2>9. Droit applicable</h2>
        <p>
          Les présentes conditions sont soumises au droit français. À défaut de résolution amiable, tout litige relève des
          tribunaux compétents du ressort du siège de l&apos;éditeur.
        </p>
      </section>
    </LegalPage>
  );
}
