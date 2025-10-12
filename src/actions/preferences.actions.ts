"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { nanoid } from "nanoid";

const updatePreferencesSchema = z.object({
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

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // Si les préférences n'existent pas, les créer avec les valeurs par défaut
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          id: nanoid(),
          userId: session.user.id,
          notificationSoundEnabled: true,
          notificationSoundType: "default",
          notificationSoundVolume: 0.5,
          emailNotificationsEnabled: true,
          desktopNotificationsEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return preferences;
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

    // Vérifier si les préférences existent
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // Si elles n'existent pas, les créer
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          id: nanoid(),
          userId: session.user.id,
          notificationSoundEnabled: parsedInput.notificationSoundEnabled ?? true,
          notificationSoundType: parsedInput.notificationSoundType ?? "default",
          notificationSoundVolume: parsedInput.notificationSoundVolume ?? 0.5,
          emailNotificationsEnabled: parsedInput.emailNotificationsEnabled ?? true,
          desktopNotificationsEnabled: parsedInput.desktopNotificationsEnabled ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      // Sinon, les mettre à jour
      preferences = await prisma.userPreferences.update({
        where: { userId: session.user.id },
        data: {
          ...parsedInput,
          updatedAt: new Date(),
        },
      });
    }

    return preferences;
  });

/**
 * Réinitialise les préférences de notification aux valeurs par défaut
 */
export const resetNotificationPreferences = actionClient
  .schema(z.object({}))
  .action(async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        id: nanoid(),
        userId: session.user.id,
        notificationSoundEnabled: true,
        notificationSoundType: "default",
        notificationSoundVolume: 0.5,
        emailNotificationsEnabled: true,
        desktopNotificationsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        notificationSoundEnabled: true,
        notificationSoundType: "default",
        notificationSoundVolume: 0.5,
        emailNotificationsEnabled: true,
        desktopNotificationsEnabled: true,
        updatedAt: new Date(),
      },
    });

    return preferences;
  });

