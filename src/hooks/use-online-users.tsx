'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getOnlineUsersCount } from '@/actions/monitoring.actions'

interface OnlineUser {
  id: string
  name: string
  email: string
}

interface UseOnlineUsersResult {
  count: number
  users: OnlineUser[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
}

interface UseOnlineUsersOptions {
  /** Intervalle de polling en millisecondes (défaut: 30000 = 30s) */
  pollingInterval?: number
  /** Activer/désactiver le hook */
  enabled?: boolean
}

/**
 * Hook pour obtenir le nombre d'utilisateurs en ligne avec polling automatique
 */
export function useOnlineUsers(options: UseOnlineUsersOptions = {}): UseOnlineUsersResult {
  const { pollingInterval = 30000, enabled = true } = options

  const [count, setCount] = useState(0)
  const [users, setUsers] = useState<OnlineUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)

  const fetchOnlineUsers = useCallback(async () => {
    if (!enabled) return

    try {
      const result = await getOnlineUsersCount({})

      if (result?.data) {
        setCount(result.data.count)
        setUsers(result.data.users)
        setLastUpdated(new Date())
        setError(null)
      } else if (result?.serverError) {
        setError(result.serverError)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  // Fonction de refresh manuelle
  const refresh = useCallback(async () => {
    setIsLoading(true)
    await fetchOnlineUsers()
  }, [fetchOnlineUsers])

  useEffect(() => {
    if (!enabled) {
      // Nettoyer l'intervalle si désactivé
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Fetch initial
    fetchOnlineUsers()

    // Setup du polling
    const setupPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        // Ne fetch que si l'onglet est visible
        if (isVisibleRef.current) {
          fetchOnlineUsers()
        }
      }, pollingInterval)
    }

    // Gestion de la visibilité de l'onglet
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible'

      if (isVisibleRef.current) {
        // Refetch immédiat quand l'onglet redevient visible
        fetchOnlineUsers()
        // Réinitialiser le polling
        setupPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    setupPolling()

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, pollingInterval, fetchOnlineUsers])

  return {
    count,
    users,
    isLoading,
    error,
    lastUpdated,
    refresh,
  }
}
