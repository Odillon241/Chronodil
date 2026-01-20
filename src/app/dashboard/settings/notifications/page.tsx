'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Bell, Volume2, Volume1, VolumeX, Mail, Monitor, Settings2, RotateCcw } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { getUserPreferences, updateUserPreferences } from '@/actions/preferences.actions'
import { useConfirmationDialog } from '@/hooks/use-confirmation-dialog'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  useNotificationSound,
  useAvailableSounds,
  CATEGORY_LABELS,
  NOTIFICATION_SOUNDS,
} from '@/hooks/use-notification-sound'
import { usePushSubscription } from '@/hooks/use-push-subscription'
import { sendTestPushNotification } from '@/actions/push-subscription.actions'

export default function NotificationsPage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()

  // Notification preferences
  const [preferences, setPreferences] = useState<any>(null)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

  // État local pour le slider de volume (pour interaction fluide)
  const [localVolume, setLocalVolume] = useState<number>(50)
  const [isTestingSound, setIsTestingSound] = useState(false)

  // Push notifications
  const pushSubscription = usePushSubscription({
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    autoSubscribe: false,
  })

  const {
    testSound,
    requestPermission,
    showNotification: _showNotification,
    permission: _permission,
    hasPermission: _hasPermission,
  } = useNotificationSound({
    soundEnabled: true,
    volume: localVolume / 100,
  })

  // Charger les sons disponibles depuis Supabase Storage
  const { availableSounds, isLoading: isLoadingSounds } = useAvailableSounds()

  // Mettre à jour l'état local quand les préférences changent
  useEffect(() => {
    if (preferences?.notificationSoundVolume !== undefined) {
      setLocalVolume(preferences.notificationSoundVolume * 100)
    }
  }, [preferences?.notificationSoundVolume])

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const result = await getUserPreferences({})
        if (result?.data) {
          setPreferences(result.data)
        }
      } catch (_error) {
        toast.error('Erreur lors du chargement')
      }
    }
    loadPreferences()
  }, [])

  // Notification preferences handlers
  const handleUpdatePreference = async (key: string, value: any) => {
    setIsSavingPreferences(true)
    try {
      // Si on active les notifications de bureau, demander la permission
      if (key === 'desktopNotificationsEnabled' && value === true) {
        console.log('[Desktop Notifications] Activating desktop notifications...')

        if (!('Notification' in window)) {
          console.error('[Desktop Notifications] Notifications API not supported')
          toast.error('Les notifications ne sont pas supportées par ce navigateur')
          setIsSavingPreferences(false)
          return
        }

        const currentPermission = Notification.permission
        console.log('[Desktop Notifications] Current permission:', currentPermission)

        if (currentPermission === 'default') {
          console.log('[Desktop Notifications] Requesting permission...')
          const permissionResult = await requestPermission()
          console.log('[Desktop Notifications] Permission result:', permissionResult)

          if (permissionResult !== 'granted') {
            toast.error(
              'Permission refusée. Les notifications de bureau ne peuvent pas être activées.',
            )
            setIsSavingPreferences(false)
            return
          }
        } else if (currentPermission === 'denied') {
          console.warn('[Desktop Notifications] Permission denied by user')
          toast.error(
            'Les notifications sont bloquées. Veuillez les autoriser dans les paramètres du navigateur.',
          )
          setIsSavingPreferences(false)
          return
        } else if (currentPermission === 'granted') {
          console.log('[Desktop Notifications] Permission already granted')
        }
      }

      const result = await updateUserPreferences({ [key]: value })
      if (result?.data) {
        setPreferences(result.data)
        // Ne pas afficher de toast pour le volume (trop fréquent)
        if (key !== 'notificationSoundVolume') {
          toast.success('Préférence enregistrée')
        }
      }
    } catch (_error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setIsSavingPreferences(false)
    }
  }

  // Handler pour le commit du volume (quand l'utilisateur relâche)
  const handleVolumeCommit = (value: number) => {
    const volumeValue = value / 100
    // Sauvegarder immédiatement quand l'utilisateur relâche
    handleUpdatePreference('notificationSoundVolume', volumeValue)
  }

  // Composant réutilisable pour les options de son
  function SoundOptionCard({
    sound,
    isSelected,
    onTest,
    disabled,
  }: {
    sound: (typeof NOTIFICATION_SOUNDS)[0]
    isSelected: boolean
    onTest: () => void
    disabled: boolean
  }) {
    return (
      <div
        className={`flex items-center gap-4 p-2.5 rounded-xl transition-all ${
          isSelected ? 'bg-primary/10 shadow-sm' : 'hover:bg-muted/50 text-muted-foreground'
        }`}
      >
        <RadioGroupItem
          value={sound.id}
          id={`sound-${sound.id}`}
          className="h-4 w-4"
          disabled={disabled}
        />
        <Label
          htmlFor={`sound-${sound.id}`}
          className="flex-1 cursor-pointer flex items-center justify-between min-w-0"
        >
          <div className="flex-1 min-w-0">
            <span
              className={`block font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {sound.name}
            </span>
            <span className="block text-[11px] text-muted-foreground/70 truncate">
              {sound.description}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] font-normal border-muted-foreground/20"
            >
              {CATEGORY_LABELS[sound.category]}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onTest()
              }}
              disabled={disabled}
              className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Label>
      </div>
    )
  }

  const handleResetPreferences = async () => {
    const _confirmed = await showConfirmation({
      title: 'Réinitialiser les préférences',
      description:
        'Êtes-vous sûr de vouloir réinitialiser toutes les préférences de notification ? Cette action est irréversible.',
      confirmText: 'Réinitialiser',
      cancelText: 'Annuler',
      variant: 'destructive',
      onConfirm: async () => {
        setIsSavingPreferences(true)
        try {
          // Reset to default values
          const result = await updateUserPreferences({
            enableTimesheetReminders: true,
            reminderTime: '17:00',
            reminderDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          })
          if (result?.data) {
            setPreferences(result.data)
            toast.success('Préférences réinitialisées')
          }
        } catch (_error) {
          toast.error('Erreur lors de la réinitialisation')
        } finally {
          setIsSavingPreferences(false)
        }
      },
    })
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gérez vos préférences de notification sonore et visuelle
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleResetPreferences}
            disabled={isSavingPreferences || !preferences}
            size="sm"
            className="h-8 text-xs md:text-sm border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30 bg-destructive/5"
          >
            <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
            Réinitialiser
          </Button>
        </div>

        {!preferences ? (
          <Card className="border-dashed">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 rounded-full bg-muted animate-pulse">
                  <Settings2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Spinner className="size-6" />
                  <p className="text-center text-muted-foreground">Chargement des préférences...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Canaux de notification - Liste épurée */}
            <Card className="overflow-hidden border shadow-none bg-muted/20">
              <CardHeader className="pb-3 border-b bg-background/50">
                <CardTitle className="text-lg font-bold">Canaux de notification</CardTitle>
                <CardDescription>
                  Activez ou désactivez les moyens de recevoir vos alertes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 bg-background/30">
                <div className="divide-y divide-border/50">
                  {/* Sons */}
                  <div className="flex items-center justify-between p-4 hover:bg-muted/3 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-background border shadow-sm">
                        <Volume2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Sons de notification</div>
                        <p className="text-xs text-muted-foreground">
                          Alertes sonores dans l'application
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {preferences.notificationSoundEnabled && (
                        <Badge
                          variant="secondary"
                          className="hidden sm:flex h-6 bg-green-500/10 text-green-600 dark:text-green-500 border-none"
                        >
                          {Math.round(localVolume)}%
                        </Badge>
                      )}
                      <Switch
                        checked={preferences.notificationSoundEnabled}
                        onCheckedChange={(checked) =>
                          handleUpdatePreference('notificationSoundEnabled', checked)
                        }
                        disabled={isSavingPreferences}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between p-4 hover:bg-muted/3 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-background border shadow-sm">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Notifications email</div>
                        <p className="text-xs text-muted-foreground">
                          Récapitulatifs et alertes importantes par courriel
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.emailNotificationsEnabled}
                      onCheckedChange={(checked) =>
                        handleUpdatePreference('emailNotificationsEnabled', checked)
                      }
                      disabled={isSavingPreferences}
                    />
                  </div>

                  {/* Bureau */}
                  <div className="flex items-center justify-between p-4 hover:bg-muted/3 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-background border shadow-sm">
                        <Monitor className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Notifications bureau</div>
                        <p className="text-xs text-muted-foreground">
                          Alertes système en temps réel sur votre ordinateur
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {preferences.desktopNotificationsEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!('Notification' in window)) {
                              toast.error('Non supporté')
                              return
                            }
                            let currentPermission = Notification.permission
                            if (currentPermission === 'default') {
                              const result = await requestPermission()
                              if (result !== 'granted') return
                              currentPermission = 'granted'
                            }
                            if (currentPermission === 'granted') {
                              new Notification('🔔 Test Chronodil', {
                                body: 'Les notifications de bureau sont actives !',
                                icon: '/assets/media/chronodil-icon.svg',
                              })
                            }
                          }}
                          className="h-8 text-xs text-primary hover:bg-primary/5"
                        >
                          Tester
                        </Button>
                      )}
                      <Switch
                        checked={preferences.desktopNotificationsEnabled}
                        onCheckedChange={(checked) =>
                          handleUpdatePreference('desktopNotificationsEnabled', checked)
                        }
                        disabled={isSavingPreferences}
                      />
                    </div>
                  </div>

                  {/* Push */}
                  <div className="flex items-center justify-between p-4 hover:bg-muted/3 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-background border shadow-sm">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Notifications push</div>
                        <p className="text-xs text-muted-foreground">
                          Restez informé même quand l'onglet est fermé
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {pushSubscription.isSubscribed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const result = await sendTestPushNotification({})
                            if (result?.data?.success) toast.success('Test envoyé')
                          }}
                          className="h-8 text-xs text-primary hover:bg-primary/5"
                        >
                          Tester
                        </Button>
                      )}
                      <Switch
                        checked={pushSubscription.isSubscribed}
                        onCheckedChange={async (checked) => {
                          if (checked) await pushSubscription.subscribe()
                          else await pushSubscription.unsubscribe()
                        }}
                        disabled={pushSubscription.isLoading || !pushSubscription.isSupported}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section détaillée des sons (si activé) */}
            {preferences.notificationSoundEnabled && (
              <div className="pt-4">
                <div className="grid gap-6 md:grid-cols-5 items-start">
                  {/* Liste des sons - Colonne de gauche (3/5) */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="px-1">
                      <h3 className="font-bold text-base">Son de notification</h3>
                      <p className="text-xs text-muted-foreground">
                        Choisissez l'alerte sonore qui vous convient
                      </p>
                    </div>

                    <Card className="shadow-none overflow-hidden bg-muted/5 border-none">
                      <div className="max-h-[350px] overflow-y-auto p-1.5 custom-scrollbar">
                        <RadioGroup
                          value={preferences?.notificationSoundType ?? 'new-notification-3-398649'}
                          onValueChange={(value) => {
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('notification-sounds-default', value)
                            }
                            handleUpdatePreference('notificationSoundType', value)
                          }}
                          disabled={isSavingPreferences}
                          className="grid grid-cols-1 gap-1"
                        >
                          {isLoadingSounds ? (
                            <div className="flex flex-col items-center gap-2 p-8">
                              <Spinner className="size-5" />
                              <p className="text-xs text-muted-foreground">Chargement...</p>
                            </div>
                          ) : availableSounds.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              <VolumeX className="h-8 w-8 mx-auto mb-2 opacity-20" />
                              <p className="text-xs">Aucun son trouvé</p>
                            </div>
                          ) : (
                            availableSounds.map((sound) => (
                              <SoundOptionCard
                                key={sound.id}
                                sound={sound}
                                isSelected={
                                  (preferences?.notificationSoundType ??
                                    'new-notification-3-398649') === sound.id
                                }
                                onTest={() => testSound(sound)}
                                disabled={isSavingPreferences}
                              />
                            ))
                          )}
                        </RadioGroup>
                      </div>
                    </Card>
                  </div>

                  {/* Volume - Colonne de droite (2/5) */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="px-1">
                      <h3 className="font-bold text-base text-right md:text-left">Volume</h3>
                      <p className="text-xs text-muted-foreground text-right md:text-left">
                        Intensité des alertes
                      </p>
                    </div>

                    <Card className="p-6 shadow-none bg-muted/5 border-none">
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <div
                            className={`p-4 rounded-full transition-all duration-300 ${localVolume === 0 ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}
                          >
                            {localVolume === 0 ? (
                              <VolumeX className="h-8 w-8" />
                            ) : localVolume < 33 ? (
                              <Volume1 className="h-8 w-8" />
                            ) : (
                              <Volume2 className="h-8 w-8" />
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-4xl font-black tracking-tighter tabular-nums text-foreground">
                              {Math.round(localVolume)}
                            </span>
                            <span className="text-sm font-bold text-muted-foreground ml-1">%</span>
                          </div>
                        </div>

                        <div className="px-2">
                          <Slider
                            value={[localVolume]}
                            onValueChange={([v]) => setLocalVolume(v)}
                            onValueCommit={([v]) => handleVolumeCommit(v)}
                            min={0}
                            max={100}
                            step={1}
                            className="cursor-pointer"
                          />
                        </div>

                        <div className="flex justify-between items-center bg-background p-2 rounded-lg border border-border/50">
                          <span className="text-[10px] font-bold text-muted-foreground px-2">
                            TESTER
                          </span>
                          <Button
                            size="sm"
                            onClick={async () => {
                              if (isTestingSound) return
                              setIsTestingSound(true)
                              const currentSound = availableSounds.find(
                                (s) => s.id === preferences?.notificationSoundType,
                              )
                              await testSound(currentSound || preferences?.notificationSoundType)
                              setIsTestingSound(false)
                            }}
                            className="h-8 px-4 rounded-md shadow-sm"
                          >
                            {isTestingSound ? (
                              <Spinner className="h-3 w-3" />
                            ) : (
                              <Volume2 className="h-3.5 w-3.5 mr-2" />
                            )}
                            Écouter
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog />
    </div>
  )
}
