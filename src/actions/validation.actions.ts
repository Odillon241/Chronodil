"use server";
type ActionContext = {
  userId: string;
  userRole: string;
};

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { timesheetValidationSchema } from "@/lib/validations/timesheet";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { notifyTimesheetValidated } from "@/lib/inngest/helpers";
import { nanoid } from "nanoid";

// Récupérer les entrées en attente de validation
export const getPendingValidations = authActionClient
  .schema(z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx;

    // Vérifier les permissions
    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    // Si manager, récupérer seulement les entrées de ses subordonnés
    let userIds: string[] = [];
    if (userRole === "MANAGER") {
      const subordinates = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true },
      });
      userIds = subordinates.map((u) => u.id);
    }

    const entries = await prisma.timesheetEntry.findMany({
      where: {
        status: "SUBMITTED",
        ...(userRole === "MANAGER" && { userId: { in: userIds } }),
        ...(parsedInput.startDate && parsedInput.endDate && {
          date: {
            gte: parsedInput.startDate,
            lte: parsedInput.endDate,
          },
        }),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Project: true,
        Task: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return entries;
  });

// Valider une entrée de temps
export const validateTimesheetEntry = authActionClient
  .schema(timesheetValidationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx;

    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    const { timesheetEntryId, status, comment } = parsedInput;

    // Vérifier que l'entrée existe et est en statut SUBMITTED
    const entry = await prisma.timesheetEntry.findUnique({
      where: { id: timesheetEntryId },
      include: { User: true },
    });

    if (!entry) {
      throw new Error("Entrée non trouvée");
    }

    if (entry.status !== "SUBMITTED") {
      throw new Error("Cette entrée n'est pas en attente de validation");
    }

    // Si manager, vérifier qu'il est bien le manager de l'utilisateur
    if (userRole === "MANAGER") {
      if (entry.User.managerId !== userId) {
        throw new Error("Vous n'êtes pas le manager de cet utilisateur");
      }
    }

    // Créer la validation
    const validation = await prisma.timesheetValidation.create({
      data: {
        id: nanoid(),
        timesheetEntryId,
        validatorId: userId,
        status,
        comment,
      },
    });

    // Mettre à jour le statut de l'entrée
    await prisma.timesheetEntry.update({
      where: { id: timesheetEntryId },
      data: {
        status,
        // Verrouiller si approuvé
        ...(status === "APPROVED" && { isLocked: true }),
      },
    });

    // Créer une notification pour l'utilisateur
    await prisma.notification.create({
      data: {
        id: nanoid(),
        userId: entry.userId,
        title: status === "APPROVED" ? "Temps approuvé" : "Temps rejeté",
        message: status === "APPROVED"
          ? `Votre saisie du ${entry.date.toLocaleDateString()} a été approuvée.`
          : `Votre saisie du ${entry.date.toLocaleDateString()} a été rejetée. ${comment || ""}`,
        type: status === "APPROVED" ? "success" : "warning",
        link: "/dashboard/timesheet",
      },
    });

    // Envoyer notification email via Inngest
    const validator = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    await notifyTimesheetValidated({
      userId: entry.userId,
      status,
      validatorName: validator?.name || validator?.email || "un manager",
      comment,
    });

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        id: nanoid(),
        userId,
        action: status === "APPROVED" ? "APPROVE_TIMESHEET" : "REJECT_TIMESHEET",
        entity: "TimesheetEntry",
        entityId: timesheetEntryId,
        changes: {
          status,
          comment,
        },
      },
    });

    revalidatePath("/dashboard/validation");
    revalidatePath("/dashboard/timesheet");
    return validation;
  });

// Valider plusieurs entrées en masse
export const bulkValidateEntries = authActionClient
  .schema(
    z.object({
      entryIds: z.array(z.string()),
      status: z.enum(["APPROVED", "REJECTED"]),
      comment: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx;

    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    const { entryIds, status, comment } = parsedInput;

    // Récupérer toutes les entrées
    const entries = await prisma.timesheetEntry.findMany({
      where: {
        id: { in: entryIds },
        status: "SUBMITTED",
      },
      include: { User: true },
    });

    // Si manager, vérifier les permissions
    if (userRole === "MANAGER") {
      const unauthorizedEntry = entries.find((e) => e.User.managerId !== userId);
      if (unauthorizedEntry) {
        throw new Error("Vous n'avez pas l'autorisation de valider toutes ces entrées");
      }
    }

    // Créer les validations
    const validations = await Promise.all(
      entries.map((entry) =>
        prisma.timesheetValidation.create({
          data: {
            id: nanoid(),
            timesheetEntryId: entry.id,
            validatorId: userId,
            status,
            comment,
          },
        })
      )
    );

    // Mettre à jour les statuts
    await prisma.timesheetEntry.updateMany({
      where: { id: { in: entryIds } },
      data: {
        status,
        ...(status === "APPROVED" && { isLocked: true }),
      },
    });

    // Créer les notifications
    await Promise.all(
      entries.map((entry) =>
        prisma.notification.create({
          data: {
            id: nanoid(),
            userId: entry.userId,
            title: status === "APPROVED" ? "Temps approuvés" : "Temps rejetés",
            message:
              status === "APPROVED"
                ? `Votre saisie du ${entry.date.toLocaleDateString()} a été approuvée.`
                : `Votre saisie du ${entry.date.toLocaleDateString()} a été rejetée. ${comment || ""}`,
            type: status === "APPROVED" ? "success" : "warning",
            link: "/dashboard/timesheet",
          },
        })
      )
    );

    // Envoyer notifications email via Inngest
    const validator = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    await Promise.all(
      entries.map((entry) =>
        notifyTimesheetValidated({
          userId: entry.userId,
          status,
          validatorName: validator?.name || validator?.email || "un manager",
          comment,
        })
      )
    );

    revalidatePath("/dashboard/validation");
    revalidatePath("/dashboard/timesheet");
    return validations;
  });

// Récupérer les statistiques de validation
export const getValidationStats = authActionClient
  .schema(
    z.object({
      startDate: z.date(),
      endDate: z.date(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx;

    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    let userIds: string[] = [];
    if (userRole === "MANAGER") {
      const subordinates = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true },
      });
      userIds = subordinates.map((u) => u.id);
    }

    const entries = await prisma.timesheetEntry.findMany({
      where: {
        ...(userRole === "MANAGER" && { userId: { in: userIds } }),
        date: {
          gte: parsedInput.startDate,
          lte: parsedInput.endDate,
        },
      },
    });

    const pending = entries.filter((e) => e.status === "SUBMITTED").length;
    const approved = entries.filter((e) => e.status === "APPROVED").length;
    const rejected = entries.filter((e) => e.status === "REJECTED").length;

    return {
      pending,
      approved,
      rejected,
      total: entries.length,
      approvalRate: entries.length > 0 ? (approved / entries.length) * 100 : 0,
    };
  });
