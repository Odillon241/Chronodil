'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from '@/lib/auth-client';
import {
  WSMessageType,
  WSConnectionState,
  WSNewMessageMessage,
  WSUserTypingMessage,
  WSUserStoppedTypingMessage,
} from '@/types/websocket';

interface UseSocketIOChatOptions {
  onNewMessage?: (message: WSNewMessageMessage['message']) => void;
  onUserTyping?: (data: { conversationId: string; userId: string; userName: string }) => void;
  onUserStoppedTyping?: (data: { conversationId: string; userId: string }) => void;
  autoConnect?: boolean;
}

export function useSocketIOChat(options: UseSocketIOChatOptions = {}) {
  const { onNewMessage, onUserTyping, onUserStoppedTyping, autoConnect = true } = options;
  const { data: session } = useSession();

  const [connectionState, setConnectionState] = useState<WSConnectionState>(WSConnectionState.DISCONNECTED);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const joinedConversationsRef = useRef<Set<string>>(new Set());

  // Connexion au serveur Socket.IO
  const connect = useCallback(() => {
    if (socketRef.current?.connected || !session?.user?.id) {
      return;
    }

    setConnectionState(WSConnectionState.CONNECTING);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}`;

    console.log('[Socket.IO] Connecting to:', socketUrl);

    const socket = io(socketUrl, {
      path: '/ws/chat',
      auth: {
        token: session.user.id, // À remplacer par un vrai token JWT
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = socket;

    // Événement: Connexion réussie
    socket.on('connect', () => {
      console.log('[Socket.IO] Connected');
      setConnectionState(WSConnectionState.CONNECTED);
      setIsAuthenticated(true);
    });

    // Événement: Erreur de connexion
    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error.message);
      setConnectionState(WSConnectionState.ERROR);
      setIsAuthenticated(false);
    });

    // Événement: Déconnexion
    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
      setConnectionState(WSConnectionState.DISCONNECTED);
      setIsAuthenticated(false);
      joinedConversationsRef.current.clear();
    });

    // Événement: Conversation rejointe
    socket.on(WSMessageType.JOINED_CONVERSATION, (data: { conversationId: string }) => {
      console.log('[Socket.IO] Joined conversation:', data.conversationId);
      joinedConversationsRef.current.add(data.conversationId);
    });

    // Événement: Conversation quittée
    socket.on(WSMessageType.LEFT_CONVERSATION, (data: { conversationId: string }) => {
      console.log('[Socket.IO] Left conversation:', data.conversationId);
      joinedConversationsRef.current.delete(data.conversationId);
    });

    // Événement: Nouveau message
    socket.on(WSMessageType.NEW_MESSAGE, (data: WSNewMessageMessage) => {
      console.log('[Socket.IO] New message received:', data.message);
      onNewMessage?.(data.message);
    });

    // Événement: Utilisateur en train de taper
    socket.on(WSMessageType.USER_TYPING, (data: WSUserTypingMessage) => {
      onUserTyping?.({
        conversationId: data.conversationId,
        userId: data.userId,
        userName: data.userName,
      });
    });

    // Événement: Utilisateur a arrêté de taper
    socket.on(WSMessageType.USER_STOPPED_TYPING, (data: WSUserStoppedTypingMessage) => {
      onUserStoppedTyping?.({
        conversationId: data.conversationId,
        userId: data.userId,
      });
    });

    // Événement: Message envoyé avec succès
    socket.on(WSMessageType.MESSAGE_SENT, (data: { messageId: string }) => {
      console.log('[Socket.IO] Message sent confirmed:', data.messageId);
    });

    // Événement: Erreur lors de l'envoi d'un message
    socket.on(WSMessageType.MESSAGE_ERROR, (data: { error: string }) => {
      console.error('[Socket.IO] Message error:', data.error);
    });

    // Événement: Erreur générale
    socket.on(WSMessageType.ERROR, (data: { error: string; code?: string }) => {
      console.error('[Socket.IO] Server error:', data.error, data.code);
    });

    // Événement: Pong (réponse au heartbeat)
    socket.on(WSMessageType.PONG, () => {
      // Heartbeat réponse (optionnel: gérer timeout)
    });
  }, [session?.user?.id, onNewMessage, onUserTyping, onUserStoppedTyping]);

  // Déconnexion
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionState(WSConnectionState.DISCONNECTED);
    setIsAuthenticated(false);
    joinedConversationsRef.current.clear();
  }, []);

  // Rejoindre une conversation
  const joinConversation = useCallback(
    (conversationId: string) => {
      if (!isAuthenticated || !socketRef.current) {
        console.warn('[Socket.IO] Cannot join conversation: not authenticated');
        return;
      }

      socketRef.current.emit(WSMessageType.JOIN_CONVERSATION, {
        type: WSMessageType.JOIN_CONVERSATION,
        timestamp: new Date().toISOString(),
        conversationId,
      });
    },
    [isAuthenticated]
  );

  // Quitter une conversation
  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (!isAuthenticated || !socketRef.current) {
        return;
      }

      socketRef.current.emit(WSMessageType.LEAVE_CONVERSATION, {
        type: WSMessageType.LEAVE_CONVERSATION,
        timestamp: new Date().toISOString(),
        conversationId,
      });
    },
    [isAuthenticated]
  );

  // Envoyer un message
  const sendChatMessage = useCallback(
    (conversationId: string, content: string, attachments?: any[]) => {
      if (!isAuthenticated || !socketRef.current) {
        console.warn('[Socket.IO] Cannot send message: not authenticated');
        return;
      }

      socketRef.current.emit(WSMessageType.SEND_MESSAGE, {
        type: WSMessageType.SEND_MESSAGE,
        timestamp: new Date().toISOString(),
        conversationId,
        content,
        attachments,
      });
    },
    [isAuthenticated]
  );

  // Indiquer que l'utilisateur tape
  const startTyping = useCallback(
    (conversationId: string) => {
      if (!isAuthenticated || !socketRef.current) {
        return;
      }

      socketRef.current.emit(WSMessageType.TYPING_START, {
        type: WSMessageType.TYPING_START,
        timestamp: new Date().toISOString(),
        conversationId,
      });
    },
    [isAuthenticated]
  );

  // Indiquer que l'utilisateur a arrêté de taper
  const stopTyping = useCallback(
    (conversationId: string) => {
      if (!isAuthenticated || !socketRef.current) {
        return;
      }

      socketRef.current.emit(WSMessageType.TYPING_STOP, {
        type: WSMessageType.TYPING_STOP,
        timestamp: new Date().toISOString(),
        conversationId,
      });
    },
    [isAuthenticated]
  );

  // Connexion automatique au montage
  useEffect(() => {
    if (autoConnect && session?.user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, session?.user?.id, connect, disconnect]);

  return {
    // État
    connectionState,
    isConnected: connectionState === WSConnectionState.CONNECTED || connectionState === WSConnectionState.AUTHENTICATED,
    isAuthenticated,
    joinedConversations: Array.from(joinedConversationsRef.current),

    // Actions
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    sendChatMessage,
    startTyping,
    stopTyping,
  };
}
