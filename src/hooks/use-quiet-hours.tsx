'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getQuietHoursSettings,
  updateQuietHoursSettings,
  isInQuietHours,
} from '@/actions/notification.actions'

interface QuietHoursSettings {
  enabled: boolean
  startTime: string
  endTime: string
  days: string[]
}

/**
 * Hook pour gérer les heures calmes
 *
 * Vérifie périodiquement si l'utilisateur est dans une période d'heures calmes
 * et empêche les notifications sonores/visuelles pendant cette période.
 */
export function useQuietHours() {
  const [settings, setSettings] = useState<QuietHoursSettings>({
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    days: [],
  })
  const [isQuiet, setIsQuiet] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Charger les paramètres au montage

  useEffect(() => {
    loadSettings()
  }, [])

  // Vérifier périodiquement si on est dans les heures calmes

  useEffect(() => {
    if (!settings.enabled) {
      setIsQuiet(false)
      return
    }

    // Vérifier immédiatement
    checkQuietHours()

    // Puis vérifier toutes les minutes
    const interval = setInterval(checkQuietHours, 60000)

    return () => clearInterval(interval)
  }, [settings])

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await getQuietHoursSettings({})
      if (result?.data) {
        setSettings({
          enabled: result.data.enabled,
          startTime: result.data.startTime,
          endTime: result.data.endTime,
          days: result.data.days,
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des heures calmes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkQuietHours = useCallback(async () => {
    if (!settings.enabled) {
      setIsQuiet(false)
      return
    }

    try {
      const result = await isInQuietHours({})
      if (result?.data) {
        setIsQuiet(result.data.isQuiet)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des heures calmes:', error)
    }
  }, [settings.enabled])

  const updateSettings = useCallback(
    async (newSettings: QuietHoursSettings) => {
      try {
        const result = await updateQuietHoursSettings(newSettings)
        if (result?.data?.success) {
          setSettings(newSettings)
          // Re-vérifier immédiatement
          if (newSettings.enabled) {
            checkQuietHours()
          } else {
            setIsQuiet(false)
          }
          return true
        }
        return false
      } catch (error) {
        console.error('Erreur lors de la mise à jour des heures calmes:', error)
        return false
      }
    },
    [checkQuietHours],
  )

  /**
   * Vérifie localement (sans appel serveur) si on est dans les heures calmes
   * Utile pour les vérifications fréquentes côté client
   */
  const checkQuietHoursLocal = useCallback((): boolean => {
    if (!settings.enabled) return false

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeNum = currentHour * 100 + currentMinute

    // Vérifier le jour
    if (settings.days.length > 0) {
      const currentDay = now.getDay().toString()
      if (!settings.days.includes(currentDay)) {
        return false
      }
    }

    // Parser les heures
    const [startHour, startMin] = settings.startTime.split(':').map(Number)
    const [endHour, endMin] = settings.endTime.split(':').map(Number)
    const startTimeNum = startHour * 100 + startMin
    const endTimeNum = endHour * 100 + endMin

    // Gérer le cas où les heures passent minuit
    if (startTimeNum > endTimeNum) {
      return currentTimeNum >= startTimeNum || currentTimeNum < endTimeNum
    } else {
      return currentTimeNum >= startTimeNum && currentTimeNum < endTimeNum
    }
  }, [settings])

  return {
    settings,
    isQuiet,
    isLoading,
    updateSettings,
    checkQuietHoursLocal,
    refresh: loadSettings,
  }
}

/**
 * Hook simplifié qui retourne juste si on est en heures calmes
 * Utile pour les composants qui n'ont pas besoin de gérer les paramètres
 */
export function useIsQuietHours() {
  const { isQuiet, checkQuietHoursLocal } = useQuietHours()
  return { isQuiet, checkQuietHoursLocal }
}
