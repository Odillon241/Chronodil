"use server";
type ActionContext = {
  userId: string;
  userRole: string;
};

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Récupérer le profil de l'utilisateur connecté
export const getMyProfile = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    return user;
  });

// Mettre à jour le profil
export const updateMyProfile = authActionClient
  .schema(
    z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      avatar: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    const user = await prisma.user.update({
      where: { id: userId },
      data: parsedInput,
    });

    revalidatePath("/dashboard/settings");
    return user;
  });

// Récupérer tous les utilisateurs (Admin/HR)
export const getUsers = authActionClient
  .schema(
    z.object({
      role: z.enum(["EMPLOYEE", "MANAGER", "HR", "ADMIN"]).optional(),
      departmentId: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userRole } = ctx;

    if (!["HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    const users = await prisma.user.findMany({
      where: {
        ...(parsedInput.role && { role: parsedInput.role }),
        ...(parsedInput.departmentId && { departmentId: parsedInput.departmentId }),
      },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            timesheetEntries: true,
            subordinates: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return users;
  });

// Créer un utilisateur (Admin/HR)
export const createUser = authActionClient
  .schema(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["EMPLOYEE", "MANAGER", "HR", "ADMIN"]),
      departmentId: z.string().optional(),
      managerId: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userRole } = ctx;

    if (!["HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedInput.email },
    });

    if (existingUser) {
      throw new Error("Cet email est déjà utilisé");
    }

    const user = await prisma.user.create({
      data: parsedInput,
    });

    revalidatePath("/dashboard/team");
    return user;
  });

// Mettre à jour un utilisateur (Admin/HR)
export const updateUser = authActionClient
  .schema(
    z.object({
      id: z.string(),
      data: z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        role: z.enum(["EMPLOYEE", "MANAGER", "HR", "ADMIN"]).optional(),
        departmentId: z.string().optional(),
        managerId: z.string().optional(),
      }),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userRole } = ctx;

    if (!["HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    const user = await prisma.user.update({
      where: { id: parsedInput.id },
      data: parsedInput.data,
    });

    revalidatePath("/dashboard/team");
    return user;
  });

// Récupérer les notifications de l'utilisateur
export const getMyNotifications = authActionClient
  .schema(
    z.object({
      unreadOnly: z.boolean().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(parsedInput.unreadOnly && { isRead: false }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return notifications;
  });

// Marquer une notification comme lue
export const markNotificationAsRead = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    const notification = await prisma.notification.update({
      where: {
        id: parsedInput.id,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/dashboard");
    return notification;
  });

// Marquer toutes les notifications comme lues
export const markAllNotificationsAsRead = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  });

// Récupérer les membres de l'équipe (pour les managers)
export const getMyTeam = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userId, userRole } = ctx;

    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    const subordinates = await prisma.user.findMany({
      where: {
        managerId: userId,
      },
      include: {
        department: true,
        _count: {
          select: {
            timesheetEntries: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return subordinates;
  });
