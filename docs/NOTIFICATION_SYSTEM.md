# Système de Notifications avec Sons en Temps Réel

## Vue d'ensemble

Le système de notifications de CHRONODIL intègre :
- **Notifications en temps réel** via Supabase Realtime
- **Sons de notification** personnalisables et configurables
- **Toasts visuels** pour afficher les notifications à l'utilisateur
- **Dropdown de notifications** avec compteur non lu en temps réel

## Architecture

### Composants

```
┌─────────────────────────────────────────────────────────────┐
│                     NotificationDropdown                     │
│  - Affiche le bouton cloche avec badge de compteur         │
│  - Dropdown avec liste des notifications récentes           │
│  - Intègre use-realtime-notifications                      │
│  - Intègre use-notification-with-sound                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌────────────────────────────┐  ┌──────────────────────────┐
│ use-realtime-notifications │  │ use-notification-with-   │
│                            │  │ sound                    │
│ - Écoute Supabase INSERT   │  │ - Gère les sons          │
│ - Filtre par userId        │  │ - Gère les préférences   │
│ - Callback onNewNotif      │  │ - localStorage           │
└────────────────────────────┘  └──────────────────────────┘
                │                           │
                │                           │
                ▼                           ▼
         Supabase Realtime          use-notification-sound
         (table Notification)       (sons via use-sound)
```

### Hooks

#### 1. `use-realtime-notifications.tsx`
**Rôle** : Écoute en temps réel les nouvelles notifications depuis Supabase.

**Fonctionnalités** :
- Souscription à la table `Notification` avec filtre `userId=eq.{userId}`
- Écoute uniquement des événements `INSERT` (nouvelles notifications)
- Reconnexion automatique avec backoff exponentiel (max 5 tentatives)
- Callback `onNewNotification` appelé quand une nouvelle notification arrive

**Utilisation** :
```tsx
useRealtimeNotifications({
  onNewNotification: (notification) => {
    console.log('Nouvelle notification:', notification);
    // Jouer un son, afficher un toast, etc.
  },
  userId: session?.user?.id || '',
});
```

#### 2. `use-notification-with-sound.tsx`
**Rôle** : Intègre automatiquement les sons aux notifications.

**Fonctionnalités** :
- Récupère les préférences utilisateur depuis `localStorage`
- Joue le son approprié selon le type de notification
- Mapping automatique : `success` → son de succès, `error` → son d'erreur, etc.

**Utilisation** :
```tsx
const { playNotificationSound, soundEnabled } = useNotificationWithSound();

// Jouer un son
playNotificationSound('success'); // ou 'error', 'info', 'warning'
```

#### 3. `use-notification-sound.tsx`
**Rôle** : Hook de bas niveau pour gérer la lecture des sons.

**Fonctionnalités** :
- Chargement paresseux des sons (après la première interaction utilisateur)
- Support de multiples types de sons (notification, taskAssigned, taskCompleted, etc.)
- Gestion des permissions de notification du navigateur
- Broadcast entre onglets via `BroadcastChannel`

### Composant Principal

#### `notification-dropdown.tsx`

**Intégrations** :
1. **Realtime** : Écoute les nouvelles notifications via `use-realtime-notifications`
2. **Sons** : Joue les sons via `use-notification-with-sound`
3. **Toasts** : Affiche un toast visuel pour chaque nouvelle notification
4. **Polling (fallback)** : Rafraîchit le compteur toutes les 30 secondes si realtime échoue

**Workflow d'une nouvelle notification** :
```
1. Supabase INSERT sur table Notification
   ↓
2. use-realtime-notifications détecte l'événement
   ↓
3. handleNewNotification() est appelé
   ↓
4. Joue le son approprié (si soundEnabled)
   ↓
5. Affiche un toast visuel
   ↓
6. Rafraîchit le compteur et la liste des notifications
```

## Configuration Supabase Realtime

### Prérequis

**IMPORTANT** : Pour que le système fonctionne, Supabase Realtime doit être activé pour la table `Notification`.

### Activation Realtime sur Supabase

1. **Se connecter à Supabase Dashboard** :
   - Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionner votre projet

2. **Activer Realtime pour la table Notification** :
   ```sql
   -- Dans l'éditeur SQL de Supabase
   ALTER TABLE "Notification" REPLICA IDENTITY FULL;

   -- Activer Realtime pour la table
   ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
   ```

3. **Vérifier l'activation** :
   - Aller dans `Database` → `Publications`
   - Vérifier que `Notification` est dans la publication `supabase_realtime`
   - Aller dans `Database` → `Replication`
   - Vérifier que `Notification` a `REPLICA IDENTITY = FULL`

### Permissions RLS (Row Level Security)

**IMPORTANT** : Assurez-vous que les utilisateurs ont les bonnes permissions pour lire leurs propres notifications.

```sql
-- Policy pour lire ses propres notifications
CREATE POLICY "Users can read their own notifications"
ON "Notification"
FOR SELECT
USING (auth.uid()::text = "userId");

-- Policy pour recevoir les événements realtime de ses propres notifications
-- (Supabase Realtime respecte automatiquement les policies RLS)
```

## Configuration des Sons

### Préférences Utilisateur

Les préférences de sons sont stockées dans `localStorage` :
- `notification-sounds-enabled` : `"true"` ou `"false"` (activer/désactiver les sons)
- `notification-sounds-volume` : `"0.0"` à `"1.0"` (volume des sons)

### Sons Disponibles

Les sons sont stockés dans 2 emplacements avec fallback automatique :

