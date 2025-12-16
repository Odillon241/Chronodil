/**
 * Module pour enregistrer et gérer le Service Worker
 * Permet les push notifications même quand l'onglet est fermé
 */

interface ServiceWorkerRegistrationOptions {
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onError?: (error: Error) => void;
  }
  
  /**
   * Vérifie si le Service Worker est supporté par le navigateur
   */
  export function isServiceWorkerSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }
  
  /**
   * Convertit une clé VAPID publique (base64 URL-safe) en Uint8Array
   * Nécessaire pour souscrire aux push notifications
   */
  export function urlBase64ToUint8Array(base64String: string): Uint8Array {
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
   * Enregistre le Service Worker
   */
  export async function registerServiceWorker(
    options: ServiceWorkerRegistrationOptions = {}
  ): Promise<ServiceWorkerRegistration | null> {
    const { onUpdate, onSuccess, onError } = options;
  
    if (!isServiceWorkerSupported()) {
      const error = new Error('Service Worker non supporté par ce navigateur');
      console.warn('[Service Worker]', error.message);
      onError?.(error);
      return null;
    }
  
    try {
      console.log('[Service Worker] Enregistrement...');
  
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
  
      console.log('[Service Worker] Enregistré avec succès:', registration);
  
      // Gérer les mises à jour du service worker
      registration.addEventListener('updatefound', () => {
        console.log('[Service Worker] Nouvelle version trouvée');
        const newWorker = registration.installing;
  
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouveau service worker installé, notifier l'utilisateur
              console.log('[Service Worker] Nouvelle version installée');
              onUpdate?.(registration);
            } else if (newWorker.state === 'activated') {
              console.log('[Service Worker] Nouvelle version activée');
            }
          });
        }
      });
  
      // Vérifier si une mise à jour est disponible immédiatement
      await registration.update();
  
      onSuccess?.(registration);
      return registration;
    } catch (error) {
      console.error('[Service Worker] Erreur lors de l\'enregistrement:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      return null;
    }
  }
  
  /**
   * Désenregistre le Service Worker
   */
  export async function unregisterServiceWorker(): Promise<boolean> {
    if (!isServiceWorkerSupported()) {
      return false;
    }
  
    try {
      const registration = await navigator.serviceWorker.ready;
      const unregistered = await registration.unregister();
      console.log('[Service Worker] Désenregistré:', unregistered);
      return unregistered;
    } catch (error) {
      console.error('[Service Worker] Erreur lors du désenregistrement:', error);
      return false;
    }
  }
  
  /**
   * Vérifie l'état actuel du Service Worker
   */
  export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!isServiceWorkerSupported()) {
      return null;
    }
  
    try {
      return await navigator.serviceWorker.ready;
    } catch (error) {
      console.error('[Service Worker] Erreur lors de la récupération:', error);
      return null;
    }
  }
  
  /**
   * Force la mise à jour du Service Worker
   */
  export async function updateServiceWorker(): Promise<boolean> {
    if (!isServiceWorkerSupported()) {
      return false;
    }
  
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      console.log('[Service Worker] Mise à jour effectuée');
      return true;
    } catch (error) {
      console.error('[Service Worker] Erreur lors de la mise à jour:', error);
      return false;
    }
  }
  