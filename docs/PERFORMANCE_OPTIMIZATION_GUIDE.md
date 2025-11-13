# 🚀 Guide Complet d'Optimisation des Performances

## 📊 Diagnostic de Performance

### Problèmes Identifiés (2025-11-13)

#### 🔴 **CRITIQUE - Sécurité**
- **28 tables sans Row Level Security (RLS)**
  - Toutes les données sont accessibles publiquement
  - Faille de sécurité majeure
  - **Impact**: CRITIQUE - À corriger IMMÉDIATEMENT

#### 🟠 **MAJEUR - Base de données**
- **48 indexes inutilisés** qui ralentissent les écritures
  - Aucun de ces indexes n'a jamais été utilisé par Postgres
  - **Impact**: -20 à -40% sur les performances d'écriture
- **2 foreign keys non indexées**
  - `Account.userId` et `HRTimesheet.odillonSignedById`
  - **Impact**: Jointures lentes

#### 🟡 **IMPORTANT - Application**
- **Requêtes Prisma non optimisées**
  - Trop d'includes, pas de select spécifique
  - Pas de pagination
  - **Impact**: Payload JSON 3-5x trop gros, -40 à -60% de performance
- **Pas de caching côté client**
  - Chaque navigation refetch toutes les données
  - **Impact**: UX dégradée, serveur surchargé
- **Real-time non filtré**
  - Écoute TOUS les événements de TOUS les utilisateurs
  - **Impact**: -70% de trafic réseau inutile

---

## 🎯 Gains de Performance Attendus

