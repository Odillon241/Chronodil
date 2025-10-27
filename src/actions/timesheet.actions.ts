"use server";
type ActionContext = {
  userId: string;
  userRole: string;
};

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { timesheetEntrySchema, timesheetValidationSchema } from "@/lib/validations/timesheet";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { CacheTags } from "@/lib/cache";
import {
  validateTimesheetEntry,
  suggestTimeType,
  detectNightHours,
  isWeekend,
} from "@/lib/utils/timesheet.utils";
import { startOfDay, endOfDay } from "date-fns";

// Créer une entrée de temps
export const createTimesheetEntry = authActionClient
  .schema(timesheetEntrySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Convertir les heures string en Date objects
    const startTime = parsedInput.startTime
      ? new Date(`1970-01-01T${parsedInput.startTime}`)
      : null;
    const endTime = parsedInput.endTime ? new Date(`1970-01-01T${parsedInput.endTime}`) : null;

    // Récupérer les entrées existantes du même jour pour validation
    const existingEntries = await prisma.timesheetEntry.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay(parsedInput.date),
          lte: endOfDay(parsedInput.date),
        },
      },
    });

    // Préparer l'entrée pour validation
    const newEntry = {
      userId,
      date: parsedInput.date,
      startTime,
      endTime,
      duration: parsedInput.duration,
    };

    // Valider l'entrée
    const validation = validateTimesheetEntry(newEntry, existingEntries as any);

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // Suggestion automatique du type si nécessaire
    let finalType = parsedInput.type;
    if (finalType === "NORMAL") {
      const suggested = suggestTimeType(newEntry, existingEntries as any);
      if (suggested !== "NORMAL") {
        finalType = suggested;
      }
    }

    const entry = await prisma.timesheetEntry.create({
      data: {
        id: require("nanoid").nanoid(),
        userId,
        ...(parsedInput.projectId && { projectId: parsedInput.projectId }),
        ...(parsedInput.taskId && { taskId: parsedInput.taskId }),
        date: parsedInput.date,
        startTime,
        endTime,
        duration: parsedInput.duration,
        type: finalType,
        description: parsedInput.description,
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        Project: true,
        Task: true,
      },
    });

    revalidatePath("/dashboard/timesheet");
    revalidateTag(CacheTags.TIMESHEETS, 'max');
    return {
      ...entry,
      warnings: validation.warnings,
    };
  });

