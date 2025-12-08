/**
 * Service Worker pour Chronodil
 * Gère les push notifications et le cache offline basique
 */

const CACHE_NAME = 'chronodil-v1';

// Fichiers à mettre en cache pour le mode offline
const STATIC_ASSETS = [
  '/sounds/new-notification-info.mp3',
  '/sounds/new-notification-success.mp3',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache ouvert');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installé avec succès');
        // Activer immédiatement sans attendre
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Erreur installation:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activé avec succès');
        // Prendre le contrôle immédiatement
        return self.clients.claim();
      })
  );
});

// Gestion des push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push reçu:', event);
  
  let data = {
    title: 'Chronodil',
    body: 'Vous avez une nouvelle notification',
    icon: '/assets/media/chronodil-icon.svg',
    badge: '/assets/media/chronodil-icon.svg',
    tag: 'chronodil-notification',
    data: {
      url: '/dashboard/notifications',
    },
  };
  
  // Parser les données du push si disponibles
  if (event.data) {
    try {
      const pushData = event.data.json();
      data = {
        ...data,
        ...pushData,
      };
    } catch (e) {
      console.error('[Service Worker] Erreur parsing push data:', e);
      data.body = event.data.text() || data.body;
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'Voir',
      },
      {
        action: 'close',
        title: 'Fermer',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification cliquée:', event);
  
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data || {};
  const url = notificationData.url || '/dashboard/notifications';
  
  if (action === 'close') {
    return;
  }
  
  // Ouvrir ou focus sur l'application
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher une fenêtre existante
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: notificationData,
            });
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Fermeture de notification
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification fermée:', event);
});

// Gestion des fetch (cache-first pour les assets statiques)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ne pas intercepter les requêtes vers des domaines externes
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Cache-first pour les sons et assets statiques
  if (url.pathname.startsWith('/sounds/') || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((response) => {
            // Mettre en cache la réponse pour la prochaine fois
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }
  
  // Network-first pour les autres requêtes (pages, API, etc.)
  // Ne pas intercepter pour permettre le fonctionnement normal de Next.js
});

// Message depuis le client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message reçu:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Script chargé');









