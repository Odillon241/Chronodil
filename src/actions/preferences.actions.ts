"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

/**
 * Schéma de validation pour la mise à jour des préférences utilisateur
 */
const updatePreferencesSchema = z.object({
  enableTimesheetReminders: z.boolean().optional(),
  reminderTime: z.string().optional(),
  reminderDays: z.array(z.string()).optional(),
  weeklyGoal: z.number().min(1).max(168).optional(), // 1h minimum, 168h maximum (24h*7 jours)
  notificationSoundEnabled: z.boolean().optional(),
  notificationSoundType: z.enum(["default", "soft", "alert"]).optional(),
  notificationSoundVolume: z.number().min(0).max(1).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  desktopNotificationsEnabled: z.boolean().optional(),
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
        weeklyGoal: true,
        notificationSoundEnabled: true,
        notificationSoundType: true,
        notificationSoundVolume: true,
        emailNotificationsEnabled: true,
        desktopNotificationsEnabled: true,
      },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Set default values for reminderDays if not set
    const reminderDays = user.reminderDays && user.reminderDays.length > 0
      ? user.reminderDays
      : ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

    return {
      enableTimesheetReminders: user.enableTimesheetReminders,
      reminderTime: user.reminderTime,
      reminderDays,
      weeklyGoal: user.weeklyGoal,
      notificationSoundEnabled: user.notificationSoundEnabled,
      notificationSoundType: user.notificationSoundType,
      notificationSoundVolume: user.notificationSoundVolume,
      emailNotificationsEnabled: user.emailNotificationsEnabled,
      desktopNotificationsEnabled: user.desktopNotificationsEnabled,
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
        weeklyGoal: true,
        notificationSoundEnabled: true,
        notificationSoundType: true,
        notificationSoundVolume: true,
        emailNotificationsEnabled: true,
        desktopNotificationsEnabled: true,
      },
    });

    return {
      enableTimesheetReminders: user.enableTimesheetReminders,
      reminderTime: user.reminderTime,
      reminderDays: user.reminderDays,
      weeklyGoal: user.weeklyGoal,
      notificationSoundEnabled: user.notificationSoundEnabled,
      notificationSoundType: user.notificationSoundType,
      notificationSoundVolume: user.notificationSoundVolume,
      emailNotificationsEnabled: user.emailNotificationsEnabled,
      desktopNotificationsEnabled: user.desktopNotificationsEnabled,
    };
  });
