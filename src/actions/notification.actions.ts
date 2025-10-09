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
