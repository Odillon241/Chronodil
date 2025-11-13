# 🔴 Configuration Supabase Realtime pour les Tâches

## 📋 Vue d'ensemble

Ce document explique comment configurer Supabase Realtime pour synchroniser les tâches en temps réel dans l'application Chronodil.

---

## ✅ Ce qui est implémenté

### 1. Hook React `useRealtimeTasks`

**Fichier**: `src/hooks/use-realtime-tasks.tsx`

Le hook écoute les changements en temps réel sur les tables suivantes:
- ✅ `Task` - Tâches principales (INSERT, UPDATE, DELETE)
- ✅ `TaskComment` - Commentaires sur les tâches
- ✅ `TaskMember` - Membres des tâches partagées
- ✅ `TaskActivity` - Historique des activités

**Fonctionnalités**:
- 🔄 Reconnexion automatique avec backoff exponentiel
- 🔔 Notifications toast pour les événements importants
- 🎯 Filtrage des notifications (ne notifie pas ses propres actions)
- 🧹 Nettoyage automatique des subscriptions
- 📊 Logging détaillé pour le débogage

### 2. Intégration dans la page Tasks

**Fichier**: `src/app/dashboard/tasks/page.tsx`

Le hook est utilisé pour rafraîchir automatiquement les tâches lorsqu'un changement est détecté:

```typescript
useRealtimeTasks({
  onTaskChange: (eventType, taskId) => {
    refreshTasks();
  },
  userId: session?.user?.id
});
```

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
   - Ouvrez le fichier `sql-scripts/enable-realtime-tasks.sql`
   - Copiez-collez le contenu dans l'éditeur SQL
   - Cliquez sur **Run** pour exécuter

### Étape 2: Vérifier l'activation

Le script SQL inclut une requête de vérification qui affiche les tables activées:

```sql
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('Task', 'TaskComment', 'TaskMember', 'TaskActivity')
ORDER BY tablename;
```

Vous devriez voir les 4 tables listées.

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

## 📊 Types d'événements gérés

### Table `Task`

| Événement | Action | Notification |
|-----------|--------|--------------|
| `INSERT` | Nouvelle tâche créée | ✅ Toast: "Nouvelle tâche créée: [nom]" |
| `UPDATE` | Tâche modifiée | ✅ Toast (si status/priority changé) |
| `DELETE` | Tâche supprimée | ✅ Toast: "Tâche supprimée: [nom]" |

### Table `TaskComment`

| Événement | Action | Notification |
|-----------|--------|--------------|
| `INSERT` | Nouveau commentaire | ✅ Toast (si pas votre propre commentaire) |
| `UPDATE` | Commentaire modifié | 🔄 Rafraîchissement silencieux |
| `DELETE` | Commentaire supprimé | 🔄 Rafraîchissement silencieux |

### Table `TaskMember`

| Événement | Action | Notification |
|-----------|--------|--------------|
| `INSERT` | Nouveau membre ajouté | ✅ Toast: "Vous avez été ajouté à une tâche" |
| `DELETE` | Membre retiré | 🔄 Rafraîchissement silencieux |

### Table `TaskActivity`

| Événement | Action | Notification |
|-----------|--------|--------------|
| `INSERT` | Nouvelle activité | 🔄 Rafraîchissement silencieux |

---

## 🐛 Dépannage

### Problème: Les changements ne sont pas détectés

**Solutions**:
1. Vérifiez que Realtime est activé dans Supabase Dashboard
2. Vérifiez la console du navigateur pour les logs de connexion
3. Vérifiez que les variables d'environnement sont correctes
4. Vérifiez que vous êtes connecté (session active)

### Problème: Trop de notifications

**Solution**: Le hook filtre déjà les notifications pour éviter le spam. Si vous voulez désactiver certaines notifications, modifiez le hook dans `src/hooks/use-realtime-tasks.tsx`.

### Problème: Erreur de connexion

**Solutions**:
1. Vérifiez votre connexion Internet
2. Vérifiez que Supabase est accessible
3. Le hook tente automatiquement de se reconnecter avec backoff exponentiel
4. Si le problème persiste, rafraîchissez la page

---

## 📝 Logs de débogage

Le hook affiche des logs dans la console du navigateur:

- `🔄 Configuration du real-time Supabase pour les tâches...` - Initialisation
- `✅ Subscription real-time active pour les tâches` - Connexion réussie
- `🔄 Événement Task [TYPE]: [détails]` - Événement détecté
- `⚠️ Erreur de connexion real-time, tentative de reconnexion...` - Erreur
- `❌ Nombre maximum de tentatives de reconnexion atteint` - Échec

---

## 🔒 Sécurité

### Row Level Security (RLS)

Supabase Realtime respecte les politiques RLS configurées sur vos tables. Assurez-vous que:

1. Les politiques RLS sont configurées correctement
2. Les utilisateurs ne peuvent voir que les tâches auxquelles ils ont accès
3. Les notifications sont filtrées par `userId` pour éviter les fuites d'information

### Permissions

Le hook utilise la clé `NEXT_PUBLIC_SUPABASE_ANON_KEY` qui est publique mais limitée par les politiques RLS. Ne jamais utiliser la clé service role côté client.

---

## 🚀 Améliorations futures

- [ ] Optimisation: Mettre à jour seulement les tâches affectées au lieu de tout recharger
- [ ] Cache local pour réduire les requêtes
- [ ] Indicateur visuel de connexion real-time (icône dans l'UI)
- [ ] Statistiques de connexion (uptime, événements reçus)
- [ ] Support des filtres avancés (écouter seulement certaines tâches)

---

## 📚 Ressources

- [Documentation Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Guide Realtime avec React](https://supabase.com/docs/guides/realtime/react)
- [Publications PostgreSQL](https://www.postgresql.org/docs/current/logical-replication-publication.html)

---

**Dernière mise à jour**: 2025-01-XX
**Version**: 1.0.0

