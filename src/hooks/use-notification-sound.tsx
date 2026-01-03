'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import useSound from 'use-sound';

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

const SOUND_FILES: SoundFiles = {
  notification: '/sounds/notification.wav',
  taskAssigned: '/sounds/task-assigned.wav',
  taskCompleted: '/sounds/task-completed.wav',
  taskUpdated: '/sounds/task-updated.wav',
  error: '/sounds/error.wav',
  success: '/sounds/success.wav',
};

export function useNotificationSound(options?: NotificationSoundOptions) {
  const { soundEnabled = false, volume = 1, onPermissionChange } = options || {};
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [mounted, setMounted] = useState(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const [playNotification] = useSound(SOUND_FILES.notification, { volume });
  const [playTaskAssigned] = useSound(SOUND_FILES.taskAssigned, { volume });
  const [playTaskCompleted] = useSound(SOUND_FILES.taskCompleted, { volume });
  const [playTaskUpdated] = useSound(SOUND_FILES.taskUpdated, { volume });
  const [playError] = useSound(SOUND_FILES.error, { volume });
  const [playSuccess] = useSound(SOUND_FILES.success, { volume });

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
          const { type, soundType } = event.data;
          if (type === 'PLAY_SOUND' && soundEnabled) {
            playSoundByType(soundType);
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
  }, [
    soundEnabled,
    mounted,
    playNotification,
    playTaskAssigned,
    playTaskCompleted,
    playTaskUpdated,
    playError,
    playSuccess,
  ]);

  const notifyWithSound = useCallback(
    async (
      title: string,
      options?: NotificationOptions & { soundType?: keyof SoundFiles }
    ) => {
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

  const testSound = useCallback(() => {
    playSoundByType('notification');
  }, [playSoundByType]);

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
    testSound,
    soundTypes: Object.keys(SOUND_FILES) as (keyof SoundFiles)[],
  };
}

export type { SoundFiles };
