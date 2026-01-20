'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
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
  Settings2,
} from 'lucide-react'
import {
  getGeneralSettings,
  updateGeneralSettings,
  resetGeneralSettings,
} from '@/actions/general-settings.actions'
import { useConfirmationDialog } from '@/hooks/use-confirmation-dialog'

// Configuration des couleurs d'accent
const accentColors = [
  { value: 'yellow-vibrant', label: 'Jaune vif', class: 'bg-[#F8E800]' },
  { value: 'green-anis', label: 'Vert anis', class: 'bg-[#95C11F]' },
  { value: 'green-teal', label: 'Vert sarcelle', class: 'bg-[#39837A]' },
  { value: 'dark', label: 'Sombre', class: 'bg-[#2C2C2C]' },
]

// Configuration des formats de date
const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'JJ/MM/AAAA', example: '23/10/2025' },
  { value: 'MM/DD/YYYY', label: 'MM/JJ/AAAA', example: '10/23/2025' },
  { value: 'YYYY-MM-DD', label: 'AAAA-MM-JJ', example: '2025-10-23' },
]

// Configuration des formats d'heure
const hourFormats = [
  { value: '24', label: '24 heures', example: '14:30' },
  { value: '12', label: '12 heures', example: '02:30 PM' },
]

// Fuseaux horaires
const timezones = [
  { value: 'Africa/Libreville', label: 'Libreville (WAT)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/London', label: 'Londres (GMT)' },
  { value: 'America/New_York', label: 'New York (EST)' },
]

// Densités d'affichage
const densityOptions = [
  { value: 'compact', label: 'Compact', description: "Moins d'espace" },
  { value: 'normal', label: 'Normal', description: 'Par défaut' },
  { value: 'comfortable', label: 'Confortable', description: "Plus d'espace" },
]

export default function GeneralPage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  const [settings, setSettings] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [localFontSize, setLocalFontSize] = useState(16)
  const [isDetecting, setIsDetecting] = useState(false)

  const validAccentColors = accentColors.map((c) => c.value)
  const colorMigrationMap: Record<string, string> = {
    'rusty-red': 'green-anis',
    'ou-crimson': 'green-teal',
    'powder-blue': 'green-anis',
    'golden-orange': 'yellow-vibrant',
  }

  const normalizeAccentColor = (color: string | null | undefined): string => {
    if (!color) return 'green-anis'
    if (validAccentColors.includes(color)) return color
    return colorMigrationMap[color] || 'green-anis'
  }

  const applySettingsToUI = (s: any) => {
    if (typeof window === 'undefined' || !s) return
    const root = document.documentElement

    if (s.theme) {
      const isDark =
        s.theme === 'dark' ||
        (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.classList.remove('light', 'dark')
      root.classList.add(isDark ? 'dark' : 'light')
    }
    if (s.accentColor) {
      root.setAttribute('data-accent', normalizeAccentColor(s.accentColor))
    }
    if (s.viewDensity) {
      root.setAttribute('data-density', s.viewDensity)
    }
    if (s.fontSize) {
      root.style.fontSize = `${s.fontSize}px`
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getGeneralSettings({})
        if (result?.data) {
          setSettings(result.data)
          setLocalFontSize(result.data.fontSize || 16)
          applySettingsToUI(result.data)
        }
      } catch {
        toast.error('Erreur lors du chargement')
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpdate = async (key: string, value: any) => {
    setIsSaving(true)
    try {
      const result = await updateGeneralSettings({ [key]: value })
      if (result?.data) {
        setSettings(result.data)
        applySettingsToUI(result.data)
        window.dispatchEvent(new CustomEvent('settings-updated'))
        toast.success('Paramètre enregistré')
      } else if (result?.serverError) {
        toast.error(result.serverError)
      }
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    await showConfirmation({
      title: 'Réinitialiser les paramètres',
      description: 'Tous les paramètres généraux seront remis aux valeurs par défaut.',
      confirmText: 'Réinitialiser',
      cancelText: 'Annuler',
      variant: 'destructive',
      onConfirm: async () => {
        setIsSaving(true)
        try {
          const result = await resetGeneralSettings({})
          if (result?.data) {
            setSettings(result.data)
            setLocalFontSize(result.data.fontSize || 16)
            applySettingsToUI(result.data)
            window.dispatchEvent(new CustomEvent('settings-updated'))
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

  const handleDetectLocalization = async () => {
    setIsDetecting(true)
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const lang = navigator.language.split('-')[0]
      const isEuropean = ['fr', 'de', 'es', 'it', 'pt'].includes(lang)

      await handleUpdate('timezone', timezone)
      await handleUpdate('dateFormat', isEuropean ? 'DD/MM/YYYY' : 'MM/DD/YYYY')
      await handleUpdate('hourFormat', isEuropean ? '24' : '12')
      toast.success('Paramètres régionaux détectés')
    } catch {
      toast.error('Erreur lors de la détection')
    } finally {
      setIsDetecting(false)
    }
  }

  const currentAccentColor = normalizeAccentColor(settings?.accentColor)

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
        <Card className="border-dashed">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-muted animate-pulse">
                <Settings2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-center gap-4">
                <Spinner className="size-6" />
                <p className="text-center text-muted-foreground">Chargement des paramètres...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Apparence */}
          <Card className="overflow-hidden border shadow-none bg-muted/20">
            <CardHeader className="pb-3 border-b bg-background/50">
              <CardTitle className="text-lg font-bold">Apparence</CardTitle>
              <CardDescription>Personnalisez l'apparence de l'application</CardDescription>
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
                          isSelected
                            ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                            : 'border-border hover:border-muted-foreground/50',
                        )}
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
                    onValueChange={(v) => {
                      document.documentElement.setAttribute('data-density', v)
                      handleUpdate('viewDensity', v)
                    }}
                  >
                    <SelectTrigger disabled={isSaving}>
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
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Ajustez la taille de la police pour une meilleure lisibilité
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card className="overflow-hidden border shadow-none bg-muted/20">
            <CardHeader className="pb-3 border-b bg-background/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Localisation</CardTitle>
                  <CardDescription>
                    Configurez votre langue, fuseau horaire et formats
                  </CardDescription>
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
                    <SelectTrigger disabled={isSaving}>
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
                    <SelectTrigger disabled={isSaving}>
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
                    <SelectTrigger disabled={isSaving}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {!timezones.find((tz) => tz.value === settings.timezone) &&
                        settings.timezone && (
                          <SelectItem value={settings.timezone}>{settings.timezone}</SelectItem>
                        )}
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accessibilité */}
          <Card className="overflow-hidden border shadow-none bg-muted/20">
            <CardHeader className="pb-3 border-b bg-background/50">
              <CardTitle className="text-lg font-bold">Accessibilité</CardTitle>
              <CardDescription>Options pour améliorer la lisibilité et le confort</CardDescription>
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
                    onCheckedChange={(v) => handleUpdate('highContrast', v)}
                    disabled={isSaving}
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
                    onCheckedChange={(v) => handleUpdate('reduceMotion', v)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmationDialog />
    </div>
  )
}
