import { Link } from "react-router";

const CONTACT_EMAIL = "suzy40713@gmail.com";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 px-4 py-4">
        <Link to="/login" className="text-lg font-extrabold tracking-tight text-slate-900">
          👑 Kadence
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 text-slate-700">
        <h1 className="text-2xl font-bold text-slate-900">Politique de confidentialité</h1>
        <p className="mt-1 text-sm text-slate-500">Dernière mise à jour : 15 août 2026</p>

        <p className="mt-6 leading-relaxed">
          Kadence est une application de coaching sportif. Cette page explique simplement quelles données sont
          collectées, pourquoi, et comment tu peux les contrôler.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">Qui est responsable de ces données ?</h2>
        <p className="mt-2 leading-relaxed">
          Kadence en est responsable. Pour toute question ou demande concernant tes données, écris à{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-indigo-600">
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">Quelles données sont collectées ?</h2>
        <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 leading-relaxed">
          <li>
            <strong>Compte</strong> : ton adresse email et ton mot de passe (stocké de façon chiffrée, jamais en
            clair).
          </li>
          <li>
            <strong>Profil</strong> : ton objectif, tes sports pratiqués, ton niveau et ton historique de blessures,
            renseignés lors de l'inscription.
          </li>
          <li>
            <strong>Journal quotidien</strong> : tes notes de sommeil, fatigue et stress.
          </li>
          <li>
            <strong>Activités sportives</strong> : les séances que tu importes (fichiers .fit/.gpx/.tcx) ou
            synchronises depuis Strava (durée, distance, dénivelé, fréquence cardiaque, allure).
          </li>
          <li>
            <strong>Plan d'entraînement</strong> : les séances générées pour toi et leur statut (faite, ajustée,
            passée).
          </li>
          <li>
            <strong>Messages avec le coach IA</strong> : le contenu de tes échanges avec le coach conversationnel.
          </li>
          <li>
            <strong>Abonnement et achats</strong> : le statut de ton abonnement et, si tu achètes l'ebook, l'adresse
            email utilisée pour te l'envoyer. Les données de carte bancaire ne transitent jamais par nos serveurs :
            elles sont gérées directement par Stripe.
          </li>
          <li>
            <strong>Notifications</strong> : si tu les actives, les informations techniques nécessaires pour
            t'envoyer une alerte (aucune donnée personnelle supplémentaire).
          </li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">Pourquoi ces données sont-elles utilisées ?</h2>
        <p className="mt-2 leading-relaxed">
          Uniquement pour faire fonctionner l'application : générer ton plan d'entraînement, faire dialoguer le
          coach IA, suivre ta progression, traiter tes paiements et t'envoyer les produits que tu achètes. Ces
          données ne sont jamais vendues, et ne servent à aucune publicité ciblée.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">Qui a accès à ces données ?</h2>
        <p className="mt-2 leading-relaxed">
          Certains prestataires techniques traitent une partie de ces données pour nous, uniquement dans ce but :
        </p>
        <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 leading-relaxed">
          <li>
            <strong>Anthropic</strong> (Claude API) pour faire fonctionner le coach IA conversationnel.
          </li>
          <li>
            <strong>Stripe</strong> pour le traitement sécurisé des paiements (abonnement et ebook).
          </li>
          <li>
            <strong>Resend</strong> pour l'envoi de l'ebook par email après achat.
          </li>
          <li>
            <strong>Strava</strong>, uniquement si tu connectes ton compte, pour synchroniser tes activités.
          </li>
          <li>
            <strong>Railway</strong> et <strong>GitHub Pages</strong>, nos hébergeurs techniques (serveur, base de
            données et site web).
          </li>
        </ul>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">Combien de temps ces données sont-elles gardées ?</h2>
        <p className="mt-2 leading-relaxed">
          Tant que ton compte existe. Si tu souhaites la suppression de ton compte et de tes données, écris-nous à{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-indigo-600">
            {CONTACT_EMAIL}
          </a>{" "}
          : nous traiterons la demande sous 30 jours.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">Tes droits</h2>
        <p className="mt-2 leading-relaxed">
          Conformément au RGPD, tu disposes d'un droit d'accès, de rectification, d'effacement, de portabilité et
          d'opposition sur tes données. Pour les exercer, contacte-nous à l'adresse ci-dessus. Tu peux aussi
          introduire une réclamation auprès de la CNIL (cnil.fr).
        </p>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">Sécurité</h2>
        <p className="mt-2 leading-relaxed">
          Les mots de passe sont chiffrés, les échanges entre l'application et nos serveurs sont protégés (HTTPS),
          et l'accès à la base de données est restreint. Aucun système n'est infaillible à 100%, mais nous prenons
          des mesures raisonnables pour protéger tes informations.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">Âge minimum</h2>
        <p className="mt-2 leading-relaxed">
          Kadence s'adresse à des utilisateurs de 16 ans et plus.
        </p>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">Modifications</h2>
        <p className="mt-2 leading-relaxed">
          Cette politique peut évoluer. La date de mise à jour en haut de cette page reflète la dernière révision.
        </p>
      </main>
    </div>
  );
}
