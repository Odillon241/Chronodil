# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce
fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Affichage du numéro de version dans la sidebar
- Page "À propos" dans les paramètres
- Ce fichier CHANGELOG.md

## [0.1.0] - 2026-01-22

### Ajouté

- **Push Notifications** - Système complet de notifications push Web
  - Actions serveur pour sauvegarder/supprimer les subscriptions
  - Module `notification-helpers.ts` pour l'envoi centralisé
  - Hook `usePushSubscription` pour le client
  - Intégration avec Service Worker existant

- **Sécurité**
  - Vérification JWT WebSocket/Socket.io via Supabase Auth
  - Headers HTTP sécurisés (CSP, HSTS, X-Frame-Options)
  - Rate limiting sur l'authentification
  - Module de validation et sanitisation (`security.ts`)
  - Correction injection SQL dans `hr-timesheet.actions.ts`
  - Correction XSS dans `task-comments.tsx` avec DOMPurify

- **Supabase Realtime pour Chat**
  - Configuration des tables pour la publication realtime
  - Politiques RLS pour la diffusion des événements
  - Hook `useRealtimeChat` avec reconnexion automatique

- **Synchronisation Task ↔ HR Activity**
  - Création automatique de tâches pour les activités RH manuelles
  - Champs d'activité RH ajoutés au modèle Task

- **Performance**
  - React Compiler activé (memoization automatique)
  - Turbopack avec cache filesystem
  - Partial Prerendering (PPR) activé
  - Dynamic imports pour MinimalTiptap
  - Optimisations Realtime (backoff exponentiel)
  - Tags de revalidation cache
  - Index composites Prisma

- **Infrastructure**
  - Migration vers Next.js 16 avec `proxy.ts`
  - Vercel Speed Insights

### Corrigé

- Attribution des rôles utilisateurs (sync Prisma ↔ Supabase Auth)
- Erreur d'hydratation React dans AppSidebar
- Champ manquant `soundEnabled` dans HR Timesheet
- Clés dupliquées 'none' dans les sélecteurs
- Connection pool Prisma timeout (limit=10)

### Modifié

- Suppression automatique des console.log en production via `next.config.mjs`

---

## Types de changements

- **Ajouté** pour les nouvelles fonctionnalités
- **Modifié** pour les changements dans les fonctionnalités existantes
- **Déprécié** pour les fonctionnalités qui seront supprimées prochainement
- **Supprimé** pour les fonctionnalités supprimées
- **Corrigé** pour les corrections de bugs
- **Sécurité** pour les vulnérabilités corrigées
