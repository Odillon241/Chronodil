'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUserPreferences } from '@/actions/preferences.actions';

export type DesktopNotificationType = 
  | 'new-message'
  | 'task-reminder'
  | 'new-task'
  | 'task-updated'
  | 'task-completed'
  | 'new-notification'
  | 'project-updated'
  | 'timesheet-reminder';

interface DesktopNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, any>;
  onClick?: () => void;
  playSound?: boolean;
  soundType?: 'success' | 'error' | 'info' | 'warning';
}

interface UseDesktopNotificationsOptions {
  enabled?: boolean;
  onPlaySound?: (soundType?: 'success' | 'error' | 'info' | 'warning') => void;
}

const ICON_URL = '/assets/media/chronodil-icon.svg';

// Mapper le type de notification desktop au type de son
function mapTypeToSoundType(type: DesktopNotificationType): 'success' | 'error' | 'info' | 'warning' {
  switch (type) {
    case 'task-completed':
    case 'new-notification':
      return 'success';
    case 'task-reminder':
    case 'timesheet-reminder':
      return 'warning';
    case 'new-message':
    case 'new-task':
    case 'task-updated':
    case 'project-updated':
    default:
      return 'info';
  }
}

// Messages par défaut pour chaque type de notification
const DEFAULT_MESSAGES: Record<DesktopNotificationType, { title: string; body: string }> = {
  'new-message': {
    title: '💬 Nouveau message',
    body: 'Vous avez reçu un nouveau message',
  },
  'task-reminder': {
    title: '⏰ Rappel de tâche',
    body: 'Il est temps de travailler sur cette tâche !',
  },
  'new-task': {
    title: '📋 Nouvelle tâche',
    body: 'Une nouvelle tâche vous a été assignée',
  },
  'task-updated': {
    title: '🔄 Tâche mise à jour',
    body: 'Une tâche a été modifiée',
  },
  'task-completed': {
    title: '✅ Tâche terminée',
    body: 'Une tâche a été marquée comme terminée',
  },
  'new-notification': {
    title: '🔔 Nouvelle notification',
    body: 'Vous avez une nouvelle notification',
  },
  'project-updated': {
    title: '📁 Projet mis à jour',
    body: 'Un projet a été modifié',
  },
  'timesheet-reminder': {
    title: '⏱️ Rappel de feuille de temps',
    body: 'N\'oubliez pas de remplir votre feuille de temps',
  },
};

