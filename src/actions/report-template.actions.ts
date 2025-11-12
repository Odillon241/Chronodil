"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import {
  createReportTemplateSchema,
  updateReportTemplateSchema,
  deleteReportTemplateSchema,
  setDefaultTemplateSchema,
} from "@/lib/validations/report-template";

// ============================================
// REPORT TEMPLATE CRUD
// ============================================

/**
 * Créer un nouveau modèle de rapport
 */
export const createReportTemplate = authActionClient
  .schema(createReportTemplateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    const template = await prisma.reportTemplate.create({
      data: {
        id: nanoid(),
        name: parsedInput.name,
        description: parsedInput.description,
        frequency: parsedInput.frequency,
        format: parsedInput.format,
        templateContent: parsedInput.templateContent,
        variables: parsedInput.variables || [],
        isActive: parsedInput.isActive,
        isDefault: parsedInput.isDefault,
        sortOrder: parsedInput.sortOrder,
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

    revalidatePath("/dashboard/reports/templates");
    return template;
  });

/**
 * Mettre à jour un modèle de rapport
 */
export const updateReportTemplate = authActionClient
  .schema(updateReportTemplateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id, ...updateData } = parsedInput;

    // Vérifier que le modèle existe
    const existingTemplate = await prisma.reportTemplate.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!existingTemplate) {
      throw new Error("Modèle non trouvé");
    }

    // Seul le créateur ou un admin peut modifier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (existingTemplate.createdById !== userId && user?.role !== "ADMIN") {
      throw new Error("Vous n'avez pas la permission de modifier ce modèle");
    }

    const template = await prisma.reportTemplate.update({
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

    revalidatePath("/dashboard/reports/templates");
    revalidatePath(`/dashboard/reports/templates/${id}`);
    return template;
  });

/**
 * Supprimer un modèle de rapport
 */
export const deleteReportTemplate = authActionClient
  .schema(deleteReportTemplateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id } = parsedInput;

    // Vérifier que le modèle existe
    const existingTemplate = await prisma.reportTemplate.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!existingTemplate) {
      throw new Error("Modèle non trouvé");
    }

    // Seul le créateur ou un admin peut supprimer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (existingTemplate.createdById !== userId && user?.role !== "ADMIN") {
      throw new Error("Vous n'avez pas la permission de supprimer ce modèle");
    }

    await prisma.reportTemplate.delete({
      where: { id },
    });

    revalidatePath("/dashboard/reports/templates");
    return { success: true };
  });

/**
 * Définir un modèle comme défaut pour une fréquence donnée
 */
export const setDefaultReportTemplate = authActionClient
  .schema(setDefaultTemplateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id, frequency } = parsedInput;

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "HR") {
      throw new Error("Seuls les admins et RH peuvent définir un modèle par défaut");
    }

    // Désactiver tous les modèles par défaut pour cette fréquence
    await prisma.reportTemplate.updateMany({
      where: {
        frequency,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Activer le nouveau modèle par défaut
    const template = await prisma.reportTemplate.update({
      where: { id },
      data: {
        isDefault: true,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/reports/templates");
    return template;
  });

/**
 * Récupérer tous les modèles de rapports
 */
export const getReportTemplates = authActionClient.action(async ({ ctx }) => {
  const { userId } = ctx;

  const templates = await prisma.reportTemplate.findMany({
    where: {
      isActive: true,
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          Report: true,
        },
      },
    },
    orderBy: [
      { frequency: "asc" },
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  return templates;
});

/**
 * Récupérer un modèle de rapport spécifique
 */
export const getReportTemplateById = authActionClient
  .schema(deleteReportTemplateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { id } = parsedInput;

    const template = await prisma.reportTemplate.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Report: {
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error("Modèle non trouvé");
    }

    return template;
  });

/**
 * Récupérer les modèles par fréquence
 */
export const getReportTemplatesByFrequency = authActionClient
  .schema(setDefaultTemplateSchema.pick({ frequency: true }))
  .action(async ({ parsedInput, ctx }) => {
    const { frequency } = parsedInput;

    const templates = await prisma.reportTemplate.findMany({
      where: {
        frequency,
        isActive: true,
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
      orderBy: [
        { isDefault: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return templates;
  });

/**
 * Récupérer le modèle par défaut pour une fréquence
 */
export const getDefaultReportTemplate = authActionClient
  .schema(setDefaultTemplateSchema.pick({ frequency: true }))
  .action(async ({ parsedInput, ctx }) => {
    const { frequency } = parsedInput;

    const template = await prisma.reportTemplate.findFirst({
      where: {
        frequency,
        isDefault: true,
        isActive: true,
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

    // Si aucun modèle par défaut, retourner le premier actif
    if (!template) {
      return await prisma.reportTemplate.findFirst({
        where: {
          frequency,
          isActive: true,
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
          sortOrder: "asc",
        },
      });
    }

    return template;
  });
