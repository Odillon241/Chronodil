'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import useSound from 'use-sound';
import { createClient } from '@/lib/supabase-client';

interface NotificationSoundOptions {
  soundEnabled?: boolean;
  volume?: number;
  onPermissionChange?: (permission: NotificationPermission) => void;
}

interface SoundFiles {
  notification: string;
  taskAssigned: string;
  taskCompleted: string;
  taskUpdated: string;
  error: string;
  success: string;
}

// Types de catégories de sons
export type SoundCategory = 'classic' | 'soft' | 'modern' | 'alert' | 'success' | 'error';

// Interface pour les sons avec catégories
export interface NotificationSound {
  id: string;
  name: string;
  description: string;
  file: string;
  category: SoundCategory;
  icon?: string;
}

/**
 * Fonction pour normaliser un ID de son (enlever les accents, caractères spéciaux)
 * Utilisée pour mapper les IDs de NOTIFICATION_SOUNDS vers les noms de fichiers dans Supabase
 */
function normalizeSoundId(soundId: string): string {
  return soundId
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Fonction helper pour obtenir l'URL d'un son depuis Supabase Storage
 * Avec fallback automatique vers les fichiers locaux
 */
function getSoundUrl(soundId: string, extension: string = 'mp3'): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucketName = 'notification-sounds';
  
  // Utiliser Supabase Storage si l'URL est disponible
  if (supabaseUrl) {
    // Normaliser l'ID pour correspondre au nom de fichier dans Supabase (sans accents)
    const normalizedId = normalizeSoundId(soundId);
    
    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${normalizedId}.${extension}`;
  }
  
  // Fallback vers les fichiers locaux si Supabase n'est pas configuré
  return `/sounds/${soundId}.${extension}`;
}

// Liste complète des sons disponibles avec catégories
// Les sons sont maintenant stockés dans Supabase Storage
export const NOTIFICATION_SOUNDS: NotificationSound[] = [
  // Catégorie : Classique
  { 
    id: 'new-notification-3-398649', 
    name: 'Notification par défaut', 
    description: 'Son de notification moderne et agréable (par défaut)', 
    file: getSoundUrl('new-notification-3-398649', 'mp3'),
    category: 'classic'
  },
  { 
    id: 'notification', 
    name: 'Notification classique', 
    description: 'Son de notification standard et familier', 
    file: getSoundUrl('notification', 'wav'),
    category: 'classic'
  },
  { 
    id: 'new-notification-réussi', 
    name: 'Notification réussie', 
    description: 'Son de notification pour les opérations réussies', 
    file: getSoundUrl('new-notification-réussi', 'mp3'), // Utiliser le nom exact du fichier
    category: 'success'
  },
  // Note: Les sons suivants n'existent pas encore dans public/sounds/
  // Ils utilisent le son par défaut en fallback
  { 
    id: 'taskAssigned', 
    name: 'Tâche assignée', 
    description: 'Son pour une nouvelle tâche assignée', 
    file: getSoundUrl('new-notification-3-398649', 'mp3'), // Fallback vers le son par défaut
    category: 'classic'
  },
  { 
    id: 'taskUpdated', 
    name: 'Tâche mise à jour', 
    description: 'Son pour une mise à jour de tâche', 
    file: getSoundUrl('new-notification-3-398649', 'mp3'), // Fallback vers le son par défaut
    category: 'classic'
  },
  
  // Catégorie : Succès
  { 
    id: 'taskCompleted', 
    name: 'Tâche terminée', 
    description: 'Son de confirmation de tâche terminée', 
    file: getSoundUrl('new-notification-réussi', 'mp3'), // Utiliser le son de succès
    category: 'success'
  },
  { 
    id: 'success', 
    name: 'Succès', 
    description: 'Son de confirmation de succès', 
    file: getSoundUrl('new-notification-réussi', 'mp3'), // Utiliser le son de succès
    category: 'success'
  },
  
  // Catégorie : Erreur/Alerte
  { 
    id: 'error', 
    name: 'Erreur', 
    description: 'Son d\'alerte d\'erreur', 
    file: getSoundUrl('notification', 'wav'), // Utiliser le son classique en fallback
    category: 'error'
  },
];

/**
 * Hook pour charger les sons disponibles depuis le bucket Supabase Storage
 * Liste directement les fichiers du bucket 'notification-sounds'
 */
export function useAvailableSounds() {
  const [availableSounds, setAvailableSounds] = useState<NotificationSound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function loadAvailableSounds() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const bucketName = 'notification-sounds';

        if (!supabaseUrl || !supabaseKey) {
          console.warn('[useAvailableSounds] Supabase non configuré, utilisation des sons par défaut');
          setAvailableSounds(NOTIFICATION_SOUNDS);
          return;
        }

        // Créer un client Supabase pour lister les fichiers du bucket
        const { createClient } = await import('@/lib/supabase-client');
        const supabase = createClient();

        // Lister les fichiers du bucket notification-sounds
        const { data: files, error } = await supabase.storage
          .from(bucketName)
          .list('', {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (error) {
          console.error('[useAvailableSounds] Erreur Supabase Storage:', error);
          setAvailableSounds(NOTIFICATION_SOUNDS);
          return;
        }

        if (!files || files.length === 0) {
          console.warn('[useAvailableSounds] Aucun fichier dans le bucket');
          setAvailableSounds([]);
          return;
        }

        // Filtrer pour ne garder que les fichiers audio (exclure les placeholders et fichiers système)
        const audioFiles = files.filter(file => {
          // Exclure les fichiers cachés et placeholders
          if (file.name.startsWith('.')) return false;
          
          const ext = file.name.split('.').pop()?.toLowerCase();
          return ['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '');
        });

        console.log(`[useAvailableSounds] ${audioFiles.length} fichiers audio trouvés dans Supabase:`, audioFiles.map(f => f.name));

        // Créer les objets NotificationSound à partir des fichiers du bucket
        const soundsFromBucket: NotificationSound[] = audioFiles.map(file => {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${file.name}`;
          
          // Chercher si ce son existe dans NOTIFICATION_SOUNDS pour récupérer ses métadonnées
          const existingSound = NOTIFICATION_SOUNDS.find(s => 
            normalizeSoundId(s.id) === normalizeSoundId(nameWithoutExt)
          );

          const formattedName = existingSound?.name || formatSoundName(nameWithoutExt);
          
          return {
            id: nameWithoutExt,
            name: formattedName,
            description: existingSound?.description || `Son de notification: ${formattedName}`,
            file: publicUrl,
            category: existingSound?.category || 'classic',
          };
        });

        console.log(`[useAvailableSounds] ${soundsFromBucket.length} sons chargés depuis Supabase Storage`);
        setAvailableSounds(soundsFromBucket);
      } catch (error) {
        console.warn('[useAvailableSounds] Erreur lors du chargement:', error);
        // En cas d'erreur, utiliser les sons par défaut comme fallback
        setAvailableSounds(NOTIFICATION_SOUNDS);
      } finally {
        setIsLoading(false);
      }
    }

    loadAvailableSounds();
  }, [mounted]);

  // Fonction helper pour formater le nom du son de manière conviviale
  function formatSoundName(id: string): string {
    // Supprimer les suffixes numériques communs (ex: -372475, _123456)
    let cleanName = id.replace(/[-_]\d{4,}$/, '');
    
    // Supprimer les préfixes courants
    cleanName = cleanName
      .replace(/^notification[-_]?/i, '')
      .replace(/^sound[-_]?/i, '')
      .replace(/^new[-_]?/i, '');
    
    // Si le nom est vide après nettoyage, utiliser l'ID original
    if (!cleanName.trim()) {
      cleanName = id;
    }
    
    // Formater : remplacer tirets/underscores par espaces et capitaliser
    return cleanName
      .replace(/[-_]/g, ' ')
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') || 'Son personnalisé';
  }

  // Grouper les sons disponibles par catégorie
  const soundsByCategory: Record<SoundCategory, NotificationSound[]> = {
    classic: availableSounds.filter(s => s.category === 'classic'),
    soft: availableSounds.filter(s => s.category === 'soft'),
    modern: availableSounds.filter(s => s.category === 'modern'),
    alert: availableSounds.filter(s => s.category === 'alert'),
    success: availableSounds.filter(s => s.category === 'success'),
    error: availableSounds.filter(s => s.category === 'error'),
  };

  return {
    availableSounds,
    soundsByCategory,
    isLoading,
  };
}

