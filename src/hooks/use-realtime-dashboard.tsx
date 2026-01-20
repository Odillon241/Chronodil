'use client'

import { useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseRealtimeDashboardProps {
  onDataChange: (
    source: 'project' | 'task' | 'hrTimesheet',
    eventType?: 'INSERT' | 'UPDATE' | 'DELETE',
    id?: string,
  ) => void
  userId?: string
  enabled?: boolean
}

// ⚡ Hook optimisé pour Realtime Dashboard
// Surveille Project, ProjectMember, Task, HRTimesheet pour le tableau de bord
export function useRealtimeDashboard({
  onDataChange,
  userId,
  enabled = true,
}: UseRealtimeDashboardProps) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 10 // Augmenté pour plus de résilience
  const isSubscribedRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownErrorRef = useRef(false) // Éviter les toasts multiples

  // Utiliser le singleton Supabase
  const supabase = useMemo(() => createClient(), [])

  // Garder une référence stable du callback
  const onDataChangeRef = useRef(onDataChange)
  useEffect(() => {
    onDataChangeRef.current = onDataChange
  }, [onDataChange])

  useEffect(() => {
    if (!enabled) {
      return
    }

    let isMounted = true

    const cleanupChannel = async () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (channelRef.current) {
        try {
          await supabase.removeChannel(channelRef.current)
        } catch {
          // Ignorer les erreurs de nettoyage
        }
        channelRef.current = null
      }
      isSubscribedRef.current = false
    }

    const setupChannel = () => {
      if (!isMounted || channelRef.current || isSubscribedRef.current) {
        return
      }

      console.log('🔄 Configuration du real-time Supabase pour le dashboard...')

      const channel = supabase
        .channel('dashboard-realtime-channel', {
          config: {
            broadcast: { self: false },
            presence: { key: userId || 'anonymous' },
          },
        })
        // Écouter les changements sur Project
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Project',
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0
            hasShownErrorRef.current = false
            const eventType = payload.eventType
            const projectId = (payload.new as any)?.id || (payload.old as any)?.id
            onDataChangeRef.current?.('project', eventType, projectId)
          },
        )
        // Écouter les changements sur ProjectMember
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ProjectMember',
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0
            hasShownErrorRef.current = false
            const projectId = (payload.new as any)?.projectId || (payload.old as any)?.projectId
            onDataChangeRef.current?.('project', 'UPDATE', projectId)
          },
        )
        // Écouter les changements sur Task
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Task',
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0
            hasShownErrorRef.current = false
            const eventType = payload.eventType
            const taskId = (payload.new as any)?.id || (payload.old as any)?.id
            onDataChangeRef.current?.('task', eventType, taskId)
          },
        )
        // Écouter les changements sur HRTimesheet
        .on<Record<string, any>>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'HRTimesheet',
          },
          (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
            retryCountRef.current = 0
            hasShownErrorRef.current = false
            const eventType = payload.eventType
            const hrTimesheetId = (payload.new as any)?.id || (payload.old as any)?.id
            onDataChangeRef.current?.('hrTimesheet', eventType, hrTimesheetId)
          },
        )
        .subscribe((status) => {
          console.log('📡 Statut de la subscription real-time Dashboard:', status)

          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true
            retryCountRef.current = 0
            hasShownErrorRef.current = false
            console.log('✅ Subscription real-time active pour le dashboard')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            isSubscribedRef.current = false
            console.warn(
              `⚠️ Erreur de connexion real-time Dashboard (${status}), tentative ${retryCountRef.current + 1}/${maxRetries}...`,
            )

            if (retryCountRef.current < maxRetries && isMounted) {
              // Backoff exponentiel avec jitter
              const baseDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 60000)
              const jitter = Math.random() * 1000
              const delay = baseDelay + jitter
              retryCountRef.current++

              console.log(`🔄 Reconnexion Dashboard dans ${Math.round(delay / 1000)}s...`)

              reconnectTimeoutRef.current = setTimeout(async () => {
                if (!isMounted) return
                await cleanupChannel()
                if (isMounted) {
                  setupChannel()
                }
              }, delay)
            } else if (isMounted && !hasShownErrorRef.current) {
              hasShownErrorRef.current = true
              console.warn(
                '⚠️ Connexion real-time Dashboard en mode dégradé (fonctionnement sans temps réel)',
              )
              // Ne pas afficher de toast d'erreur - le dashboard fonctionne sans realtime
              // L'utilisateur peut rafraîchir manuellement si nécessaire
            }
          }
        })

      channelRef.current = channel
    }

    setupChannel()

    // Reconnexion quand la page redevient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isSubscribedRef.current && isMounted) {
        console.log('👁️ Page visible, tentative de reconnexion Dashboard...')
        retryCountRef.current = 0
        hasShownErrorRef.current = false
        cleanupChannel().then(() => {
          if (isMounted) setupChannel()
        })
      }
    }

    // Reconnexion quand le réseau revient
    const handleOnline = () => {
      if (isMounted && !isSubscribedRef.current) {
        console.log('🌐 Connexion réseau rétablie, reconnexion Dashboard...')
        retryCountRef.current = 0
        hasShownErrorRef.current = false
        cleanupChannel().then(() => {
          if (isMounted) setupChannel()
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)

    return () => {
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (channelRef.current) {
        console.log('🧹 Nettoyage de la subscription real-time Dashboard...')
        supabase.removeChannel(channelRef.current).catch(() => {})
        channelRef.current = null
        isSubscribedRef.current = false
      }
    }
  }, [supabase, userId, enabled])
}
