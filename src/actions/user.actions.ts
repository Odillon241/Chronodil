"use server";
type ActionContext = {
  userId: string;
  userRole: string;
};

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { CacheTags } from "@/lib/cache";
import { createAuditLog, AuditActions, AuditEntities } from "@/lib/audit";

// Récupérer le profil de l'utilisateur connecté
export const getMyProfile = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        position: true,
        createdAt: true,
        updatedAt: true,
        Department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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
      position: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    const user = await prisma.user.update({
      where: { id: userId },
      data: parsedInput,
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidateTag(CacheTags.USERS, 'max');
    return user;
  });

// Récupérer tous les utilisateurs (Admin/HR/DIRECTEUR)
export const getUsers = authActionClient
  .schema(
    z.object({
      role: z.enum(["EMPLOYEE", "MANAGER", "HR", "DIRECTEUR", "ADMIN"]).optional(),
      departmentId: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userRole } = ctx;

    if (!["HR", "DIRECTEUR", "ADMIN"].includes(userRole)) {
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

// Créer un utilisateur (Admin/HR/DIRECTEUR)
export const createUser = authActionClient
  .schema(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["EMPLOYEE", "MANAGER", "HR", "DIRECTEUR", "ADMIN"]),
      departmentId: z.string().optional(),
      managerId: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userRole } = ctx;

    if (!["HR", "DIRECTEUR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    // DIRECTEUR ne peut pas créer d'ADMIN
    if (userRole === "DIRECTEUR" && parsedInput.role === "ADMIN") {
      throw new Error("Seul un ADMIN peut créer un compte ADMIN");
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedInput.email },
    });

    if (existingUser) {
      throw new Error("Cet email est déjà utilisé");
    }

    // Créer l'utilisateur via l'API Better Auth pour obtenir le bon hash
    const betterAuthUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const response = await fetch(`${betterAuthUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: parsedInput.email,
        password: parsedInput.password,
        name: parsedInput.name,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur lors de la création du compte: ${error}`);
    }

    // Récupérer l'utilisateur créé
    const createdUser = await prisma.user.findUnique({
      where: { email: parsedInput.email },
    });

    if (!createdUser) {
      throw new Error("Utilisateur créé mais non trouvé");
    }

    // Mettre à jour avec les informations supplémentaires
    const user = await prisma.user.update({
      where: { id: createdUser.id },
      data: {
        role: parsedInput.role,
        ...(parsedInput.departmentId && { departmentId: parsedInput.departmentId }),
        ...(parsedInput.managerId && { managerId: parsedInput.managerId }),
        emailVerified: true, // Marquer comme vérifié pour les utilisateurs créés par admin
      },
    });

    // Créer un log d'audit
    await createAuditLog({
      userId: ctx.userId,
      action: AuditActions.CREATE,
      entity: AuditEntities.USER,
      entityId: user.id,
      changes: {
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        managerId: user.managerId,
      },
    });

    revalidatePath("/dashboard/team");
    revalidatePath("/dashboard/settings/users");
    revalidateTag(CacheTags.USERS, 'max');
    return user;
  });

// Mettre à jour un utilisateur (Admin/HR/DIRECTEUR)
export const updateUser = authActionClient
  .schema(
    z.object({
      id: z.string(),
      data: z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        role: z.enum(["EMPLOYEE", "MANAGER", "HR", "DIRECTEUR", "ADMIN"]).optional(),
        departmentId: z.string().optional(),
        managerId: z.string().optional(),
      }),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userRole, userId } = ctx;

    if (!["HR", "DIRECTEUR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    // Récupérer l'utilisateur à modifier
    const targetUser = await prisma.user.findUnique({
      where: { id: parsedInput.id },
    });

    if (!targetUser) {
      throw new Error("Utilisateur non trouvé");
    }

    // DIRECTEUR ne peut pas modifier d'ADMIN ni créer d'ADMIN
    if (userRole === "DIRECTEUR") {
      if (targetUser.role === "ADMIN") {
        throw new Error("Seul un ADMIN peut modifier un compte ADMIN");
      }
      if (parsedInput.data.role === "ADMIN") {
        throw new Error("Seul un ADMIN peut créer un compte ADMIN");
      }
    }

    const user = await prisma.user.update({
      where: { id: parsedInput.id },
      data: parsedInput.data,
    });

    // Créer un log d'audit
    await createAuditLog({
      userId: userId,
      action: AuditActions.UPDATE,
      entity: AuditEntities.USER,
      entityId: parsedInput.id,
      changes: {
        previous: {
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          departmentId: targetUser.departmentId,
          managerId: targetUser.managerId,
        },
        new: parsedInput.data,
      },
    });

    revalidatePath("/dashboard/team");
    revalidatePath("/dashboard/settings/users");
    revalidateTag(CacheTags.USERS, 'max');
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

    if (!["MANAGER", "HR", "DIRECTEUR", "ADMIN"].includes(userRole)) {
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
            Task_Task_createdByToUser: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return subordinates;
  });

// Récupérer tous les utilisateurs (pour les MANAGER, HR, DIRECTEUR, ADMIN)
export const getAllUsers = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userRole } = ctx;

    if (!["MANAGER", "HR", "DIRECTEUR", "ADMIN"].includes(userRole)) {
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

    // Sauvegarder les informations de l'utilisateur avant suppression pour l'audit
    const userData = {
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: parsedInput.id },
    });

    // Créer un log d'audit
    await createAuditLog({
      userId: userId,
      action: AuditActions.DELETE,
      entity: AuditEntities.USER,
      entityId: parsedInput.id,
      changes: userData,
    });

    revalidatePath("/dashboard/settings/users");
    revalidateTag(CacheTags.USERS, 'max');
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
      include: { Account: true },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Créer un hash temporaire via Better Auth
    // 1. Créer un utilisateur temporaire avec le nouveau mot de passe
    const tempEmail = `temp_${Date.now()}_${Math.random().toString(36)}@temp.chronodil.local`;
    const betterAuthUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

    const response = await fetch(`${betterAuthUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: tempEmail,
        password: parsedInput.newPassword,
        name: "Temp User",
      }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la génération du hash");
    }

    // 2. Récupérer le hash
    const tempUser = await prisma.user.findUnique({
      where: { email: tempEmail },
      include: { Account: true },
    });

    if (!tempUser || !tempUser.Account || tempUser.Account.length === 0) {
      throw new Error("Erreur lors de la génération du hash");
    }

    const newPasswordHash = tempUser.Account[0].password;

    // 3. Mettre à jour le mot de passe de l'utilisateur cible
    const userAccount = user.Account.find(acc => acc.providerId === "credential");
    if (userAccount) {
      await prisma.account.update({
        where: { id: userAccount.id },
        data: {
          password: newPasswordHash,
          updatedAt: new Date(),
        },
      });
    } else {
      // Créer un compte si aucun n'existe
      await prisma.account.create({
        data: {
          id: require("nanoid").nanoid(),
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: newPasswordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // 4. Nettoyer l'utilisateur temporaire
    await prisma.account.deleteMany({ where: { userId: tempUser.id } });
    await prisma.user.delete({ where: { id: tempUser.id } });

    revalidatePath("/dashboard/settings/users");
    revalidateTag(CacheTags.USERS, 'max');
    return {
      success: true,
      message: "Mot de passe réinitialisé avec succès",
      tempPassword: parsedInput.newPassword
    };
  });
