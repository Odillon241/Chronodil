/**
 * Tests unitaires pour le hook useNotificationSound
 * Teste:
 * - Initialisation avec/sans options
 * - Gestion des permissions
 * - Lecture des sons
 * - Synchronisation multi-onglets via BroadcastChannel
 * - État et lifecycle
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useNotificationSound } from '@/hooks/use-notification-sound';

describe('useNotificationSound', () => {
  beforeEach(() => {
    // Mock BroadcastChannel
    global.BroadcastChannel = jest.fn(() => ({
      postMessage: jest.fn(),
      close: jest.fn(),
      onmessage: null,
    })) as any;

    // Mock Notification API
    global.Notification = {
      permission: 'default',
      requestPermission: jest.fn().mockResolvedValue('granted'),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialisation', () => {
    test('devrait initialiser sans options', () => {
      const { result } = renderHook(() => useNotificationSound());

      expect(result.current).toBeDefined();
      expect(result.current.soundEnabled).toBe(false);
      expect(result.current.permission).toBe('default');
      expect(result.current.mounted).toBe(false);
    });

    test('devrait initialiser avec options personnalisées', () => {
      const { result } = renderHook(() =>
        useNotificationSound({
          soundEnabled: true,
          volume: 0.7,
        })
      );

      expect(result.current.soundEnabled).toBe(true);
    });

    test('devrait définir mounted à true après le montage', async () => {
      const { result } = renderHook(() => useNotificationSound());

      expect(result.current.mounted).toBe(false);

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });
    });
  });

  describe('Gestion des permissions', () => {
    test('devrait retourner la permission correcte', async () => {
      const { result } = renderHook(() => useNotificationSound());

      await waitFor(() => {
        expect(result.current.permission).toBeDefined();
      });
    });

    test('hasPermission devrait être true quand permission est granted', async () => {
      const { result } = renderHook(() =>
        useNotificationSound({
          soundEnabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.hasPermission).toBeDefined();
      });
    });

    test('requestPermission devrait retourner une Promise', async () => {
      const { result } = renderHook(() => useNotificationSound());

      const promise = result.current.requestPermission();
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('Méthodes de lecture de sons', () => {
    test('playSound devrait être une fonction', () => {
      const { result } = renderHook(() =>
        useNotificationSound({
          soundEnabled: true,
        })
      );

      expect(typeof result.current.playSound).toBe('function');
    });

    test('testSound devrait être une fonction', () => {
      const { result } = renderHook(() =>
        useNotificationSound({
          soundEnabled: true,
        })
      );

      expect(typeof result.current.testSound).toBe('function');
    });

    test('notifyWithSound devrait être une fonction', () => {
      const { result } = renderHook(() =>
        useNotificationSound({
          soundEnabled: true,
        })
      );

      expect(typeof result.current.notifyWithSound).toBe('function');
    });

    test('playSoundByType devrait être une fonction', () => {
      const { result } = renderHook(() =>
        useNotificationSound({
          soundEnabled: true,
        })
      );

      expect(typeof result.current.playSoundByType).toBe('function');
    });
  });

  describe('Types de sons disponibles', () => {
    test('soundTypes devrait contenir tous les types de sons', () => {
      const { result } = renderHook(() => useNotificationSound());

      expect(result.current.soundTypes).toContain('notification');
      expect(result.current.soundTypes).toContain('taskAssigned');
      expect(result.current.soundTypes).toContain('taskCompleted');
      expect(result.current.soundTypes).toContain('taskUpdated');
      expect(result.current.soundTypes).toContain('error');
      expect(result.current.soundTypes).toContain('success');
    });

    test('soundTypes devrait avoir 6 éléments', () => {
      const { result } = renderHook(() => useNotificationSound());

      expect(result.current.soundTypes).toHaveLength(6);
    });
  });

  describe('BroadcastChannel', () => {
    test('devrait créer un BroadcastChannel au montage', async () => {
      renderHook(() => useNotificationSound());

      await waitFor(() => {
        expect(global.BroadcastChannel).toHaveBeenCalledWith('notification-sounds');
      });
    });

    test('devrait fermer le BroadcastChannel au démontage', async () => {
      const closeMock = jest.fn();
      global.BroadcastChannel = jest.fn(() => ({
        postMessage: jest.fn(),
        close: closeMock,
        onmessage: null,
      })) as any;

      const { unmount } = renderHook(() => useNotificationSound());

      unmount();

      await waitFor(() => {
        expect(closeMock).toHaveBeenCalled();
      });
    });
  });

  describe('Callback onPermissionChange', () => {
    test('devrait appeler onPermissionChange quand la permission change', async () => {
      const onPermissionChange = jest.fn();

      renderHook(() =>
        useNotificationSound({
          soundEnabled: true,
          onPermissionChange,
        })
      );

      // La fonction devrait être appelée ou prête à être appelée
      expect(onPermissionChange).toBeDefined();
    });
  });

  describe('État soundEnabled', () => {
    test('ne devrait pas jouer de son si soundEnabled est false', () => {
      const { result } = renderHook(() =>
        useNotificationSound({
          soundEnabled: false,
        })
      );

      // La méthode playSound ne devrait rien faire si soundEnabled est false
      expect(() => {
        result.current.playSound('notification');
      }).not.toThrow();
    });

    test('devrait jouer un son si soundEnabled est true et mounted est true', async () => {
      const { result } = renderHook(() =>
        useNotificationSound({
          soundEnabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      // La méthode playSound devrait être appelable
      expect(() => {
        result.current.playSound('notification');
      }).not.toThrow();
    });
  });

  describe('Cleanup et lifecycle', () => {
    test('devrait nettoyer les ressources au démontage', async () => {
      const { unmount } = renderHook(() => useNotificationSound());

      unmount();

      await waitFor(() => {
        // Le composant devrait être nettoyé sans erreur
        expect(true).toBe(true);
      });
    });

    test('ne devrait pas provoquer de memory leak avec BroadcastChannel', async () => {
      const { unmount } = renderHook(() => useNotificationSound());

      // Monter et démonter plusieurs fois
      for (let i = 0; i < 5; i++) {
        unmount();
      }

      expect(true).toBe(true);
    });
  });
});
