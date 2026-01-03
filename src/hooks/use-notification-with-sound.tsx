'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNotificationSound, type SoundFiles } from './use-notification-sound';

interface NotificationConfig {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  soundType?: keyof SoundFiles;
}

/**
 * Hook qui intègre automatiquement les sons aux notifications
 * Récupère soundEnabled depuis localStorage
 */
export function useNotificationWithSound() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [mounted, setMounted] = useState(false);

  // Charger les préférences utilisateur depuis localStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification-sounds-enabled');
      const savedVolume = localStorage.getItem('notification-sounds-volume');

      if (saved !== null) {
        setSoundEnabled(saved === 'true');
      }
      if (savedVolume !== null) {
        setVolume(parseFloat(savedVolume));
      }
    }
  }, []);

  // Initialiser le hook de son
  const soundHook = useNotificationSound({
    soundEnabled,
    volume,
  });

  // Fonction pour jouer un son en fonction du type de notification
  const playNotificationSound = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning', customSoundType?: keyof SoundFiles) => {
      if (!soundEnabled || !mounted) return;

      let soundType: keyof SoundFiles = customSoundType || 'notification';

      if (!customSoundType) {
        switch (type) {
          case 'success':
            soundType = 'success';
            break;
          case 'error':
            soundType = 'error';
            break;
          case 'warning':
            soundType = 'taskUpdated';
            break;
          case 'info':
          default:
            soundType = 'notification';
        }
      }

      soundHook.playSound(soundType);
    },
    [soundEnabled, mounted, soundHook]
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

  return {
    // État
    soundEnabled,
    volume,
    mounted,
    hasPermission: soundHook.hasPermission,
    permission: soundHook.permission,

    // Méthodes pour les notifications
    notifyWithSound,
    playNotificationSound,

    // Méthodes pour gérer les préférences
    setSoundPreference,
    setVolumePreference,
    requestPermission: soundHook.requestPermission,

    // Autres méthodes du hook
    playSound: soundHook.playSound,
    showNotification: soundHook.showNotification,
    testSound: soundHook.testSound,
    soundTypes: soundHook.soundTypes,
  };
}
