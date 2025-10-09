"use server";
type ActionContext = {
  userId: string;
  userRole: string;
};

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { timesheetEntrySchema, timesheetValidationSchema } from "@/lib/validations/timesheet";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Créer une entrée de temps
export const createTimesheetEntry = authActionClient
  .schema(timesheetEntrySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    const entry = await prisma.timesheetEntry.create({
      data: {
        userId,
        projectId: parsedInput.projectId,
        taskId: parsedInput.taskId,
        date: parsedInput.date,
        startTime: parsedInput.startTime ? new Date(`1970-01-01T${parsedInput.startTime}`) : undefined,
        endTime: parsedInput.endTime ? new Date(`1970-01-01T${parsedInput.endTime}`) : undefined,
        duration: parsedInput.duration,
        type: parsedInput.type,
        description: parsedInput.description,
        status: "DRAFT",
      },
      include: {
        project: true,
        task: true,
      },
    });

    revalidatePath("/dashboard/timesheet");
    return entry;
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
        project: true,
        task: true,
        validation: {
          include: {
            validator: true,
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

    const entry = await prisma.timesheetEntry.update({
      where: { id },
      data: {
        ...(data.projectId && { projectId: data.projectId }),
        ...(data.taskId && { taskId: data.taskId }),
        ...(data.date && { date: data.date }),
        ...(data.startTime && { startTime: new Date(`1970-01-01T${data.startTime}`) }),
        ...(data.endTime && { endTime: new Date(`1970-01-01T${data.endTime}`) }),
        ...(data.duration && { duration: data.duration }),
        ...(data.type && { type: data.type }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        project: true,
        task: true,
      },
    });

    revalidatePath("/dashboard/timesheet");
    return entry;
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
    return { success: true };
  });

// Soumettre les entrées pour validation
export const submitTimesheetEntries = authActionClient
  .schema(z.object({ entryIds: z.array(z.string()) }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { entryIds } = parsedInput;

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

    revalidatePath("/dashboard/timesheet");
    return result;
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
