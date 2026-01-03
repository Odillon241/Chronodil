# Guide des Notifications avec Sons - Chronodil

## Architecture

### Composants principaux

1. **Hook `useNotificationSound`** (`src/hooks/use-notification-sound.tsx`)
   - Gère les permissions Notification API
   - Synchronise les sons entre les onglets (BroadcastChannel)
   - Utilise la librairie `useSound` pour une meilleure robustesse
   - Sons disponibles : notification, taskAssigned, taskCompleted, taskUpdated, error, success

2. **Hook `useNotificationWithSound`** (`src/hooks/use-notification-with-sound.tsx`)
   - Intègre automatiquement les sons aux notifications
   - Récupère/Sauvegarde les préférences utilisateur (localStorage)
   - Propose des méthodes simples : `notifyWithSound()`, `playNotificationSound()`

3. **Composant `NotificationSoundSettings`** (`src/components/features/notification-sound-settings.tsx`)
   - Interface UI pour gérer les paramètres de son
   - Toggle pour activer/désactiver
   - Slider pour le volume
   - Boutons pour tester chaque type de son
   - Affiche l'état des permissions

### Fichiers audio

Tous les fichiers sont stockés dans `public/sounds/` :
- `notification.wav` - Son standard (700 Hz)
- `task-assigned.wav` - Tâche assignée (600 Hz)
- `task-completed.wav` - Tâche complétée (900 Hz)
- `task-updated.wav` - Tâche mise à jour (750 Hz)
- `error.wav` - Erreur (400 Hz)
- `success.wav` - Succès (1000 Hz)

## Utilisation

### Approche basique avec le hook `useNotificationWithSound`

```tsx
'use client';

import { useNotificationWithSound } from '@/hooks/use-notification-with-sound';
import { toast } from 'sonner';

export function MyComponent() {
  const { notifyWithSound, setSoundPreference, setVolumePreference } = useNotificationWithSound();

  const handleSuccess = () => {
    // Jouer le son et afficher une notification
    const notification = notifyWithSound('success', 'Opération réussie', {
      message: 'Les modifications ont été sauvegardées',
      soundType: 'success', // optionnel, utilise 'success' par défaut pour ce type
    });

    // Afficher le toast
    toast.success(notification.title, {
      description: notification.message,
    });
  };

  const handleError = () => {
    const notification = notifyWithSound('error', 'Une erreur est survenue', {
      message: 'Veuillez réessayer',
    });

    toast.error(notification.title, {
      description: notification.message,
    });
  };

  return (
    <>
      <button onClick={handleSuccess}>Succès</button>
      <button onClick={handleError}>Erreur</button>
    </>
  );
}
```

### Approche avancée avec `useNotificationSound`

```tsx
'use client';

import { useNotificationSound } from '@/hooks/use-notification-sound';

export function AdvancedComponent() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const sound = useNotificationSound({
    soundEnabled,
    volume: 0.5,
    onPermissionChange: (permission) => {
      console.log('Permission changed:', permission);
    },
  });

  // Jouer un son spécifique
  const playTaskAssignedSound = () => {
    sound.playSound('taskAssigned');
  };

  // Afficher notification + son
  const showNotificationWithSound = () => {
    sound.notifyWithSound('Nouvelle tâche assignée!', {
      body: 'Vous avez reçu une nouvelle tâche',
      soundType: 'taskAssigned',
      icon: '/task-icon.png',
    });
  };

  // Demander la permission
  const askPermission = async () => {
    const result = await sound.requestPermission();
    console.log('Permission result:', result);
  };

  return (
    <>
      <button onClick={playTaskAssignedSound}>Jouer son</button>
      <button onClick={showNotificationWithSound}>Notification + Son</button>
      <button onClick={askPermission}>Demander permission</button>
      <p>Permission: {sound.hasPermission ? 'Accordée ✅' : 'Non accordée ❌'}</p>
    </>
  );
}
```

### Utilisation du composant de paramètres

```tsx
'use client';

import { NotificationSoundSettings } from '@/components/features/notification-sound-settings';
import { useState } from 'react';

export function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notification-sounds-enabled') === 'true';
    }
    return false;
  });

  const [volume, setVolume] = useState(0.5);

  return (
    <NotificationSoundSettings
      soundEnabled={soundEnabled}
      onSoundEnabledChange={setSoundEnabled}
      initialVolume={volume}
      onVolumeChange={setVolume}
    />
  );
}
```

## Fonctionnalités principales

### 1. Permissions Notification API

Le hook gère automatiquement les permissions :

