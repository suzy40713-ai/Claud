# BookSync — Rapport de livraison

État au 6 novembre 2026, branche `claude/booksync-saas-architecture-d820fm`.

## Fonctionnalités terminées

| Domaine                 | Contenu                                                                                                                                                                                                                    | Vérifié par                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Site public             | Page commerciale (hero, présentation, fonctionnalités, avantages, illustration du tableau de bord, tarifs, FAQ, pied de page), mentions légales, CGU/CGV, confidentialité                                                  | E2E                                                                              |
| Authentification        | Inscription, connexion, déconnexion, vérification de l'email, mot de passe oublié/réinitialisation, CGU obligatoires (serveur), limitation des tentatives, anti-énumération, sessions de 30 jours, pages privées protégées | Intégration + E2E                                                                |
| Connexion Google        | Bouton et flux en place, rattachement au compte existant, acceptation des CGU au premier accès                                                                                                                             | **Non testé avec Google** (identifiants à créer)                                 |
| Entreprises et rôles    | Propriétaire / administrateur / employé, matrice de permissions appliquée côté serveur, changement d'entreprise active                                                                                                     | Unitaires + E2E                                                                  |
| Invitations             | Email avec lien signé (7 jours, usage unique), limite de membres par forfait, renvoi, annulation, refus                                                                                                                    | E2E                                                                              |
| Installation            | Création guidée (activité, adresse, fuseau), assistant : horaires, prestations suggérées, équipe, page                                                                                                                     | E2E                                                                              |
| Services                | Création, modification, suppression/archivage, prix, durée, battement, image, employés autorisés                                                                                                                           | E2E (prestations suggérées)                                                      |
| Employés                | Profil, photo, couleur, réservable, services autorisés, horaires avec pauses, absences                                                                                                                                     | Intégration (permissions)                                                        |
| Horaires et fermetures  | Horaires d'ouverture, jours de fermeture de l'entreprise                                                                                                                                                                   | Unitaires (validation)                                                           |
| Disponibilités          | Moteur pur : horaires, pauses, fermetures, battement, délai minimal, horizon, fuseaux, changements d'heure                                                                                                                 | 22 tests unitaires                                                               |
| Anti double réservation | Contrainte d'exclusion PostgreSQL + re-vérification serveur                                                                                                                                                                | 10 réservations simultanées → 1 seule réussit                                    |
| Réservation publique    | Prestation → employé → créneau → coordonnées, sans compte, anti-robots, limitation de débit ; confirmation ; lien signé pour déplacer/annuler ; export .ics                                                                | E2E desktop + mobile                                                             |
| Calendrier              | Vues jour/semaine/mois, filtre par employé, création, déplacement, annulation, honoré/absent, notes                                                                                                                        | E2E (affichage)                                                                  |
| Réservations            | Liste filtrable (période, statut, employé, recherche), pagination                                                                                                                                                          | E2E                                                                              |
| Clients                 | Liste, recherche, fiche, historique, notes, suppression                                                                                                                                                                    | E2E + isolation                                                                  |
| Notifications           | File dédupliquée en base, confirmation/modification/annulation, rappels 24 h et 2 h, alertes équipe, centre de notifications, journal d'envoi, nouvelles tentatives, prêt pour les SMS                                     | Intégration                                                                      |
| Statistiques            | Vue générale (aujourd'hui, semaine, clients, CA, prochains RDV, récents, 30 jours) ; page analytique avec filtres de dates ; avancées en Pro                                                                               | Intégration + E2E                                                                |
| Abonnements             | Checkout, changement d'offre au prorata, résiliation/reprise, portail, factures, webhooks idempotents, synchronisation du forfait, limites serveur, compteur mensuel                                                       | Webhooks testés hors ligne ; **paiement réel non testé** (clé de test à fournir) |
| Paramètres              | Entreprise (coordonnées, logo), réservation en ligne, personnalisation (Pro), horaires, notifications, compte (profil, mot de passe), export RGPD, suppression du compte                                                   | E2E                                                                              |
| Sécurité                | RLS sur toutes les tables, révocation des rôles de l'API Supabase, clés étrangères composites par entreprise, en-têtes de sécurité, images ré-encodées, secrets uniquement côté serveur                                    | Intégration + E2E                                                                |

## Tests

- **105** tests unitaires et d'intégration (PostgreSQL réel).
- **54** tests de bout en bout (Chromium, desktop + Pixel 7).
- Build de production et image de production simulée sur une base vierge : OK.

## Bugs et limites connus

- **Statut HTTP 404** : pour une adresse de réservation inexistante, la page « Page introuvable » s'affiche (balise `noindex`), mais le code HTTP renvoyé est 200 à cause du rendu en streaming.
- **Limiteur de débit** des pages publiques en mémoire : suffisant pour une instance Render, à partager si plusieurs instances.
- **Déplacement** d'un rendez-vous par le client : même professionnel uniquement (choix d'un autre employé possible côté professionnel).
- **Pas de glisser-déposer** dans le calendrier : le déplacement se fait par la fiche du rendez-vous.
- **Downgrade de forfait** : les membres excédentaires gardent leur accès ; seules les nouvelles invitations sont bloquées.

## Configurations externes nécessaires

Voir [`deploiement.md`](deploiement.md) : Supabase, Render, pg_cron, Resend, Stripe (mode test), Google, mentions légales.

## Coûts à prévoir

| Service        | Gratuit                                                           | Payant (à valider)                               |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| Supabase       | Offre gratuite (500 Mo, mise en pause après 7 jours d'inactivité) | Pro 25 $/mois pour la production                 |
| Render         | Plan gratuit (mise en veille)                                     | Starter 7 $/mois recommandé à l'ouverture        |
| Resend         | 3 000 emails/mois                                                 | 20 $/mois au-delà                                |
| Stripe         | Aucun abonnement                                                  | ~1,5 % + 0,25 € par paiement de carte européenne |
| Google OAuth   | Gratuit                                                           | —                                                |
| Nom de domaine | —                                                                 | ~10–15 €/an                                      |
