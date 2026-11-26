import { Prose } from "@/components/prose";
import { legal } from "@/lib/legal";
import { formatEuros, PACKS } from "@/lib/packs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conditions générales de vente" };

export default function Page() {
  const l = legal();
  return (
    <Prose title="Conditions générales de vente">
      <p>Vendeur : {l.company}, SIREN {l.siren}, contact : {l.email}.</p>
      <h2>1. Service</h2>
      <p>
        VidaIA permet de générer des vidéos verticales à partir d&apos;une description : un script est écrit par une
        intelligence artificielle, une voix off de synthèse le lit, et la vidéo est assemblée dans le navigateur de
        l&apos;acheteur. Le résultat est produit automatiquement : il peut contenir des imprécisions, et l&apos;acheteur
        reste responsable de vérifier la vidéo avant de la publier.
      </p>
      <h2>2. Prix et paiement</h2>
      <p>
        Packs proposés : {PACKS.map((p) => `${p.name} (${p.videos} vidéos, ${formatEuros(p.priceCents)})`).join(", ")}. Prix en
        euros TTC, payés en une fois par carte via Stripe. Aucun abonnement.
      </p>
      <h2>3. Crédits</h2>
      <p>
        Chaque vidéo générée utilise 1 crédit. Les crédits n&apos;expirent pas. Si une génération échoue, le crédit est
        rendu automatiquement. Une vidéo déjà générée peut être refabriquée et téléchargée sans nouveau crédit.
      </p>
      <h2>4. Droit de rétractation</h2>
      <p>
        Il s&apos;agit d&apos;un contenu numérique fourni sans support matériel. En cochant la case prévue avant le paiement,
        l&apos;acheteur demande l&apos;accès immédiat au service et reconnaît perdre son droit de rétractation dès la première
        vidéo générée (article L221-28 13° du Code de la consommation). Tant qu&apos;aucune vidéo n&apos;a été générée,
        l&apos;acheteur peut demander le remboursement de son pack dans les 14 jours suivant l&apos;achat, en écrivant à {l.email}.
      </p>
      <h2>5. Utilisation des vidéos</h2>
      <p>
        L&apos;acheteur peut utiliser les vidéos générées, y compris à des fins commerciales. Il s&apos;engage à ne pas
        demander de contenu illégal, trompeur, haineux ou portant atteinte aux droits d&apos;autrui.
      </p>
      <h2>6. Réclamations et médiation</h2>
      <p>
        Toute réclamation est à adresser à {l.email}. En cas de litige non résolu, l&apos;acheteur consommateur peut
        recourir gratuitement à un médiateur de la consommation, ou à la plateforme européenne de règlement en ligne
        des litiges.
      </p>
    </Prose>
  );
}
