# Système de Sons de Notification avec Supabase Storage

## 📋 Vue d'ensemble

Les sons de notification sont maintenant stockés dans **Supabase Storage** au lieu du dossier `public/sounds`. Cela permet :
- ✅ Gestion centralisée des sons
- ✅ Upload/Suppression via l'interface admin
- ✅ CDN global pour des chargements rapides
- ✅ Pas de fichiers statiques dans le build

## 🗂️ Architecture

### Bucket Supabase
- **Nom** : `notification-sounds`
- **Type** : Public (lecture publique, upload authentifié)
- **Limite** : 5MB par fichier
- **Formats acceptés** : MP3, WAV, OGG, WEBM

### Structure des fichiers
Les fichiers sont nommés selon leur ID : `{soundId}.{extension}`
- Exemple : `new-notification-3-398649.mp3`
- Exemple : `notification.wav`

## 🚀 Utilisation

### 1. Uploader les sons existants

Exécutez le script de migration pour uploader tous les sons depuis `public/sounds/` vers Supabase :

```bash
pnpm sounds:upload
```

**Prérequis** :
- Variable d'environnement `SUPABASE_SERVICE_ROLE_KEY` définie
- Bucket `notification-sounds` créé (via migration SQL)

### 2. Configuration

Les sons sont automatiquement chargés depuis Supabase Storage via la fonction `getSoundUrl()` dans `use-notification-sound.tsx`.

**URL générée** :
```
{SUPABASE_URL}/storage/v1/object/public/notification-sounds/{soundId}.{extension}
```

### 3. Son par défaut

Le son **`new-notification-3-398649.mp3`** est maintenant le son par défaut pour toutes les nouvelles notifications.

**Changement** :
- Ancien : `notification.wav`
- Nouveau : `new-notification-3-398649.mp3`

## 📝 Liste des sons disponibles

Les sons sont définis dans `src/hooks/use-notification-sound.tsx` :

```typescript
export const NOTIFICATION_SOUNDS: NotificationSound[] = [
  { 
    id: 'new-notification-3-398649', 
    name: 'Notification par défaut', 
    file: getSoundUrl('new-notification-3-398649', 'mp3'),
    category: 'classic'
  },
  // ... autres sons
];
```

## 🔧 Actions serveur

### Uploader un son
```typescript
import { uploadNotificationSound } from '@/actions/notification-sounds.actions';

const result = await uploadNotificationSound({
  file: audioFile,
  soundId: 'my-sound',
  name: 'Mon son',
  description: 'Description du son',
  category: 'classic',
});
```

### Supprimer un son
```typescript
import { deleteNotificationSound } from '@/actions/notification-sounds.actions';

const result = await deleteNotificationSound({
  soundId: 'my-sound',
});
```

### Lister les sons
```typescript
import { listNotificationSounds } from '@/actions/notification-sounds.actions';

const result = await listNotificationSounds();
// result.sounds contient la liste des sons
```

## 🎵 Utilisation dans le hook

Le hook `useNotificationSound` expose plusieurs méthodes :

```typescript
const { 
  playSoundById,      // Jouer un son par son ID
  playSoundByType,    // Jouer un son par type (legacy)
  testSound,          // Tester un son (gère automatiquement les IDs)
  NOTIFICATION_SOUNDS // Liste complète des sons
} = useNotificationSound({
  soundEnabled: true,
  volume: 0.5,
});
```

### Exemples

```typescript
// Jouer le son par défaut
playSoundById('new-notification-3-398649');

// Tester un son (gère automatiquement les IDs personnalisés)
testSound('new-notification-3-398649');

// Utiliser un son depuis NOTIFICATION_SOUNDS
const sound = NOTIFICATION_SOUNDS.find(s => s.id === 'new-notification-3-398649');
if (sound) {
  playSoundById(sound.id);
}
```

## 🔐 Sécurité

### Politiques RLS (Row Level Security)

1. **Lecture publique** : Tous les utilisateurs peuvent lire les sons
   ```sql
   CREATE POLICY "Public can read notification sounds"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'notification-sounds');
   ```

2. **Upload authentifié** : Seuls les utilisateurs authentifiés peuvent uploader
   ```sql
   CREATE POLICY "Authenticated users can upload notification sounds"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'notification-sounds' 
     AND auth.role() = 'authenticated'
   );
   ```

3. **Suppression admin** : Seuls les admins peuvent supprimer
   ```sql
   CREATE POLICY "Admins can delete notification sounds"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'notification-sounds'
     AND EXISTS (
       SELECT 1 FROM public.profils
       WHERE id = auth.uid()
       AND role = 'admin'
     )
   );
   ```

## 📦 Migration

### Étape 1 : Créer le bucket
La migration SQL a déjà créé le bucket `notification-sounds` avec les politiques RLS.

### Étape 2 : Uploader les sons
```bash
# Définir la clé service role
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Exécuter le script
pnpm sounds:upload
```

### Étape 3 : Vérifier
Vérifiez dans le dashboard Supabase que tous les sons sont présents dans le bucket.

## 🐛 Dépannage

### Les sons ne se chargent pas
1. Vérifier que `NEXT_PUBLIC_SUPABASE_URL` est défini
2. Vérifier que le bucket existe dans Supabase
3. Vérifier que les fichiers sont bien uploadés
4. Vérifier les politiques RLS

### Fallback vers fichiers locaux
Si Supabase n'est pas configuré, le système utilise automatiquement les fichiers locaux depuis `public/sounds/`.

### Erreur "Bucket not found"
Exécutez la migration SQL pour créer le bucket :
```sql
-- Voir prisma/migrations/create_notification_sounds_bucket.sql
```

## 📚 Fichiers modifiés

- ✅ `src/hooks/use-notification-sound.tsx` - Hook principal avec support Supabase
- ✅ `src/actions/notification-sounds.actions.ts` - Actions serveur pour gérer les sons
- ✅ `src/lib/supabase-server.ts` - Client Supabase pour serveur
- ✅ `src/app/dashboard/settings/page.tsx` - Interface utilisateur mise à jour
- ✅ `scripts/upload-sounds-to-supabase.ts` - Script de migration
- ✅ `prisma/migrations/create_notification_sounds_bucket.sql` - Migration SQL

## 🎯 Prochaines étapes

1. ✅ Uploader les sons existants vers Supabase
2. ✅ Tester le système avec le nouveau son par défaut
3. ⏳ Créer une interface admin pour uploader/gérer les sons
4. ⏳ Ajouter la possibilité d'uploader des sons personnalisés depuis l'interface

