'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNotificationSound, NOTIFICATION_SOUNDS, type SoundFiles } from './use-notification-sound';

interface NotificationConfig {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  soundType?: keyof SoundFiles;
}

// Son par défaut fallback
const DEFAULT_SOUND_ID = 'new-notification-3-398649';

/**
 * Hook qui intègre automatiquement les sons aux notifications
 * Récupère soundEnabled, volume et defaultSoundId depuis localStorage
 */
export function useNotificationWithSound() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [defaultSoundId, setDefaultSoundId] = useState(DEFAULT_SOUND_ID);
  const [mounted, setMounted] = useState(false);

  // Charger les préférences utilisateur depuis localStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification-sounds-enabled');
      const savedVolume = localStorage.getItem('notification-sounds-volume');
      const savedSoundId = localStorage.getItem('notification-sounds-default');

      if (saved !== null) {
        setSoundEnabled(saved === 'true');
      }
      if (savedVolume !== null) {
        setVolume(parseFloat(savedVolume));
      }
      if (savedSoundId !== null) {
        setDefaultSoundId(savedSoundId);
      }
    }
  }, []);

  // Initialiser le hook de son
  const soundHook = useNotificationSound({
    soundEnabled,
    volume,
  });

  // Fonction pour jouer un son en fonction du type de notification
  // Utilise le son par défaut défini par l'utilisateur
  const playNotificationSound = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning', customSoundType?: keyof SoundFiles) => {
      if (!soundEnabled || !mounted) return;

      // Si un son personnalisé est demandé, l'utiliser
      if (customSoundType) {
        soundHook.playSound(customSoundType);
        return;
      }

      // Pour les types spécifiques, utiliser les sons dédiés
      if (type === 'success') {
        soundHook.playSound('success');
        return;
      }
      if (type === 'error') {
        soundHook.playSound('error');
        return;
      }

      // Pour info/warning, utiliser le son par défaut de l'utilisateur
      const sound = NOTIFICATION_SOUNDS.find(s => s.id === defaultSoundId);
      if (sound) {
        // Jouer le son par défaut personnalisé
        const audio = new Audio(sound.file);
        audio.volume = volume;
        audio.play().catch((error) => {
          console.warn('[playNotificationSound] Erreur lecture son personnalisé:', error);
          // Fallback vers le son standard
          soundHook.playSound('notification');
        });
      } else {
        // Fallback vers le son standard si le son par défaut n'existe pas
        soundHook.playSound('notification');
      }
    },
    [soundEnabled, mounted, soundHook, defaultSoundId, volume]
  );

  // Fonction pour afficher une notification avec son
  const notifyWithSound = useCallback(
    (
      type: 'success' | 'error' | 'info' | 'warning',
      title: string,
      options?: {
        message?: string;
        soundType?: keyof SoundFiles;
        icon?: string;
        duration?: number;
      }
    ) => {
      const { message, soundType, ...otherOptions } = options || {};

      // Jouer le son
      playNotificationSound(type, soundType);

      // Retourner l'objet pour permettre l'affichage du toast
      return {
        type,
        title,
        message,
        ...otherOptions,
      };
    },
    [playNotificationSound]
  );

  // Fonction pour mettre à jour les préférences
  const setSoundPreference = useCallback(
    (enabled: boolean) => {
      setSoundEnabled(enabled);
      if (typeof window !== 'undefined') {
        localStorage.setItem('notification-sounds-enabled', enabled.toString());
      }
    },
    []
  );

  const setVolumePreference = useCallback(
    (newVolume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setVolume(clampedVolume);
      if (typeof window !== 'undefined') {
        localStorage.setItem('notification-sounds-volume', clampedVolume.toString());
      }
    },
    []
  );

  // Fonction pour mettre à jour le son par défaut
  const setDefaultSoundPreference = useCallback(
    (soundId: string) => {
      setDefaultSoundId(soundId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('notification-sounds-default', soundId);
      }
    },
    []
  );

  return {
    // État
    soundEnabled,
    volume,
    defaultSoundId,
    mounted,
    hasPermission: soundHook.hasPermission,
    permission: soundHook.permission,

    // Méthodes pour les notifications
    notifyWithSound,
    playNotificationSound,

    // Méthodes pour gérer les préférences
    setSoundPreference,
    setVolumePreference,
    setDefaultSoundPreference,
    requestPermission: soundHook.requestPermission,

    // Autres méthodes du hook
    playSound: soundHook.playSound,
    showNotification: soundHook.showNotification,
    testSound: soundHook.testSound,
    soundTypes: soundHook.soundTypes,
  };
}
