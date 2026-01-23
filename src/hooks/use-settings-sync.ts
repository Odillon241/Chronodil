'use client'

import { useEffect, useCallback, useRef } from 'react'
import type { GeneralSettings } from '@/types/settings.types'

const CHANNEL_NAME = 'chronodil-settings-sync'

interface SettingsSyncMessage {
  type: 'SETTINGS_UPDATED'
  settings: Partial<GeneralSettings>
  timestamp: number
  tabId: string
}

/**
 * Hook pour synchroniser les paramètres entre les onglets du navigateur
 * Utilise BroadcastChannel API avec fallback localStorage pour Safari < 15.4
 */
export function useSettingsSync(onSettingsChange: (settings: Partial<GeneralSettings>) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null)
  const tabIdRef = useRef<string>(Math.random().toString(36).substring(7))

  // Vérifie si BroadcastChannel est supporté
  const isBroadcastSupported = typeof window !== 'undefined' && 'BroadcastChannel' in window

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isBroadcastSupported) {
      // Utilise BroadcastChannel (Chrome, Firefox, Edge, Safari 15.4+)
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channelRef.current = channel

      channel.onmessage = (event: MessageEvent<SettingsSyncMessage>) => {
        // Ignore les messages de cet onglet
        if (event.data.tabId === tabIdRef.current) return

        if (event.data.type === 'SETTINGS_UPDATED') {
          onSettingsChange(event.data.settings)
        }
      }

      return () => {
        channel.close()
        channelRef.current = null
      }
    } else {
      // Fallback localStorage pour Safari ancien
      const handleStorage = (event: StorageEvent) => {
        if (event.key === CHANNEL_NAME && event.newValue) {
          try {
            const data: SettingsSyncMessage = JSON.parse(event.newValue)
            if (data.tabId !== tabIdRef.current && data.type === 'SETTINGS_UPDATED') {
              onSettingsChange(data.settings)
            }
          } catch {
            // Ignore erreurs de parsing
          }
        }
      }

      window.addEventListener('storage', handleStorage)
      return () => window.removeEventListener('storage', handleStorage)
    }
  }, [onSettingsChange, isBroadcastSupported])

  /**
   * Diffuse les changements de paramètres aux autres onglets
   */
  const broadcastUpdate = useCallback(
    (settings: Partial<GeneralSettings>) => {
      const message: SettingsSyncMessage = {
        type: 'SETTINGS_UPDATED',
        settings,
        timestamp: Date.now(),
        tabId: tabIdRef.current,
      }

      if (isBroadcastSupported && channelRef.current) {
        channelRef.current.postMessage(message)
      } else if (typeof window !== 'undefined') {
        // Fallback localStorage
        localStorage.setItem(CHANNEL_NAME, JSON.stringify(message))
        // Nettoie immédiatement pour permettre de nouveaux events
        setTimeout(() => localStorage.removeItem(CHANNEL_NAME), 100)
      }
    },
    [isBroadcastSupported],
  )

  return { broadcastUpdate }
}

/**
 * Applique les paramètres à l'interface utilisateur (DOM)
 */
export function applySettingsToDOM(settings: Partial<GeneralSettings>) {
  if (typeof window === 'undefined') return

  const root = document.documentElement

  // Mode sombre
  if (settings.darkModeEnabled !== undefined) {
    const isDark =
      settings.darkModeEnabled ||
      (settings.darkModeEnabled === undefined &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.remove('light', 'dark')
    root.classList.add(isDark ? 'dark' : 'light')
  }

  // Couleur d'accent
  if (settings.accentColor) {
    root.setAttribute('data-accent', settings.accentColor)
  }

  // Densité d'affichage
  if (settings.viewDensity) {
    root.setAttribute('data-density', settings.viewDensity)
  }

  // Taille de police
  if (settings.fontSize) {
    root.style.fontSize = `${settings.fontSize}px`
  }

  // Contraste élevé
  if (settings.highContrast !== undefined) {
    root.classList.toggle('high-contrast', settings.highContrast)
  }

  // Réduction des animations
  if (settings.reduceMotion !== undefined) {
    root.classList.toggle('reduce-motion', settings.reduceMotion)
  }

  // Mode lecteur d'écran
  if (settings.screenReaderMode !== undefined) {
    root.classList.toggle('screen-reader-mode', settings.screenReaderMode)
  }
}
