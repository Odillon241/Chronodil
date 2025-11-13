# 🔴 Configuration Supabase Realtime Complète

## 📋 Vue d'ensemble

Ce document explique comment configurer Supabase Realtime pour synchroniser toutes les données en temps réel dans l'application Chronodil.

---

## ✅ Pages avec Real-time Activé

### 1. **HR Timesheets** (`/dashboard/hr-timesheet`)
- ✅ Surveille `HRTimesheet` et `HRActivity`
- ✅ Notifications pour création, mise à jour, suppression
- ✅ Rafraîchissement automatique des listes

### 2. **Chat** (`/dashboard/chat`)
- ✅ Surveille `Conversation`, `ConversationMember`, `Message`
- ✅ Notifications pour nouveaux messages
- ✅ Mise à jour automatique des conversations et compteurs

### 3. **Projects** (`/dashboard/projects`)
- ✅ Surveille `Project` et `ProjectMember`
- ✅ Notifications pour création/modification de projets
- ✅ Rafraîchissement automatique de la liste

### 4. **Dashboard** (`/dashboard`)
- ✅ Surveille `Project`, `ProjectMember`, `Task`, `HRTimesheet`
- ✅ Rafraîchissement automatique de la page

### 5. **Tasks** (`/dashboard/tasks`)
- ✅ Déjà implémenté (voir `REALTIME_TASKS_SETUP.md`)

---

## 🚀 Configuration Supabase

### Étape 1: Activer Realtime dans Supabase Dashboard

1. **Ouvrez Supabase Dashboard**
   - Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionnez votre projet

2. **Accédez au SQL Editor**
   - Cliquez sur **SQL Editor** dans la barre latérale
   - Cliquez sur **New query**

3. **Exécutez le script SQL**
   - Ouvrez le fichier `sql-scripts/enable-realtime-all-tables.sql`
   - Copiez-collez le contenu dans l'éditeur SQL
   - Cliquez sur **Run** pour exécuter

### Étape 2: Vérifier l'activation

Le script SQL inclut une requête de vérification qui affiche toutes les tables activées:

```sql
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN (
    'HRTimesheet', 'HRActivity',
    'Conversation', 'ConversationMember', 'Message',
    'Project', 'ProjectMember'
  )
ORDER BY tablename;
```

Vous devriez voir **7 tables** listées (les tables de tâches sont déjà activées via `enable-realtime-tasks.sql`).

---

## 🔧 Hooks React Disponibles

### 1. `useRealtimeHRTimesheets`

**Fichier**: `src/hooks/use-realtime-hr-timesheets.tsx`

```typescript
useRealtimeHRTimesheets({
  onHRTimesheetChange: (eventType, hrTimesheetId) => {
    // Rafraîchir les données
    loadMyTimesheets();
  },
  userId: session?.user?.id,
});
```

**Tables surveillées**: `HRTimesheet`, `HRActivity`

---

### 2. `useRealtimeChat`

**Fichier**: `src/hooks/use-realtime-chat.tsx`

```typescript
useRealtimeChat({
  onConversationChange: (eventType, conversationId) => {
    loadConversations();
  },
  onMessageChange: (eventType, messageId, conversationId) => {
    if (selectedConversation?.id === conversationId) {
      loadConversation(conversationId);
    }
    loadConversations();
  },
  userId: currentUser?.id,
});
```

**Tables surveillées**: `Conversation`, `ConversationMember`, `Message`

---

### 3. `useRealtimeProjects`

**Fichier**: `src/hooks/use-realtime-projects.tsx`

```typescript
useRealtimeProjects({
  onProjectChange: (eventType, projectId) => {
    loadProjects();
  },
  userId: currentUser?.id,
});
```

**Tables surveillées**: `Project`, `ProjectMember`

---

### 4. `useRealtimeDashboard`

**Fichier**: `src/hooks/use-realtime-dashboard.tsx`

```typescript
useRealtimeDashboard({
  onDataChange: (source, eventType, id) => {
    router.refresh(); // Rafraîchir la page serveur
  },
  userId: session?.user?.id,
});
```

**Tables surveillées**: `Project`, `ProjectMember`, `Task`, `HRTimesheet`

---

### 5. `useRealtimeTasks`

**Fichier**: `src/hooks/use-realtime-tasks.tsx`

**Tables surveillées**: `Task`, `TaskComment`, `TaskMember`, `TaskActivity`

Voir la documentation complète dans `REALTIME_TASKS_SETUP.md`.

---

## 📊 Tables Activées