```tsx
const { requestPermission, hasPermission } = useNotificationSound({
  soundEnabled: true,
});

// Demander la permission (DOIT être appelé lors d'une interaction utilisateur)
const permission = await requestPermission();

// Vérifier si la permission est accordée
if (hasPermission) {
  // Afficher les notifications navigateur
}
```

### 2. Synchronisation multi-onglets (BroadcastChannel)

Automatiquement, si un onglet joue un son, les autres onglets sont informés :

```tsx
// Les sons ne sont joués que dans l'onglet actif pour éviter les doublons
// BroadcastChannel synchronise entre onglets
```

**Comportement :**
- Si l'onglet A joue un son de notification
- L'onglet B reçoit le message via BroadcastChannel
- L'onglet B ne rejoue PAS le son (évite les doublons)

### 3. Gestion du volume et des préférences

```tsx
const { soundEnabled, volume } = useNotificationWithSound();

// Les préférences sont sauvegardées dans localStorage
// notification-sounds-enabled: boolean
// notification-sounds-volume: 0-1
```

## Types de notifications

Les sons disponibles sont :

| Type | Fréquence | Durée | Cas d'usage |
|------|-----------|-------|-----------|
| notification | 700 Hz | 400ms | Notification standard |
| taskAssigned | 600 Hz | 300ms | Quand une tâche est assignée |
| taskCompleted | 900 Hz | 500ms | Quand une tâche est complétée |
| taskUpdated | 750 Hz | 350ms | Quand une tâche est mise à jour |
| error | 400 Hz | 300ms | Message d'erreur |
| success | 1000 Hz | 400ms | Message de succès |

## Intégration avec Sonner (Toast)

Vous pouvez combiner Sonner avec les notifications sonores :

```tsx
import { toast } from 'sonner';
import { useNotificationWithSound } from '@/hooks/use-notification-with-sound';

export function MyComponent() {
  const { playNotificationSound } = useNotificationWithSound();

  const handleAction = async () => {
    try {
      // Faire quelque chose
      playNotificationSound('success');
      toast.success('Action réussie!');
    } catch (error) {
      playNotificationSound('error');
      toast.error('Une erreur est survenue');
    }
  };
}
```

## Accessibilité

- ✅ Les sons doivent être **optionnels** (toggle pour activer/désactiver)
- ✅ Les notifications visuelles doivent fonctionner **sans son**
- ✅ Les utilisateurs doivent **contrôler le volume**
- ✅ Les sons ne **doivent jamais autoplay** (nécessite interaction utilisateur)
- ✅ Indication visuelle des permissions demandées

## Dépannage

### Les sons ne jouent pas

1. **Vérifiez que soundEnabled est true**
   ```tsx
   const { soundEnabled } = useNotificationWithSound();
   console.log('Sounds enabled:', soundEnabled);
   ```

2. **Vérifiez que le hook est monté**
   ```tsx
   const { mounted } = useNotificationSound({ soundEnabled: true });
   if (!mounted) return null;
   ```

3. **Vérifiez les fichiers audio**
   - Les fichiers doivent être dans `public/sounds/`
   - Vérifiez l'extension (.wav ou .mp3)
   - Vérifiez que les fichiers sont valides

4. **Vérifiez les permissions du navigateur**
   ```tsx
   const { hasPermission, requestPermission } = useNotificationSound({
     soundEnabled: true,
   });

   if (!hasPermission) {
     await requestPermission();
   }
   ```

### Sons dupliqués sur plusieurs onglets

Le hook utilise **automatiquement** BroadcastChannel pour éviter les doublons :

```tsx
// Automatique - aucune action requise
const sound = useNotificationSound({ soundEnabled: true });

// BroadcastChannel gère la synchronisation en arrière-plan
```

Si les doublons persistent :
- Vérifiez que BroadcastChannel est supporté (Chrome 54+, Firefox 38+, Safari 15.4+)
- Vérifiez que les onglets sont dans le même domaine
- Vérifiez la console pour les erreurs

## Performance

- **Bundle size**: useSound ajoute ~1KB (gzipped)
- **Memory**: BroadcastChannel est nettoyé au démontage du composant
- **CPU**: Minimal - les sons WAV sont optimisés

## Navigateurs supportés

| Navigateur | useSound | BroadcastChannel | Notifications API |
|-----------|----------|------------------|------------------|
| Chrome    | ✅       | ✅ (54+)        | ✅              |
| Firefox   | ✅       | ✅ (38+)        | ✅              |
| Safari    | ✅       | ✅ (15.4+)      | ✅ (10+)        |
| Edge      | ✅       | ✅ (79+)        | ✅              |

## Ressources

- [Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [useSound Library](https://www.npmjs.com/package/use-sound)
- [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
