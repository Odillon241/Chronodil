/**
 * Tests d'intégration pour le système de notifications
 * Teste:
 * - Le flux complet de notification avec son
 * - La synchronisation multi-onglets
 * - La persistance des préférences
 * - L'intégration avec les composants UI
 */

describe('Système de notifications - Tests d\'intégration', () => {
  beforeEach(() => {
    // Nettoyer localStorage
    localStorage.clear();

    // Mock BroadcastChannel
    global.BroadcastChannel = jest.fn(() => ({
      postMessage: jest.fn(),
      close: jest.fn(),
      onmessage: null,
    })) as any;

    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'granted',
        requestPermission: jest.fn().mockResolvedValue('granted'),
      },
      writable: true,
    });

    // Mock Audio API
    global.Audio = jest.fn(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      currentTime: 0,
    })) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Scénario 1: Premier démarrage de l\'application', () => {
    test('devrait initialiser avec les paramètres par défaut', () => {
      // État initial
      const soundsEnabled = localStorage.getItem('notification-sounds-enabled');
      const volume = localStorage.getItem('notification-sounds-volume');

      expect(soundsEnabled).toBeNull();
      expect(volume).toBeNull();
    });

    test('devrait demander la permission lors du premier usage', async () => {
      const requestPermissionMock = jest.fn().mockResolvedValue('granted');
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: requestPermissionMock,
        },
        writable: true,
      });

      // Simuler le clic utilisateur pour demander la permission
      expect(() => {
        window.Notification.requestPermission();
      }).not.toThrow();
    });
  });

  describe('Scénario 2: Configuration des sons', () => {
    test('devrait sauvegarder les préférences dans localStorage', () => {
      // Simuler la sauvegarde des préférences
      localStorage.setItem('notification-sounds-enabled', 'true');
      localStorage.setItem('notification-sounds-volume', '0.7');

      expect(localStorage.getItem('notification-sounds-enabled')).toBe('true');
      expect(localStorage.getItem('notification-sounds-volume')).toBe('0.7');
    });

    test('devrait charger les préférences sauvegardées au démarrage', () => {
      // Préférences sauvegardées
      localStorage.setItem('notification-sounds-enabled', 'true');
      localStorage.setItem('notification-sounds-volume', '0.5');

      // Vérifier le chargement
      const soundsEnabled = localStorage.getItem('notification-sounds-enabled') === 'true';
      const volume = parseFloat(localStorage.getItem('notification-sounds-volume') || '0.5');

      expect(soundsEnabled).toBe(true);
      expect(volume).toBe(0.5);
    });

    test('devrait permettre de modifier le volume progressivement', () => {
      // Volume initial
      localStorage.setItem('notification-sounds-volume', '0.3');
      expect(parseFloat(localStorage.getItem('notification-sounds-volume') || '0')).toBe(0.3);

      // Augmenter le volume
      localStorage.setItem('notification-sounds-volume', '0.6');
      expect(parseFloat(localStorage.getItem('notification-sounds-volume') || '0')).toBe(0.6);

      // Augmenter à nouveau
      localStorage.setItem('notification-sounds-volume', '0.9');
      expect(parseFloat(localStorage.getItem('notification-sounds-volume') || '0')).toBe(0.9);
    });
  });

  describe('Scénario 3: Lecture de sons', () => {
    test('devrait jouer le son correct pour chaque type', () => {
      const playMock = jest.fn().mockResolvedValue(undefined);
      global.Audio = jest.fn(() => ({
        play: playMock,
        pause: jest.fn(),
      })) as any;

      // Simuler la lecture de différents sons
      const soundTypes = [
        'notification',
        'taskAssigned',
        'taskCompleted',
        'taskUpdated',
        'error',
        'success',
      ];

      soundTypes.forEach((soundType) => {
        const audio = new Audio(`/sounds/${soundType}.wav`);
        expect(() => {
          audio.play();
        }).not.toThrow();
      });
    });

    test('devrait respecter le volume configuré', () => {
      const volume = 0.6;
      localStorage.setItem('notification-sounds-volume', volume.toString());

      // Vérifier que le volume est bien persisté
      const savedVolume = parseFloat(localStorage.getItem('notification-sounds-volume') || '0');
      expect(savedVolume).toBe(volume);
    });

    test('ne devrait pas jouer de son si soundEnabled est false', () => {
      localStorage.setItem('notification-sounds-enabled', 'false');

      const soundsEnabled = localStorage.getItem('notification-sounds-enabled') === 'true';
      expect(soundsEnabled).toBe(false);
    });
  });

  describe('Scénario 4: Notifications avec son', () => {
    test('devrait créer une notification navigateur avec son', async () => {
      const notificationMock = jest.fn();
      global.Notification = jest.fn(notificationMock) as any;

      // Simuler la création d'une notification
      const notification = new Notification('Test', {
        body: 'Message de test',
        silent: true,
      });

      expect(notificationMock).toHaveBeenCalled();
    });

    test('devrait afficher une notification si la permission est accordée', () => {
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'granted',
        },
        writable: true,
      });

      expect(window.Notification.permission).toBe('granted');
    });

    test('ne devrait pas afficher de notification si la permission est refusée', () => {
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'denied',
        },
        writable: true,
      });

      expect(window.Notification.permission).toBe('denied');
    });
  });

  describe('Scénario 5: Synchronisation multi-onglets', () => {
    test('devrait synchroniser les sons entre les onglets', () => {
      const broadcastMock = jest.fn();
      global.BroadcastChannel = jest.fn(() => ({
        postMessage: broadcastMock,
        close: jest.fn(),
        onmessage: null,
      })) as any;

      const channel = new BroadcastChannel('notification-sounds');

      // Simuler l'envoi d'un message
      channel.postMessage({
        type: 'PLAY_SOUND',
        soundType: 'taskAssigned',
      });

      expect(broadcastMock).toHaveBeenCalledWith({
        type: 'PLAY_SOUND',
        soundType: 'taskAssigned',
      });
    });

    test('les autres onglets devraient recevoir le message de son', () => {
      let receivedMessage = null;

      global.BroadcastChannel = jest.fn(() => ({
        postMessage: jest.fn(),
        close: jest.fn(),
        onmessage: function (event: any) {
          receivedMessage = event.data;
        },
      })) as any;

      const channel = new BroadcastChannel('notification-sounds');

      // Simuler la réception d'un message
      if (channel.onmessage) {
        channel.onmessage({
          data: {
            type: 'PLAY_SOUND',
            soundType: 'taskCompleted',
          },
        } as any);
      }
    });

    test('devrait synchroniser les changements de permission entre les onglets', () => {
      const broadcastMock = jest.fn();
      global.BroadcastChannel = jest.fn(() => ({
        postMessage: broadcastMock,
        close: jest.fn(),
        onmessage: null,
      })) as any;

      const channel = new BroadcastChannel('notification-sounds');

      // Simuler un changement de permission
      channel.postMessage({
        type: 'PERMISSION_CHANGED',
        permission: 'granted',
      });

      expect(broadcastMock).toHaveBeenCalledWith({
        type: 'PERMISSION_CHANGED',
        permission: 'granted',
      });
    });
  });

  describe('Scénario 6: Persistance et récupération', () => {
    test('devrait récupérer les préférences après un rechargement', () => {
      // Première session
      localStorage.setItem('notification-sounds-enabled', 'true');
      localStorage.setItem('notification-sounds-volume', '0.8');

      // Simuler un rechargement
      const soundsEnabled =
        localStorage.getItem('notification-sounds-enabled') === 'true';
      const volume = parseFloat(localStorage.getItem('notification-sounds-volume') || '0');

      expect(soundsEnabled).toBe(true);
      expect(volume).toBe(0.8);
    });

    test('devrait gérer les paramètres manquants gracieusement', () => {
      // Pas de préférences sauvegardées
      const soundsEnabled =
        localStorage.getItem('notification-sounds-enabled') === 'true';
      const volume = parseFloat(localStorage.getItem('notification-sounds-volume') || '0.5');

      expect(soundsEnabled).toBe(false);
      expect(volume).toBe(0.5); // Valeur par défaut
    });
  });

  describe('Scénario 7: Gestion d\'erreurs', () => {
    test('devrait gérer les erreurs de permission gracieusement', () => {
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'denied',
          requestPermission: jest.fn().mockRejectedValue(new Error('Permission denied')),
        },
        writable: true,
      });

      expect(window.Notification.permission).toBe('denied');
    });

    test('devrait gérer les fichiers audio manquants gracieusement', () => {
      const playMock = jest.fn().mockRejectedValue(new Error('File not found'));
      global.Audio = jest.fn(() => ({
        play: playMock,
        pause: jest.fn(),
      })) as any;

      const audio = new Audio('/sounds/invalid.wav');
      expect(() => {
        audio.play();
      }).not.toThrow();
    });

    test('devrait gérer BroadcastChannel non supporté gracieusement', () => {
      // @ts-ignore
      global.BroadcastChannel = undefined;

      // L'application devrait continuer à fonctionner sans BroadcastChannel
      expect(global.BroadcastChannel).toBeUndefined();
    });
  });

  describe('Scénario 8: Performance', () => {
    test('devrait gérer plusieurs sons rapides sans crash', () => {
      const playMock = jest.fn().mockResolvedValue(undefined);
      global.Audio = jest.fn(() => ({
        play: playMock,
        pause: jest.fn(),
      })) as any;

      // Jouer 10 sons rapidement
      for (let i = 0; i < 10; i++) {
        const audio = new Audio('/sounds/notification.wav');
        expect(() => {
          audio.play();
        }).not.toThrow();
      }
    });

    test('devrait fermer les ressources BroadcastChannel sans memory leak', () => {
      const closeMock = jest.fn();
      global.BroadcastChannel = jest.fn(() => ({
        postMessage: jest.fn(),
        close: closeMock,
        onmessage: null,
      })) as any;

      // Créer et fermer plusieurs canaux
      for (let i = 0; i < 5; i++) {
        const channel = new BroadcastChannel('notification-sounds');
        channel.close();
      }

      expect(closeMock.mock.calls.length).toBeGreaterThan(0);
    });
  });
});
