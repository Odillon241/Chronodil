"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schéma de validation pour les préférences de rappel
const reminderPreferencesSchema = z.object({
  enableTimesheetReminders: z.boolean(),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:MM)").optional(),
  reminderDays: z.array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])).optional(),
});

// Récupérer les préférences de rappel de l'utilisateur
export const getReminderPreferences = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

// Mettre à jour les préférences de rappel de l'utilisateur
export const updateReminderPreferences = authActionClient
  .schema(reminderPreferencesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { enableTimesheetReminders, reminderTime, reminderDays } = parsedInput;

    // Si les rappels sont désactivés, on peut mettre des valeurs par défaut
    const updateData = {
      enableTimesheetReminders,
      ...(enableTimesheetReminders && {
        reminderTime: reminderTime || "17:00",
        reminderDays: reminderDays || ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      }),
      ...(!enableTimesheetReminders && {
        reminderTime: null,
        reminderDays: [],
      }),
    };

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        enableTimesheetReminders: true,
        reminderTime: true,
        reminderDays: true,
      },
    });

    revalidatePath("/dashboard/settings");
    return {
      success: true,
      preferences: {
        enableTimesheetReminders: user.enableTimesheetReminders,
        reminderTime: user.reminderTime,
        reminderDays: user.reminderDays,
      },
    };
  });

// Récupérer tous les utilisateurs qui ont activé les rappels pour une heure donnée
export const getUsersForReminder = authActionClient
  .schema(z.object({
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  }))
  .action(async ({ parsedInput }) => {
    const { time, day } = parsedInput;

    const users = await prisma.user.findMany({
      where: {
        enableTimesheetReminders: true,
        reminderTime: time,
        reminderDays: {
          has: day,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        reminderTime: true,
        reminderDays: true,
      },
    });

    return users;
  });
