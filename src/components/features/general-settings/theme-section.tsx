'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Sun, Moon, Check } from 'lucide-react'
import type { GeneralSettings } from '@/types/settings.types'

interface ThemeSectionProps {
  settings: Pick<GeneralSettings, 'darkModeEnabled'>
  onUpdate: (key: string, value: boolean) => void
  isSaving: boolean
}

const themeOptions = [
  {
    value: false,
    label: 'Clair',
    description: 'Thème lumineux',
    icon: Sun,
    preview: 'bg-white border-gray-200',
  },
  {
    value: true,
    label: 'Sombre',
    description: 'Thème sombre',
    icon: Moon,
    preview: 'bg-gray-900 border-gray-700',
  },
]

/**
 * Section de sélection du thème (clair/sombre)
 * Avec prévisualisation live et icônes
 */
export function ThemeSection({ settings, onUpdate, isSaving }: ThemeSectionProps) {
  const handleThemeChange = (isDark: boolean) => {
    // Applique immédiatement au DOM pour feedback visuel
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(isDark ? 'dark' : 'light')

    // Sauvegarde côté serveur
    onUpdate('darkModeEnabled', isDark)
  }

  return (
    <Card className="overflow-hidden border shadow-none bg-muted/20">
      <CardHeader className="pb-3 border-b bg-background/50">
        <CardTitle className="text-lg font-bold">Thème</CardTitle>
        <CardDescription>Choisissez l'apparence de l'application</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3">
          {themeOptions.map((option) => {
            const isSelected = settings.darkModeEnabled === option.value
            const Icon = option.icon

            return (
              <button
                key={option.label}
                onClick={() => handleThemeChange(option.value)}
                disabled={isSaving}
                className={cn(
                  'relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[120px]',
                  'hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                    : 'border-border hover:border-muted-foreground/50',
                )}
                aria-pressed={isSelected}
                aria-label={`Thème ${option.label}`}
              >
                {/* Preview */}
                <div
                  className={cn(
                    'w-16 h-10 rounded-lg border-2 flex items-center justify-center',
                    option.preview,
                  )}
                >
                  <Icon
                    className={cn('h-5 w-5', option.value ? 'text-yellow-400' : 'text-yellow-500')}
                  />
                </div>

                {/* Label */}
                <div className="text-center">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>

                {/* Check indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 p-0.5 rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