1. **Supabase Storage** (prioritaire) :
   - Bucket : `notification-sounds`
   - URL : `{SUPABASE_URL}/storage/v1/object/public/notification-sounds/{soundId}.mp3`

2. **Fichiers locaux** (fallback) :
   - Répertoire : `public/sounds/`
   - Accès : `/sounds/{soundId}.mp3`

#### Liste des sons par défaut :
- `new-notification-3-398649.mp3` - Son de notification par défaut (moderne et agréable)
- `new-notification-réussi.mp3` - Son de succès/confirmation
- `notification.wav` - Son classique (fallback)

### Configuration des Sons dans le Code

Fichier : `src/hooks/use-notification-sound.tsx`

```typescript
export const NOTIFICATION_SOUNDS: NotificationSound[] = [
  {
    id: 'new-notification-3-398649',
    name: 'Notification par défaut',
    description: 'Son de notification moderne et agréable (par défaut)',
    file: getSoundUrl('new-notification-3-398649', 'mp3'),
    category: 'classic'
  },
  // ...autres sons
];
```

## Utilisation

### Créer une Notification

Pour créer une notification qui sera détectée en temps réel :

```typescript
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

await prisma.notification.create({
  data: {
    id: nanoid(),
    userId: targetUserId,
    title: "Nouvelle tâche assignée",
    message: "Vous avez été assigné à la tâche XYZ",
    type: "info", // ou 'success', 'error', 'warning'
    link: "/dashboard/tasks/xyz",
    isRead: false,
  },
});
```

**Types de notifications** :
- `info` : Notification informative (par défaut)
- `success` : Opération réussie
- `error` : Erreur ou problème
- `warning` : Avertissement

### Activer/Désactiver les Sons

Les utilisateurs peuvent activer/désactiver les sons depuis :
- **Page Settings** : `/dashboard/settings?tab=notifications`
- **Composant** : `src/components/features/notification-sound-settings.tsx`

### Tester les Sons

Un composant de test est disponible :
- **Composant** : `src/components/features/notification-sound-tester.tsx`
- Permet de tester chaque son individuellement
- Affiche l'état des permissions de notification du navigateur

## Débogage

### Logs de Console

Le système affiche des logs détaillés dans la console :
- `🔄 Configuration du real-time Supabase pour les notifications...`
- `✅ Subscription real-time active pour les notifications`
- `🔔 Nouvelle notification reçue dans le dropdown:` + détails
- `⚠️ Erreur de connexion real-time notifications, tentative de reconnexion...`

### Vérifier que Realtime fonctionne

1. **Ouvrir la console du navigateur**
2. **Créer une notification pour l'utilisateur connecté** (via Supabase Dashboard ou API)
3. **Vérifier les logs** :
   - Le hook doit détecter l'événement INSERT
   - Un toast doit s'afficher
   - Le son doit se jouer (si activé)
   - Le compteur doit se mettre à jour

### Problèmes Courants

#### 1. Les sons ne se jouent pas

**Causes possibles** :
- Les sons ne sont pas activés dans les préférences
- Permissions de notification du navigateur refusées
- Les fichiers audio ne sont pas accessibles (vérifier le réseau)
- L'utilisateur n'a pas encore interagi avec la page (Chrome bloque l'audio avant interaction)

**Solution** :
- Vérifier `localStorage.getItem('notification-sounds-enabled')` = `"true"`
- Vérifier `Notification.permission` dans la console
- Tester manuellement avec le composant `notification-sound-tester`

#### 2. Les notifications ne s'affichent pas en temps réel

**Causes possibles** :
- Supabase Realtime non activé pour la table `Notification`
- Permissions RLS bloquent l'accès
- Le userId n'est pas fourni au hook

**Solution** :
- Vérifier que `ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";` a été exécuté
- Vérifier les policies RLS sur la table `Notification`
- Vérifier que `session?.user?.id` est bien passé au hook

#### 3. Plusieurs onglets jouent le même son

**Comportement normal** : Le système joue le son dans tous les onglets ouverts qui écoutent les notifications.

**Solution (si non souhaité)** :
- Le `BroadcastChannel` permet de communiquer entre onglets
- Implémenter une logique de "leader election" pour qu'un seul onglet joue le son

## Tests

### Tests Unitaires

Fichier : `src/__tests__/hooks/use-notification-sound.test.ts`

### Tests d'Intégration

Fichier : `src/__tests__/integration/notification-system.integration.test.ts`

### Tester Manuellement

1. **Activer les sons** dans `/dashboard/settings?tab=notifications`
2. **Tester un son** avec le bouton de test
3. **Créer une notification** via Supabase Dashboard :
   ```sql
   INSERT INTO "Notification" (id, "userId", title, message, type, "isRead", "createdAt")
   VALUES (
     gen_random_uuid()::text,
     '{votre-user-id}',
     'Test Notification',
     'Ceci est un test',
     'info',
     false,
     now()
   );
   ```
4. **Vérifier** que le son se joue et le toast s'affiche

## Améliorations Futures

- [ ] Support des notifications push (Service Worker)
- [ ] Groupement des notifications similaires
- [ ] Snooze de notifications
- [ ] Plus de sons personnalisables
- [ ] Sons différents par type de notification (tâche, projet, message, etc.)
- [ ] Vibration sur mobile
- [ ] Notification desktop même si l'onglet est en arrière-plan

## Références

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [use-sound Hook](https://www.npmjs.com/package/use-sound)
- [Better Auth Documentation](https://www.better-auth.com/docs)
