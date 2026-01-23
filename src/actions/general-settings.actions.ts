'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { actionClient } from '@/lib/safe-action'
import { z } from 'zod'
import {
  generalSettingsSchema,
  DEFAULT_GENERAL_SETTINGS,
  VALID_TIMEZONES,
} from '@/lib/validations/general-settings'

// Re-export du type pour utilisation côté client
export type { GeneralSettingsInput } from '@/lib/validations/general-settings'

/**
 * Récupère les paramètres généraux de l'utilisateur
 */
export const getGeneralSettings = actionClient.schema(z.object({})).action(async () => {
  const session = await getSession()

  if (!session) {
    throw new Error('Non authentifié')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      // Apparence
      darkModeEnabled: true,
      accentColor: true,
      viewDensity: true,
      fontSize: true,

      // Localisation
      language: true,
      dateFormat: true,
      hourFormat: true,
      timezone: true,

      // Accessibilité
      highContrast: true,
      screenReaderMode: true,
      reduceMotion: true,

      // Heures silencieuses
      quietHoursEnabled: true,
      quietHoursStart: true,
      quietHoursEnd: true,
      quietHoursDays: true,
    },
  })

  if (!user) {
    throw new Error('Utilisateur non trouvé')
  }

  return user
})

/**
 * Met à jour les paramètres généraux de l'utilisateur
 */
export const updateGeneralSettings = actionClient
  .schema(generalSettingsSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    // Validation supplémentaire du timezone si fourni
    if (parsedInput.timezone) {
      const isValidTimezone =
        VALID_TIMEZONES.includes(parsedInput.timezone as (typeof VALID_TIMEZONES)[number]) ||
        /^[A-Za-z_]+\/[A-Za-z_]+$/.test(parsedInput.timezone) ||
        parsedInput.timezone === 'UTC' ||
        parsedInput.timezone.startsWith('Etc/')

      if (!isValidTimezone) {
        throw new Error('Fuseau horaire invalide')
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: parsedInput,
      select: {
        // Apparence
        darkModeEnabled: true,
        accentColor: true,
        viewDensity: true,
        fontSize: true,

        // Localisation
        language: true,
        dateFormat: true,
        hourFormat: true,
        timezone: true,

        // Accessibilité
        highContrast: true,
        screenReaderMode: true,
        reduceMotion: true,

        // Heures silencieuses
        quietHoursEnabled: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        quietHoursDays: true,
      },
    })

    return user
  })

/**
 * Réinitialise les paramètres généraux aux valeurs par défaut
 */
export const resetGeneralSettings = actionClient.schema(z.object({})).action(async () => {
  const session = await getSession()

  if (!session) {
    throw new Error('Non authentifié')
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: DEFAULT_GENERAL_SETTINGS,
    select: {
      // Apparence
      darkModeEnabled: true,
      accentColor: true,
      viewDensity: true,
      fontSize: true,

      // Localisation
      language: true,
      dateFormat: true,
      hourFormat: true,
      timezone: true,

      // Accessibilité
      highContrast: true,
      screenReaderMode: true,
      reduceMotion: true,

      // Heures silencieuses
      quietHoursEnabled: true,
      quietHoursStart: true,
      quietHoursEnd: true,
      quietHoursDays: true,
    },
  })

  return user
})
