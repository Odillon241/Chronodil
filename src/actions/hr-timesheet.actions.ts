"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import {
  hrTimesheetSchema,
  hrActivitySchema,
  submitHRTimesheetSchema,
  managerApprovalSchema,
  odillonApprovalSchema,
  hrTimesheetFilterSchema,
  activityCatalogFilterSchema,
  hrTimesheetBaseSchema,
  hrActivityBaseSchema,
} from "@/lib/validations/hr-timesheet";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { nanoid } from "nanoid";
import { differenceInDays } from "date-fns";

// ============================================
// TIMESHEET RH - CRUD
// ============================================

/**
 * Créer un nouveau timesheet RH hebdomadaire
 */
export const createHRTimesheet = authActionClient
  .schema(hrTimesheetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Vérifier qu'il n'existe pas déjà un timesheet pour cette semaine
    const existingTimesheet = await prisma.hRTimesheet.findUnique({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: parsedInput.weekStartDate,
        },
      },
    });

    if (existingTimesheet) {
      throw new Error("Un timesheet existe déjà pour cette semaine");
    }

    // Récupérer les infos utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Department: true },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const timesheet = await prisma.hRTimesheet.create({
      data: {
        id: nanoid(),
        userId,
        weekStartDate: parsedInput.weekStartDate,
        weekEndDate: parsedInput.weekEndDate,
        employeeName: parsedInput.employeeName || user.name,
        position: parsedInput.position,
        site: parsedInput.site,
        employeeObservations: parsedInput.employeeObservations,
        totalHours: 0,
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        activities: true,
        User: true,
      },
    });

    revalidatePath("/dashboard/hr-timesheet");
    return timesheet;
  });

/**
 * Récupérer les timesheets RH de l'utilisateur
 */