### Tables activées par ce script (7 tables)

| Table | Page(s) | Événements |
|-------|---------|-------------|
| `HRTimesheet` | HR Timesheets, Dashboard | INSERT, UPDATE, DELETE |
| `HRActivity` | HR Timesheets | INSERT, UPDATE, DELETE |
| `Conversation` | Chat | INSERT, UPDATE, DELETE |
| `ConversationMember` | Chat | INSERT, DELETE |
| `Message` | Chat | INSERT, UPDATE, DELETE |
| `Project` | Projects, Dashboard | INSERT, UPDATE, DELETE |
| `ProjectMember` | Projects, Dashboard | INSERT, DELETE |

### Tables déjà activées (via `enable-realtime-tasks.sql`)

| Table | Page(s) | Événements |
|-------|---------|-------------|
| `Task` | Tasks, Dashboard | INSERT, UPDATE, DELETE |
| `TaskComment` | Tasks | INSERT, UPDATE, DELETE |
| `TaskMember` | Tasks | INSERT, DELETE |
| `TaskActivity` | Tasks | INSERT |

---

## 🔧 Variables d'environnement

Assurez-vous que les variables suivantes sont configurées dans votre `.env`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Ces variables sont utilisées par `src/lib/supabase-client.ts` pour créer le client Supabase.

---

## 🎯 Fonctionnalités

### Reconnexion automatique
- ✅ Backoff exponentiel en cas d'erreur
- ✅ Maximum 5 tentatives de reconnexion
- ✅ Notification utilisateur si la connexion échoue

### Notifications toast
- ✅ Notifications pour les événements importants
- ✅ Filtrage des notifications (ne notifie pas ses propres actions)
- ✅ Durées adaptées selon l'importance

### Nettoyage automatique
- ✅ Désabonnement automatique lors du démontage du composant
- ✅ Prévention des fuites mémoire

---

## 🐛 Dépannage

### Problème: Les changements ne sont pas détectés

**Solutions**:
1. Vérifiez que Realtime est activé dans Supabase Dashboard
2. Vérifiez la console du navigateur pour les logs de connexion
3. Vérifiez que les tables sont bien dans la publication `supabase_realtime`
4. Vérifiez que les variables d'environnement sont correctes

### Problème: Erreur "Table does not exist"

**Solutions**:
1. Vérifiez que les migrations Prisma ont été appliquées
2. Vérifiez que les noms de tables sont corrects (sensible à la casse)
3. Vérifiez que vous êtes dans le bon schéma (`public`)

### Problème: Trop de notifications

**Solutions**:
1. Les hooks filtrent déjà les notifications pour éviter les doublons
2. Vous pouvez modifier les hooks pour ajuster le comportement des notifications
3. Les notifications sont limitées aux événements importants

---

## 📝 Notes Techniques

### Architecture

- **Client Supabase**: Créé via `createBrowserClient` dans `src/lib/supabase-client.ts`
- **Channels**: Chaque hook crée son propre channel avec un nom unique
- **Presence**: Utilisé pour identifier l'utilisateur connecté
- **Broadcast**: Désactivé (`self: false`) pour éviter les boucles

### Performance

- Les hooks utilisent `useCallback` pour stabiliser les callbacks
- Les refs sont utilisées pour éviter les reconnexions inutiles
- Le nettoyage est effectué automatiquement lors du démontage

### Sécurité

- Les hooks ne filtrent pas les données côté client
- La sécurité doit être gérée côté serveur (RLS policies)
- Les notifications sont basées sur les événements reçus

---

## 🔄 Migration depuis l'ancien système

Si vous aviez déjà activé Realtime pour les tâches uniquement:

1. Exécutez le nouveau script `enable-realtime-all-tables.sql`
2. Le script est idempotent - les tables déjà activées seront ignorées
3. Aucune modification nécessaire dans le code

---

## 📚 Ressources

- [Documentation Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Documentation Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Documentation Tasks Real-time](./REALTIME_TASKS_SETUP.md)

---

## ✅ Checklist de Déploiement

Avant de déployer en production:

- [ ] Script SQL exécuté dans Supabase
- [ ] Variables d'environnement configurées
- [ ] Toutes les tables vérifiées dans `pg_publication_tables`
- [ ] Tests effectués sur chaque page avec real-time
- [ ] Console du navigateur vérifiée (pas d'erreurs)
- [ ] Notifications toast fonctionnelles
- [ ] Reconnexion automatique testée (déconnexion réseau)

---

**Dernière mise à jour**: 2025-01-XX

