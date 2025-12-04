'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  savePushSubscription,
  deletePushSubscription,
  checkPushSubscription,
} from '@/actions/push-subscription.actions';

/**
 * Options pour le hook usePushSubscription
 */
export interface PushSubscriptionOptions {
  vapidPublicKey?: string;
  autoSubscribe?: boolean;
}

/**
 * Type de retour du hook usePushSubscription
 */
export interface PushSubscriptionReturn {
  isSubscribed: boolean;
  isLoading: boolean;
  isSupported: boolean;
  error: string | undefined;
  permission: NotificationPermission;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

/**
 * Convertir une clé VAPID base64 en Uint8Array
 * Nécessaire pour l'API Push
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook pour gérer les abonnements aux push notifications
 * 
 * @example
 * ```tsx
 * const { isSubscribed, subscribe, unsubscribe } = usePushSubscription({
 *   vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
 * });
 * 
 * // Pour s'abonner
 * await subscribe();
 * 
 * // Pour se désabonner
 * await unsubscribe();
 * ```
 */
export function usePushSubscription(
  options?: PushSubscriptionOptions
): PushSubscriptionReturn {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Clé VAPID publique
  const vapidPublicKey =
    options?.vapidPublicKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

  // Vérifier le support et l'état initial
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Vérifier le support du navigateur
        if (typeof window === 'undefined') {
          setIsSupported(false);
          setIsLoading(false);
          return;
        }

        const hasServiceWorker = 'serviceWorker' in navigator;
        const hasPushManager = 'PushManager' in window;
        const hasNotification = 'Notification' in window;

        if (!hasServiceWorker || !hasPushManager || !hasNotification) {
          console.log('[Push] API non supportée:', {
            serviceWorker: hasServiceWorker,
            pushManager: hasPushManager,
            notification: hasNotification,
          });
          setIsSupported(false);
          setIsLoading(false);
          return;
        }

        // Vérifier si VAPID est configuré
        if (!vapidPublicKey) {
          console.log('[Push] Clé VAPID non configurée');
          setIsSupported(false);
          setError('Clé VAPID non configurée');
          setIsLoading(false);
          return;
        }

        setIsSupported(true);
        setPermission(Notification.permission);

        // Vérifier si déjà abonné côté serveur
        const result = await checkPushSubscription({});
        if (result?.data?.hasSubscription) {
          setIsSubscribed(true);
        }

        // Vérifier aussi côté navigateur
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription =
          await registration.pushManager.getSubscription();

        if (existingSubscription) {
          setIsSubscribed(true);
        }
      } catch (err: any) {
        console.error('[Push] Erreur lors de la vérification:', err);
        setError(err.message || 'Erreur de vérification');
      } finally {
        setIsLoading(false);
      }
    };

    checkSupport();
  }, [vapidPublicKey]);

  /**
   * S'abonner aux notifications push
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !vapidPublicKey) {
      setError('Push notifications non supportées ou non configurées');
      return false;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      // Demander la permission si nécessaire
      if (Notification.permission === 'default') {
        const permissionResult = await Notification.requestPermission();
        setPermission(permissionResult);
        if (permissionResult !== 'granted') {
          setError('Permission de notification refusée');
          setIsLoading(false);
          return false;
        }
      } else if (Notification.permission === 'denied') {
        setError('Les notifications sont bloquées. Veuillez les autoriser dans les paramètres du navigateur.');
        setIsLoading(false);
        return false;
      }

      // Attendre que le service worker soit prêt
      const registration = await navigator.serviceWorker.ready;

      // Vérifier si déjà abonné
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Créer une nouvelle subscription
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });
      }

      // Envoyer la subscription au serveur
      const subscriptionJSON = subscription.toJSON();
      
      if (!subscriptionJSON.endpoint || !subscriptionJSON.keys) {
        throw new Error('Subscription invalide');
      }

      const result = await savePushSubscription({
        endpoint: subscriptionJSON.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys.p256dh!,
          auth: subscriptionJSON.keys.auth!,
        },
      });

      if (result?.data?.success) {
        setIsSubscribed(true);
        console.log('[Push] Abonnement réussi');
        return true;
      } else {
        throw new Error('Erreur lors de la sauvegarde de la subscription');
      }
    } catch (err: any) {
      console.error('[Push] Erreur lors de l\'abonnement:', err);
      setError(err.message || 'Erreur lors de l\'abonnement');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, vapidPublicKey]);

  /**
   * Se désabonner des notifications push
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(undefined);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Désabonner côté navigateur
        const success = await subscription.unsubscribe();
        
        if (success) {
          // Supprimer côté serveur
          await deletePushSubscription({
            endpoint: subscription.endpoint,
          });
        }
      }

      setIsSubscribed(false);
      console.log('[Push] Désabonnement réussi');
      return true;
    } catch (err: any) {
      console.error('[Push] Erreur lors du désabonnement:', err);
      setError(err.message || 'Erreur lors du désabonnement');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSubscribed,
    isLoading,
    isSupported,
    error,
    permission,
    subscribe,
    unsubscribe,
  };
}
