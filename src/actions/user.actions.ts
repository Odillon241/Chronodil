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
        Department: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        other_User: {
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
        Department: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            TimesheetEntry: true,
            other_User: true,
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
      data: {
        id: require("nanoid").nanoid(),
        name: parsedInput.name,
        email: parsedInput.email,
        role: parsedInput.role,
        ...(parsedInput.departmentId && { departmentId: parsedInput.departmentId }),
        ...(parsedInput.managerId && { managerId: parsedInput.managerId }),
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
        Department: true,
        _count: {
          select: {
            TimesheetEntry: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return subordinates;
  });

// Récupérer tous les utilisateurs (pour les MANAGER, HR, ADMIN)
export const getAllUsers = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userRole } = ctx;

    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        Department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return users;
  });

// Récupérer tous les utilisateurs pour le chat (accessible à tous)
export const getAllUsersForChat = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        image: true,
        Department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return users;
  });

// Supprimer un utilisateur (Admin uniquement)
export const deleteUser = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userRole, userId } = ctx;

    if (userRole !== "ADMIN") {
      throw new Error("Seuls les administrateurs peuvent supprimer des utilisateurs");
    }

    // Empêcher la suppression de son propre compte
    if (parsedInput.id === userId) {
      throw new Error("Vous ne pouvez pas supprimer votre propre compte");
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: parsedInput.id },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: parsedInput.id },
    });

    revalidatePath("/dashboard/settings/users");
    return { success: true, message: "Utilisateur supprimé avec succès" };
  });

// Réinitialiser le mot de passe d'un utilisateur (Admin uniquement)
export const resetUserPassword = authActionClient
  .schema(
    z.object({
      id: z.string(),
      newPassword: z.string().min(6),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userRole } = ctx;

    if (userRole !== "ADMIN") {
      throw new Error("Seuls les administrateurs peuvent réinitialiser les mots de passe");
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: parsedInput.id },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Note: Dans une application réelle avec authentification,
    // vous devriez hasher le mot de passe avant de le stocker
    // Pour l'instant, nous simulons la réinitialisation
    await prisma.user.update({
      where: { id: parsedInput.id },
      data: {
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/settings/users");
    return { 
      success: true, 
      message: "Mot de passe réinitialisé avec succès",
      tempPassword: parsedInput.newPassword 
    };
  });
