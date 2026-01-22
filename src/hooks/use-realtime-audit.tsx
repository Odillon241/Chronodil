'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { AuditLogWithUser, ConnectionStatus } from '@/types/monitoring'

interface UseRealtimeAuditProps {
  onNewEvent: (event: AuditLogWithUser, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
  enabled?: boolean
}

interface AuditLogPayload {
  id: string
  userId: string | null
  action: string
  entity: string
  entityId: string
  changes: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

/**
 * Hook pour la souscription temps réel aux événements d'audit
 * Utilise Supabase Realtime pour écouter les INSERT sur la table AuditLog
 */
export function useRealtimeAudit({ onNewEvent, enabled = true }: UseRealtimeAuditProps) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 5
  const isSubscribedRef = useRef(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastConnected: null,
    reconnectAttempts: 0,
    error: null,
  })

  // Stabiliser la callback
  const stableOnNewEvent = useCallback(onNewEvent, [onNewEvent])

  useEffect(() => {
    if (!enabled) {
      // Si désactivé, cleanup et return
      if (channelRef.current) {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        isSubscribedRef.current = false
      }
      return
    }

    const supabase = createClient()
    let reconnectTimeout: NodeJS.Timeout

    const setupChannel = () => {
      // Éviter les doublons de channel
      if (channelRef.current || isSubscribedRef.current) {
        return
      }

      console.log('🔄 Configuration du real-time Supabase pour les audits...')

      channelRef.current = supabase
        .channel('monitoring-realtime', {
          config: {
            broadcast: { self: false },
          },
        })
        // Écouter les INSERT sur la table AuditLog
        .on<AuditLogPayload>(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'AuditLog',
          },
          (payload: RealtimePostgresChangesPayload<AuditLogPayload>) => {
            retryCountRef.current = 0
            const newRecord = payload.new as AuditLogPayload

            if (newRecord) {
              // Convertir en AuditLogWithUser
              const auditEvent: AuditLogWithUser = {
                id: newRecord.id,
                userId: newRecord.userId,
                action: newRecord.action,
                entity: newRecord.entity,
                entityId: newRecord.entityId,
                changes: newRecord.changes,
                ipAddress: newRecord.ipAddress,
                userAgent: newRecord.userAgent,
                createdAt: new Date(newRecord.createdAt),
                User: null, // Le user sera chargé séparément si nécessaire
              }

              console.log(`📋 Nouvel événement audit: ${newRecord.action} sur ${newRecord.entity}`)
              stableOnNewEvent(auditEvent, 'INSERT')
            }
          },
        )
        .subscribe((status) => {
          console.log('📡 Statut de la subscription real-time audit:', status)

          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true
            retryCountRef.current = 0
            setConnectionStatus({
              connected: true,
              lastConnected: new Date(),
              reconnectAttempts: 0,
              error: null,
            })
            console.log('✅ Subscription real-time active pour les audits')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            isSubscribedRef.current = false
            console.warn('⚠️ Erreur de connexion real-time audit, tentative de reconnexion...')

            // Backoff exponentiel
            if (retryCountRef.current < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 60000) // Max 60s
              retryCountRef.current++

              setConnectionStatus((prev) => ({
                ...prev,
                connected: false,
                reconnectAttempts: retryCountRef.current,
                error: `Reconnexion dans ${delay / 1000}s...`,
              }))

              reconnectTimeout = setTimeout(() => {
                if (channelRef.current) {
                  supabase.removeChannel(channelRef.current)
                  channelRef.current = null
                }
                isSubscribedRef.current = false
                setupChannel()
              }, delay)
            } else {
              setConnectionStatus({
                connected: false,
                lastConnected: null,
                reconnectAttempts: retryCountRef.current,
                error: 'Connexion real-time en mode dégradé',
              })
              console.warn(
                '⚠️ Connexion real-time Audit en mode dégradé (fonctionnement par polling)',
              )
            }
          } else if (status === 'CLOSED') {
            isSubscribedRef.current = false
            setConnectionStatus((prev) => ({
              ...prev,
              connected: false,
            }))
          }
        })
    }

    // Gestion de la visibilité de l'onglet
    const visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        // Quand l'onglet redevient visible, vérifier la connexion
        if (!isSubscribedRef.current && !channelRef.current) {
          retryCountRef.current = 0
          setupChannel()
        }
      }
    }

    document.addEventListener('visibilitychange', visibilityChangeHandler)
    setupChannel()

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', visibilityChangeHandler)
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (channelRef.current) {
        console.log('🧹 Nettoyage de la subscription real-time audit...')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        isSubscribedRef.current = false
      }
    }
  }, [stableOnNewEvent, enabled])

  // Fonction pour forcer la reconnexion
  const reconnect = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      isSubscribedRef.current = false
    }
    retryCountRef.current = 0
    setConnectionStatus((prev) => ({
      ...prev,
      error: null,
      reconnectAttempts: 0,
    }))
    // Le useEffect va recréer la connexion
  }, [])

  return {
    connectionStatus,
    reconnect,
    isConnected: connectionStatus.connected,
  }
}
