# Étape 1 — Comptes, entreprise, rôles et invitations

## Déjà livré (partie commune)

- Inscription, connexion, déconnexion par email ; vérification de l'email ; mot de passe oublié.
- Limitation des tentatives, protection contre l'énumération des comptes, redirections sûres.
- Onboarding : nom, adresse publique, fuseau. Tableau de bord protégé.
- Journal des emails (Resend si clé fournie).

## Reste à livrer

### 1.1 Conditions générales

- Case obligatoire à l'inscription, refusée côté serveur si absente.
- Enregistrement `terms_accepted_at` + `terms_version` sur l'utilisateur.
- Pages `/conditions-generales` et `/confidentialite` (modèles à faire valider par un juriste).

### 1.2 Connexion avec Google

- Bouton « Continuer avec Google » sur l'inscription et la connexion.
- Première connexion Google : écran d'acceptation des CGU avant l'onboarding.
- Rattachement au compte existant de même adresse vérifiée.
- Le bouton n'apparaît que si `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` sont configurés.

### 1.3 Rôles et permissions

- Rôles `owner` (Propriétaire), `admin` (Administrateur), `employee` (Employé).
- Matrice de permissions dans `src/domain/permissions.ts` (logique pure, testée cas par cas),
  appliquée côté serveur à chaque action et dans l'interface.

### 1.4 Fondations des abonnements

- Champ `plan` sur l'entreprise (`free` par défaut).
- Limites et fonctionnalités par plan dans `src/domain/billing/plans.ts`.
- Limite d'employés appliquée dès cette étape (invitations) ; les autres limites seront
  branchées dans les étapes concernées ; Stripe à l'étape 8.

### 1.5 Équipe et invitations — `/tableau-de-bord/equipe`

- Liste des membres (rôle, date d'arrivée) et des invitations en attente.
- Inviter par email avec un rôle ; renvoyer, annuler une invitation.
- Changer le rôle, retirer un membre (selon la matrice).
- Page `/invitation/{jeton}` : accepter ou refuser ; création de compte ou connexion avec
  l'email invité pré-rempli ; message clair si le lien est expiré, déjà utilisé ou destiné
  à une autre adresse.
- Compteur « x / y employés » selon le plan, invitation bloquée au-delà avec un message
  qui propose le plan supérieur.

### 1.6 Paramètres de l'entreprise — `/tableau-de-bord/parametres` (propriétaire)

- Nom, adresse publique, fuseau, adresse postale (rue, code postal, ville, pays),
  téléphone (format français et international vérifié), logo (aperçu, remplacement, suppression).

### 1.7 Navigation de l'espace professionnel

- Barre latérale sur ordinateur, barre d'onglets en bas de l'écran sur mobile.
- Entrées affichées selon le rôle.

## Tests prévus

- Unitaires : matrice de permissions (chaque rôle × chaque action), limites des plans,
  validation téléphone / adresse / logo.
- Intégration (PostgreSQL réel) : refus serveur d'une action non autorisée, limite d'employés,
  jeton d'invitation expiré ou réutilisé, CGU obligatoires.
- Bout en bout (desktop + mobile) : invitation complète propriétaire → employé ; un employé
  ne peut pas ouvrir les paramètres ; mise à jour des informations et du logo ; inscription
  sans CGU refusée.
- Google : testé avec un faux fournisseur OAuth local (le vrai nécessite tes identifiants).