// Grouper les sons par catégorie pour faciliter l'affichage (legacy - utilise tous les sons)
export const SOUNDS_BY_CATEGORY: Record<SoundCategory, NotificationSound[]> = {
  classic: NOTIFICATION_SOUNDS.filter(s => s.category === 'classic'),
  soft: NOTIFICATION_SOUNDS.filter(s => s.category === 'soft'),
  modern: NOTIFICATION_SOUNDS.filter(s => s.category === 'modern'),
  alert: NOTIFICATION_SOUNDS.filter(s => s.category === 'alert'),
  success: NOTIFICATION_SOUNDS.filter(s => s.category === 'success'),
  error: NOTIFICATION_SOUNDS.filter(s => s.category === 'error'),
};

// Labels des catégories
export const CATEGORY_LABELS: Record<SoundCategory, string> = {
  classic: 'Classique',
  soft: 'Doux',
  modern: 'Moderne',
  alert: 'Alerte',
  success: 'Succès',
  error: 'Erreur',
};

// Mapping des IDs de sons vers leurs fichiers
// Utilise les fichiers locaux disponibles, avec fallback vers les sons existants
const SOUND_FILES: SoundFiles = {
  notification: getSoundUrl('new-notification-3-398649', 'mp3'), // Nouveau son par défaut
  taskAssigned: getSoundUrl('new-notification-3-398649', 'mp3'), // Fallback vers le son par défaut
  taskCompleted: getSoundUrl('new-notification-réussi', 'mp3'), // Utiliser le son de succès
  taskUpdated: getSoundUrl('new-notification-3-398649', 'mp3'), // Fallback vers le son par défaut
  error: getSoundUrl('notification', 'wav'), // Utiliser le son classique
  success: getSoundUrl('new-notification-réussi', 'mp3'), // Utiliser le son de succès
};

