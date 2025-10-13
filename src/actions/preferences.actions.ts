"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

/**
 * REMARQUE: Ce fichier est actuellement désactivé car le modèle UserPreferences
 * n'existe pas dans le schéma Prisma. Les préférences de l'utilisateur sont
 * stockées directement dans le modèle User.
 *
 * Pour activer ces fonctionnalités, vous devez soit:
 * 1. Créer un modèle UserPreferences dans le schéma Prisma
 * 2. OU adapter ce code pour utiliser les champs du modèle User
 */

const updatePreferencesSchema = z.object({
  enableTimesheetReminders: z.boolean().optional(),
  reminderTime: z.string().optional(),
  reminderDays: z.array(z.string()).optional(),
});

/**
 * Récupère les préférences de l'utilisateur connecté
 */
export const getUserPreferences = actionClient
  .schema(z.object({}))
  .action(async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        enableTimesheetReminders: true,
        reminderTime: true,
        reminderDays: true,
      },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    return {
      enableTimesheetReminders: user.enableTimesheetReminders,
      reminderTime: user.reminderTime,
      reminderDays: user.reminderDays,
    };
  });

/**
 * Met à jour les préférences de l'utilisateur connecté
 */
export const updateUserPreferences = actionClient
  .schema(updatePreferencesSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: parsedInput,
      select: {
        id: true,
        enableTimesheetReminders: true,
        reminderTime: true,
        reminderDays: true,
      },
    });

    return {
      enableTimesheetReminders: user.enableTimesheetReminders,
      reminderTime: user.reminderTime,
      reminderDays: user.reminderDays,
    };
  });
