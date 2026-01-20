'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'

/**
 * Hook pour tracker la présence de l'utilisateur
 *
 * Fonctionnalités:
 * - Met à jour lastSeenAt toutes les 30 secondes quand l'utilisateur est actif
 * - Détecte l'inactivité (pas de mouvement souris/clavier pendant 5 minutes = hors ligne)
 * - Utilise l'API visibilitychange pour détecter les changements d'onglet
 * - Nettoie les timers au démontage
 * - Gère les erreurs réseau avec retry et backoff exponentiel
 */
export function usePresenceTracker() {
  const { data: session, isPending } = useSession()
  const lastActivityRef = useRef<number>(Date.now())
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef<number>(0)
  const maxRetries = 3

  // Constantes
  const UPDATE_INTERVAL = 30 * 1000 // 30 secondes
  const INACTIVITY_THRESHOLD = 5 * 60 * 1000 // 5 minutes

  /**
   * Met à jour la présence de l'utilisateur via l'API
   * Avec gestion des erreurs réseau et retry
   */
  const updatePresence = useCallback(async () => {
    // Ne pas faire de requête si la session est en cours de chargement ou absente
    if (isPending || !session?.user) return

    try {
      const response = await fetch('/api/presence/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: inclure les cookies pour l'authentification
        body: JSON.stringify({
          userId: session.user.id,
        }),
      })

      // Réinitialiser le compteur de retry en cas de succès
      if (response.ok) {
        retryCountRef.current = 0
        return
      }

      // 401 = session expirée ou non authentifié - ignorer silencieusement
      if (response.status === 401) {
        // Ne pas logger comme erreur, c'est un comportement attendu
        // quand la session expire ou que l'utilisateur n'est pas connecté
        return
      }

      // Autres erreurs HTTP
      console.warn(`[Presence] Erreur HTTP ${response.status}`)
    } catch (_error) {
      // Erreur réseau (ECONNRESET, timeout, etc.)
      retryCountRef.current++

      if (retryCountRef.current <= maxRetries) {
        // Retry avec backoff exponentiel (1s, 2s, 4s)
        const delay = Math.pow(2, retryCountRef.current - 1) * 1000
        setTimeout(() => {
          updatePresence()
        }, delay)
      }
      // Ne pas logger les erreurs réseau transitoires pour éviter le spam console
    }
  }, [session?.user, isPending])

  /**
   * Met à jour le timestamp de dernière activité
   */
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now()

    // Réinitialiser le timer d'inactivité
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }

    // Définir un nouveau timer d'inactivité
    inactivityTimeoutRef.current = setTimeout(() => {
      // L'utilisateur est inactif - on arrête les mises à jour
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }, INACTIVITY_THRESHOLD)
  }, [INACTIVITY_THRESHOLD])

  /**
   * Gère le changement de visibilité de la page
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // L'utilisateur a quitté l'onglet - on arrête les mises à jour
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    } else {
      // L'utilisateur est revenu sur l'onglet - on met à jour immédiatement
      updatePresence()
      handleActivity()

      // Redémarrer les mises à jour périodiques si pas déjà en cours
      if (!updateIntervalRef.current) {
        updateIntervalRef.current = setInterval(updatePresence, UPDATE_INTERVAL)
      }
    }
  }, [updatePresence, handleActivity, UPDATE_INTERVAL])

  useEffect(() => {
    // Attendre que la session soit chargée et valide
    if (isPending || !session?.user) return

    // Mise à jour initiale
    updatePresence()

    // Démarrer les mises à jour périodiques
    updateIntervalRef.current = setInterval(updatePresence, UPDATE_INTERVAL)

    // Écouter les événements d'activité de l'utilisateur
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Écouter le changement de visibilité de la page
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Initialiser le timer d'inactivité
    handleActivity()

    // Cleanup
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }

      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })

      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [
    session?.user,
    isPending,
    updatePresence,
    handleActivity,
    handleVisibilityChange,
    UPDATE_INTERVAL,
  ])
}
