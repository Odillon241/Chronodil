'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Moon, Clock, Bell, BellOff } from 'lucide-react'
import type { GeneralSettings, WeekDay } from '@/types/settings.types'
import { WEEKDAY_OPTIONS, type ValidWeekday } from '@/lib/validations/general-settings'

interface QuietHoursSectionProps {
  settings: Pick<
    GeneralSettings,
    'quietHoursEnabled' | 'quietHoursStart' | 'quietHoursEnd' | 'quietHoursDays'
  >
  onUpdate: (key: string, value: boolean | string | WeekDay[]) => void
  isSaving: boolean
}

/**
 * Section de configuration des heures silencieuses
 * Permet de définir des plages horaires sans notifications
 */
export function QuietHoursSection({ settings, onUpdate, isSaving }: QuietHoursSectionProps) {
  const handleDayToggle = (day: ValidWeekday) => {
    const currentDays = settings.quietHoursDays || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day]
    onUpdate('quietHoursDays', newDays as WeekDay[])
  }

  const isEnabled = settings.quietHoursEnabled

  return (
    <Card className="overflow-hidden border shadow-none bg-muted/20">
      <CardHeader className="pb-3 border-b bg-background/50">
        <CardTitle className="text-lg font-bold">Heures silencieuses</CardTitle>
        <CardDescription>Désactivez les notifications pendant certaines heures</CardDescription>
      </CardHeader>
      <CardContent className="p-0 bg-background/30">
        {/* Toggle principal */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-background border shadow-sm">
              {isEnabled ? (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Bell className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="font-semibold text-sm">Activer les heures silencieuses</div>
              <p className="text-xs text-muted-foreground">
                Pause des notifications pendant les heures définies
              </p>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={(v) => onUpdate('quietHoursEnabled', v)}
            disabled={isSaving}
            aria-label="Activer les heures silencieuses"
          />
        </div>

        {/* Configuration détaillée (visible uniquement si activé) */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            isEnabled ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          {/* Plage horaire */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Plage horaire</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiet-start" className="text-xs text-muted-foreground mb-1.5 block">
                  Début
                </Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={settings.quietHoursStart || '22:00'}
                  onChange={(e) => onUpdate('quietHoursStart', e.target.value)}
                  disabled={isSaving || !isEnabled}
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="quiet-end" className="text-xs text-muted-foreground mb-1.5 block">
                  Fin
                </Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={settings.quietHoursEnd || '07:00'}
                  onChange={(e) => onUpdate('quietHoursEnd', e.target.value)}
                  disabled={isSaving || !isEnabled}
                  className="font-mono"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Les notifications seront suspendues de {settings.quietHoursStart || '22:00'} à{' '}
              {settings.quietHoursEnd || '07:00'}
            </p>
          </div>

          {/* Jours de la semaine */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Jours actifs</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((day) => {
                const isActive = (settings.quietHoursDays || []).includes(day.value)
                return (
                  <button
                    key={day.value}
                    onClick={() => handleDayToggle(day.value)}
                    disabled={isSaving || !isEnabled}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-muted-foreground/50',
                    )}
                    aria-pressed={isActive}
                    aria-label={`${day.label} ${isActive ? 'activé' : 'désactivé'}`}
                  >
                    {day.short}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {(settings.quietHoursDays || []).length === 0
                ? 'Sélectionnez les jours où les heures silencieuses seront actives'
                : `Heures silencieuses actives ${(settings.quietHoursDays || []).length} jour(s) par semaine`}
            </p>
          </div>

          {/* Prévisualisation */}
          <div className="px-4 pb-4">
            <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <Moon className="h-4 w-4 text-primary" />
                <span className="font-medium">Résumé :</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(settings.quietHoursDays || []).length > 0 ? (
                  <>
                    Notifications désactivées de{' '}
                    <span className="font-mono font-medium">
                      {settings.quietHoursStart || '22:00'}
                    </span>{' '}
                    à{' '}
                    <span className="font-mono font-medium">
                      {settings.quietHoursEnd || '07:00'}
                    </span>{' '}
                    les{' '}
                    {(settings.quietHoursDays || [])
                      .map((d) => WEEKDAY_OPTIONS.find((opt) => opt.value === d)?.label)
                      .join(', ')}
                  </>
                ) : (
                  'Sélectionnez au moins un jour pour activer les heures silencieuses'
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
