/**
 * Service Worker pour Chronodil
 * Gère les push notifications, le cache offline et la vérification de version
 */

const CACHE_NAME = 'chronodil-v2';

// Configuration de la vérification de version
const VERSION_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 heures
let lastVersionCheck = 0;
let currentKnownVersion = null;

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

// Note: L'activation est gérée plus bas avec la vérification de version

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

  // Répondre avec la version actuelle si demandé
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({
      type: 'VERSION_INFO',
      version: currentKnownVersion,
    });
  }

  // Forcer une vérification de version
  if (event.data && event.data.type === 'CHECK_VERSION') {
    checkForVersionUpdate();
  }
});

/**
 * Vérifie si une nouvelle version de l'application est disponible
 * Compare la version serveur avec la version connue et notifie les clients
 */
async function checkForVersionUpdate() {
  const now = Date.now();

  // Respecter l'intervalle minimum entre les checks
  if (now - lastVersionCheck < VERSION_CHECK_INTERVAL) {
    console.log('[Service Worker] Version check skipped (interval not elapsed)');
    return;
  }

  try {
    console.log('[Service Worker] Checking for version update...');

    const response = await fetch('/api/version', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.data?.version) {
      const serverVersion = data.data.version;

      console.log(`[Service Worker] Server version: ${serverVersion}, Known version: ${currentKnownVersion}`);

      // Si c'est la première vérification, stocker la version
      if (!currentKnownVersion) {
        currentKnownVersion = serverVersion;
        console.log('[Service Worker] Initial version stored:', serverVersion);
      }
      // Si la version a changé, notifier tous les clients
      else if (serverVersion !== currentKnownVersion) {
        console.log('[Service Worker] New version detected!', serverVersion);

        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });

        clients.forEach((client) => {
          client.postMessage({
            type: 'NEW_VERSION_AVAILABLE',
            version: serverVersion,
            previousVersion: currentKnownVersion,
          });
        });

        // Mettre à jour la version connue
        currentKnownVersion = serverVersion;
      }

      lastVersionCheck = now;
    }
  } catch (error) {
    console.error('[Service Worker] Version check failed:', error);
  }
}

// Vérifier la version lors de l'activation du Service Worker
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
        // Vérifier la version au démarrage
        checkForVersionUpdate();
        // Prendre le contrôle immédiatement
        return self.clients.claim();
      })
  );
});

// Vérification périodique de la version (toutes les 4 heures)
setInterval(() => {
  checkForVersionUpdate();
}, VERSION_CHECK_INTERVAL);

console.log('[Service Worker] Script chargé');











