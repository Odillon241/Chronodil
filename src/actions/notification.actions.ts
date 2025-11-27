"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

export const getMyNotifications = actionClient
  .schema(z.object({ limit: z.number().optional() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: parsedInput.limit || 50,
    });

    return notifications;
  });

export const markAsRead = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const notification = await prisma.notification.findUnique({
      where: { id: parsedInput.id },
    });

    if (!notification || notification.userId !== session.user.id) {
      throw new Error("Notification non trouvée");
    }

    await prisma.notification.update({
      where: { id: parsedInput.id },
      data: { isRead: true },
    });

    return { success: true };
  });

export const markAllAsRead = actionClient
  .schema(z.object({}))
  .action(async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  });

export const deleteNotification = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const notification = await prisma.notification.findUnique({
      where: { id: parsedInput.id },
    });

    if (!notification || notification.userId !== session.user.id) {
      throw new Error("Notification non trouvée");
    }

    await prisma.notification.delete({
      where: { id: parsedInput.id },
    });

    return { success: true };
  });

export const getUnreadCount = actionClient
  .schema(z.object({}))
  .action(async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return count;
  });

// ========================================
// HEURES CALMES (QUIET HOURS)
// ========================================

const quietHoursSchema = z.object({
  enabled: z.boolean(),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format invalide (HH:MM)"),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format invalide (HH:MM)"),
  days: z.array(z.string()).optional(), // Jours de la semaine (0-6, 0 = Dimanche)
});

/**
 * Récupérer les préférences d'heures calmes de l'utilisateur
 */
export const getQuietHoursSettings = actionClient
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
        quietHoursEnabled: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        quietHoursDays: true,
      },
    });

    return {
      enabled: user?.quietHoursEnabled ?? false,
      startTime: user?.quietHoursStart ?? "22:00",
      endTime: user?.quietHoursEnd ?? "07:00",
      days: user?.quietHoursDays ?? [],
    };
  });

/**
 * Mettre à jour les préférences d'heures calmes
 */
export const updateQuietHoursSettings = actionClient
  .schema(quietHoursSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        quietHoursEnabled: parsedInput.enabled,
        quietHoursStart: parsedInput.startTime,
        quietHoursEnd: parsedInput.endTime,
        quietHoursDays: parsedInput.days || [],
      },
    });

    return { success: true };
  });

/**
 * Vérifier si on est actuellement dans les heures calmes
 * Cette fonction peut être appelée côté client pour décider d'afficher les notifications
 */
export const isInQuietHours = actionClient
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
        quietHoursEnabled: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        quietHoursDays: true,
        timezone: true,
      },
    });

    if (!user?.quietHoursEnabled) {
      return { isQuiet: false };
    }

    // Obtenir l'heure actuelle dans le fuseau horaire de l'utilisateur
    const now = new Date();
    const userTimezone = user.timezone || "Africa/Libreville";

    // Convertir en heure locale de l'utilisateur
    const options: Intl.DateTimeFormatOptions = {
      timeZone: userTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    const currentTimeStr = new Intl.DateTimeFormat("fr-FR", options).format(now);
    const currentTime = currentTimeStr.replace(":", "");

    // Obtenir le jour de la semaine
    const dayOptions: Intl.DateTimeFormatOptions = {
      timeZone: userTimezone,
      weekday: "short",
    };
    const currentDay = new Intl.DateTimeFormat("en-US", dayOptions).format(now).toLowerCase();
    const dayMap: Record<string, string> = {
      sun: "0",
      mon: "1",
      tue: "2",
      wed: "3",
      thu: "4",
      fri: "5",
      sat: "6",
    };
    const currentDayNum = dayMap[currentDay];

    // Vérifier si c'est un jour où les heures calmes sont actives
    if (user.quietHoursDays && user.quietHoursDays.length > 0) {
      if (!user.quietHoursDays.includes(currentDayNum)) {
        return { isQuiet: false };
      }
    }

    // Convertir les heures en format numérique pour comparaison
    const startTime = user.quietHoursStart.replace(":", "");
    const endTime = user.quietHoursEnd.replace(":", "");

    // Gérer le cas où les heures calmes passent minuit
    if (startTime > endTime) {
      // Ex: 22:00 - 07:00
      if (currentTime >= startTime || currentTime < endTime) {
        return { isQuiet: true };
      }
    } else {
      // Ex: 13:00 - 14:00 (pause déjeuner)
      if (currentTime >= startTime && currentTime < endTime) {
        return { isQuiet: true };
      }
    }

    return { isQuiet: false };
  });
