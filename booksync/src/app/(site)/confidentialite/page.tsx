import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { PUBLISHER, SUBPROCESSORS } from "@/lib/legal";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="5 novembre 2026">
      <section>
        <h2>Qui est responsable de vos données ?</h2>
        <p>
          Pour les comptes professionnels, le responsable de traitement est {PUBLISHER.companyName}{" "}
          ({PUBLISHER.email}). Pour les clients qui réservent un rendez-vous, le responsable de
          traitement est le professionnel concerné ; BookSync agit pour son compte en tant que
          sous-traitant.
        </p>
      </section>
      <section>
        <h2>Données collectées</h2>
        <ul>
          <li>
            Professionnels : nom, email, mot de passe chiffré, informations de l&apos;entreprise,
            données d&apos;usage du service.
          </li>
          <li>
            Clients finaux : prénom, nom, email, téléphone, historique des rendez-vous et message
            facultatif.
          </li>
          <li>
            Paiement des abonnements : traité par Stripe ; BookSync ne stocke aucune donnée de carte
            bancaire.
          </li>
        </ul>
        <p>
          Nous ne collectons aucune donnée de santé ni donnée sensible, et ne revendons aucune
          donnée.
        </p>
      </section>
      <section>
        <h2>Finalités et bases légales</h2>
        <ul>
          <li>Fourniture du service et gestion des rendez-vous : exécution du contrat.</li>
          <li>
            Emails de confirmation et de rappel : exécution du contrat ; le client peut s&apos;y
            opposer.
          </li>
          <li>Sécurité (journaux, limitation des tentatives de connexion) : intérêt légitime.</li>
          <li>Facturation : obligation légale.</li>
        </ul>
      </section>
      <section>
        <h2>Durées de conservation</h2>
        <ul>
          <li>
            Données de compte : pendant la durée de l&apos;abonnement, puis suppression à la
            fermeture du compte.
          </li>
          <li>
            Données des clients finaux : tant que le professionnel les conserve, au plus 3 ans après
            le dernier rendez-vous.
          </li>
          <li>Factures : 10 ans (obligation comptable).</li>
        </ul>
      </section>
      <section>
        <h2>Sous-traitants</h2>
        <table>
          <thead>
            <tr>
              <th>Prestataire</th>
              <th>Rôle</th>
              <th>Localisation</th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((s) => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td>{s.role}</td>
                <td>{s.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>
          BookSync n&apos;utilise que des cookies strictement nécessaires (session de connexion,
          entreprise active, préférence de thème). Aucun cookie publicitaire ni de mesure
          d&apos;audience tierce n&apos;est déposé.
        </p>
      </section>
      <section>
        <h2>Vos droits</h2>
        <p>
          Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation,
          d&apos;opposition et de portabilité. Les professionnels peuvent exporter leurs données et
          supprimer leur compte directement depuis leurs paramètres. Pour toute demande :{" "}
          {PUBLISHER.email}. Vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).
        </p>
      </section>
    </LegalPage>
  );
}
