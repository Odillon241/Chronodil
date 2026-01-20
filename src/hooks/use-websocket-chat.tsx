'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import {
  WSMessageType,
  WSClientMessage,
  WSServerMessage,
  WSConnectionState,
  WSNewMessageMessage,
} from '@/types/websocket'

interface UseWebSocketChatOptions {
  onNewMessage?: (message: WSNewMessageMessage['message']) => void
  onUserTyping?: (data: { conversationId: string; userId: string; userName: string }) => void
  onUserStoppedTyping?: (data: { conversationId: string; userId: string }) => void
  autoConnect?: boolean
}

export function useWebSocketChat(options: UseWebSocketChatOptions = {}) {
  const { onNewMessage, onUserTyping, onUserStoppedTyping, autoConnect = true } = options
  const { data: session } = useSession()

  const [connectionState, setConnectionState] = useState<WSConnectionState>(
    WSConnectionState.DISCONNECTED,
  )
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000
  const joinedConversationsRef = useRef<Set<string>>(new Set())

  // Fonction pour envoyer un message au serveur
  const sendMessage = useCallback((message: WSClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('[WebSocket] Cannot send message: not connected')
    }
  }, [])

  // Fonction pour se connecter au WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || !session?.user?.id) {
      return
    }

    setConnectionState(WSConnectionState.CONNECTING)

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`

    console.log('[WebSocket] Connecting to:', wsUrl)

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WebSocket] Connected')
        setConnectionState(WSConnectionState.CONNECTED)
        reconnectAttemptsRef.current = 0

        // S'authentifier
        if (session?.user?.id) {
          sendMessage({
            type: WSMessageType.AUTHENTICATE,
            timestamp: new Date().toISOString(),
            token: session.user.id, // À remplacer par un vrai token JWT
          })
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: WSServerMessage = JSON.parse(event.data)
          handleServerMessage(message)
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        setConnectionState(WSConnectionState.ERROR)
      }

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        setConnectionState(WSConnectionState.DISCONNECTED)
        setIsAuthenticated(false)
        joinedConversationsRef.current.clear()

        // Tentative de reconnexion
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(
            `[WebSocket] Reconnecting (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`,
          )
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay)
        } else {
          console.error('[WebSocket] Max reconnection attempts reached')
        }
      }
    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
      setConnectionState(WSConnectionState.ERROR)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, sendMessage])

  // Fonction pour se déconnecter
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnectionState(WSConnectionState.DISCONNECTED)
    setIsAuthenticated(false)
    joinedConversationsRef.current.clear()
  }, [])

  // Gérer les messages du serveur
  const handleServerMessage = (message: WSServerMessage) => {
    switch (message.type) {
      case WSMessageType.AUTHENTICATED:
        console.log('[WebSocket] Authenticated')
        setIsAuthenticated(true)
        setConnectionState(WSConnectionState.AUTHENTICATED)
        break

      case WSMessageType.AUTH_ERROR:
        console.error('[WebSocket] Authentication failed:', message.error)
        disconnect()
        break

      case WSMessageType.JOINED_CONVERSATION:
        console.log('[WebSocket] Joined conversation:', message.conversationId)
        joinedConversationsRef.current.add(message.conversationId)
        break

      case WSMessageType.LEFT_CONVERSATION:
        console.log('[WebSocket] Left conversation:', message.conversationId)
        joinedConversationsRef.current.delete(message.conversationId)
        break

      case WSMessageType.NEW_MESSAGE:
        console.log('[WebSocket] New message received:', message.message)
        onNewMessage?.(message.message)
        break

      case WSMessageType.USER_TYPING:
        onUserTyping?.({
          conversationId: message.conversationId,
          userId: message.userId,
          userName: message.userName,
        })
        break

      case WSMessageType.USER_STOPPED_TYPING:
        onUserStoppedTyping?.({
          conversationId: message.conversationId,
          userId: message.userId,
        })
        break

      case WSMessageType.MESSAGE_SENT:
        console.log('[WebSocket] Message sent confirmed:', message.messageId)
        break

      case WSMessageType.MESSAGE_ERROR:
        console.error('[WebSocket] Message error:', message.error)
        break

      case WSMessageType.ERROR:
        console.error('[WebSocket] Server error:', message.error)
        break

      case WSMessageType.PONG:
        // Heartbeat réponse
        break

      default:
        console.log('[WebSocket] Unknown message type:', message)
    }
  }

  // Rejoindre une conversation
  const joinConversation = useCallback(
    (conversationId: string) => {
      if (!isAuthenticated) {
        console.warn('[WebSocket] Cannot join conversation: not authenticated')
        return
      }

      sendMessage({
        type: WSMessageType.JOIN_CONVERSATION,
        timestamp: new Date().toISOString(),
        conversationId,
      })
    },
    [isAuthenticated, sendMessage],
  )

  // Quitter une conversation
  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (!isAuthenticated) {
        return
      }

      sendMessage({
        type: WSMessageType.LEAVE_CONVERSATION,
        timestamp: new Date().toISOString(),
        conversationId,
      })
    },
    [isAuthenticated, sendMessage],
  )

  // Envoyer un message
  const sendChatMessage = useCallback(
    (conversationId: string, content: string, attachments?: any[]) => {
      if (!isAuthenticated) {
        console.warn('[WebSocket] Cannot send message: not authenticated')
        return
      }

      sendMessage({
        type: WSMessageType.SEND_MESSAGE,
        timestamp: new Date().toISOString(),
        conversationId,
        content,
        attachments,
      })
    },
    [isAuthenticated, sendMessage],
  )

  // Indiquer que l'utilisateur tape
  const startTyping = useCallback(
    (conversationId: string) => {
      if (!isAuthenticated) {
        return
      }

      sendMessage({
        type: WSMessageType.TYPING_START,
        timestamp: new Date().toISOString(),
        conversationId,
      })
    },
    [isAuthenticated, sendMessage],
  )

  // Indiquer que l'utilisateur a arrêté de taper
  const stopTyping = useCallback(
    (conversationId: string) => {
      if (!isAuthenticated) {
        return
      }

      sendMessage({
        type: WSMessageType.TYPING_STOP,
        timestamp: new Date().toISOString(),
        conversationId,
      })
    },
    [isAuthenticated, sendMessage],
  )

  // Connexion automatique au montage
  useEffect(() => {
    if (autoConnect && session?.user?.id) {
      connect()
    }

    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, session?.user?.id])

  return {
    // État
    connectionState,
    isConnected:
      connectionState === WSConnectionState.CONNECTED ||
      connectionState === WSConnectionState.AUTHENTICATED,
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
  }
}
