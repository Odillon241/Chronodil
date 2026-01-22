'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useVersionCheck } from '@/hooks/use-version-check'
import { toast } from 'sonner'
import { RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const TOAST_ID = 'version-update-notification'

/**
 * Composant qui surveille les nouvelles versions de l'application
 * et notifie l'utilisateur quand une mise à jour est disponible.
 *
 * Utilise le hook useVersionCheck qui:
 * - Poll l'API /api/version toutes les 5 minutes
 * - Vérifie aussi au retour de l'utilisateur (visibilitychange)
 */
export function VersionUpdateNotifier() {
  const hasNotified = useRef(false)

  const handleNewVersion = useCallback((newVersion: string, currentVersion: string) => {
    // Éviter les notifications multiples pour la même version
    if (hasNotified.current) return
    hasNotified.current = true

    toast.info(
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Sparkles className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Nouvelle version disponible</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            v{currentVersion} → v{newVersion}
          </p>
          <div className="mt-2">
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs"
              onClick={() => {
                toast.dismiss(TOAST_ID)
                window.location.reload()
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Mettre à jour
            </Button>
          </div>
        </div>
      </div>,
      {
        id: TOAST_ID,
        duration: Infinity, // Ne pas fermer automatiquement
        dismissible: true,
        position: 'bottom-right',
      },
    )
  }, [])

  const { updateAvailable, serverVersion, currentVersion } = useVersionCheck({
    interval: VERSION_CHECK_INTERVAL,
    enabled: true,
    onNewVersion: handleNewVersion,
  })

  // Reset le flag si l'utilisateur ferme le toast et qu'une autre version arrive
  useEffect(() => {
    if (!updateAvailable) {
      hasNotified.current = false
    }
  }, [updateAvailable])

  // Log pour le debugging (supprimé en production par removeConsole)
  useEffect(() => {
    if (updateAvailable && serverVersion) {
      console.log(`[VersionUpdateNotifier] Update available: ${currentVersion} -> ${serverVersion}`)
    }
  }, [updateAvailable, serverVersion, currentVersion])

  // Ce composant ne rend rien visuellement, il gère juste les notifications
  return null
}
