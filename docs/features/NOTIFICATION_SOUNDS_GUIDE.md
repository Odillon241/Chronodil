# Guide des Sons de Notification - Chronodil

## 📚 Structure des Sons

### Catégories disponibles

- **Classique** : Sons de notification standards et familiers
- **Doux** : Sons subtils et discrets (à venir)
- **Moderne** : Sons contemporains et élégants (à venir)
- **Alerte** : Sons d'alerte et d'erreur
- **Succès** : Sons de confirmation positive
- **Erreur** : Sons d'alerte d'erreur

## 🎵 Ajouter de Nouveaux Sons

### Étape 1 : Télécharger des sons depuis Pixabay

1. Aller sur https://pixabay.com/fr/sound-effects/search/notifications/
2. Filtrer par :
   - Format : WAV ou MP3
   - Durée : 0.5s - 2s (idéal pour les notifications)
   - Licence : Pixabay License (gratuit, usage commercial autorisé)
3. Télécharger les sons qui vous plaisent

### Étape 2 : Placer les fichiers

Placez les fichiers audio dans le dossier `public/sounds/` :

```
public/
  sounds/
    notification.wav          (existant)
    task-assigned.wav        (existant)
    task-completed.wav       (existant)
    task-updated.wav         (existant)
    success.wav              (existant)
    error.wav                (existant)
    votre-nouveau-son.wav    (nouveau)
```

### Étape 3 : Ajouter le son dans le code

Modifiez `src/hooks/use-notification-sound.tsx` :

```typescript
// 1. Ajouter le type dans SoundFiles
interface SoundFiles {
  // ... existants
  votreNouveauSon: string;
}

// 2. Ajouter dans NOTIFICATION_SOUNDS
export const NOTIFICATION_SOUNDS: NotificationSound[] = [
  // ... existants
  { 
    id: 'votreNouveauSon', 
    name: 'Nom du son', 
    description: 'Description du son', 
    file: '/sounds/votre-nouveau-son.wav',
    category: 'classic' // ou 'soft', 'modern', 'alert', 'success', 'error'
  },
];

// 3. Ajouter dans SOUND_FILES
const SOUND_FILES: SoundFiles = {
  // ... existants
  votreNouveauSon: '/sounds/votre-nouveau-son.wav',
};

// 4. Ajouter dans playSoundByType
const playSoundByType = useCallback((soundType: keyof SoundFiles) => {
  // ... existants
  case 'votreNouveauSon':
    playVotreNouveauSon();
    break;
}, [/* ... */]);

// 5. Ajouter le hook useSound
const [playVotreNouveauSon] = useSound(
  soundsReady ? SOUND_FILES.votreNouveauSon : '', 
  { 
    volume, 
    interrupt: false,
  }
);
```

## 🎨 Recommandations pour les Sons

### Caractéristiques idéales

- **Durée** : 0.5s - 2s maximum
- **Format** : WAV (meilleure qualité) ou MP3 (plus léger)
- **Volume** : Normalisé (éviter les sons trop forts ou trop faibles)
- **Fréquence** : 400Hz - 2000Hz (audible sans être agressif)

### Sons recommandés par catégorie

#### Classique
- Notifications système standards
- Sons de cloche douce
- Bips discrets

#### Doux
- Sons très subtils
- Chimes légers
- Notes musicales douces

#### Moderne
- Sons électroniques élégants
- Notifications d'applications modernes
- Sons synthétiques harmonieux

#### Alerte/Erreur
- Sons d'alerte clairs mais pas agressifs
- Bips d'attention
- Sons d'avertissement

#### Succès
- Sons de confirmation positive
- Chimes de succès
- Notes ascendantes

## 🔧 Utilisation dans le Code

### Tester un son

```typescript
const { testSound } = useNotificationSound({
  soundEnabled: true,
  volume: 0.5,
});

// Tester un son spécifique
testSound('notification');
```

### Jouer un son programmatiquement

```typescript
const { playSoundByType } = useNotificationSound({
  soundEnabled: true,
  volume: 0.5,
});

// Jouer un son
playSoundByType('success');
```

## 📦 Ressources Recommandées

### Sites gratuits (libres de droits)

1. **Pixabay** : https://pixabay.com/fr/sound-effects/
   - Plus de 1 200 sons de notification
   - Licence Pixabay (usage commercial OK)
   - Formats : MP3, WAV, OGG

2. **Freesound** : https://freesound.org/
   - Bibliothèque collaborative
   - API disponible
   - Vérifier les licences Creative Commons

3. **Mixkit** : https://mixkit.co/free-sound-effects/
   - Sons gratuits pour projets créatifs
   - Pas d'inscription requise

### Outils de traitement audio

- **Audacity** (gratuit) : Pour normaliser le volume et couper les sons
- **Online Audio Cutter** : Pour couper rapidement les fichiers

## 🚀 Prochaines Étapes

Pour enrichir la bibliothèque de sons :

1. Télécharger 10-15 sons de qualité depuis Pixabay
2. Les normaliser (volume, durée)
3. Les ajouter dans les catégories appropriées
4. Tester chaque son dans l'interface
5. Documenter les nouveaux sons ajoutés

## 📝 Notes Techniques

- Les sons sont chargés de manière paresseuse (lazy loading)
- Chargement uniquement après interaction utilisateur
- Support du volume dynamique
- Synchronisation multi-onglets via BroadcastChannel
