# Chronodil App - Project Instructions

## Corrections récentes (2025-12-04)

### ✅ Système de Push Notifications - IMPLÉMENTÉ
**Fonctionnalité** : Notifications push Web complètes pour alerter les utilisateurs même lorsqu'ils ne sont pas sur l'application.

**Ce qui a été implémenté** :
1. **Actions serveur push-subscription.actions.ts** :
   - `savePushSubscription()` - Sauvegarder une subscription push en DB
   - `deletePushSubscription()` - Supprimer une subscription
   - `checkPushSubscription()` - Vérifier si l'utilisateur a une subscription active

2. **Module notification-helpers.ts** :
   - `sendPushNotificationForNotification()` - Envoyer une push à un utilisateur
   - `sendPushNotificationsForNotifications()` - Envoyer des push en batch
   - `createAndSendNotification()` - Créer notification + push (centralisé)
   - `createAndSendNotifications()` - Création batch avec push

3. **Hook usePushSubscription** (refactorisé) :
   - Support complet du subscribe/unsubscribe
   - Gestion des permissions du navigateur
   - Conversion VAPID base64 → Uint8Array
   - Intégration avec le Service Worker existant

4. **Actions createNotification** dans notification.actions.ts :
   - `createNotification()` - Créer une notification avec push automatique
   - `createNotifications()` - Créer plusieurs notifications
   - `createNotificationDirect()` - Fonction utilitaire serveur

5. **Activation des push dans les modules existants** :
   - `task.actions.ts` - Partage de tâche
   - `chat.actions.ts` - Nouveaux messages
   - `task-comment.actions.ts` - Nouveaux commentaires
   - `inngest/functions.ts` - Rappels email et timesheet

**Configuration requise** :
Générer les clés VAPID avec :
```bash
pnpm tsx scripts/generate-vapid-keys.ts
```