### Après implémentation de toutes les optimisations:

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Temps de chargement des listes** | 2-4s | 0.5-1s | **-60 à -75%** |
| **Taille des payloads JSON** | 500KB-2MB | 100-400KB | **-60 à -80%** |
| **Requêtes DB (temps d'exécution)** | 200-800ms | 50-200ms | **-60 à -75%** |
| **Trafic réseau real-time** | 100% | 20-30% | **-70 à -80%** |
| **Re-fetches inutiles** | Beaucoup | Quasi aucun | **-90%** |
| **Temps d'écriture DB** | 100ms | 50-70ms | **-30 à -50%** |

---

## 📋 Plan d'Implémentation (Étapes)

### ⏱️ Durée estimée totale: **2-3 heures**

### Étape 1: Backup de la Base de Données (15 min)

**OBLIGATOIRE AVANT TOUTE MODIFICATION**

1. Aller sur **Supabase Dashboard** → Votre projet
2. **Settings** → **Database** → **Backups**
3. Cliquer sur **"Create backup"**
4. Attendre la fin du backup (5-10 min)
5. Vérifier que le backup est bien créé

### Étape 2: Optimisation de la Base de Données (30 min)

#### 2.1 Exécuter le script d'optimisation des indexes

1. Ouvrir **Supabase SQL Editor**
2. Copier le contenu de `scripts/optimize-database-performance.sql`
3. Exécuter le script
4. Vérifier les résultats:
   ```sql
   -- Vérifier que les indexes sont bien supprimés/créés
   SELECT tablename, indexname
   FROM pg_indexes
   WHERE schemaname = 'public' AND tablename = 'Task'
   ORDER BY indexname;
   ```

**Résultat attendu**:
- ✅ 48 indexes supprimés
- ✅ 8 nouveaux indexes composites créés
- ✅ 2 foreign keys indexées
- ✅ ANALYZE terminé avec succès

**Temps d'exécution**: 2-5 minutes

#### 2.2 Activer Row Level Security (RLS)

⚠️ **ATTENTION**: Cette étape est CRITIQUE pour la sécurité ET les performances real-time

1. Ouvrir **Supabase SQL Editor**
2. Copier le contenu de `scripts/enable-row-level-security.sql`
3. **LIRE ATTENTIVEMENT** les commentaires dans le script
4. Exécuter le script
5. Vérifier que RLS est activé:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

**Résultat attendu**:
- ✅ RLS activé sur 28 tables
- ✅ Politiques de base créées
- ✅ rowsecurity = true pour toutes les tables

**⚠️ IMPORTANT**: Après activation de RLS, testez bien que vos users peuvent toujours accéder à leurs données!

**Temps d'exécution**: 1-2 minutes

### Étape 3: Migration vers React Query (45 min)

#### 3.1 Installer React Query

```bash
pnpm add @tanstack/react-query
```

✅ **Déjà fait!**

#### 3.2 Ajouter le QueryProvider

1. Ouvrir `src/app/layout.tsx`
2. Importer le QueryProvider:
   ```tsx
   import { QueryProvider } from "@/providers/query-provider";
   ```
3. Wrapper l'application:
   ```tsx
   export default function RootLayout({ children }) {
     return (
       <html lang="fr">
         <body>
           <QueryProvider>
             {/* Autres providers */}
             {children}
           </QueryProvider>
         </body>
       </html>
     );
   }
   ```

#### 3.3 Migrer les composants vers les hooks React Query

**Exemple de migration**:

**AVANT** (sans cache):
```tsx
// src/app/dashboard/tasks/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getMyTasks } from "@/actions/task.actions";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      const result = await getMyTasks({});
      if (result.data) {
        setTasks(result.data);
      }
      setLoading(false);
    }
    fetchTasks();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      {tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}
```

**APRÈS** (avec cache React Query):
```tsx
// src/app/dashboard/tasks/page.tsx
"use client";

import { useMyTasks } from "@/hooks/use-tasks-query";

export default function TasksPage() {
  const { data, isLoading, error } = useMyTasks({});

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  return (
    <div>
      {data.tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}
```

**Avantages**:
- ✅ Cache automatique (5 minutes)
- ✅ Pas de re-fetch si données fraîches
- ✅ Retry automatique en cas d'erreur
- ✅ Refetch automatique au focus
- ✅ Code 50% plus court

#### 3.4 Remplacer les actions par les versions optimisées

1. Importer les actions optimisées:
   ```tsx
   import {
     getMyTasksOptimized,
     getAllTasksOptimized,
     getTaskByIdOptimized,
   } from "@/actions/task.actions.optimized";
   ```

2. Utiliser les hooks React Query (déjà créés):
   ```tsx
   import {
     useMyTasks,
     useAllTasks,
     useTask,
     useCreateTask,
     useUpdateTask,
     useDeleteTask,
   } from "@/hooks/use-tasks-query";
   ```

### Étape 4: Optimiser le Real-time (30 min)

#### 4.1 Remplacer le hook real-time

1. Ouvrir les composants qui utilisent `useRealtimeTasks`
2. Remplacer par `useRealtimeTasksOptimized`:

**AVANT**:
```tsx
import { useRealtimeTasks } from "@/hooks/use-realtime-tasks";

useRealtimeTasks({
  onTaskChange: () => {
    // Refetch manually
    fetchTasks();
  },
  userId: session.user.id,
});
```

**APRÈS**:
```tsx
import { useRealtimeTasksOptimized } from "@/hooks/use-realtime-tasks.optimized";

// ⚡ Plus besoin de callback! React Query synchronise automatiquement le cache
useRealtimeTasksOptimized({
  userId: session.user.id,
  enabled: true, // Peut être désactivé si nécessaire
});
```

**Avantages**:
- ✅ Filtrage côté serveur (RLS)
- ✅ Synchronisation automatique du cache React Query
- ✅ Un seul channel au lieu de 4
- ✅ Notifications debouncées
- ✅ -70% de trafic réseau

### Étape 5: Tests et Validation (30 min)

#### 5.1 Tests unitaires des requêtes

1. Tester la récupération des tâches:
   ```bash
   # Ouvrir l'app en dev
   pnpm dev

   # Vérifier dans les DevTools React Query:
   # - Les queries sont bien créées
   # - Le cache fonctionne
   # - Les données sont bien invalidées après mutations
   ```

2. Vérifier les payloads réseau:
   - Ouvrir **DevTools Chrome** → **Network**
   - Filtrer par `task`
   - Vérifier que les payloads sont **-60% plus petits**

#### 5.2 Tests du real-time

1. Ouvrir 2 onglets avec 2 users différents
2. Créer une tâche dans l'onglet 1
3. Vérifier qu'elle apparaît dans l'onglet 2 (si partagée)
4. Modifier le statut
5. Vérifier la synchronisation

#### 5.3 Tests de performance

1. Mesurer le temps de chargement:
   - Ouvrir **DevTools** → **Performance**
   - Enregistrer une session
   - Naviguer vers `/dashboard/tasks`
   - Vérifier que le temps de chargement est **< 1s**

2. Vérifier le cache:
   - Naviguer vers `/dashboard/tasks`
   - Revenir à `/dashboard`
   - Retourner à `/dashboard/tasks`
   - **Devrait être instantané** (données en cache)

---

## 📝 Checklist de Déploiement

### Avant le déploiement

- [ ] Backup de la base de données créé
- [ ] Script d'optimisation des indexes testé en local
- [ ] Script RLS testé en local
- [ ] React Query intégré et testé
- [ ] Real-time optimisé et testé
- [ ] Tous les tests passent

### Déploiement en production

1. **Fenêtre de maintenance recommandée**: 30 minutes
2. **Heure recommandée**: Heures creuses (ex: 2h-4h du matin)
3. **Plan de rollback**: Restaurer le backup en cas de problème

#### Étapes de déploiement:

1. **Mettre l'app en maintenance** (optionnel)
2. **Exécuter le script d'optimisation des indexes** (Supabase SQL Editor)
3. **Exécuter le script RLS** (Supabase SQL Editor)
4. **Déployer le code** (Vercel/autre)
5. **Tester rapidement** les fonctionnalités critiques
6. **Monitorer les logs** pendant 30 minutes
7. **Retirer la maintenance**

### Après le déploiement

- [ ] Vérifier les logs Supabase (pas d'erreurs)
- [ ] Vérifier les logs d'application (pas d'erreurs)
- [ ] Tester les fonctionnalités critiques
- [ ] Mesurer les performances (temps de chargement)
- [ ] Monitorer pendant 24h

---

## 🐛 Troubleshooting

### Problème: "Timed out fetching a new connection from the connection pool"

**Cause**: `connection_limit` trop bas dans `DATABASE_URL`

**Solution**:
```bash
# .env et .env.production
DATABASE_URL="...?pgbouncer=true&connection_limit=10"
```

### Problème: "Row Level Security policy violation"

**Cause**: Politiques RLS mal configurées ou manquantes

**Solution**:
1. Vérifier les politiques RLS dans Supabase Dashboard
2. Tester avec un user normal (pas admin)
3. Ajuster les politiques selon vos besoins

### Problème: "React Query cache not updating"

**Cause**: Clés de cache incorrectes ou invalidation manquante

**Solution**:
1. Vérifier que vous utilisez les `QUERY_KEYS` exportés
2. Vérifier que les mutations invalident bien le cache
3. Ouvrir les **React Query DevTools** pour debugger

### Problème: "Real-time events not received"

**Cause**: RLS bloque les événements ou filtres incorrects

**Solution**:
1. Vérifier que RLS est bien configuré
2. Vérifier les filtres dans `useRealtimeTasksOptimized`
3. Vérifier les logs Supabase Real-time

---

## 📊 Monitoring Post-Déploiement

### Métriques à surveiller:

1. **Temps de réponse API**:
   - Vercel Analytics / Dashboard
   - Cible: < 500ms pour 95% des requêtes

2. **Taille des payloads**:
   - DevTools Network
   - Cible: -60% vs avant

3. **Nombre de requêtes DB**:
   - Supabase Dashboard → Database → Query Stats
   - Cible: -30% vs avant (grâce au cache)

4. **Taux d'erreur**:
   - Vercel Logs / Supabase Logs
   - Cible: < 1%

5. **Temps de chargement client**:
   - Core Web Vitals (Vercel Analytics)
   - Cible: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## 🎓 Ressources Supplémentaires

### Documentation

- [React Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Prisma Select Optimization](https://www.prisma.io/docs/concepts/components/prisma-client/select-fields)
- [Supabase Realtime Filters](https://supabase.com/docs/guides/realtime/postgres-changes#filters)

### Outils de Monitoring

- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Supabase Logs](https://supabase.com/docs/guides/platform/logs)
- [React Query DevTools](https://tanstack.com/query/latest/docs/framework/react/devtools)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

## ✅ Résumé des Gains

| Optimisation | Effort | Impact | Priorité |
|--------------|--------|--------|----------|
| **Suppression indexes inutilisés** | Faible (15 min) | Élevé (-30% écritures) | 🔴 URGENT |
| **Indexes composites** | Faible (15 min) | Élevé (-50% lectures) | 🔴 URGENT |
| **Row Level Security** | Moyen (30 min) | CRITIQUE (Sécurité + Perf) | 🔴 URGENT |
| **React Query** | Élevé (2h) | Très élevé (-60% requêtes) | 🟠 IMPORTANT |
| **Requêtes Prisma optimisées** | Moyen (1h) | Élevé (-70% payload) | 🟠 IMPORTANT |
| **Real-time optimisé** | Faible (30 min) | Élevé (-70% trafic) | 🟡 MOYEN |

---

## 🚀 Prochaines Étapes (Optionnel)

### Phase 2 - Optimisations Avancées (après Phase 1)

1. **Server Components avec PPR**:
   - Utiliser les Server Components Next.js pour le rendu côté serveur
   - Activer Partial Prerendering (PPR) pour les routes dynamiques
   - **Gain**: -40% de JavaScript côté client

2. **Image Optimization**:
   - Utiliser `next/image` pour toutes les images
   - Lazy loading avec `loading="lazy"`
   - **Gain**: -50% de taille des images

3. **Code Splitting**:
   - Dynamic imports pour les composants lourds
   - Route-based code splitting
   - **Gain**: -30% de bundle initial

4. **Edge Caching**:
   - Cache Vercel Edge pour les données statiques
   - ISR (Incremental Static Regeneration) pour les pages
   - **Gain**: -80% de requêtes DB

---

**Date de création**: 2025-11-13
**Dernière mise à jour**: 2025-11-13
**Version**: 1.0.0
