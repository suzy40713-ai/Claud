import { useEffect } from "react";
import { Link } from "react-router";

function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Studio Cartoon`;
  }, [title]);
  return (
    <main className="wrap legal">
      <p>
        <Link to="/">← Retour</Link>
      </p>
      <h1>{title}</h1>
      {children}
    </main>
  );
}

export function MentionsPage() {
  return (
    <Legal title="Mentions légales">
      <p className="note">Modèle à compléter avant la mise en vente. Les informations entre crochets sont obligatoires.</p>
      <h2>Éditeur du site</h2>
      <p>
        [Nom et prénom, ou raison sociale]
        <br />
        [Statut : micro-entreprise, société…]
        <br />
        [Adresse]
        <br />
        [Numéro SIRET]
        <br />
        Email : [adresse de contact]
      </p>
      <h2>Hébergement</h2>
      <p>Site : GitHub Pages (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis). Serveur : [hébergeur du serveur, par exemple Railway Corp.].</p>
      <h2>Propriété intellectuelle</h2>
      <p>Le contenu de la formation (textes, scripts, cahier PDF) est protégé. Il est réservé à l'usage personnel de l'acheteur et ne peut pas être revendu ni partagé.</p>
    </Legal>
  );
}

export function CgvPage() {
  return (
    <Legal title="Conditions générales de vente">
      <p className="note">Modèle à compléter et à faire vérifier avant la mise en vente.</p>
      <h2>1. Produit</h2>
      <p>La formation « Studio Cartoon » est un contenu numérique : une formation en ligne (13 modules, 59 leçons) et un cahier d'exercices au format PDF.</p>
      <h2>2. Prix et paiement</h2>
      <p>Le prix est indiqué en euros, toutes taxes comprises, sur la page de vente. Le paiement est unique et traité par Stripe. [Mention TVA, par exemple « TVA non applicable, article 293 B du CGI » pour une micro-entreprise en franchise.]</p>
      <h2>3. Accès</h2>
      <p>Après paiement, l'acheteur reçoit un lien d'accès personnel par email et peut télécharger le cahier PDF. L'accès est réservé à son usage personnel.</p>
      <h2>4. Droit de rétractation</h2>
      <p>Conformément au Code de la consommation, le droit de rétractation ne s'applique pas à un contenu numérique fourni immédiatement lorsque l'acheteur a donné son accord exprès et reconnu perdre ce droit. Cet accord est recueilli par une case à cocher avant le paiement. [Si tu proposes un remboursement volontaire, décris-le ici.]</p>
      <h2>5. Résultats</h2>
      <p>La formation fournit une méthode et des modèles. Aucun résultat (abonnés, vues, revenus) n'est garanti.</p>
      <h2>6. Contact</h2>
      <p>[Adresse de contact]</p>
    </Legal>
  );
}

export function PrivacyPage() {
  return (
    <Legal title="Confidentialité">
      <h2>Données collectées</h2>
      <p>Nous collectons uniquement ton adresse email : quand tu demandes l'aperçu gratuit, et quand tu achètes la formation (transmise par Stripe).</p>
      <h2>Utilisation</h2>
      <p>Ton email sert à t'envoyer l'aperçu gratuit et deux emails de suivi, ou ton lien d'accès et le cahier PDF après achat. Il n'est ni vendu ni partagé.</p>
      <h2>Paiement</h2>
      <p>Les paiements sont traités par Stripe. Aucune donnée bancaire n'est stockée par ce site.</p>
      <h2>Progression</h2>
      <p>Ta progression dans la formation est enregistrée uniquement dans ton navigateur.</p>
      <h2>Tes droits</h2>
      <p>Tu peux demander l'accès à tes données ou leur suppression à tout moment en répondant à l'un de nos emails ou en écrivant à [adresse de contact].</p>
    </Legal>
  );
}
