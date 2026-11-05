# BookSync — Cahier des charges

> Document de référence, mis à jour à chaque décision produit.
> Dernière mise à jour : 6 novembre 2026.
> Les points marqués **[défaut proposé]** sont des choix par défaut en attente de validation.

## 1. Vision

BookSync est un logiciel SaaS de gestion et de réservation de rendez-vous destiné aux
professionnels (cabinets, salons, studios, praticiens…). Il réunit l'agenda, une page de
réservation en ligne pour les clients finaux et les notifications.

- Interface **entièrement en français** (textes, emails, erreurs, formats `fr-FR`).
- Design haut de gamme (inspiration Stripe, Linear, Calendly), **mobile d'abord**.
- **Aucun paiement en ligne des clients finaux** : ils paient sur place.
  Stripe Billing sert uniquement aux abonnements BookSync des professionnels.
  L'architecture permettra d'ajouter Stripe Connect plus tard.

## 2. Authentification

| Fonction                | Détail                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Inscription par email   | Nom, email, mot de passe (10 caractères min., lettre + chiffre)                                     |
| Conditions générales    | Case **obligatoire** à l'inscription ; date et version acceptées enregistrées                       |
| Connexion par email     | Limitée à 5 tentatives par minute                                                                   |
| Connexion avec Google   | Inscription ou connexion en un clic ; acceptation des CGU demandée à la première connexion          |
| Vérification de l'email | Obligatoire avant la première connexion (inscription par email) ; un compte Google est déjà vérifié |
| Mot de passe oublié     | Lien par email, valable 1 h, à usage unique ; sessions fermées après changement                     |
| Confidentialité         | Aucune information révélée sur l'existence d'un compte                                              |

**[défaut proposé]** Un compte créé par email puis une connexion Google avec la même adresse
vérifiée sont rattachés au même compte.

## 3. Entreprise

- Créée à l'onboarding : **nom**, **adresse publique** (`booksync.fr/{adresse}`), **fuseau horaire**.
- **Adresse postale, téléphone et logo** : facultatifs à l'inscription, modifiables dans les paramètres.
- **[défaut proposé]** Logo : PNG, JPG, WEBP ou SVG, 2 Mo max., stocké dans Supabase Storage
  (offre gratuite : 1 Go).

## 4. Rôles et permissions

| Action                                                | Propriétaire |     Administrateur      |         Employé         |
| ----------------------------------------------------- | :----------: | :---------------------: | :---------------------: |
| Paramètres de l'entreprise (nom, adresse, logo…)      |      ✅      |           ❌            |           ❌            |
| Abonnement et facturation                             |      ✅      |           ❌            |           ❌            |
| Inviter / retirer des employés                        |      ✅      |           ✅            |           ❌            |
| Inviter / retirer des administrateurs                 |      ✅      | ❌ **[défaut proposé]** |           ❌            |
| Modifier le rôle d'un membre                          |      ✅      | ❌ **[défaut proposé]** |           ❌            |
| Gérer les services                                    |      ✅      |           ✅            |           ❌            |
| Gérer les clients                                     |      ✅      |           ✅            |           ❌            |
| Gérer tous les rendez-vous                            |      ✅      |           ✅            |           ❌            |
| Consulter son planning, gérer ses propres rendez-vous |      ✅      |           ✅            |           ✅            |
| Voir les clients de ses propres rendez-vous           |      ✅      |           ✅            | ✅ **[défaut proposé]** |
| Statistiques                                          |      ✅      |           ✅            | ❌ **[défaut proposé]** |
| Supprimer l'entreprise                                |      ✅      |           ❌            |           ❌            |

