/**
 * Types TypeScript stricts pour les paramètres généraux
 */

// Types d'apparence
export type AccentColor = 'yellow-vibrant' | 'green-anis' | 'green-teal' | 'dark'
export type ViewDensity = 'compact' | 'normal' | 'comfortable'
export type ThemeMode = 'light' | 'dark' | 'system'

// Types de localisation
export type Language = 'fr' | 'en'
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
export type HourFormat = '12' | '24'

// Jours de la semaine
export type WeekDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

// Interface principale des paramètres généraux
export interface GeneralSettings {
  // Apparence
  darkModeEnabled: boolean
  accentColor: AccentColor
  viewDensity: ViewDensity
  fontSize: number

  // Localisation
  language: Language
  dateFormat: DateFormat
  hourFormat: HourFormat
  timezone: string

  // Accessibilité
  highContrast: boolean
  screenReaderMode: boolean
  reduceMotion: boolean

  // Heures silencieuses
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  quietHoursDays: WeekDay[]
}

// Type partiel pour les mises à jour
export type GeneralSettingsUpdate = Partial<GeneralSettings>

// Configuration des couleurs d'accent
export interface AccentColorConfig {
  value: AccentColor
  label: string
  class: string
  hex: string
}

// Configuration des formats de date
export interface DateFormatConfig {
  value: DateFormat
  label: string
  example: string
}

// Configuration des formats d'heure
export interface HourFormatConfig {
  value: HourFormat
  label: string
  example: string
}

// Configuration des fuseaux horaires
export interface TimezoneConfig {
  value: string
  label: string
  offset?: string
}

// Configuration de densité
export interface DensityConfig {
  value: ViewDensity
  label: string
  description: string
}

// Configuration de langue
export interface LanguageConfig {
  value: Language
  label: string
  flag: string
  nativeName: string
}

// Valeurs par défaut
export const DEFAULT_SETTINGS: GeneralSettings = {
  darkModeEnabled: true,
  accentColor: 'green-anis',
  viewDensity: 'normal',
  fontSize: 16,
  language: 'fr',
  dateFormat: 'DD/MM/YYYY',
  hourFormat: '24',
  timezone: 'Africa/Libreville',
  highContrast: false,
  screenReaderMode: false,
  reduceMotion: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  quietHoursDays: [],
}