export const getMyHRTimesheets = authActionClient
  .schema(hrTimesheetFilterSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { status, weekStartDate, weekEndDate } = parsedInput;

    const timesheets = await prisma.hRTimesheet.findMany({
      where: {
        userId,
        ...(status && { status }),
        ...(weekStartDate && { weekStartDate: { gte: weekStartDate } }),
        ...(weekEndDate && { weekEndDate: { lte: weekEndDate } }),
      },
      include: {
        activities: {
          include: {
            ActivityCatalog: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        User: true,
        ManagerSigner: true,
        OdillonSigner: true,
      },
      orderBy: {
        weekStartDate: "desc",
      },
    });

    return timesheets;
  });

/**
 * Récupérer les timesheets RH en attente de validation (pour manager/admin)
 */
export const getHRTimesheetsForApproval = authActionClient
  .schema(hrTimesheetFilterSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx;
    const { status, weekStartDate, weekEndDate } = parsedInput;

    // Construire les conditions de filtre
    const whereConditions: any = {
      ...(status && { status }),
      ...(weekStartDate && { weekStartDate: { gte: weekStartDate } }),
      ...(weekEndDate && { weekEndDate: { lte: weekEndDate } }),
    };

    // Si manager, voir ses équipes
    if (userRole === "MANAGER") {
      whereConditions.User = {
        managerId: userId,
      };
      // Statut PENDING ou MANAGER_APPROVED
      whereConditions.status = { in: ["PENDING"] };
    }

    // Si admin ou HR, voir tous les MANAGER_APPROVED
    if (userRole === "ADMIN" || userRole === "HR") {
      whereConditions.status = { in: ["MANAGER_APPROVED"] };
    }

    const timesheets = await prisma.hRTimesheet.findMany({
      where: whereConditions,
      include: {
        activities: {
          include: {
            ActivityCatalog: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        User: true,
        ManagerSigner: true,
        OdillonSigner: true,
        _count: {
          select: {
            activities: true,
          },
        },
      },
      orderBy: {
        weekStartDate: "desc",
      },
    });

    return timesheets;
  });

/**
 * Récupérer un timesheet RH par ID
 */
export const getHRTimesheet = authActionClient
  .schema(z.object({ timesheetId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx;
    const { timesheetId: id } = parsedInput;

    const timesheet = await prisma.hRTimesheet.findUnique({
      where: { id },
      include: {
        activities: {
          include: {
            ActivityCatalog: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        User: {
          include: {
            Department: true,
            User: true, // Manager
          },
        },
        ManagerSigner: true,
        OdillonSigner: true,
      },
    });

    if (!timesheet) {
      throw new Error("Timesheet non trouvé");
    }

    // Vérifier les permissions
    const canView =
      timesheet.userId === userId ||
      userRole === "ADMIN" ||
      userRole === "HR" ||
      timesheet.User.managerId === userId;

    if (!canView) {
      throw new Error("Vous n'avez pas la permission de voir ce timesheet");
    }

    return timesheet;
  });

/**
 * Mettre à jour un timesheet RH
 */
export const updateHRTimesheet = authActionClient
  .schema(
    z.object({
      id: z.string(),
      data: hrTimesheetBaseSchema.partial(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id, data } = parsedInput;

    // Vérifier que le timesheet appartient à l'utilisateur et est en DRAFT
    const existingTimesheet = await prisma.hRTimesheet.findFirst({
      where: {
        id,
        userId,
        status: "DRAFT",
      },
    });

    if (!existingTimesheet) {
      throw new Error("Timesheet non trouvé ou non modifiable");
    }

    const timesheet = await prisma.hRTimesheet.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        activities: true,
        User: true,
      },
    });

    revalidatePath("/dashboard/hr-timesheet");
    revalidatePath(`/dashboard/hr-timesheet/${id}`);
    return timesheet;
  });

/**
 * Supprimer un timesheet RH
 */
export const deleteHRTimesheet = authActionClient
  .schema(z.object({ timesheetId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { timesheetId: id } = parsedInput;

    // Vérifier que le timesheet appartient à l'utilisateur et est en DRAFT
    const existingTimesheet = await prisma.hRTimesheet.findFirst({
      where: {
        id,
        userId,
        status: "DRAFT",
      },
    });

    if (!existingTimesheet) {
      throw new Error("Timesheet non trouvé ou non supprimable");
    }

    await prisma.hRTimesheet.delete({
      where: { id },
    });

    revalidatePath("/dashboard/hr-timesheet");
    return { success: true };
  });

// ============================================
// ACTIVITÉS RH
// ============================================

/**
 * Ajouter une activité à un timesheet RH
 */
export const addHRActivity = authActionClient
  .schema(
    z.object({
      timesheetId: z.string(),
      activity: hrActivitySchema,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { timesheetId, activity } = parsedInput;

    // Vérifier que le timesheet appartient à l'utilisateur et est en DRAFT
    const timesheet = await prisma.hRTimesheet.findFirst({
      where: {
        id: timesheetId,
        userId,
        status: "DRAFT",
      },
    });

    if (!timesheet) {
      throw new Error("Timesheet non trouvé ou non modifiable");
    }

    // Calculer les heures totales: DATEDIF(start, end, "D") * 24
    const days = differenceInDays(activity.endDate, activity.startDate);
    const totalHours = days * 24;

    const newActivity = await prisma.hRActivity.create({
      data: {
        id: nanoid(),
        hrTimesheetId: timesheetId,
        activityType: activity.activityType,
        activityName: activity.activityName,
        description: activity.description,
        periodicity: activity.periodicity,
        weeklyQuantity: activity.weeklyQuantity,
        startDate: activity.startDate,
        endDate: activity.endDate,
        totalHours,
        status: activity.status,
        catalogId: activity.catalogId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        ActivityCatalog: true,
      },
    });

    // Mettre à jour le total des heures du timesheet
    await updateTimesheetTotalHours(timesheetId);

    revalidatePath("/dashboard/hr-timesheet");
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`);
    return newActivity;
  });

/**
 * Mettre à jour une activité RH
 */
export const updateHRActivity = authActionClient
  .schema(
    z.object({
      id: z.string(),
      data: hrActivityBaseSchema.partial(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id, data } = parsedInput;

    // Vérifier que l'activité appartient à un timesheet de l'utilisateur en DRAFT
    const activity = await prisma.hRActivity.findFirst({
      where: {
        id,
        hrTimesheet: {
          userId,
          status: "DRAFT",
        },
      },
      include: {
        hrTimesheet: true,
      },
    });

    if (!activity) {
      throw new Error("Activité non trouvée ou non modifiable");
    }

    // Recalculer les heures si les dates ont changé
    let totalHours = activity.totalHours;
    if (data.startDate || data.endDate) {
      const startDate = data.startDate || activity.startDate;
      const endDate = data.endDate || activity.endDate;
      const days = differenceInDays(endDate, startDate);
      totalHours = days * 24;
    }

    const updatedActivity = await prisma.hRActivity.update({
      where: { id },
      data: {
        ...data,
        ...(data.startDate || data.endDate ? { totalHours } : {}),
        updatedAt: new Date(),
      },
      include: {
        ActivityCatalog: true,
      },
    });

    // Mettre à jour le total des heures du timesheet
    await updateTimesheetTotalHours(activity.hrTimesheetId);

    revalidatePath("/dashboard/hr-timesheet");
    revalidatePath(`/dashboard/hr-timesheet/${activity.hrTimesheetId}`);
    return updatedActivity;
  });

/**
 * Supprimer une activité RH
 */
export const deleteHRActivity = authActionClient
  .schema(z.object({ timesheetId: z.string(), activityId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { activityId: id } = parsedInput;

    // Vérifier que l'activité appartient à un timesheet de l'utilisateur en DRAFT
    const activity = await prisma.hRActivity.findFirst({
      where: {
        id,
        hrTimesheet: {
          userId,
          status: "DRAFT",
        },
      },
      include: {
        hrTimesheet: true,
      },
    });

    if (!activity) {
      throw new Error("Activité non trouvée ou non supprimable");
    }

    await prisma.hRActivity.delete({
      where: { id },
    });

    // Mettre à jour le total des heures du timesheet
    await updateTimesheetTotalHours(activity.hrTimesheetId);

    revalidatePath("/dashboard/hr-timesheet");
    revalidatePath(`/dashboard/hr-timesheet/${activity.hrTimesheetId}`);
    return { success: true };
  });

// ============================================
// WORKFLOW DE VALIDATION
// ============================================

/**
 * Soumettre un timesheet RH pour validation
 */
export const submitHRTimesheet = authActionClient
  .schema(submitHRTimesheetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { timesheetId } = parsedInput;

    // Vérifier que le timesheet appartient à l'utilisateur et est en DRAFT
    const timesheet = await prisma.hRTimesheet.findFirst({
      where: {
        id: timesheetId,
        userId,
        status: "DRAFT",
      },
      include: {
        activities: true,
        User: {
          include: {
            User: true, // Manager
          },
        },
      },
    });

    if (!timesheet) {
      throw new Error("Timesheet non trouvé ou déjà soumis");
    }

    // Vérifier qu'il y a au moins une activité
    if (timesheet.activities.length === 0) {
      throw new Error("Vous devez ajouter au moins une activité avant de soumettre");
    }

    // Vérifier que l'utilisateur a un manager
    if (!timesheet.User.managerId) {
      throw new Error(
        "Vous n'avez pas de manager assigné. Veuillez contacter votre administrateur."
      );
    }

    // Signer et soumettre
    const updatedTimesheet = await prisma.hRTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: "PENDING",
        employeeSignedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        activities: true,
        User: true,
      },
    });

    // Créer une notification pour le manager
    await prisma.notification.create({
      data: {
        id: nanoid(),
        userId: timesheet.User.managerId,
        title: "Nouvelle feuille de temps RH à valider",
        message: `${timesheet.User.name} a soumis sa feuille de temps hebdomadaire pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()}`,
        type: "hr_timesheet_submitted",
        link: `/dashboard/hr-timesheet/${timesheetId}`,
      },
    });

    revalidatePath("/dashboard/hr-timesheet");
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`);
    revalidatePath("/dashboard/hr-validations");

    return updatedTimesheet;
  });

/**
 * Annuler la soumission d'un timesheet RH (le remettre en DRAFT)
 */
export const cancelHRTimesheetSubmission = authActionClient
  .schema(z.object({ timesheetId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { timesheetId } = parsedInput;

    // Vérifier que le timesheet appartient à l'utilisateur et est en PENDING
    const timesheet = await prisma.hRTimesheet.findFirst({
      where: {
        id: timesheetId,
        userId,
        status: "PENDING",
      },
      include: {
        User: true,
      },
    });

    if (!timesheet) {
      throw new Error("Timesheet non trouvé ou ne peut pas être annulé");
    }

    // Remettre en DRAFT
    const updatedTimesheet = await prisma.hRTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: "DRAFT",
        employeeSignedAt: null,
        updatedAt: new Date(),
      },
      include: {
        activities: true,
        User: true,
      },
    });

    // Supprimer la notification créée pour le manager (optionnel)
    if (timesheet.User.managerId) {
      await prisma.notification.deleteMany({
        where: {
          userId: timesheet.User.managerId,
          type: "hr_timesheet_submitted",
          link: `/dashboard/hr-timesheet/${timesheetId}`,
        },
      });
    }

    revalidatePath("/dashboard/hr-timesheet");
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`);

    return updatedTimesheet;
  });

/**
 * Approuver ou rejeter un timesheet RH (Manager)
 */
export const managerApproveHRTimesheet = authActionClient
  .schema(managerApprovalSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx;
    const { timesheetId, action, comments } = parsedInput;

    // Récupérer le timesheet
    const timesheet = await prisma.hRTimesheet.findUnique({
      where: { id: timesheetId },
      include: {
        User: true,
      },
    });

    if (!timesheet) {
      throw new Error("Timesheet non trouvé");
    }

    // Vérifier que l'utilisateur est le manager ou admin
    const isManager = timesheet.User.managerId === userId;
    const isAdmin = userRole === "ADMIN" || userRole === "HR";

    if (!isManager && !isAdmin) {
      throw new Error("Vous n'avez pas la permission de valider ce timesheet");
    }

    // Vérifier le statut
    if (timesheet.status !== "PENDING") {
      throw new Error("Ce timesheet ne peut pas être validé dans son état actuel");
    }

    const newStatus = action === "approve" ? "MANAGER_APPROVED" : "REJECTED";

    const updatedTimesheet = await prisma.hRTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: newStatus,
        managerSignedAt: new Date(),
        managerSignedById: userId,
        managerComments: comments,
        updatedAt: new Date(),
      },
      include: {
        activities: true,
        User: true,
        ManagerSigner: true,
      },
    });

    // Notifier l'employé
    await prisma.notification.create({
      data: {
        id: nanoid(),
        userId: timesheet.userId,
        title:
          action === "approve"
            ? "Feuille de temps RH approuvée par votre manager"
            : "Feuille de temps RH rejetée",
        message:
          action === "approve"
            ? `Votre feuille de temps pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()} a été approuvée par votre manager${
                comments ? `: ${comments}` : ""
              }`
            : `Votre feuille de temps pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()} a été rejetée${
                comments ? `: ${comments}` : ""
              }`,
        type: action === "approve" ? "success" : "warning",
        link: `/dashboard/hr-timesheet/${timesheetId}`,
      },
    });

    // Si approuvé, notifier Odillon (Admin/HR)
    if (action === "approve") {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ["ADMIN", "HR"] },
        },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            id: nanoid(),
            userId: admin.id,
            title: "Feuille de temps RH en attente de validation finale",
            message: `La feuille de temps de ${timesheet.User.name} pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()} est en attente de votre validation finale`,
            type: "hr_timesheet_pending_final",
            link: `/dashboard/hr-timesheet/${timesheetId}`,
          },
        });
      }
    }

    revalidatePath("/dashboard/hr-timesheet");
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`);
    revalidatePath("/dashboard/hr-validations");

    return updatedTimesheet;
  });