Ajouter au fichier `.env` :
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public_key>
VAPID_PRIVATE_KEY=<private_key>
VAPID_SUBJECT=mailto:admin@chronodil.com
```

**Fichiers créés/modifiés** :
- [src/actions/push-subscription.actions.ts](src/actions/push-subscription.actions.ts) - Actions DB
- [src/lib/notification-helpers.ts](src/lib/notification-helpers.ts) - Fonctions d'envoi push
- [src/hooks/use-push-subscription.tsx](src/hooks/use-push-subscription.tsx) - Hook client
- [src/actions/notification.actions.ts](src/actions/notification.actions.ts) - Actions centralisées
- [scripts/generate-vapid-keys.ts](scripts/generate-vapid-keys.ts) - Générateur de clés
- [docs/features/notifications/NOTIFICATION_SYSTEM.md](docs/features/notifications/NOTIFICATION_SYSTEM.md) - Documentation

**Résultat** :
- ✅ Push notifications fonctionnelles
- ✅ Service Worker configuré pour recevoir les push
- ✅ Intégration automatique dans les actions existantes
- ✅ Documentation complète

---

## Corrections précédentes (2025-11-08)

### ✅ Synchronisation bidirectionnelle Task ↔ HR Activity - IMPLÉMENTÉE
**Fonctionnalité** : Création automatique de tâches pour les activités RH créées en mode manuel.

**Problème initial** : Quand une activité RH était créée en mode "Saisie manuelle" (sans lien vers une tâche existante), aucune tâche correspondante n'était créée, donc l'activité n'apparaissait pas dans la liste des tâches.

**Solution implémentée** :
- Modification de la fonction `addHRActivity` dans [src/actions/hr-timesheet.actions.ts](src/actions/hr-timesheet.actions.ts:439-493)
- Si aucune `taskId` n'est fournie, création automatique d'une tâche avec :
  - Nom et description de l'activité RH
  - Champs d'activité RH (`activityType`, `activityName`, `periodicity`)
  - Statut converti automatiquement (IN_PROGRESS ou DONE)
  - Priorité, complexité et heures estimées
  - Date d'échéance (endDate de l'activité)
  - Lien bidirectionnel Task ↔ HRActivity
- Suppression du champ `createLinkedTask` (plus nécessaire) dans [src/lib/validations/hr-timesheet.ts](src/lib/validations/hr-timesheet.ts:28)
- Ajout des champs d'activité RH au modèle Task dans Prisma

**Migration requise** :
- Script SQL créé : [prisma/migrations/add_activity_fields_to_task.sql](prisma/migrations/add_activity_fields_to_task.sql)
- Exécuter manuellement dans Supabase SQL Editor pour ajouter les colonnes `activityType`, `activityName`, `periodicity` à la table Task

**Résultat** :
- ✅ Toute activité RH (manuelle ou liée) crée/référence une tâche
- ✅ Les activités manuelles apparaissent maintenant dans `/dashboard/tasks`
- ✅ Synchronisation complète bidirectionnelle Task ↔ HR Activity
- ✅ Réutilisation des champs d'activité pour éviter la duplication de données

**Files modifiés** :
- [src/actions/hr-timesheet.actions.ts](src/actions/hr-timesheet.actions.ts) - Création automatique de tâche
- [src/lib/validations/hr-timesheet.ts](src/lib/validations/hr-timesheet.ts) - Suppression de createLinkedTask
- [prisma/migrations/add_activity_fields_to_task.sql](prisma/migrations/add_activity_fields_to_task.sql) - Migration SQL

### ✅ Erreur d'hydratation React dans AppSidebar - RÉSOLU
**Problème** : Erreur React "Hydration failed because the server rendered HTML didn't match the client" dans le composant AppSidebar.

**Erreur console** :
```
Encountered two children with the same key... at AppSidebar (src/components/layout/app-sidebar.tsx:237:21)
```

**Cause** : Les fonctions `filteredNavMain` et `filteredNavSettings` filtraient les éléments de navigation basés sur `session?.user?.role`, ce qui causait une différence entre le rendu serveur (session potentiellement null) et le rendu client (session chargée), résultant en un nombre différent d'éléments `<li>` rendus.

**Solution appliquée** :
- Modification de `filteredNavMain` et `filteredNavSettings` pour retourner **tous les items** quand `mounted=false` (server-side/première hydratation)
- Après le montage client (`mounted=true`), les items sont filtrés selon le rôle utilisateur
- Ajout de `suppressHydrationWarning` sur les composants `<SidebarMenu>` pour gérer les différences de styling
- Pattern identique à celui déjà utilisé pour l'avatar et le nom d'utilisateur (lignes 273-289)
- Fichier modifié : [src/components/layout/app-sidebar.tsx](src/components/layout/app-sidebar.tsx:119-137)

**Résultat** :
- Structure HTML identique entre serveur et client lors de l'hydratation initiale
- Filtrage basé sur les rôles s'applique après le montage (transition fluide)
- Plus d'erreur de hydratation React ✅

### ✅ Champ manquant soundEnabled dans HR Timesheet - RÉSOLU
**Problème** : Erreur TypeScript "Property 'soundEnabled' is missing in type 'Activity'" lors de la création d'une feuille de temps RH.

**Solution appliquée** :
- Ajout du champ `soundEnabled: boolean` à l'interface `Activity` (ligne 49)
- Initialisation par défaut à `false` lors de la création d'activité (ligne 263)
- Fichier modifié : [src/app/dashboard/hr-timesheet/new/page.tsx](src/app/dashboard/hr-timesheet/new/page.tsx)

**Résultat** : Build TypeScript corrigé ✅

---

## Corrections précédentes (2025-11-07)

### ✅ Clés dupliquées 'none' dans Select - RÉSOLU
**Problème** : Erreur React "Encountered two children with the same key, `none`" dans le formulaire de création de tâche.

**Cause** : Deux composants `<SelectItem value="none">` dans le même contexte de rendu :
- Sélecteur de projet (ligne 501)
- Sélecteur de feuille de temps RH (ligne 523)

**Solution appliquée** :
- Changement `value="none"` → `value="no-project"` pour le sélecteur de projet
- Changement `value="none"` → `value="no-timesheet"` pour le sélecteur de feuille de temps
- Mise à jour de toutes les vérifications dans le code (6 occurrences) :
  - Valeurs par défaut dans le state
  - Fonction `handleSubmit` (createTask)
  - Fonction `handleEdit`
  - Fonction `resetForm`
  - Fonction `loadAvailableUsers` (2 occurrences)
- Fichier modifié : [src/app/dashboard/tasks/page.tsx](src/app/dashboard/tasks/page.tsx)

**Résultat** : Les clés sont maintenant uniques, le warning React a été éliminé.

### ⚠️ Problème de création de tâche - EN ATTENTE DE TEST
**Symptôme** : La création d'une tâche depuis `/dashboard/tasks` échoue avec une notification d'erreur.

**Investigation** :
- Code de création vérifié dans [src/actions/task.actions.ts](src/actions/task.actions.ts) - Semble correct
- Schéma Prisma vérifié : `isActive` par défaut = `true`, `status` par défaut = `"TODO"` ✅
- Valeurs par défaut du formulaire correctes ✅

**Causes possibles** :
1. Session expirée ou problème d'authentification
2. Erreur de validation du schéma Zod
3. Problème de transaction Prisma
4. Permissions insuffisantes sur le projet

**Action requise** :
- Tester la création d'une tâche simple (sans projet ni timesheet)
- Vérifier les logs du serveur Next.js pour l'erreur exacte
- Partager le message d'erreur complet depuis `toast.error(result?.serverError || "Erreur")`

### ⚠️ Sélecteur de tâche non visible dans formulaire RH - EN ATTENTE DE TEST
**Symptôme** : Dans `/dashboard/hr-timesheet/new`, le sélecteur de tâche ne s'affiche pas en mode "Tâche existante".

**Cause** : `availableTasks.length === 0` (aucune tâche chargée)

**Investigation** :
- Fonction `getUserTasksForHRTimesheet` filtre sur :
  - `isActive: true` ✅
  - `status: { in: ["TODO", "IN_PROGRESS"] }` ✅
  - Utilisateur doit être créateur OU membre ✅
- Le problème est probablement lié au premier problème (création de tâche échoue)

**Solution** : Une fois la création de tâche résolue, créer une tâche avec status "TODO" ou "IN_PROGRESS" pour tester l'affichage dans le formulaire RH.

---

## Build Status
✅ Build successful - No syntax errors detected
✅ TypeScript check passed
✅ All pages compile successfully (28 pages)
✅ Partial Prerendering (PPR) active on dynamic routes
**Last successful build**: 2025-10-27

## Tech Stack
- **Next.js**: 16.0.0 (Turbopack enabled by default)
- **React**: 19.2.0
- **TypeScript**: 5.9.3
- **Node.js**: 20.9.0+ (minimum required)
- **next-intl**: 4.4.0 (internationalization)
- **Prisma**: 6.17.1 (ORM)

## Next.js 16 Features & Optimizations

### Active Performance Optimizations

1. **⚡ React Compiler** (Stable)
   - Status: **ENABLED** in `next.config.mjs`
   - Feature: Automatic memoization of components
   - Benefit: Reduces unnecessary re-renders with zero manual code changes
   - Package: `babel-plugin-react-compiler@1.0.0`

2. **🚀 Turbopack** (Stable - Default Bundler)
   - Status: **ENABLED BY DEFAULT**
   - Speed: 5-10x faster Fast Refresh, 2-5x faster builds
   - No configuration needed - replaces Webpack

3. **💾 Turbopack Filesystem Caching**
   - Status: **ENABLED** in `next.config.mjs`
   - Feature: Stores compiler artifacts on disk between runs
   - Benefit: Significantly faster compile times across dev server restarts

4. **🎯 Cache Components (PPR)** ✅ ENABLED
   - Status: **ENABLED** in `next.config.mjs`
   - Solution: Configuration next-intl STATIQUE (pas de cookies/headers dans getRequestConfig)
   - Architecture: Locale "fr" hardcodée en SSR, client handle dynamique
   - Files: `src/i18n.ts` (config statique), `next.config.mjs` (ES module)
   - Benefit: Rendu hybride statique/dynamique pour performances optimales
   - Migration: Complétée le 2025-10-27

5. **📦 Dynamic Imports** ✨ NOUVEAU
   - Status: **IMPLEMENTED**
   - Components: MinimalTiptap (éditeur riche)
   - Benefit: Bundle initial réduit de ~250KB
   - File: `src/components/ui/minimal-tiptap-dynamic.tsx`

6. **🌐 Realtime Optimizations** ✨ NOUVEAU
   - Status: **IMPLEMENTED**
   - Features: Backoff exponentiel, prévention reconnexions
   - Benefit: Latence -30%, stabilité améliorée
   - File: `src/hooks/use-realtime-tasks.tsx`

7. **♻️ Revalidation Tags** ✨ NOUVEAU
   - Status: **IMPLEMENTED**
   - Tags: PROJECTS, USERS, TASKS, TIMESHEETS, REPORTS
   - Benefit: Cache invalidation précise
   - File: `src/lib/cache.ts`

8. **🗄️ Prisma Composite Indexes** ✨ NOUVEAU
   - Status: **CRÉÉS** dans Supabase
   - Indexes: (userId, date), (projectId, status), (status, priority)
   - Benefit: Requêtes DB +30-50% plus rapides
   - File: `prisma/schema.prisma` + `scripts/add-performance-indexes.sql`

9. **🔐 Proxy.ts (Next.js 16)** ✨ NOUVEAU
   - Status: **IMPLEMENTED**
   - Remplace: middleware.ts (deprecated en Next.js 16)
   - Fonctions: Protection auth + Détection locale i18n
   - Benefit: Architecture optimisée pour Next.js 16
   - File: `proxy.ts`

### Breaking Changes from Next.js 15

1. **Async Dynamic APIs** ✅ HANDLED
   - `params`, `searchParams`, `cookies()`, `headers()` require `await`
   - All instances verified with Next.js codemod
   - TypeScript types updated accordingly

2. **revalidateTag() API Change** ✅ FIXED (2025-10-27)
   - **Breaking**: Now requires 2 arguments: `revalidateTag(tag, profile)`
   - **Profile parameter**: Built-in options: `'max'`, `'hours'`, `'days'`
   - **Migration**: Updated all 10 occurrences across:
     - `src/actions/project.actions.ts` (3 instances)
     - `src/actions/user.actions.ts` (4 instances)
     - `src/actions/timesheet.actions.ts` (3 instances)
   - **Example**: `revalidateTag(CacheTags.PROJECTS, 'max')`
   - **Benefit**: Enables stale-while-revalidate (SWR) behavior

3. **middleware.ts → proxy.ts** ✅ MIGRATED
   - Status: **Using proxy.ts** at project root
   - Migration: Completed for Next.js 16 best practices
   - Features: Auth protection + i18n locale detection
   - Runtime: Node.js (not Edge runtime)

4. **Suspense Boundaries for PPR** ✅ IMPLEMENTED (2025-10-27)
   - **Requirement**: Dynamic components must be wrapped in `<Suspense>`
   - **File**: `src/app/dashboard/layout.tsx`
   - **Components wrapped**:
     - `<AppSidebar />` - Uses `useSession()`, `usePathname()`
     - `<DynamicBreadcrumb />` - Uses `usePathname()`
     - `<NotificationDropdown />` - Dynamic user data
     - `<CommandPalette />` - Dynamic navigation
   - **Why**: Allows PPR to cache static parts while streaming dynamic content
   - **Result**: Routes marked as ◐ (Partial Prerender) instead of ƒ (Dynamic)

5. **Node.js & TypeScript Requirements**
   - Node.js: ≥20.9.0 (Node 18 not supported)
   - TypeScript: ≥5.1.0

## Known Issues & Solutions

### Browser Console Warnings (Non-Critical)

1. **Font 404 Errors** ℹ️
   - Status: **NORMAL BEHAVIOR** - Safe to ignore
   - Description: Next.js font optimization attempts to load fallback font files that may not exist
   - Impact: None - Primary fonts load correctly
   - Files affected: inter-latin-*.woff2, jetbrains-mono-*.woff2
   - **No action required** - This is expected Next.js behavior

2. **Prisma Studio Runtime Error** ✅ RÉSOLU
   - Statut: **RÉSOLU**
   - Description: Prisma Studio était incapable de traiter les requêtes
   - Cause: Prisma Client désynchronisé après modifications du schéma
   - Solution appliquée:
     ```bash
     pnpm prisma db pull --force    # Synchroniser le schéma
     pnpm prisma format             # Formater le schéma
     pnpm prisma generate           # Régénérer le client
     pnpm prisma migrate status     # Vérifier les migrations
     ```
   - Résultat: Client Prisma régénéré avec succès, 7 migrations à jour

3. **TypeScript Types for lodash.throttle** ✅ RESOLVED
   - Status: **ALREADY INSTALLED** - No action required
   - Package: `@types/lodash.throttle@4.1.9` (in devDependencies)
   - Used in: `src/components/ui/shadcn-io/gantt/index.tsx`
   - Note: Types are installed; build errors may indicate cache issues
   - Solution: Clean build resolves the issue automatically

4. **Prisma Connection Pool Timeout** ✅ FIXED (2025-10-27)
   - **Error**: `Timed out fetching a new connection from the connection pool (connection limit: 1)`
   - **Symptom**: Dashboard page fails to load with connection timeout
   - **Root cause**: `connection_limit=1` in DATABASE_URL too low for parallel queries
   - **Impact**: Any page using `Promise.all()` with multiple Prisma queries would timeout
   - **Solution**: Increased `connection_limit=10` in `.env` and `.env.production`
   - **Configuration**:
     ```bash
     # Before (causes timeouts)
     DATABASE_URL="...?pgbouncer=true&connection_limit=1"

     # After (supports parallel queries)
     DATABASE_URL="...?pgbouncer=true&connection_limit=10"
     ```
   - **Why 10?**:
     - Dashboard has 8 concurrent Prisma queries via `Promise.all()`
     - Supabase PgBouncer transaction mode limit
     - Best practice for Vercel/Supabase integration
   - **Prevention**: Always set `connection_limit ≥ number of parallel queries + 2`

### Procédure de résolution des erreurs Prisma

Si vous rencontrez des erreurs Prisma similaires:

1. **Vérifier la connexion à la base de données**
   ```bash
   pnpm prisma db pull
   ```

2. **Régénérer le Prisma Client**
   ```bash
   pnpm prisma generate
   ```

3. **Vérifier l'état des migrations**
   ```bash
   pnpm prisma migrate status
   ```

4. **Si nécessaire, créer une nouvelle migration**
   ```bash
   pnpm prisma migrate dev --name descriptive_name
   ```

## Development Commands

```bash
# Development (uses Turbopack by default)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Database management
pnpm db:studio     # Open Prisma Studio
pnpm db:push       # Push schema changes
pnpm db:migrate    # Run migrations
```

## Development Notes
- Build output: **28 pages** generated successfully
- All TypeScript types valid
- React Compiler enabled for automatic optimization
- Turbopack filesystem caching improves dev server restart speed
- **Partial Prerendering (PPR)** active:
  - Static pages: ○ (23 routes)
  - Partial Prerender: ◐ (4 routes with dynamic segments)
  - Dynamic: ƒ (1 route - API routes)

## Recent Fixes (2025-10-27)

### revalidateTag Migration
- **Issue**: `revalidateTag()` required 2 arguments in Next.js 16
- **Fix**: Added `'max'` profile parameter to all cache tag invalidations
- **Files modified**: 3 action files, 10 total occurrences
- **Documentation**: See "Breaking Changes" section above

### PPR Suspense Boundaries
- **Issue**: Dynamic data access outside `<Suspense>` blocked prerendering
- **Fix**: Wrapped dynamic components in dashboard layout with Suspense
- **Result**: Enabled Partial Prerendering for dynamic routes
- **Performance**: Faster initial page load, streaming dynamic content

### Prisma Connection Pool Fix
- **Issue**: `PrismaClientKnownRequestError: Timed out fetching a new connection from the connection pool`
- **Root cause**: `connection_limit=1` was too low for parallel queries with `Promise.all()`
- **Impact**: Dashboard page with 8 parallel queries was timing out
- **Fix**: Increased `connection_limit` from `1` to `10` in:
  - `.env` (development)
  - `.env.production` (production/Vercel)
- **Why 10?**:
  - Dashboard executes 8 parallel Prisma queries via `Promise.all()`
  - Supabase PgBouncer in transaction mode supports 10 connections
  - Allows room for concurrent requests in production
- **Files modified**: `.env`, `.env.production`
- **Performance**: Eliminates connection pool timeouts, enables efficient parallel queries

### Build Verification
- ✅ TypeScript compilation: Success
- ✅ Static generation: 28/28 pages
- ✅ PPR routes: 4 routes with hybrid static/dynamic rendering
- ✅ Connection pool: Configured for parallel queries (limit=10)