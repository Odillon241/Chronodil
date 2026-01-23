'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Languages, Check, Loader2 } from 'lucide-react'
import type { GeneralSettings, Language } from '@/types/settings.types'
import { LANGUAGE_OPTIONS } from '@/lib/validations/general-settings'

const LOCALE_COOKIE = 'NEXT_LOCALE'

interface LanguageSectionProps {
  settings: Pick<GeneralSettings, 'language'>
  onUpdate: (key: string, value: Language) => void
  isSaving: boolean
}

/**
 * Définit le cookie de locale côté client
 */
function setLocaleCookie(locale: Language) {
  const maxAge = 60 * 60 * 24 * 365 // 1 an
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; samesite=lax`
}

/**
 * Section de sélection de la langue
 * Avec drapeaux et noms natifs
 * Change le cookie NEXT_LOCALE et recharge la page
 */
export function LanguageSection({ settings, onUpdate, isSaving }: LanguageSectionProps) {
  const [isChanging, setIsChanging] = useState(false)

  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage === settings.language) return

    setIsChanging(true)

    // 1. Sauvegarder en base de données
    onUpdate('language', newLanguage)

    // 2. Définir le cookie de locale
    setLocaleCookie(newLanguage)

    // 3. Recharger la page pour appliquer la nouvelle langue
    // Petit délai pour laisser le temps à la sauvegarde de se faire
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <Card className="overflow-hidden border shadow-none bg-muted/20">
      <CardHeader className="pb-3 border-b bg-background/50">
        <CardTitle className="text-lg font-bold">Langue</CardTitle>
        <CardDescription>Choisissez la langue de l'interface</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Langue de l'application</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {LANGUAGE_OPTIONS.map((lang) => {
            const isSelected = settings.language === lang.value
            const isLoading = isChanging && !isSelected

            return (
              <button
                key={lang.value}
                onClick={() => handleLanguageChange(lang.value)}
                disabled={isSaving || isChanging}
                className={cn(
                  'relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-w-[140px]',
                  'hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                    : 'border-border hover:border-muted-foreground/50',
                )}
                aria-pressed={isSelected}
                aria-label={`Langue ${lang.label}`}
              >
                {/* Flag ou Loader */}
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-2xl" role="img" aria-label={lang.label}>
                    {lang.flag}
                  </span>
                )}

                {/* Label */}
                <div className="text-left">
                  <div className="font-medium text-sm">{lang.nativeName}</div>
                  <div className="text-xs text-muted-foreground">{lang.label}</div>
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
        {isChanging && (
          <p className="text-xs text-primary mt-3 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Changement de langue en cours...
          </p>
        )}
        {!isChanging && (
          <p className="text-xs text-muted-foreground mt-3">
            La page sera rechargée pour appliquer la nouvelle langue.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
