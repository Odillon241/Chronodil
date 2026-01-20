'use client'

import { useEffect, useState } from 'react'
import { useNotificationSound, type SoundFiles } from '@/hooks/use-notification-sound'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Volume2, Wifi, WifiOff, Check, X } from 'lucide-react'

/**
 * Composant de test pour vérifier:
 * 1. La lecture des sons
 * 2. La synchronisation multi-onglets
 * 3. Les permissions de notification
 * 4. Le statut de BroadcastChannel
 */
export function NotificationSoundTester() {
  const [soundEnabled, _setSoundEnabled] = useState(true)
  const [broadcastStatus, setBroadcastStatus] = useState<string>('checking')
  const [testLog, setTestLog] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  const sound = useNotificationSound({
    soundEnabled,
    volume: 0.7,
    onPermissionChange: (permission) => {
      addLog(`Permission changed: ${permission}`)
    },
  })

  useEffect(() => {
    setMounted(true)
    addLog('Composant monté')

    // Vérifier BroadcastChannel
    if ('BroadcastChannel' in window) {
      setBroadcastStatus('supported')
      addLog('✅ BroadcastChannel supporté')
    } else {
      setBroadcastStatus('not-supported')
      addLog('❌ BroadcastChannel non supporté')
    }

    // Vérifier Notification API
    if ('Notification' in window) {
      addLog(`✅ Notification API supportée (permission: ${sound.permission})`)
    } else {
      addLog('❌ Notification API non supportée')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('fr-FR')
    setTestLog((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)])
  }

  const testSound = (soundType: keyof SoundFiles) => {
    addLog(`▶️ Lecture de: ${soundType}`)
    sound.playSound(soundType)
  }

  const testNotification = () => {
    addLog('📢 Notification avec son')
    sound.notifyWithSound('Test Notification', {
      body: 'Ceci est un test de notification avec son',
      soundType: 'notification',
      icon: '/icon.png',
    })
  }

  const requestPermission = async () => {
    addLog('🔐 Demande de permission...')
    const result = await sound.requestPermission()
    addLog(`Résultat: ${result}`)
  }

  const testMultiTab = async () => {
    addLog('🔄 Test multi-onglets (voir les autres onglets)')
    sound.playSound('taskAssigned')
    await new Promise((resolve) => setTimeout(resolve, 500))
    sound.playSound('taskCompleted')
  }

  if (!mounted) {
    return <div className="p-4 text-sm text-muted-foreground">Initialisation...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Test des sons de notification
          </CardTitle>
          <CardDescription>
            Testez les sons, les permissions et la synchronisation multi-onglets
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                {broadcastStatus === 'supported' ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-sm font-medium">BroadcastChannel</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {broadcastStatus === 'supported' ? 'Supporté ✅' : 'Non supporté ⚠️'}
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                {sound.hasPermission ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Permissions</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {sound.permission === 'granted' ? 'Accordées ✅' : `${sound.permission} ⚠️`}
              </p>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Contrôles</h3>

            {/* Permission */}
            {sound.permission === 'default' && (
              <Button onClick={requestPermission} className="w-full sm:w-auto" size="sm">
                🔐 Demander permission
              </Button>
            )}

            {/* Test Buttons */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Sons disponibles</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {sound.soundTypes.map((soundType) => (
                  <Button
                    key={soundType}
                    onClick={() => testSound(soundType)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    ▶️ {getSoundLabel(soundType)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notification Test */}
            <Button onClick={testNotification} size="sm" className="w-full">
              📢 Test notification complète
            </Button>

            {/* Multi-tab Test */}
            <Button
              onClick={testMultiTab}
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={broadcastStatus !== 'supported'}
            >
              🔄 Test multi-onglets (ouvrir plusieurs onglets)
            </Button>
          </div>

          {/* Instructions */}
          <div className="space-y-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
              💡 Test multi-onglets
            </p>
            <ol className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
              <li>1. Ouvrez cette page dans 2-3 onglets</li>
              <li>2. Cliquez sur &quot;Test multi-onglets&quot; dans un onglet</li>
              <li>3. Le son devrait jouer dans cet onglet</li>
              <li>4. Les autres onglets recevront le message mais ne rejouent PAS le son</li>
            </ol>
          </div>

          {/* Log */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Journal (50 dernières lignes)</h3>
            <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted p-2">
              {testLog.length === 0 ? (
                <p className="text-xs text-muted-foreground">En attente de logs...</p>
              ) : (
                <pre className="text-xs whitespace-pre-wrap wrap-break-word text-muted-foreground">
                  {testLog.join('\n')}
                </pre>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getSoundLabel(soundType: string): string {
  const labels: Record<string, string> = {
    notification: 'Notification',
    taskAssigned: 'Tâche assignée',
    taskCompleted: 'Tâche complétée',
    taskUpdated: 'Tâche mise à jour',
    error: 'Erreur',
    success: 'Succès',
  }
  return labels[soundType] || soundType
}
