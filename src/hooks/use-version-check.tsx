'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { APP_VERSION } from '@/lib/version'

interface VersionResponse {
  success: boolean
  data?: {
    version: string
    formattedVersion: string
    buildDate: string
    nodeEnv: string
    name: string
  }
  error?: string
}

interface ServiceWorkerMessage {
  type: string
  version?: string
  previousVersion?: string
}

interface UseVersionCheckOptions {
  /**
   * Intervalle de vérification en millisecondes
   * @default 5 * 60 * 1000 (5 minutes)
   */
  interval?: number
  /**
   * Activer la vérification automatique
   * @default true
   */
  enabled?: boolean
  /**
   * Callback appelé quand une nouvelle version est détectée
   */
  onNewVersion?: (newVersion: string, currentVersion: string) => void
}

export function useVersionCheck(options: UseVersionCheckOptions = {}) {
  const {
    interval = 5 * 60 * 1000, // 5 minutes par défaut
    enabled = true,
    onNewVersion,
  } = options

  const [isChecking, setIsChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [serverVersion, setServerVersion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkVersion = useCallback(async () => {
    if (!enabled) return

    setIsChecking(true)
    setError(null)

    try {
      const response = await fetch('/api/version', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: VersionResponse = await response.json()

      if (data.success && data.data) {
        const newVersion = data.data.version
        setServerVersion(newVersion)

        // Comparer les versions
        if (newVersion !== APP_VERSION) {
          setUpdateAvailable(true)
          onNewVersion?.(newVersion, APP_VERSION)
        } else {
          setUpdateAvailable(false)
        }
      } else {
        throw new Error(data.error || 'Failed to fetch version')
      }
    } catch (err) {
      console.error('[useVersionCheck] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsChecking(false)
    }
  }, [enabled, onNewVersion])

  // Vérification initiale
  useEffect(() => {
    if (enabled) {
      checkVersion()
    }
  }, [enabled, checkVersion])

  // Vérification périodique
  useEffect(() => {
    if (!enabled || interval <= 0) return

    const intervalId = setInterval(() => {
      checkVersion()
    }, interval)

    return () => clearInterval(intervalId)
  }, [enabled, interval, checkVersion])

  // Vérification au focus de la fenêtre (retour de l'utilisateur)
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkVersion()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enabled, checkVersion])

  // Référence pour éviter les appels multiples du callback
  const onNewVersionRef = useRef(onNewVersion)
  onNewVersionRef.current = onNewVersion

  // Écouter les messages du Service Worker pour les mises à jour de version
  useEffect(() => {
    if (!enabled) return
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return

    const handleMessage = (event: MessageEvent<ServiceWorkerMessage>) => {
      if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
        const newVersion = event.data.version
        const previousVersion = event.data.previousVersion

        if (newVersion && newVersion !== APP_VERSION) {
          console.log('[useVersionCheck] Service Worker detected new version:', newVersion)
          setServerVersion(newVersion)
          setUpdateAvailable(true)
          onNewVersionRef.current?.(newVersion, previousVersion || APP_VERSION)
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [enabled])

  return {
    isChecking,
    updateAvailable,
    serverVersion,
    currentVersion: APP_VERSION,
    error,
    checkVersion,
  }
}