// Récupérer les entrées de temps de l'utilisateur
export const getMyTimesheetEntries = authActionClient
  .schema(z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "LOCKED"]).optional(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { startDate, endDate, status } = parsedInput;

    const entries = await prisma.timesheetEntry.findMany({
      where: {
        userId,
        ...(startDate && endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
        ...(status && { status }),
      },
      include: {
        Project: true,
        Task: true,
        TimesheetValidation: {
          include: {
            User: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return entries;
  });

// Mettre à jour une entrée de temps
export const updateTimesheetEntry = authActionClient
  .schema(
    z.object({
      id: z.string(),
      data: timesheetEntrySchema.partial(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id, data } = parsedInput;

    // Vérifier que l'entrée appartient à l'utilisateur et n'est pas verrouillée
    const existingEntry = await prisma.timesheetEntry.findFirst({
      where: {
        id,
        userId,
        isLocked: false,
      },
    });

    if (!existingEntry) {
      throw new Error("Entrée non trouvée ou verrouillée");
    }

    // Préparer les données mises à jour
    const updatedDate = data.date || existingEntry.date;
    const updatedStartTime = data.startTime
      ? new Date(`1970-01-01T${data.startTime}`)
      : existingEntry.startTime;
    const updatedEndTime = data.endTime
      ? new Date(`1970-01-01T${data.endTime}`)
      : existingEntry.endTime;
    const updatedDuration = data.duration ?? existingEntry.duration;

    // Récupérer les autres entrées du jour (excluant celle en cours de modification)
    const otherEntries = await prisma.timesheetEntry.findMany({
      where: {
        userId,
        id: { not: id },
        date: {
          gte: startOfDay(updatedDate),
          lte: endOfDay(updatedDate),
        },
      },
    });

    // Préparer l'entrée pour validation
    const updatedEntry = {
      id,
      userId,
      date: updatedDate,
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      duration: updatedDuration,
    };

    // Valider l'entrée
    const validation = validateTimesheetEntry(updatedEntry, otherEntries as any);

    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const entry = await prisma.timesheetEntry.update({
      where: { id },
      data: {
        projectId: data.projectId && data.projectId !== "none" ? data.projectId : null,
        ...(data.taskId && { taskId: data.taskId }),
        ...(data.date && { date: data.date }),
        ...(data.startTime && { startTime: updatedStartTime }),
        ...(data.endTime && { endTime: updatedEndTime }),
        ...(data.duration && { duration: data.duration }),
        ...(data.type && { type: data.type }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date(),
      },
      include: {
        Project: true,
        Task: true,
      },
    });

    revalidatePath("/dashboard/timesheet");
    revalidateTag(CacheTags.TIMESHEETS, 'max');
    return {
      ...entry,
      warnings: validation.warnings,
    };
  });

// Supprimer une entrée de temps
export const deleteTimesheetEntry = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id } = parsedInput;

    // Vérifier que l'entrée appartient à l'utilisateur et n'est pas verrouillée
    const existingEntry = await prisma.timesheetEntry.findFirst({
      where: {
        id,
        userId,
        isLocked: false,
      },
    });

    if (!existingEntry) {
      throw new Error("Entrée non trouvée ou verrouillée");
    }

    await prisma.timesheetEntry.delete({
      where: { id },
    });

    revalidatePath("/dashboard/timesheet");
    revalidateTag(CacheTags.TIMESHEETS, 'max');
    return { success: true };
  });

// Soumettre les entrées pour validation
export const submitTimesheetEntries = authActionClient
  .schema(
    z.object({
      entryIds: z.array(z.string()),
      period: z.object({
        startDate: z.date(),
        endDate: z.date(),
      }).optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { entryIds, period } = parsedInput;

    // Vérifier que toutes les entrées appartiennent à l'utilisateur et sont en DRAFT
    const entries = await prisma.timesheetEntry.findMany({
      where: {
        id: { in: entryIds },
        userId,
      },
      include: {
        Project: true,
      },
    });

    // Vérifier que toutes les entrées sont bien en DRAFT
    const nonDraftEntries = entries.filter((e) => e.status !== "DRAFT");
    if (nonDraftEntries.length > 0) {
      throw new Error(
        `Certaines entrées ne sont pas en brouillon et ne peuvent pas être soumises`
      );
    }

    // Vérifier qu'il y a au moins une entrée
    if (entries.length === 0) {
      throw new Error("Aucune entrée à soumettre");
    }

    // Vérifier qu'aucune entrée n'est verrouillée
    const lockedEntries = entries.filter((e) => e.isLocked);
    if (lockedEntries.length > 0) {
      throw new Error("Certaines entrées sont verrouillées");
    }

    // Récupérer l'utilisateur et son manager
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        User: true, // Manager
      },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    if (!user.managerId) {
      throw new Error(
        "Vous n'avez pas de manager assigné. Veuillez contacter votre administrateur."
      );
    }

    // Mettre à jour le statut de toutes les entrées
    const result = await prisma.timesheetEntry.updateMany({
      where: {
        id: { in: entryIds },
        userId,
        status: "DRAFT",
        isLocked: false,
      },
      data: {
        status: "SUBMITTED",
      },
    });

    // Créer une notification pour le manager
    await prisma.notification.create({
      data: {
        id: require("nanoid").nanoid(),
        userId: user.managerId,
        title: "Nouvelle feuille de temps à valider",
        message: `${user.name} a soumis ${entries.length} entrée(s) de temps pour validation`,
        type: "timesheet_submitted",
        link: "/dashboard/validations",
      },
    });

    // TODO: Envoyer un email au manager (via Inngest plus tard)

    revalidatePath("/dashboard/timesheet");
    revalidatePath("/dashboard/validations");

    return {
      success: true,
      count: result.count,
      managerId: user.managerId,
      entries: entries.length,
    };
  });

// Obtenir les statistiques de temps
export const getTimesheetStats = authActionClient
  .schema(z.object({
    startDate: z.date(),
    endDate: z.date(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { startDate, endDate } = parsedInput;

    const entries = await prisma.timesheetEntry.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const approvedHours = entries
      .filter((e) => e.status === "APPROVED")
      .reduce((sum, entry) => sum + entry.duration, 0);
    const pendingHours = entries
      .filter((e) => e.status === "SUBMITTED")
      .reduce((sum, entry) => sum + entry.duration, 0);

    const byType = entries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + entry.duration;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalHours,
      approvedHours,
      pendingHours,
      byType,
      entriesCount: entries.length,
    };
  });
