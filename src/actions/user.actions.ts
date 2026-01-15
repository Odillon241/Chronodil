"use server";
type ActionContext = {
  userId: string;
  userRole: string;
};

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { revalidatePath, updateTag } from "next/cache";
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
    updateTag(CacheTags.USERS);
    return user;
  });

// Mettre à jour l'email de l'utilisateur (avec Supabase Auth)
export const updateMyEmail = authActionClient
  .schema(
    z.object({
      newEmail: z.string().email("Email invalide"),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId, user } = ctx;
    
    // Vérifier que le nouvel email est différent
    if (parsedInput.newEmail === user.email) {
      throw new Error("Le nouvel email est identique à l'actuel");
    }
    
    // Vérifier que l'email n'est pas déjà utilisé dans Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedInput.newEmail },
    });
    
    if (existingUser) {
      throw new Error("Cet email est déjà utilisé par un autre compte");
    }
    
    try {
      // Utiliser Supabase Auth Admin API pour changer l'email
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email: parsedInput.newEmail }
      );
      
      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }
      
      // Mettre à jour l'email dans Prisma
      await prisma.user.update({
        where: { id: userId },
        data: { email: parsedInput.newEmail },
      });
      
      // Créer un log d'audit
      await createAuditLog({
        userId: userId,
        action: AuditActions.UPDATE,
        entity: AuditEntities.USER,
        entityId: userId,
        changes: {
          action: "email_change",
          previousEmail: user.email,
          newEmail: parsedInput.newEmail,
        },
      });
      
      revalidatePath("/dashboard/settings");
      revalidatePath("/dashboard");
      updateTag(CacheTags.USERS);
      
      return { 
        success: true, 
        message: "Votre adresse email a été mise à jour" 
      };
    } catch (error: any) {
      console.error("[updateMyEmail] Error:", error);
      throw new Error(error.message || "Erreur lors du changement d'email");
    }
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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        departmentId: true,
        managerId: true,
        Department: {
          select: {
            id: true,
            name: true,
          },
        },
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
            HRTimesheet_HRTimesheet_userIdToUser: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Mapper les données pour correspondre à l'interface attendue
    const mappedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.Department ? {
        id: user.Department.id,
        name: user.Department.name,
      } : null,
      manager: user.User ? {
        id: user.User.id,
        name: user.User.name,
      } : null,
      _count: {
        timesheetEntries: user._count.HRTimesheet_HRTimesheet_userIdToUser || 0,
        subordinates: user._count.other_User || 0,
      },
    }));

    return mappedUsers;
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

    // Créer l'utilisateur via Supabase Auth Admin API
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: parsedInput.email,
      password: parsedInput.password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        name: parsedInput.name,
        role: parsedInput.role,
      },
    });

    if (authError || !authData.user) {
      throw new Error(`Erreur lors de la création du compte: ${authError?.message || "Utilisateur non créé"}`);
    }

    // Créer l'utilisateur dans Prisma avec l'ID Supabase
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: parsedInput.email,
        name: parsedInput.name,
        role: parsedInput.role,
        ...(parsedInput.departmentId && { departmentId: parsedInput.departmentId }),
        ...(parsedInput.managerId && { managerId: parsedInput.managerId }),
        emailVerified: true,
        updatedAt: new Date(),
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
    updateTag(CacheTags.USERS);
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
        departmentId: z.string().nullable().optional(),
        managerId: z.string().nullable().optional(),
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

    // Construire l'objet de données en gérant explicitement null
    const updateData: any = {};
    
    if (parsedInput.data.name !== undefined) updateData.name = parsedInput.data.name;
    if (parsedInput.data.email !== undefined) updateData.email = parsedInput.data.email;
    if (parsedInput.data.role !== undefined) updateData.role = parsedInput.data.role;
    
    // Gérer departmentId : null signifie "aucun département"
    if (parsedInput.data.departmentId !== undefined) {
      updateData.departmentId = parsedInput.data.departmentId === null ? null : parsedInput.data.departmentId;
    }
    
    // Gérer managerId : null signifie "tous les validateurs"
    if (parsedInput.data.managerId !== undefined) {
      updateData.managerId = parsedInput.data.managerId === null ? null : parsedInput.data.managerId;
    }

    const user = await prisma.user.update({
      where: { id: parsedInput.id },
      data: updateData,
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
    updateTag(CacheTags.USERS);
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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        position: true,
        Department: {
          select: {
            id: true,
            name: true,
          },
        },
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
    updateTag(CacheTags.USERS);
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
    const { userRole, userId } = ctx;

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

    try {
      // Utiliser Supabase Auth Admin API pour réinitialiser le mot de passe
      const { createClient } = await import("@supabase/supabase-js");
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      console.log("Debug ResetPassword:", { 
        urlExists: !!supabaseUrl, 
        keyExists: !!serviceRoleKey,
        keyLength: serviceRoleKey?.length,
        userId: parsedInput.id 
      });

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Configuration Supabase manquante (URL ou Service Role Key)");
      }

      const supabaseAdmin = createClient(
        supabaseUrl,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Verify user exists first
      const { data: authUser, error: findError } = await supabaseAdmin.auth.admin.getUserById(parsedInput.id);
      
      if (findError || !authUser.user) {
        console.error("User not found in Supabase Auth:", findError);
        throw new Error(`Utilisateur introuvable dans Supabase Auth (ID: ${parsedInput.id})`);
      }

      console.log("Found Supabase User:", authUser.user.id, authUser.user.email);

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        parsedInput.id,
        { password: parsedInput.newPassword }
      );

      if (updateError) {
        throw new Error(`Erreur lors de la réinitialisation: ${updateError.message}`);
      }

      // Créer un log d'audit
      await createAuditLog({
        userId: userId,
        action: AuditActions.UPDATE,
        entity: AuditEntities.USER,
        entityId: parsedInput.id,
        changes: {
          action: "password_reset",
        },
      });

      revalidatePath("/dashboard/settings/users");
      updateTag(CacheTags.USERS);
      
      return {
        success: true,
        message: "Mot de passe réinitialisé avec succès",
        tempPassword: parsedInput.newPassword
      };

    } catch (error: any) {
      console.error("Erreur resetUserPassword:", error);
      throw new Error(error.message || "Erreur lors de la réinitialisation du mot de passe");
    }
  });

// Changer le mot de passe de l'utilisateur connecté
export const changeMyPassword = authActionClient
  .schema(
    z.object({
      currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
      newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId, user } = ctx;
    
    try {
      // Utiliser Supabase Auth Admin API pour changer le mot de passe
      const { createClient } = await import("@supabase/supabase-js");
      
      // D'abord, vérifier le mot de passe actuel en tentant une connexion
      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: user.email,
        password: parsedInput.currentPassword,
      });
      
      if (signInError) {
        throw new Error("Le mot de passe actuel est incorrect");
      }
      
      // Utiliser l'Admin API pour mettre à jour le mot de passe
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: parsedInput.newPassword }
      );

      if (updateError) {
        throw new Error("Erreur lors du changement de mot de passe");
      }

      return {
        success: true,
        message: "Mot de passe modifié avec succès",
      };
    } catch (error: any) {
      if (error.message?.includes("Invalid login") || error.message?.includes("incorrect")) {
        throw new Error("Le mot de passe actuel est incorrect");
      }
      throw new Error(error.message || "Erreur lors du changement de mot de passe");
    }
  });
