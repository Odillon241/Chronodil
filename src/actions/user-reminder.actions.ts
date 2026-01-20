"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReminderActivityType } from "@/generated/prisma/enums";

// =======================================
// Schémas de validation
// =======================================

const daySchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

const createReminderSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  activityType: z.nativeEnum(ReminderActivityType),
  time: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Format d'heure invalide (HH:MM)"
    ),
  days: z.array(daySchema).min(1, "Sélectionnez au moins un jour"),
  isEnabled: z.boolean().optional().default(true),
});

const updateReminderSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Le nom est requis").max(100).optional(),
  activityType: z.nativeEnum(ReminderActivityType).optional(),
  time: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Format d'heure invalide (HH:MM)"
    )
    .optional(),
  days: z.array(daySchema).min(1, "Sélectionnez au moins un jour").optional(),
  isEnabled: z.boolean().optional(),
});

const deleteReminderSchema = z.object({
  id: z.string().cuid(),
});

const toggleReminderSchema = z.object({
  id: z.string().cuid(),
});

// =======================================
// Actions CRUD
// =======================================

/**
 * Récupérer tous les rappels de l'utilisateur
 */
export const getUserReminders = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const reminders = await prisma.userReminder.findMany({
      where: { userId },
      orderBy: [{ activityType: "asc" }, { createdAt: "desc" }],
    });

    return reminders;
  });

/**
 * Créer un nouveau rappel
 */
export const createReminder = authActionClient
  .schema(createReminderSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { name, activityType, time, days, isEnabled } = parsedInput;

    const reminder = await prisma.userReminder.create({
      data: {
        userId,
        name,
        activityType,
        time,
        days,
        isEnabled,
      },
    });

    revalidatePath("/dashboard/settings/reminders");

    return {
      success: true,
      reminder,
    };
  });

/**
 * Mettre à jour un rappel existant
 */
export const updateReminder = authActionClient
  .schema(updateReminderSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id, ...updateData } = parsedInput;

    // Vérifier que le rappel appartient à l'utilisateur
    const existingReminder = await prisma.userReminder.findFirst({
      where: { id, userId },
    });

    if (!existingReminder) {
      throw new Error("Rappel non trouvé");
    }

    const reminder = await prisma.userReminder.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard/settings/reminders");

    return {
      success: true,
      reminder,
    };
  });

/**
 * Supprimer un rappel
 */
export const deleteReminder = authActionClient
  .schema(deleteReminderSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id } = parsedInput;

    // Vérifier que le rappel appartient à l'utilisateur
    const existingReminder = await prisma.userReminder.findFirst({
      where: { id, userId },
    });

    if (!existingReminder) {
      throw new Error("Rappel non trouvé");
    }

    await prisma.userReminder.delete({
      where: { id },
    });

    revalidatePath("/dashboard/settings/reminders");

    return {
      success: true,
    };
  });

/**
 * Activer/Désactiver un rappel
 */
export const toggleReminder = authActionClient
  .schema(toggleReminderSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id } = parsedInput;

    // Vérifier que le rappel appartient à l'utilisateur
    const existingReminder = await prisma.userReminder.findFirst({
      where: { id, userId },
    });

    if (!existingReminder) {
      throw new Error("Rappel non trouvé");
    }

    const reminder = await prisma.userReminder.update({
      where: { id },
      data: {
        isEnabled: !existingReminder.isEnabled,
      },
    });

    revalidatePath("/dashboard/settings/reminders");

    return {
      success: true,
      reminder,
    };
  });

// =======================================
// Actions pour le Job Inngest
// =======================================

/**
 * Récupérer tous les rappels actifs pour une heure et un jour donnés
 * Utilisé par le job Inngest pour envoyer les notifications
 */
export const getActiveRemindersForTime = authActionClient
  .schema(
    z.object({
      time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      day: daySchema,
    })
  )
  .action(async ({ parsedInput }) => {
    const { time, day } = parsedInput;

    const reminders = await prisma.userReminder.findMany({
      where: {
        isEnabled: true,
        time,
        days: { has: day },
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            emailNotificationsEnabled: true,
            desktopNotificationsEnabled: true,
          },
        },
      },
    });

    return reminders;
  });

// =======================================
// Migration des anciens rappels
// =======================================

/**
 * Migrer les anciennes préférences de rappels vers le nouveau système
 * À exécuter une seule fois après la migration
 */
export const migrateOldReminders = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    // Récupérer les anciennes préférences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        enableTimesheetReminders: true,
        reminderTime: true,
        reminderDays: true,
      },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérifier si un rappel de type TIMESHEET existe déjà
    const existingTimesheet = await prisma.userReminder.findFirst({
      where: {
        userId,
        activityType: "TIMESHEET",
      },
    });

    if (existingTimesheet) {
      return {
        success: true,
        message: "Migration déjà effectuée",
        migrated: false,
      };
    }

    // Créer le rappel à partir des anciennes préférences
    if (user.enableTimesheetReminders && user.reminderDays.length > 0) {
      await prisma.userReminder.create({
        data: {
          userId,
          name: "Rappel feuille de temps",
          activityType: "TIMESHEET",
          time: user.reminderTime || "17:00",
          days: user.reminderDays,
          isEnabled: user.enableTimesheetReminders,
        },
      });
    }

    revalidatePath("/dashboard/settings/reminders");

    return {
      success: true,
      message: "Migration effectuée avec succès",
      migrated: true,
    };
  });
