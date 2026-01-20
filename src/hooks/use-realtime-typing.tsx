'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Constante: temps après lequel on considère que l'utilisateur a arrêté d'écrire
const TYPING_TIMEOUT = 3000 // 3 secondes

interface TypingUser {
  id: string
  name: string
  timestamp: number
}

interface UseRealtimeTypingProps {
  conversationId: string
  currentUserId: string
  currentUserName: string
}

/**
 * Hook pour gérer les indicateurs de frappe en temps réel via Supabase Broadcast
 *
 * Utilise le canal Broadcast de Supabase pour envoyer et recevoir des événements
 * de frappe sans passer par la base de données.
 */
export function useRealtimeTyping({
  conversationId,
  currentUserId,
  currentUserName,
}: UseRealtimeTypingProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Nettoie les utilisateurs qui ont arrêté d'écrire (timeout dépassé)
   */
  const cleanupStaleTypingUsers = useCallback(() => {
    const now = Date.now()
    setTypingUsers((prev) => prev.filter((user) => now - user.timestamp < TYPING_TIMEOUT))
  }, [])

  /**
   * Envoie un événement de début de frappe
   */
  const startTyping = useCallback(() => {
    if (!channelRef.current || isTypingRef.current) return

    isTypingRef.current = true
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing:start',
      payload: {
        userId: currentUserId,
        userName: currentUserName,
        conversationId,
      },
    })

    // Arrêter automatiquement après le timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, TYPING_TIMEOUT)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId, currentUserName])

  /**
   * Envoie un événement de fin de frappe
   */
  const stopTyping = useCallback(() => {
    if (!channelRef.current || !isTypingRef.current) return

    isTypingRef.current = false
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing:stop',
      payload: {
        userId: currentUserId,
        conversationId,
      },
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [conversationId, currentUserId])

  /**
   * Appelé à chaque changement dans l'input de message
   * Utilise un debounce pour éviter trop d'événements
   */
  const onTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (!isTypingRef.current) {
      startTyping()
    } else {
      // Prolonger le timeout si déjà en train d'écrire
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping()
      }, TYPING_TIMEOUT)
    }
  }, [startTyping, stopTyping])

  // Configuration du canal Broadcast
  useEffect(() => {
    const supabase = createClient()

    // Créer un canal unique pour cette conversation
    const channelName = `typing:${conversationId}`

    channelRef.current = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false }, // Ne pas recevoir ses propres messages
        },
      })
      .on('broadcast', { event: 'typing:start' }, ({ payload }) => {
        if (payload.conversationId === conversationId && payload.userId !== currentUserId) {
          setTypingUsers((prev) => {
            const existing = prev.find((u) => u.id === payload.userId)
            if (existing) {
              // Mettre à jour le timestamp
              return prev.map((u) =>
                u.id === payload.userId ? { ...u, timestamp: Date.now() } : u,
              )
            }
            // Ajouter le nouvel utilisateur
            return [
              ...prev,
              {
                id: payload.userId,
                name: payload.userName,
                timestamp: Date.now(),
              },
            ]
          })
        }
      })
      .on('broadcast', { event: 'typing:stop' }, ({ payload }) => {
        if (payload.conversationId === conversationId && payload.userId !== currentUserId) {
          setTypingUsers((prev) => prev.filter((u) => u.id !== payload.userId))
        }
      })
      .subscribe((status) => {
        console.log(`📡 Typing channel [${channelName}]: ${status}`)
      })

    // Nettoyer les utilisateurs inactifs toutes les secondes
    cleanupIntervalRef.current = setInterval(cleanupStaleTypingUsers, 1000)

    return () => {
      // Arrêter de signaler qu'on écrit
      if (isTypingRef.current && channelRef.current) {
        stopTyping()
      }

      // Nettoyer les timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current)
      }

      // Se désabonner du canal
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, currentUserId, cleanupStaleTypingUsers, stopTyping])

  return {
    typingUsers: typingUsers.map((u) => u.name),
    onTyping,
    startTyping,
    stopTyping,
  }
}