export function useNotificationSound(options?: NotificationSoundOptions) {
  const { soundEnabled = false, volume = 1, onPermissionChange } = options || {};
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [mounted, setMounted] = useState(false);
  const [soundsReady, setSoundsReady] = useState(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const userInteractedRef = useRef(false);

  // Charger les sons seulement après la première interaction utilisateur
  // Cela évite le téléchargement automatique au chargement/refresh de la page
  useEffect(() => {
    if (!mounted) return;

    const handleUserInteraction = () => {
      if (!userInteractedRef.current) {
        userInteractedRef.current = true;
        setSoundsReady(true);
        // Nettoyer les listeners après la première interaction
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      }
    };

    // Écouter les interactions utilisateur
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [mounted]);

  // Chargement paresseux : les sons ne sont chargés qu'après la première interaction utilisateur
  // Utiliser un chemin vide au début pour éviter le chargement automatique au refresh
  // L'option 'format' indique à Howler.js le format attendu même avec un chemin vide
  const [playNotification] = useSound(
    soundsReady ? SOUND_FILES.notification : '', 
    { 
      volume, 
      interrupt: false,
      format: ['mp3'], // Évite le warning "No file extension was found"
    }
  );
  const [playTaskAssigned] = useSound(
    soundsReady ? SOUND_FILES.taskAssigned : '', 
    { 
      volume, 
      interrupt: false,
      format: ['mp3'],
    }
  );
  const [playTaskCompleted] = useSound(
    soundsReady ? SOUND_FILES.taskCompleted : '', 
    { 
      volume, 
      interrupt: false,
      format: ['mp3'],
    }
  );
  const [playTaskUpdated] = useSound(
    soundsReady ? SOUND_FILES.taskUpdated : '', 
    { 
      volume, 
      interrupt: false,
      format: ['mp3'],
    }
  );
  const [playError] = useSound(
    soundsReady ? SOUND_FILES.error : '', 
    { 
      volume, 
      interrupt: false,
      format: ['wav', 'mp3'], // error utilise .wav
    }
  );
  const [playSuccess] = useSound(
    soundsReady ? SOUND_FILES.success : '', 
    { 
      volume, 
      interrupt: false,
      format: ['mp3'],
    }
  );

  useEffect(() => {
    setMounted(true);

    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
    }

    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('notification-sounds');
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
          const { type } = event.data;
          if (type === 'PLAY_SOUND') {
            console.debug('[Notifications] Another tab played a sound');
          }
        };
      } catch (error) {
        console.warn('BroadcastChannel not supported:', error);
      }
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if ('Notification' in window && mounted) {
      const currentPermission = Notification.permission;
      if (currentPermission !== permission) {
        setPermission(currentPermission);
        onPermissionChange?.(currentPermission);

        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'PERMISSION_CHANGED',
            permission: currentPermission,
          });
        }
      }
    }
  }, [mounted, permission, onPermissionChange]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('Notifications API not supported');
      return 'denied';
    }

    if (permission === 'denied') {
      console.warn('Notification permission denied by user');
      return 'denied';
    }

    if (permission === 'granted') {
      return 'granted';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      onPermissionChange?.(result);

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'PERMISSION_CHANGED',
          permission: result,
        });
      }

      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, [permission, onPermissionChange]);

  const playSoundByType = useCallback((soundType: keyof SoundFiles) => {
    if (!soundEnabled || !mounted) return;

    switch (soundType) {
      case 'notification':
        playNotification();
        break;
      case 'taskAssigned':
        playTaskAssigned();
        break;
      case 'taskCompleted':
        playTaskCompleted();
        break;
      case 'taskUpdated':
        playTaskUpdated();
        break;
      case 'error':
        playError();
        break;
      case 'success':
        playSuccess();
        break;
      default:
        playNotification();
    }
  }, [soundEnabled, mounted, playNotification, playTaskAssigned, playTaskCompleted, playTaskUpdated, playError, playSuccess]);

  const notifyWithSound = useCallback(
    async (title: string, options?: NotificationOptions & { soundType?: keyof SoundFiles }) => {
      if (!mounted) return;

      const { soundType = 'notification', ...notificationOptions } = options || {};

      playSoundByType(soundType);

      if (permission === 'granted' && 'Notification' in window) {
        try {
          new Notification(title, {
            ...notificationOptions,
            silent: true,
          });
        } catch (error) {
          console.error('Error showing notification:', error);
        }
      }

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'PLAY_SOUND',
          soundType,
        });
      }
    },
    [permission, mounted, playSoundByType]
  );

  const playSound = useCallback(
    (soundType: keyof SoundFiles) => {
      if (!soundEnabled || !mounted) return;
      playSoundByType(soundType);

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'PLAY_SOUND',
          soundType,
        });
      }
    },
    [soundEnabled, mounted, playSoundByType]
  );

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission === 'granted' && 'Notification' in window && mounted) {
        try {
          new Notification(title, {
            ...options,
            silent: true,
          });
        } catch (error) {
          console.error('Error showing notification:', error);
        }
      }
    },
    [permission, mounted]
  );

  // Fonction pour jouer un son par son ID (depuis NOTIFICATION_SOUNDS)
  const playSoundById = useCallback((soundId: string, forcePlay: boolean = false) => {
    // Pour les tests (forcePlay = true), ignorer les vérifications soundEnabled et mounted
    if (!forcePlay) {
      if (!soundEnabled || !mounted) {
        console.warn('[playSoundById] Son désactivé ou non monté', { soundEnabled, mounted });
        return;
      }
    } else {
      // Pour les tests, on force même si mounted est false (peut être appelé avant le montage)
      if (!mounted) {
        console.log('[playSoundById] Force play avant montage, on continue quand même');
      }
    }

    const sound = NOTIFICATION_SOUNDS.find(s => s.id === soundId);
    if (!sound) {
      console.warn(`[playSoundById] Son non trouvé dans NOTIFICATION_SOUNDS: ${soundId}`);
      // Essayer de trouver dans SOUND_FILES comme fallback
      if (Object.keys(SOUND_FILES).includes(soundId)) {
        console.log('[playSoundById] Son trouvé dans SOUND_FILES, utilisation de playSoundByType');
        playSoundByType(soundId as keyof SoundFiles);
      }
      return;
    }

    console.log('[playSoundById] Lecture du son:', { soundId, url: sound.file, volume, forcePlay, soundEnabled, mounted });

    // Créer un élément audio temporaire pour jouer le son
    const audio = new Audio(sound.file);
    // Utiliser le volume fourni, ou 1.0 par défaut pour les tests
    audio.volume = forcePlay ? (volume || 1.0) : volume;
    
    // Gérer les erreurs de chargement
    audio.addEventListener('error', (e) => {
      console.error('[playSoundById] Erreur audio:', {
        soundId,
        url: sound.file,
        error: e,
        errorCode: audio.error?.code,
        errorMessage: audio.error?.message,
      });
    });

    audio.addEventListener('loadstart', () => {
      console.log('[playSoundById] Chargement du son démarré:', soundId);
    });

    audio.addEventListener('canplay', () => {
      console.log('[playSoundById] Son prêt à être joué:', soundId);
    });

    audio.addEventListener('loadeddata', () => {
      console.log('[playSoundById] Données audio chargées:', soundId);
    });

    // Essayer de jouer le son
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('[playSoundById] Son joué avec succès:', soundId);
        })
        .catch((error) => {
          console.error('[playSoundById] Erreur lors de la lecture:', {
            soundId,
            url: sound.file,
            error: error.message,
            errorName: error.name,
            errorCode: audio.error?.code,
            errorMessage: audio.error?.message,
          });
          
          // Si l'erreur est due à une interaction utilisateur requise, essayer de rejouer
          if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
            console.warn('[playSoundById] Interaction utilisateur requise, le son sera joué au prochain clic');
          }
        });
    }
  }, [soundEnabled, mounted, soundsReady, volume, playSoundByType]);

  const testSound = useCallback((soundType?: keyof SoundFiles | string) => {
    console.log('[testSound] Test du son:', soundType);
    
    if (!soundType) {
      // Par défaut, utiliser le son par défaut
      playSoundById('new-notification-3-398649', true);
      return;
    }

    // Pour les tests, toujours utiliser playSoundById qui peut forcer la lecture
    // Cela fonctionne pour tous les sons, qu'ils soient dans SOUND_FILES ou non
    const sound = NOTIFICATION_SOUNDS.find(s => s.id === soundType);
    if (sound) {
      // Son trouvé dans NOTIFICATION_SOUNDS, utiliser playSoundById
      playSoundById(soundType, true);
    } else {
      // Si le son n'est pas trouvé, essayer avec playSoundByType comme fallback
      // mais seulement si c'est une clé valide de SOUND_FILES
      if (Object.keys(SOUND_FILES).includes(soundType)) {
        playSoundByType(soundType as keyof SoundFiles);
      } else {
        console.warn('[testSound] Son non trouvé:', soundType);
      }
    }
  }, [playSoundByType, playSoundById]);

  return {
    permission,
    hasPermission: permission === 'granted',
    soundEnabled,
    mounted,
    requestPermission,
    playSound,
    notifyWithSound,
    showNotification,
    playSoundByType,
    playSoundById,
    testSound,
    soundTypes: Object.keys(SOUND_FILES) as (keyof SoundFiles)[],
    NOTIFICATION_SOUNDS,
  };
}

export type { SoundFiles };