/**
 * Validation finale par Odillon (Admin/HR)
 */
export const odillonApproveHRTimesheet = authActionClient
  .schema(odillonApprovalSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx;
    const { timesheetId, action, comments } = parsedInput;

    // Vérifier que l'utilisateur est Admin ou HR
    if (userRole !== "ADMIN" && userRole !== "HR") {
      throw new Error("Seuls les administrateurs et RH peuvent effectuer la validation finale");
    }

    // Récupérer le timesheet
    const timesheet = await prisma.hRTimesheet.findUnique({
      where: { id: timesheetId },
      include: {
        User: true,
      },
    });

    if (!timesheet) {
      throw new Error("Timesheet non trouvé");
    }

    // Vérifier le statut
    if (timesheet.status !== "MANAGER_APPROVED") {
      throw new Error("Ce timesheet doit d'abord être approuvé par le manager");
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    const updatedTimesheet = await prisma.hRTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: newStatus,
        odillonSignedAt: new Date(),
        odillonSignedById: userId,
        odillonComments: comments,
        updatedAt: new Date(),
      },
      include: {
        activities: true,
        User: true,
        ManagerSigner: true,
        OdillonSigner: true,
      },
    });

    // Notifier l'employé
    await prisma.notification.create({
      data: {
        id: nanoid(),
        userId: timesheet.userId,
        title:
          action === "approve"
            ? "Feuille de temps RH validée définitivement"
            : "Feuille de temps RH rejetée",
        message:
          action === "approve"
            ? `Votre feuille de temps pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()} a été validée définitivement${
                comments ? `: ${comments}` : ""
              }`
            : `Votre feuille de temps pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()} a été rejetée lors de la validation finale${
                comments ? `: ${comments}` : ""
              }`,
        type: action === "approve" ? "success" : "warning",
        link: `/dashboard/hr-timesheet/${timesheetId}`,
      },
    });

    revalidatePath("/dashboard/hr-timesheet");
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`);
    revalidatePath("/dashboard/hr-validations");

    return updatedTimesheet;
  });

// ============================================
// CATALOGUE D'ACTIVITÉS & RAPPORTS
// ============================================

/**
 * Récupérer le catalogue d'activités RH
 */
export const getActivityCatalog = authActionClient
  .schema(activityCatalogFilterSchema)
  .action(async ({ parsedInput }) => {
    const { category, type, isActive } = parsedInput;

    const activities = await prisma.activityCatalog.findMany({
      where: {
        ...(category && { category }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return activities;
  });

/**
 * Récupérer les types de rapports
 */
export const getReportTypes = authActionClient.action(async () => {
  const reportTypes = await prisma.reportType.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return reportTypes;
});

/**
 * Récupérer les catégories d'activités uniques
 */
export const getActivityCategories = authActionClient.action(async () => {
  const activities = await prisma.activityCatalog.findMany({
    where: {
      isActive: true,
    },
    select: {
      category: true,
    },
    distinct: ["category"],
    orderBy: {
      category: "asc",
    },
  });

  return activities.map((a) => a.category);
});

// ============================================
// STATISTIQUES
// ============================================

/**
 * Récupérer les statistiques des timesheets RH
 */
export const getHRTimesheetStats = authActionClient
  .schema(
    z.object({
      startDate: z.date(),
      endDate: z.date(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { startDate, endDate } = parsedInput;

    const timesheets = await prisma.hRTimesheet.findMany({
      where: {
        userId,
        weekStartDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        activities: true,
      },
    });

    const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);
    const approvedHours = timesheets
      .filter((ts) => ts.status === "APPROVED")
      .reduce((sum, ts) => sum + ts.totalHours, 0);
    const pendingHours = timesheets
      .filter((ts) => ts.status === "PENDING" || ts.status === "MANAGER_APPROVED")
      .reduce((sum, ts) => sum + ts.totalHours, 0);

    const activitiesByType = timesheets
      .flatMap((ts) => ts.activities)
      .reduce(
        (acc, activity) => {
          acc[activity.activityType] = (acc[activity.activityType] || 0) + activity.totalHours;
          return acc;
        },
        {} as Record<string, number>
      );

    const activitiesByCategory = timesheets
      .flatMap((ts) => ts.activities)
      .reduce(
        (acc, activity) => {
          const category = activity.activityName;
          acc[category] = (acc[category] || 0) + activity.totalHours;
          return acc;
        },
        {} as Record<string, number>
      );

    return {
      totalHours,
      approvedHours,
      pendingHours,
      timesheetsCount: timesheets.length,
      activitiesCount: timesheets.reduce((sum, ts) => sum + ts.activities.length, 0),
      activitiesByType,
      activitiesByCategory,
      statusBreakdown: {
        DRAFT: timesheets.filter((ts) => ts.status === "DRAFT").length,
        PENDING: timesheets.filter((ts) => ts.status === "PENDING").length,
        MANAGER_APPROVED: timesheets.filter((ts) => ts.status === "MANAGER_APPROVED").length,
        APPROVED: timesheets.filter((ts) => ts.status === "APPROVED").length,
        REJECTED: timesheets.filter((ts) => ts.status === "REJECTED").length,
      },
    };
  });

// ============================================
// UTILITAIRES INTERNES
// ============================================

/**
 * Mettre à jour le total des heures d'un timesheet
 */
async function updateTimesheetTotalHours(timesheetId: string) {
  const activities = await prisma.hRActivity.findMany({
    where: {
      hrTimesheetId: timesheetId,
    },
  });

  const totalHours = activities.reduce((sum, activity) => sum + activity.totalHours, 0);

  await prisma.hRTimesheet.update({
    where: { id: timesheetId },
    data: {
      totalHours,
      updatedAt: new Date(),
    },
  });

  return totalHours;
}
