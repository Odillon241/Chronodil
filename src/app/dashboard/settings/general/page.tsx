'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  RotateCcw,
  Palette,
  Type,
  LayoutGrid,
  Globe,
  Clock,
  Calendar,
  Eye,
  Zap,
  Check,
  Loader2,
  RefreshCw,
  Accessibility,
} from 'lucide-react'
import {
  getGeneralSettings,
  updateGeneralSettings,
  resetGeneralSettings,
} from '@/actions/general-settings.actions'
import { useConfirmationDialog } from '@/hooks/use-confirmation-dialog'
import { useSettingsSync, applySettingsToDOM } from '@/hooks/use-settings-sync'
import {
  GeneralSettingsSkeleton,
  LanguageSection,
  QuietHoursSection,
} from '@/components/features/general-settings'
import { TIMEZONE_OPTIONS } from '@/lib/validations/general-settings'
import type { GeneralSettings, AccentColor, ViewDensity, Language } from '@/types/settings.types'
import type { GeneralSettingsInput } from '@/lib/validations/general-settings'

// Configuration des couleurs d'accent
const accentColors = [
  { value: 'yellow-vibrant' as const, label: 'Jaune vif', class: 'bg-[#F8E800]', hex: '#F8E800' },
  { value: 'green-anis' as const, label: 'Vert anis', class: 'bg-[#95C11F]', hex: '#95C11F' },
  { value: 'green-teal' as const, label: 'Vert sarcelle', class: 'bg-[#39837A]', hex: '#39837A' },
  { value: 'dark' as const, label: 'Sombre', class: 'bg-[#2C2C2C]', hex: '#2C2C2C' },
] as const

// Configuration des formats de date
const dateFormats = [
  { value: 'DD/MM/YYYY' as const, label: 'JJ/MM/AAAA', example: '23/01/2026' },
  { value: 'MM/DD/YYYY' as const, label: 'MM/JJ/AAAA', example: '01/23/2026' },
  { value: 'YYYY-MM-DD' as const, label: 'AAAA-MM-JJ', example: '2026-01-23' },
] as const

// Configuration des formats d'heure
const hourFormats = [
  { value: '24' as const, label: '24 heures', example: '14:30' },
  { value: '12' as const, label: '12 heures', example: '02:30 PM' },
] as const

// Densités d'affichage
const densityOptions = [
  { value: 'compact' as const, label: 'Compact', description: "Moins d'espace" },
  { value: 'normal' as const, label: 'Normal', description: 'Par défaut' },
  { value: 'comfortable' as const, label: 'Confortable', description: "Plus d'espace" },
] as const

// Migration des anciennes couleurs
const colorMigrationMap: Record<string, AccentColor> = {
  'rusty-red': 'green-anis',
  'ou-crimson': 'green-teal',
  'powder-blue': 'green-anis',
  'golden-orange': 'yellow-vibrant',
}

const validAccentColors = accentColors.map((c) => c.value)

function normalizeAccentColor(color: string | null | undefined): AccentColor {
  if (!color) return 'green-anis'
  if (validAccentColors.includes(color as AccentColor)) return color as AccentColor
  return colorMigrationMap[color] || 'green-anis'
}

