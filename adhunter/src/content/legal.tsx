import Link from "next/link";

import { siteConfig } from "@/lib/site";

const L = siteConfig.legal;
const email = siteConfig.contactEmail;

export interface LegalPage {
  slug: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    description: "Informations légales relatives à l'éditeur et à l'hébergeur du site AdHunter.",
    content: (
      <>
        <h2>Éditeur du site</h2>
        <p>
          Le site et le service {siteConfig.name} sont édités par <strong>{L.companyName}</strong>, {L.legalForm}, dont le siège social est situé {L.address}, immatriculée sous le numéro {L.registration}, numéro de TVA intracommunautaire {L.vat}.
        </p>
        <p>Directeur de la publication : {L.director}.</p>
        <p>Contact : <a href={`mailto:${email}`}>{email}</a> — ou via la <Link href="/contact">page de contact</Link>.</p>
        <h2>Hébergement</h2>
        <p>Le site est hébergé par {L.host}. Les données de l'application sont hébergées par Supabase (région de l'Union européenne sélectionnée lors de la configuration).</p>
        <h2>Propriété intellectuelle</h2>
        <p>
          La marque {siteConfig.name}, le logo, la charte graphique, les textes et le code du service sont protégés. Toute reproduction non autorisée est interdite. Les publicités affichées dans le service restent la propriété de leurs annonceurs respectifs ; elles proviennent des bibliothèques publicitaires publiques officielles et sont présentées à des fins d'information et d'analyse.
        </p>
        <h2>Marques tierces</h2>
        <p>Meta, Facebook, Instagram et TikTok sont des marques de leurs propriétaires respectifs. {siteConfig.name} n'est ni affilié, ni sponsorisé, ni approuvé par ces sociétés.</p>
      </>
    ),
  },
  {
    slug: "cgu",
    title: "Conditions générales d'utilisation",
    description: "Règles d'utilisation de la plateforme AdHunter.",
    content: (
      <>
        <h2>1. Objet</h2>
        <p>Les présentes conditions générales d'utilisation (CGU) encadrent l'accès et l'utilisation du service {siteConfig.name}, plateforme d'exploration et d'analyse de publicités issues de bibliothèques publicitaires officielles, et d'aide à la création publicitaire assistée par intelligence artificielle.</p>
        <h2>2. Accès au service et compte</h2>
        <p>L'utilisation des fonctionnalités nécessite la création d'un compte. Tu t'engages à fournir des informations exactes et à préserver la confidentialité de ton mot de passe. Tu es responsable des actions effectuées depuis ton compte. Le service est destiné aux personnes majeures et aux professionnels.</p>
        <h2>3. Description du service</h2>
        <ul>
          <li>Recherche de publicités via des sources officielles (Meta Ad Library API, TikTok Commercial Content API) lorsque leur accès est disponible ;</li>
          <li>Analyse de publicités par IA, présentée à titre d'estimation, sans valeur de donnée de performance vérifiée ;</li>
          <li>Génération de contenus publicitaires originaux par IA ;</li>
          <li>Radar de tendances fondé sur les données collectées par le service, avec indication de la taille de l'échantillon ;</li>
          <li>Favoris, collections, notes et, selon la formule, outils d'équipe et exports.</li>
        </ul>
        <p>{siteConfig.name} ne dispose d'aucune donnée privée des annonceurs (budgets, ventes, taux de conversion) et ne prétend pas en disposer.</p>
        <h2>4. Usages interdits</h2>
        <ul>
          <li>Reproduire intégralement des publicités de tiers ou porter atteinte à leurs droits de propriété intellectuelle ou à leurs marques ;</li>
          <li>Extraire massivement les données du service, contourner les quotas ou les mesures de sécurité ;</li>
          <li>Utiliser les contenus générés pour des publicités trompeuses, illicites ou contraires aux règles des plateformes publicitaires ;</li>
          <li>Partager son compte au-delà des membres d'équipe prévus par la formule.</li>
        </ul>
        <h2>5. Contenus générés par l'IA</h2>
        <p>Les contenus générés te sont fournis pour ton usage. Ils peuvent contenir des erreurs : tu dois les relire, les vérifier et t'assurer de leur conformité (droit de la consommation, règles des plateformes, droits des tiers) avant toute diffusion. Tu restes seul responsable des publicités que tu diffuses.</p>
        <h2>6. Disponibilité</h2>
        <p>Nous mettons tout en œuvre pour assurer la disponibilité du service, sans garantie d'accès ininterrompu. Les sources externes (Meta, TikTok, fournisseur d'IA) peuvent être temporairement indisponibles ou modifier leurs conditions d'accès ; certaines fonctionnalités peuvent alors être indiquées comme « en préparation » ou indisponibles.</p>
        <h2>7. Responsabilité</h2>
        <p>Les analyses et tendances fournies sont des aides à la décision. {siteConfig.name} ne saurait garantir un résultat commercial. Dans les limites autorisées par la loi, notre responsabilité est limitée aux dommages directs et prévisibles.</p>
        <h2>8. Suspension et suppression</h2>
        <p>Tu peux supprimer ton compte à tout moment depuis tes paramètres. Nous pouvons suspendre un compte en cas de violation des présentes CGU, après notification sauf urgence.</p>
        <h2>9. Données personnelles</h2>
        <p>Le traitement de tes données est décrit dans notre <Link href="/legal/confidentialite">politique de confidentialité</Link>.</p>
        <h2>10. Modification et droit applicable</h2>
        <p>Les CGU peuvent évoluer ; tu seras informé de toute modification substantielle. Elles sont soumises au droit français.</p>
        <p className="text-xs">Dernière mise à jour : {siteConfig.lastLegalUpdate}.</p>
      </>
    ),
  },
  {
    slug: "cgv",
    title: "Conditions générales de vente",
    description: "Conditions applicables aux abonnements payants AdHunter Pro et Business.",
    content: (
      <>
        <h2>1. Champ d'application</h2>
        <p>Les présentes conditions générales de vente (CGV) s'appliquent à la souscription des abonnements payants proposés par {L.companyName} sur {siteConfig.name}. Elles complètent les <Link href="/legal/cgu">CGU</Link>.</p>
        <h2>2. Offres et prix</h2>
        <p>Les formules, leurs fonctionnalités, quotas et prix sont décrits sur la <Link href="/tarifs">page Tarifs</Link>. Les prix sont indiqués en euros toutes taxes comprises. La formule Free est gratuite et sans engagement.</p>
        <h2>3. Souscription et paiement</h2>
        <p>Le paiement est effectué par carte bancaire via notre prestataire de paiement Stripe. {siteConfig.name} n'a jamais accès à tes données bancaires complètes. L'abonnement est mensuel, payable d'avance et renouvelé automatiquement chaque mois jusqu'à résiliation. Une facture est émise à chaque échéance et accessible depuis la page Abonnement.</p>
        <h2>4. Droit de rétractation</h2>
        <p>Si tu es un consommateur, tu disposes d'un délai de quatorze jours à compter de la souscription pour exercer ton droit de rétractation, sans avoir à te justifier, en nous contactant à <a href={`mailto:${email}`}>{email}</a>.</p>
        <p>Lors de la souscription, tu demandes expressément que le service commence immédiatement, avant la fin du délai de rétractation. Conformément à l'article L221-25 du Code de la consommation, si tu te rétractes, tu restes redevable d'un montant proportionnel au service fourni jusqu'à la communication de ta décision de te rétracter ; le surplus t'est remboursé sous quatorze jours.</p>
        <h2>5. Changement de formule</h2>
        <p>Tu peux changer de formule à tout moment depuis la page Abonnement. Le changement est immédiat ; la différence de prix est calculée au prorata et appliquée sur la facture suivante.</p>
        <h2>6. Résiliation</h2>
        <p>Tu peux résilier ton abonnement à tout moment, en quelques clics, depuis la page Abonnement (fonctionnalité « Résilier »). La résiliation prend effet à la fin de la période mensuelle en cours ; l'accès aux fonctionnalités payantes est maintenu jusqu'à cette date, puis le compte repasse en formule Free. Aucune période entamée n'est remboursée, hors exercice du droit de rétractation.</p>
        <h2>7. Défaut de paiement</h2>
        <p>En cas d'échec de paiement, Stripe effectue de nouvelles tentatives. Sans régularisation, l'abonnement est suspendu et le compte repasse en formule Free.</p>
        <h2>8. Évolution des prix</h2>
        <p>Toute modification de prix est notifiée au moins trente jours avant son application ; tu peux résilier avant son entrée en vigueur.</p>
        <h2>9. Réclamations et médiation</h2>
        <p>Pour toute réclamation, contacte-nous à <a href={`mailto:${email}`}>{email}</a>. En cas de litige non résolu, tu peux recourir gratuitement au médiateur de la consommation : {L.mediator}.</p>
        <h2>10. Droit applicable</h2>
        <p>Les présentes CGV sont soumises au droit français. Les consommateurs bénéficient des dispositions impératives de la loi de leur pays de résidence.</p>
        <p className="text-xs">Dernière mise à jour : {siteConfig.lastLegalUpdate}.</p>
      </>
    ),
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    description: "Comment AdHunter collecte, utilise et protège tes données personnelles (RGPD).",
    content: (
      <>
        <h2>Responsable du traitement</h2>
        <p>{L.companyName}, {L.address}. Contact pour toute question relative à tes données : <a href={`mailto:${email}`}>{email}</a>.</p>
        <h2>Données collectées</h2>
        <ul>
          <li><strong>Compte</strong> : email, nom (facultatif), mot de passe (chiffré, jamais stocké en clair), préférences.</li>
          <li><strong>Utilisation</strong> : recherches, publicités consultées et enregistrées, collections, notes, analyses et créations IA, compteurs d'utilisation.</li>
          <li><strong>Facturation</strong> : formule, statut d'abonnement, identifiants Stripe. Les données de carte sont traitées exclusivement par Stripe.</li>
          <li><strong>Support</strong> : messages envoyés via le formulaire de contact.</li>
          <li><strong>Technique</strong> : journaux d'erreurs nécessaires à la sécurité et au bon fonctionnement.</li>
        </ul>
        <h2>Finalités et bases légales</h2>
        <ul>
          <li>Fournir le service et gérer ton compte — exécution du contrat ;</li>
          <li>Facturation et obligations comptables — obligation légale ;</li>
          <li>Sécurité, prévention des abus, amélioration du service — intérêt légitime ;</li>
          <li>Newsletter et informations produit — consentement (case dédiée, retirable à tout moment).</li>
        </ul>
        <h2>Tendances anonymisées</h2>
        <p>Le Trend Radar utilise des agrégats anonymes (par exemple : nombre de recherches par niche). Aucune donnée permettant de t'identifier n'est affichée aux autres utilisateurs.</p>
        <h2>Destinataires et sous-traitants</h2>
        <ul>
          <li>Supabase (hébergement de la base de données et authentification) ;</li>
          <li>Stripe (paiement et facturation) ;</li>
          <li>Anthropic (traitement par IA du contenu des publicités analysées et des descriptions de produits que tu saisis ; ne saisis pas de données personnelles dans ces champs) ;</li>
          <li>Notre hébergeur web ({L.host}).</li>
        </ul>
        <p>Certains prestataires peuvent traiter des données hors de l'Union européenne ; ces transferts sont encadrés par des clauses contractuelles types de la Commission européenne ou un cadre d'adéquation. Nous ne vendons jamais tes données.</p>
        <h2>Durées de conservation</h2>
        <ul>
          <li>Données de compte et d'utilisation : pendant la durée du compte, supprimées à sa suppression ;</li>
          <li>Factures : 10 ans (obligation comptable), conservées par Stripe ;</li>
          <li>Messages de contact : 3 ans maximum ;</li>
          <li>Journaux techniques : 12 mois maximum.</li>
        </ul>
        <h2>Tes droits</h2>
        <p>Tu disposes des droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité. Depuis tes <strong>Paramètres</strong>, tu peux exporter toutes tes données au format JSON et supprimer définitivement ton compte. Pour toute autre demande : <a href={`mailto:${email}`}>{email}</a>. Tu peux introduire une réclamation auprès de la CNIL (www.cnil.fr).</p>
        <h2>Sécurité</h2>
        <p>Chiffrement des échanges (HTTPS), mots de passe hachés, isolation des données de chaque utilisateur par des règles de sécurité au niveau de la base de données (Row Level Security), clés secrètes conservées exclusivement côté serveur.</p>
        <p className="text-xs">Dernière mise à jour : {siteConfig.lastLegalUpdate}.</p>
      </>
    ),
  },
  {
    slug: "cookies",
    title: "Politique de cookies",
    description: "Les cookies et traceurs utilisés par AdHunter.",
    content: (
      <>
        <h2>Notre approche</h2>
        <p>{siteConfig.name} n'utilise <strong>aucun cookie publicitaire ni traceur de mesure d'audience tiers</strong>. Seuls des cookies strictement nécessaires au fonctionnement du service sont déposés ; ils sont exemptés de consentement (article 82 de la loi Informatique et Libertés).</p>
        <h2>Cookies utilisés</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr><th className="py-2 pr-4">Nom</th><th className="py-2 pr-4">Finalité</th><th className="py-2">Durée</th></tr></thead>
            <tbody>
              <tr className="border-t border-border"><td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token</td><td className="py-2 pr-4">Maintien de ta session de connexion (Supabase)</td><td className="py-2">Session / jusqu'à déconnexion</td></tr>
              <tr className="border-t border-border"><td className="py-2 pr-4 font-mono text-xs">adhunter-cookie-consent</td><td className="py-2 pr-4">Mémoriser que tu as lu l'information cookies (stockage local)</td><td className="py-2">Jusqu'à effacement</td></tr>
            </tbody>
          </table>
        </div>
        <p>Lors du paiement, tu es redirigé vers une page sécurisée de Stripe, qui peut déposer ses propres cookies nécessaires à la prévention de la fraude (voir la politique de Stripe).</p>
        <h2>Gérer les cookies</h2>
        <p>Tu peux supprimer les cookies depuis les réglages de ton navigateur. Supprimer le cookie de session te déconnectera.</p>
        <p>Si nous ajoutions un jour des traceurs optionnels, ils ne seraient activés qu'avec ton consentement préalable, retirable à tout moment.</p>
        <p className="text-xs">Dernière mise à jour : {siteConfig.lastLegalUpdate}.</p>
      </>
    ),
  },
];