export function useDesktopNotifications(options: UseDesktopNotificationsOptions = {}) {
  const { enabled = true, onPlaySound } = options;
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences utilisateur
  useEffect(() => {
    if (!enabled) return;

    const loadPreferences = async () => {
      try {
        const result = await getUserPreferences({});
        if (result?.data?.desktopNotificationsEnabled) {
          setDesktopNotificationsEnabled(true);
        }
      } catch (error) {
        console.error('[Desktop Notifications] Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [enabled]);

  // Vérifier la permission du navigateur
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [enabled]);

  // Demander la permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('[Desktop Notifications] Notifications API not supported');
      return 'denied';
    }

    if (permission === 'denied') {
      console.warn('[Desktop Notifications] Permission already denied');
      return 'denied';
    }

    if (permission === 'granted') {
      return 'granted';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('[Desktop Notifications] Error requesting permission:', error);
      return 'denied';
    }
  }, [permission]);

  // Afficher une notification
  const showNotification = useCallback(
    (type: DesktopNotificationType, customOptions?: Partial<DesktopNotificationOptions>) => {
      // Vérifier si les notifications sont activées
      if (!desktopNotificationsEnabled || !enabled) {
        console.log('[Desktop Notifications] Desktop notifications disabled');
        return null;
      }

      // Vérifier la permission
      if (permission !== 'granted') {
        console.log('[Desktop Notifications] Permission not granted:', permission);
        return null;
      }

      // Récupérer le message par défaut pour ce type
      const defaultMessage = DEFAULT_MESSAGES[type];
      if (!defaultMessage) {
        console.warn('[Desktop Notifications] Unknown notification type:', type);
        return null;
      }

      // Fusionner les options personnalisées avec les valeurs par défaut
      const options: DesktopNotificationOptions = {
        title: customOptions?.title || defaultMessage.title,
        body: customOptions?.body || defaultMessage.body,
        icon: customOptions?.icon || ICON_URL,
        tag: customOptions?.tag || `notification-${type}-${Date.now()}`,
        data: customOptions?.data,
        onClick: customOptions?.onClick,
      };

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          badge: options.icon,
          tag: options.tag,
          data: options.data,
          requireInteraction: false,
          silent: false,
        } as any);

        // Gérer le clic sur la notification
        if (options.onClick) {
          notification.onclick = () => {
            options.onClick?.();
            window.focus();
            notification.close();
          };
        } else {
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }

        // Fermer automatiquement après 10 secondes
        setTimeout(() => {
          if (notification) {
            notification.close();
          }
        }, 10000);

        console.log('[Desktop Notifications] Notification shown:', { type, title: options.title });
        return notification;
      } catch (error) {
        console.error('[Desktop Notifications] Error showing notification:', error);
        return null;
      }
    },
    [desktopNotificationsEnabled, permission, enabled]
  );

  // Méthodes spécifiques pour chaque type d'événement
  const notifyNewMessage = useCallback(
    (senderName: string, conversationName?: string, onClick?: () => void) => {
      return showNotification('new-message', {
        title: '💬 Nouveau message',
        body: conversationName 
          ? `${senderName} vous a envoyé un message dans "${conversationName}"`
          : `${senderName} vous a envoyé un message`,
        onClick,
      });
    },
    [showNotification]
  );

  const notifyTaskReminder = useCallback(
    (taskName: string, onClick?: () => void) => {
      return showNotification('task-reminder', {
        title: `⏰ Rappel: ${taskName}`,
        body: 'Il est temps de travailler sur cette tâche !',
        onClick,
      });
    },
    [showNotification]
  );

  const notifyNewTask = useCallback(
    (taskName: string, onClick?: () => void) => {
      return showNotification('new-task', {
        title: '📋 Nouvelle tâche',
        body: `Une nouvelle tâche vous a été assignée: "${taskName}"`,
        onClick,
      });
    },
    [showNotification]
  );

  const notifyTaskUpdated = useCallback(
    (taskName: string, onClick?: () => void) => {
      return showNotification('task-updated', {
        title: '🔄 Tâche mise à jour',
        body: `La tâche "${taskName}" a été modifiée`,
        onClick,
      });
    },
    [showNotification]
  );

  const notifyTaskCompleted = useCallback(
    (taskName: string, onClick?: () => void) => {
      return showNotification('task-completed', {
        title: '✅ Tâche terminée',
        body: `La tâche "${taskName}" a été marquée comme terminée`,
        onClick,
      });
    },
    [showNotification]
  );

  const notifyNewNotification = useCallback(
    (title: string, message: string, onClick?: () => void) => {
      return showNotification('new-notification', {
        title: `🔔 ${title}`,
        body: message,
        onClick,
      });
    },
    [showNotification]
  );

  const notifyProjectUpdated = useCallback(
    (projectName: string, onClick?: () => void) => {
      return showNotification('project-updated', {
        title: '📁 Projet mis à jour',
        body: `Le projet "${projectName}" a été modifié`,
        onClick,
      });
    },
    [showNotification]
  );

  const notifyTimesheetReminder = useCallback(
    (message?: string, onClick?: () => void) => {
      return showNotification('timesheet-reminder', {
        title: '⏱️ Rappel de feuille de temps',
        body: message || 'N\'oubliez pas de remplir votre feuille de temps',
        onClick,
      });
    },
    [showNotification]
  );

  return {
    permission,
    hasPermission: permission === 'granted',
    desktopNotificationsEnabled,
    isLoading,
    requestPermission,
    showNotification,
    // Méthodes spécifiques
    notifyNewMessage,
    notifyTaskReminder,
    notifyNewTask,
    notifyTaskUpdated,
    notifyTaskCompleted,
    notifyNewNotification,
    notifyProjectUpdated,
    notifyTimesheetReminder,
  };
}

