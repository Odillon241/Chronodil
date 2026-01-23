import { z } from 'zod'

/**
 * Liste des fuseaux horaires IANA valides (les plus courants)
 */
export const VALID_TIMEZONES = [
  // Afrique
  'Africa/Libreville',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Nairobi',
  'Africa/Dakar',
  'Africa/Abidjan',
  'Africa/Douala',
  'Africa/Kinshasa',
  'Africa/Brazzaville',
  'Africa/Algiers',
  'Africa/Tunis',

  // Europe
  'Europe/Paris',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Zurich',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Prague',
  'Europe/Stockholm',
  'Europe/Oslo',
  'Europe/Copenhagen',
  'Europe/Helsinki',
  'Europe/Athens',
  'Europe/Lisbon',
  'Europe/Dublin',
  'Europe/Moscow',

  // Amérique
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'America/Toronto',
  'America/Montreal',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'America/Lima',
  'America/Bogota',
  'America/Santiago',

  // Asie
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Seoul',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Manila',
  'Asia/Taipei',
  'Asia/Riyadh',
  'Asia/Jerusalem',
  'Asia/Beirut',

  // Océanie
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Brisbane',
  'Pacific/Auckland',
  'Pacific/Fiji',

  // UTC
  'UTC',
  'Etc/GMT',
] as const

export type ValidTimezone = (typeof VALID_TIMEZONES)[number]

/**
 * Jours de la semaine valides
 */
export const VALID_WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

export type ValidWeekday = (typeof VALID_WEEKDAYS)[number]

/**
 * Schéma de validation pour les paramètres généraux
 */
export const generalSettingsSchema = z.object({
  // Apparence
  darkModeEnabled: z.boolean().optional(),
  accentColor: z.enum(['yellow-vibrant', 'green-anis', 'green-teal', 'dark']).optional(),
  viewDensity: z.enum(['compact', 'normal', 'comfortable']).optional(),
  fontSize: z.number().int().min(12).max(24).optional(),

  // Localisation
  language: z.enum(['fr', 'en']).optional(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  hourFormat: z.enum(['12', '24']).optional(),
  // Accepte les timezones valides ou tout timezone détecté automatiquement (format IANA)
  timezone: z
    .string()
    .refine(
      (val) => {
        // Accepte les timezones de notre liste ou tout format IANA valide
        if (VALID_TIMEZONES.includes(val as ValidTimezone)) return true
        // Vérifie que c'est un format IANA valide (Continent/Ville)
        return /^[A-Za-z_]+\/[A-Za-z_]+$/.test(val) || val === 'UTC' || val.startsWith('Etc/')
      },
      { message: 'Fuseau horaire invalide' },
    )
    .optional(),

  // Accessibilité
  highContrast: z.boolean().optional(),
  screenReaderMode: z.boolean().optional(),
  reduceMotion: z.boolean().optional(),

  // Heures silencieuses
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM invalide')
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM invalide')
    .optional(),
  quietHoursDays: z.array(z.enum(VALID_WEEKDAYS)).optional(),
})

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>

/**
 * Valeurs par défaut pour reset
 */
export const DEFAULT_GENERAL_SETTINGS = {
  darkModeEnabled: true,
  accentColor: 'green-anis' as const,
  viewDensity: 'normal' as const,
  fontSize: 16,
  language: 'fr' as const,
  dateFormat: 'DD/MM/YYYY' as const,
  hourFormat: '24' as const,
  timezone: 'Africa/Libreville',
  highContrast: false,
  screenReaderMode: false,
  reduceMotion: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  quietHoursDays: [] as string[],
}

/**
 * Configuration des fuseaux horaires pour l'UI
 */
export const TIMEZONE_OPTIONS = [
  // Afrique
  { value: 'Africa/Libreville', label: 'Libreville (WAT)', region: 'Afrique' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', region: 'Afrique' },
  { value: 'Africa/Douala', label: 'Douala (WAT)', region: 'Afrique' },
  { value: 'Africa/Kinshasa', label: 'Kinshasa (WAT)', region: 'Afrique' },
  { value: 'Africa/Brazzaville', label: 'Brazzaville (WAT)', region: 'Afrique' },
  { value: 'Africa/Dakar', label: 'Dakar (GMT)', region: 'Afrique' },
  { value: 'Africa/Abidjan', label: 'Abidjan (GMT)', region: 'Afrique' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', region: 'Afrique' },
  { value: 'Africa/Cairo', label: 'Le Caire (EET)', region: 'Afrique' },
  { value: 'Africa/Casablanca', label: 'Casablanca (WET)', region: 'Afrique' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', region: 'Afrique' },

  // Europe
  { value: 'Europe/Paris', label: 'Paris (CET)', region: 'Europe' },
  { value: 'Europe/London', label: 'Londres (GMT)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome (CET)', region: 'Europe' },
  { value: 'Europe/Brussels', label: 'Bruxelles (CET)', region: 'Europe' },
  { value: 'Europe/Zurich', label: 'Zurich (CET)', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscou (MSK)', region: 'Europe' },

  // Amérique
  { value: 'America/New_York', label: 'New York (EST)', region: 'Amérique' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)', region: 'Amérique' },
  { value: 'America/Chicago', label: 'Chicago (CST)', region: 'Amérique' },
  { value: 'America/Toronto', label: 'Toronto (EST)', region: 'Amérique' },
  { value: 'America/Montreal', label: 'Montréal (EST)', region: 'Amérique' },
  { value: 'America/Mexico_City', label: 'Mexico (CST)', region: 'Amérique' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', region: 'Amérique' },

  // Asie
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', region: 'Asie' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', region: 'Asie' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', region: 'Asie' },
  { value: 'Asia/Singapore', label: 'Singapour (SGT)', region: 'Asie' },
  { value: 'Asia/Dubai', label: 'Dubaï (GST)', region: 'Asie' },
  { value: 'Asia/Kolkata', label: 'Mumbai (IST)', region: 'Asie' },

  // Océanie
  { value: 'Australia/Sydney', label: 'Sydney (AEST)', region: 'Océanie' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)', region: 'Océanie' },

  // UTC
  { value: 'UTC', label: 'UTC', region: 'Universel' },
]

/**
 * Configuration des langues pour l'UI
 */
export const LANGUAGE_OPTIONS = [
  { value: 'fr' as const, label: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { value: 'en' as const, label: 'English', flag: '🇬🇧', nativeName: 'English' },
]

/**
 * Configuration des jours de la semaine pour l'UI
 */
export const WEEKDAY_OPTIONS = [
  { value: 'MONDAY' as const, label: 'Lundi', short: 'Lun' },
  { value: 'TUESDAY' as const, label: 'Mardi', short: 'Mar' },
  { value: 'WEDNESDAY' as const, label: 'Mercredi', short: 'Mer' },
  { value: 'THURSDAY' as const, label: 'Jeudi', short: 'Jeu' },
  { value: 'FRIDAY' as const, label: 'Vendredi', short: 'Ven' },
  { value: 'SATURDAY' as const, label: 'Samedi', short: 'Sam' },
  { value: 'SUNDAY' as const, label: 'Dimanche', short: 'Dim' },
]
