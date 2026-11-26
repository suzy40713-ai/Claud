import { Prose } from "@/components/prose";
import { legal } from "@/lib/legal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confidentialité" };

export default function Page() {
  const l = legal();
  return (
    <Prose title="Politique de confidentialité">
      <p>Responsable du traitement : {l.company}, contact : {l.email}.</p>
      <h2>Données collectées</h2>
      <p>
        Adresse email (fournie lors du paiement), historique d&apos;achats, descriptions saisies et vidéos générées
        (script et voix off). Les données de carte bancaire sont traitées uniquement par Stripe.
      </p>
      <h2>Finalités</h2>
      <p>Fournir le service (génération des vidéos, gestion des crédits), envoyer le lien d&apos;accès, tenir la comptabilité.</p>
      <h2>Sous-traitants</h2>
      <p>
        Stripe (paiement), Groq (écriture des scripts : la description lui est transmise), ElevenLabs (voix off : le
        texte du script lui est transmis), Resend (emails), Supabase et Render (hébergement).
      </p>
      <h2>Durée de conservation</h2>
      <p>Tant que le compte est utilisé, puis 3 ans ; les données comptables 10 ans.</p>
      <h2>Vos droits</h2>
      <p>
        Accès, rectification, suppression, opposition et portabilité : écrivez à {l.email}. Vous pouvez aussi saisir la
        CNIL (cnil.fr).
      </p>
      <p>Aucun cookie publicitaire : seul un cookie de session est utilisé pour vous garder connecté à votre studio.</p>
    </Prose>
  );
}