export default function GeneralPage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  const [settings, setSettings] = useState<GeneralSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [localFontSize, setLocalFontSize] = useState(16)
  const [isDetecting, setIsDetecting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  // Ref pour debounce
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdatesRef = useRef<Partial<GeneralSettings>>({})

  // Sync multi-onglets
  const { broadcastUpdate } = useSettingsSync(
    useCallback((newSettings: Partial<GeneralSettings>) => {
      setSettings((prev) => (prev ? { ...prev, ...newSettings } : null))
      applySettingsToDOM(newSettings)
    }, []),
  )

  // Charge les paramètres
  const loadSettings = useCallback(async () => {
    try {
      setLoadError(null)
      const result = await getGeneralSettings({})
      if (result?.data) {
        const normalizedSettings = {
          ...result.data,
          accentColor: normalizeAccentColor(result.data.accentColor),
        } as GeneralSettings
        setSettings(normalizedSettings)
        setLocalFontSize(result.data.fontSize || 16)
        applySettingsToDOM(normalizedSettings)
      }
    } catch (error) {
      setLoadError('Impossible de charger les paramètres')
      toast.error('Erreur lors du chargement des paramètres')
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Retry loading
  const handleRetry = async () => {
    setIsRetrying(true)
    await loadSettings()
    setIsRetrying(false)
  }

  // Mise à jour avec debounce
  const handleUpdate = useCallback(
    async (key: string, value: unknown) => {
      // Mise à jour optimiste locale
      setSettings((prev) => (prev ? { ...prev, [key]: value } : null))

      // Accumule les updates pour le debounce
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, [key]: value }

      // Clear le timeout précédent
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }

      // Debounce de 300ms
      updateTimeoutRef.current = setTimeout(async () => {
        const updates = pendingUpdatesRef.current as GeneralSettingsInput
        pendingUpdatesRef.current = {}

        setIsSaving(true)
        try {
          const result = await updateGeneralSettings(updates)
          if (result?.data) {
            const normalizedSettings = {
              ...result.data,
              accentColor: normalizeAccentColor(result.data.accentColor),
            } as GeneralSettings
            setSettings(normalizedSettings)
            applySettingsToDOM(normalizedSettings)
            broadcastUpdate(normalizedSettings)
            toast.success('Paramètres enregistrés')
          } else if (result?.serverError) {
            toast.error(result.serverError)
            // Revert en cas d'erreur
            await loadSettings()
          }
        } catch {
          toast.error('Erreur lors de la mise à jour')
          await loadSettings()
        } finally {
          setIsSaving(false)
        }
      }, 300)
    },
    [broadcastUpdate, loadSettings],
  )

  // Réinitialisation
  const handleReset = async () => {
    await showConfirmation({
      title: 'Réinitialiser les paramètres',
      description:
        'Tous les paramètres généraux seront remis aux valeurs par défaut :\n\n• Thème sombre\n• Couleur vert anis\n• Densité normale\n• Police 16px\n• Langue français\n• Fuseau horaire Libreville',
      confirmText: 'Réinitialiser',
      cancelText: 'Annuler',
      variant: 'destructive',
      onConfirm: async () => {
        setIsSaving(true)
        try {
          const result = await resetGeneralSettings({})
          if (result?.data) {
            const normalizedSettings = {
              ...result.data,
              accentColor: normalizeAccentColor(result.data.accentColor),
            } as GeneralSettings
            setSettings(normalizedSettings)
            setLocalFontSize(result.data.fontSize || 16)
            applySettingsToDOM(normalizedSettings)
            broadcastUpdate(normalizedSettings)
            toast.success('Paramètres réinitialisés')
          }
        } catch {
          toast.error('Erreur lors de la réinitialisation')
        } finally {
          setIsSaving(false)
        }
      },
    })
  }

  // Détection automatique de la localisation
  const handleDetectLocalization = async () => {
    setIsDetecting(true)
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const lang = navigator.language.split('-')[0]
      const isEuropean = ['fr', 'de', 'es', 'it', 'pt'].includes(lang)

      // Batch updates
      const updates = {
        timezone,
        dateFormat: isEuropean ? ('DD/MM/YYYY' as const) : ('MM/DD/YYYY' as const),
        hourFormat: isEuropean ? ('24' as const) : ('12' as const),
        language: (lang === 'en' ? 'en' : 'fr') as Language,
      }

      setSettings((prev) => (prev ? { ...prev, ...updates } : null))

      const result = await updateGeneralSettings(updates)
      if (result?.data) {
        const normalizedSettings = {
          ...result.data,
          accentColor: normalizeAccentColor(result.data.accentColor),
        } as GeneralSettings
        setSettings(normalizedSettings)
        applySettingsToDOM(normalizedSettings)
        broadcastUpdate(normalizedSettings)
        toast.success('Paramètres régionaux détectés et appliqués')
      }
    } catch {
      toast.error('Erreur lors de la détection')
    } finally {
      setIsDetecting(false)
    }
  }

  const currentAccentColor = settings ? normalizeAccentColor(settings.accentColor) : 'green-anis'

  // État d'erreur avec retry
  if (loadError && !settings) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Paramètres généraux</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Personnalisez l'apparence, la langue et l'accessibilité
          </p>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="p-4 rounded-full bg-destructive/10">
                <RefreshCw className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{loadError}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Vérifiez votre connexion et réessayez
                </p>
              </div>
              <Button onClick={handleRetry} disabled={isRetrying} className="mt-4">
                {isRetrying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Paramètres généraux</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Personnalisez l'apparence, la langue et l'accessibilité
        </p>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isSaving || !settings}
          size="sm"
          className="h-8 text-xs md:text-sm border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30 bg-destructive/5"
        >
          <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
          Réinitialiser
        </Button>
      </div>

      {!settings ? (
        <GeneralSettingsSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Section Apparence */}
          <Card className="overflow-hidden border shadow-none bg-muted/20">
            <CardHeader className="pb-3 border-b bg-background/50">
              <CardTitle className="text-lg font-bold">Apparence</CardTitle>
              <CardDescription>Personnalisez les couleurs et la mise en page</CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-background/30">
              {/* Couleur d'accentuation */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <Label className="font-medium">Couleur d'accentuation</Label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {accentColors.map((color) => {
                    const isSelected = currentAccentColor === color.value
                    return (
                      <button
                        key={color.value}
                        onClick={() => {
                          document.documentElement.setAttribute('data-accent', color.value)
                          handleUpdate('accentColor', color.value)
                        }}
                        disabled={isSaving}
                        className={cn(
                          'relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                          'hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                          isSelected
                            ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                            : 'border-border hover:border-muted-foreground/50',
                        )}
                        aria-pressed={isSelected}
                        aria-label={`Couleur ${color.label}`}
                      >
                        <div
                          className={cn(
                            'h-10 w-10 rounded-full shadow-inner flex items-center justify-center',
                            color.class,
                          )}
                        >
                          {isSelected && (
                            <Check
                              className={cn(
                                'h-5 w-5',
                                color.value === 'dark' ? 'text-white' : 'text-gray-900',
                              )}
                            />
                          )}
                        </div>
                        <span className="text-xs font-medium">{color.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Densité et Taille de police */}
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
                {/* Densité */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Densité d'affichage</Label>
                  </div>
                  <Select
                    value={settings.viewDensity}
                    onValueChange={(v: ViewDensity) => {
                      document.documentElement.setAttribute('data-density', v)
                      handleUpdate('viewDensity', v)
                    }}
                  >
                    <SelectTrigger disabled={isSaving} aria-label="Sélectionner la densité">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {densityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span>{opt.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {opt.description}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Taille de police */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      <Label className="font-medium">Taille de police</Label>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{localFontSize}px</span>
                  </div>
                  <Slider
                    value={[localFontSize]}
                    onValueChange={([v]) => {
                      setLocalFontSize(v)
                      document.documentElement.style.fontSize = `${v}px`
                    }}
                    onValueCommit={([v]) => handleUpdate('fontSize', v)}
                    min={12}
                    max={20}
                    step={1}
                    disabled={isSaving}
                    className="cursor-pointer"
                    aria-label="Ajuster la taille de police"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Ajustez la taille de la police pour une meilleure lisibilité
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Langue */}
          <LanguageSection
            settings={{ language: settings.language as Language }}
            onUpdate={handleUpdate}
            isSaving={isSaving}
          />

          {/* Section Localisation */}
          <Card className="overflow-hidden border shadow-none bg-muted/20">
            <CardHeader className="pb-3 border-b bg-background/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Localisation</CardTitle>
                  <CardDescription>Configurez votre fuseau horaire et formats</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDetectLocalization}
                  disabled={isSaving || isDetecting}
                  className="gap-2"
                >
                  {isDetecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  Détecter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-background/30">
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
                {/* Format de date */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Format de date</Label>
                  </div>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(v) => handleUpdate('dateFormat', v)}
                  >
                    <SelectTrigger disabled={isSaving} aria-label="Format de date">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFormats.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          <span>{f.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{f.example}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Format d'heure */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Format d'heure</Label>
                  </div>
                  <Select
                    value={settings.hourFormat}
                    onValueChange={(v) => handleUpdate('hourFormat', v)}
                  >
                    <SelectTrigger disabled={isSaving} aria-label="Format d'heure">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hourFormats.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          <span>{f.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{f.example}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fuseau horaire */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Fuseau horaire</Label>
                  </div>
                  <Select
                    value={settings.timezone}
                    onValueChange={(v) => handleUpdate('timezone', v)}
                  >
                    <SelectTrigger disabled={isSaving} aria-label="Fuseau horaire">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {/* Timezone détecté (si pas dans la liste) */}
                      {!TIMEZONE_OPTIONS.find((tz) => tz.value === settings.timezone) &&
                        settings.timezone && (
                          <SelectItem value={settings.timezone}>
                            {settings.timezone} (détecté)
                          </SelectItem>
                        )}
                      {/* Groupés par région */}
                      {['Afrique', 'Europe', 'Amérique', 'Asie', 'Océanie', 'Universel'].map(
                        (region) => {
                          const regionTimezones = TIMEZONE_OPTIONS.filter(
                            (tz) => tz.region === region,
                          )
                          if (regionTimezones.length === 0) return null
                          return (
                            <SelectGroup key={region}>
                              <SelectLabel>{region}</SelectLabel>
                              {regionTimezones.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )
                        },
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Accessibilité */}
          <Card className="overflow-hidden border shadow-none bg-muted/20">
            <CardHeader className="pb-3 border-b bg-background/50">
              <CardTitle className="text-lg font-bold">Accessibilité</CardTitle>
              <CardDescription>
                Options pour améliorer la lisibilité et le confort visuel
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-background/30">
              <div className="divide-y divide-border/50">
                {/* Contraste élevé */}
                <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-background border shadow-sm">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Contraste élevé</div>
                      <p className="text-xs text-muted-foreground">
                        Augmente le contraste pour une meilleure lisibilité
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.highContrast}
                    onCheckedChange={(v) => {
                      document.documentElement.classList.toggle('high-contrast', v)
                      handleUpdate('highContrast', v)
                    }}
                    disabled={isSaving}
                    aria-label="Activer le contraste élevé"
                  />
                </div>

                {/* Mode lecteur d'écran */}
                <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-background border shadow-sm">
                      <Accessibility className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Mode lecteur d'écran</div>
                      <p className="text-xs text-muted-foreground">
                        Améliore la visibilité du focus et l'espacement du texte
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.screenReaderMode}
                    onCheckedChange={(v) => {
                      document.documentElement.classList.toggle('screen-reader-mode', v)
                      handleUpdate('screenReaderMode', v)
                    }}
                    disabled={isSaving}
                    aria-label="Activer le mode lecteur d'écran"
                  />
                </div>

                {/* Réduire les animations */}
                <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-background border shadow-sm">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Réduire les animations</div>
                      <p className="text-xs text-muted-foreground">
                        Limite les animations pour le confort visuel
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.reduceMotion}
                    onCheckedChange={(v) => {
                      document.documentElement.classList.toggle('reduce-motion', v)
                      handleUpdate('reduceMotion', v)
                    }}
                    disabled={isSaving}
                    aria-label="Réduire les animations"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Heures silencieuses */}
          <QuietHoursSection
            settings={{
              quietHoursEnabled: settings.quietHoursEnabled,
              quietHoursStart: settings.quietHoursStart,
              quietHoursEnd: settings.quietHoursEnd,
              quietHoursDays: settings.quietHoursDays,
            }}
            onUpdate={handleUpdate}
            isSaving={isSaving}
          />
        </div>
      )}

      <ConfirmationDialog />
    </div>
  )
}