- Une entreprise a **toujours exactement un propriétaire**. Il ne peut ni être retiré ni se retirer.
- Les permissions sont vérifiées **côté serveur** pour chaque action (l'interface masque en plus
  ce qui n'est pas autorisé).

## 5. Invitations

- Envoyées par email avec un **lien sécurisé** (jeton aléatoire, valable 7 jours, à usage unique).
- Le lien ne fonctionne qu'avec un compte utilisant **l'adresse invitée** (création de compte ou
  connexion, par email ou Google).
- Le propriétaire et les administrateurs peuvent **renvoyer** ou **annuler** une invitation en attente.
- Une invitation en attente compte dans la limite d'employés du plan.

## 6. Abonnements

|                                            | FREE     | STARTER       | PRO            |
| ------------------------------------------ | -------- | ------------- | -------------- |
| Prix                                       | 0 €      | 9,99 € / mois | 19,99 € / mois |
| Réservations                               | 5 / mois | Illimitées    | Illimitées     |
| Employés                                   | 1        | 2             | 10             |
| Clients                                    | 20       | Illimités     | Illimités      |
| Notifications email                        | —        | ✅            | ✅             |
| Rappels automatiques                       | —        | —             | ✅             |
| Statistiques                               | Basiques | Basiques      | Avancées       |
| Personnalisation de la page de réservation | —        | —             | ✅             |

Règles de calcul **[défaut proposé]** :

- **Employés** : tous les membres comptent (propriétaire inclus) + invitations en attente.
  FREE = le propriétaire seul ; STARTER = propriétaire + 1 ; PRO = propriétaire + 9.
- **Réservations** : rendez-vous créés pendant le mois calendaire (fuseau de l'entreprise),
  en ligne ou manuellement. Une annulation ne libère pas de crédit.
- **Clients** : fiches clients actives.
- **Notifications email** (STARTER et PRO) : confirmation, modification et annulation envoyées
  aux clients finaux. Les emails liés au compte (vérification, mot de passe, invitations)
  sont envoyés quel que soit le plan.
- **Changement vers un plan inférieur** : aucune donnée supprimée ; les ajouts sont bloqués
  tant que la limite est dépassée ; les membres excédentaires sont désactivés au choix du propriétaire.
- **Prix** affichés TTC, facturation mensuelle par Stripe Billing.

## 7. Feuille de route

| Étape | Contenu                                                                                | État                                   |
| ----- | -------------------------------------------------------------------------------------- | -------------------------------------- |
| 0     | Socle technique, design system, base de données, CI, Render                            | ✅                                     |
| 1     | Comptes, Google, CGU, entreprise, paramètres, rôles, invitations, fondations des plans | ✅ (Google : identifiants à créer)     |
| 2     | Services (durée, prix, temps tampon) et employés réservables                           | ✅                                     |
| 3     | Disponibilités : horaires, pauses, congés, moteur de créneaux                          | ✅                                     |
| 4     | Page de réservation publique (mobile d'abord), anti double réservation                 | ✅                                     |
| 5     | Agenda professionnel : jour / semaine / mois, création, déplacement, annulation        | ✅                                     |
| 6     | Notifications email clients (STARTER+) et rappels automatiques (PRO)                   | ✅ (envoi réel : clé Resend à fournir) |
| 7     | Clients (fiches, historique, notes)                                                    | ✅                                     |
| 8     | Facturation Stripe Billing (STARTER, PRO), limites appliquées partout                  | ✅ (mode test : clé Stripe à fournir)  |
| 9     | Statistiques (basiques / avancées), personnalisation de la page (PRO)                  | ✅                                     |

## 8. Services externes

| Service      | Usage                                | Coût                                     | État                                               |
| ------------ | ------------------------------------ | ---------------------------------------- | -------------------------------------------------- |
| Supabase     | Base PostgreSQL + stockage des logos | Offre gratuite                           | À créer avant la mise en ligne (accord requis)     |
| Render       | Hébergement                          | Gratuit pendant le développement         | Configuré dans `render.yaml`                       |
| Resend       | Emails                               | Gratuit jusqu'à 3 000 emails/mois        | Clé à fournir (accord requis)                      |
| Google Cloud | Connexion avec Google (OAuth)        | Gratuit                                  | Identifiants à créer par le propriétaire du projet |
| Stripe       | Abonnements                          | Commission par paiement, sans abonnement | Mode test à l'étape 8                              |

**Règle : aucun service payant n'est activé sans accord explicite.**
