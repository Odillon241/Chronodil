"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

// ============================================
// SCHEMAS DE VALIDATION
// ============================================

const createReportSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().default(""),
  format: z.enum(["pdf", "word", "excel"]).default("pdf"),
  period: z.string().optional(),
  includeSummary: z.boolean().default(false),
});

const updateReportSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  format: z.enum(["pdf", "word", "excel"]).optional(),
  period: z.string().optional(),
  includeSummary: z.boolean().optional(),
});

const deleteReportSchema = z.object({
  id: z.string(),
});

// ============================================
// REPORT CRUD
// ============================================

/**
 * Créer un nouveau rapport
 */
export const createReport = authActionClient
  .schema(createReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    const report = await prisma.report.create({
      data: {
        id: nanoid(),
        title: parsedInput.title,
        content: parsedInput.content,
        format: parsedInput.format,
        period: parsedInput.period,
        includeSummary: parsedInput.includeSummary,
        createdById: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/reports");
    return report;
  });

/**
 * Mettre à jour un rapport
 */
export const updateReport = authActionClient
  .schema(updateReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id, ...updateData } = parsedInput;

    // Vérifier que le rapport appartient à l'utilisateur
    const existingReport = await prisma.report.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!existingReport) {
      throw new Error("Rapport non trouvé");
    }

    if (existingReport.createdById !== userId) {
      throw new Error("Vous n'avez pas la permission de modifier ce rapport");
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/reports");
    revalidatePath(`/dashboard/reports/${id}`);
    return report;
  });

/**
 * Supprimer un rapport
 */
export const deleteReport = authActionClient
  .schema(deleteReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id } = parsedInput;

    // Vérifier que le rapport appartient à l'utilisateur
    const existingReport = await prisma.report.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!existingReport) {
      throw new Error("Rapport non trouvé");
    }

    if (existingReport.createdById !== userId) {
      throw new Error("Vous n'avez pas la permission de supprimer ce rapport");
    }

    await prisma.report.delete({
      where: { id },
    });

    revalidatePath("/dashboard/reports");
    return { success: true };
  });

/**
 * Récupérer tous les rapports de l'utilisateur
 */
export const getUserReports = authActionClient.action(async ({ ctx }) => {
  const { userId } = ctx;

  const reports = await prisma.report.findMany({
    where: {
      createdById: userId,
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return reports;
});

/**
 * Récupérer un rapport spécifique
 */
export const getReportById = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id } = parsedInput;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ReportRecipient: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new Error("Rapport non trouvé");
    }

    if (report.createdById !== userId) {
      throw new Error("Vous n'avez pas la permission de voir ce rapport");
    }

    return report;
  });

/**
 * Récupérer les données pour insertion dans le rapport
 */
export const getReportSourceData = authActionClient
  .schema(
    z.object({
      includeTimesheets: z.boolean().default(false),
      includeTasks: z.boolean().default(false),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      projectId: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { includeTimesheets, includeTasks, startDate, endDate, projectId } = parsedInput;

    const data: any = {};

    // Récupérer les feuilles de temps
    if (includeTimesheets) {
      const where: any = {
        userId,
      };

      if (startDate && endDate) {
        where.weekStartDate = {
          gte: startDate,
          lte: endDate,
        };
      }

      data.timesheets = await prisma.hRTimesheet.findMany({
        where,
        include: {
          HRActivity: {
            select: {
              id: true,
              activityName: true,
              totalHours: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: {
          weekStartDate: "desc",
        },
      });
    }

    // Récupérer les tâches
    if (includeTasks) {
      const where: any = {
        createdBy: userId,
        isActive: true,
      };

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      if (projectId && projectId !== "all") {
        where.projectId = projectId;
      }

      data.tasks = await prisma.task.findMany({
        where,
        include: {
          Project: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return data;
  });
