'use server'

import { authActionClient } from '@/lib/safe-action'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'

// ============================================
// SCHEMAS DE VALIDATION
// ============================================

const createReportSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  content: z.string().default(''),
  format: z.enum(['pdf', 'word', 'excel']).default('pdf'),
  period: z.string().optional(),
  includeSummary: z.boolean().default(false),
})

const updateReportSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  format: z.enum(['pdf', 'word', 'excel']).optional(),
  period: z.string().optional(),
  includeSummary: z.boolean().optional(),
})

const deleteReportSchema = z.object({
  id: z.string(),
})

const duplicateReportSchema = z.object({
  id: z.string(),
  newTitle: z.string().optional(),
})

// ============================================
// REPORT CRUD
// ============================================

/**
 * Créer un nouveau rapport
 */
export const createReport = authActionClient
  .schema(createReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx

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
    })

    revalidatePath('/dashboard/reports')
    return report
  })

/**
 * Mettre à jour un rapport
 */
export const updateReport = authActionClient
  .schema(updateReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { id, ...updateData } = parsedInput

    // Vérifier que le rapport appartient à l'utilisateur
    const existingReport = await prisma.report.findUnique({
      where: { id },
      select: { createdById: true },
    })

    if (!existingReport) {
      throw new Error('Rapport non trouvé')
    }

    if (existingReport.createdById !== userId) {
      throw new Error("Vous n'avez pas la permission de modifier ce rapport")
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
    })

    revalidatePath('/dashboard/reports')
    revalidatePath(`/dashboard/reports/${id}`)
    return report
  })

/**
 * Supprimer un rapport
 */
export const deleteReport = authActionClient
  .schema(deleteReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { id } = parsedInput

    // Vérifier que le rapport appartient à l'utilisateur
    const existingReport = await prisma.report.findUnique({
      where: { id },
      select: { createdById: true },
    })

    if (!existingReport) {
      throw new Error('Rapport non trouvé')
    }

    if (existingReport.createdById !== userId) {
      throw new Error("Vous n'avez pas la permission de supprimer ce rapport")
    }

    await prisma.report.delete({
      where: { id },
    })

    revalidatePath('/dashboard/reports')
    return { success: true }
  })

/**
 * Dupliquer un rapport existant
 */
export const duplicateReport = authActionClient
  .schema(duplicateReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { id, newTitle } = parsedInput

    // Récupérer le rapport original
    const originalReport = await prisma.report.findUnique({
      where: { id },
      select: {
        title: true,
        content: true,
        format: true,
        period: true,
        includeSummary: true,
        reportType: true,
        templateId: true,
        createdById: true,
      },
    })

    if (!originalReport) {
      throw new Error('Rapport non trouvé')
    }

    // Vérifier les permissions (créateur ou admin/HR/manager)
    if (originalReport.createdById !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (user?.role !== 'ADMIN' && user?.role !== 'HR' && user?.role !== 'MANAGER') {
        throw new Error("Vous n'avez pas la permission de dupliquer ce rapport")
      }
    }

    // Créer le nouveau rapport avec un titre modifié
    const duplicatedTitle = newTitle || `${originalReport.title} (copie)`

    const report = await prisma.report.create({
      data: {
        id: nanoid(),
        title: duplicatedTitle,
        content: originalReport.content,
        format: originalReport.format,
        period: originalReport.period,
        includeSummary: originalReport.includeSummary,
        reportType: originalReport.reportType,
        templateId: originalReport.templateId,
        createdById: userId, // Le nouveau rapport appartient à l'utilisateur actuel
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
    })

    revalidatePath('/dashboard/reports')
    return report
  })

/**
 * Récupérer tous les rapports de l'utilisateur
 */
export const getUserReports = authActionClient.action(async ({ ctx }) => {
  const { userId } = ctx

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
      HRTimesheet: {
        select: {
          id: true,
          weekStartDate: true,
          weekEndDate: true,
          employeeName: true,
        },
      },
      ReportTemplate: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return reports
})

/**
 * Récupérer un rapport spécifique
 */
export const getReportById = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { id } = parsedInput

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
        ReportTemplate: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        HRTimesheet: {
          select: {
            id: true,
            employeeName: true,
            weekStartDate: true,
            weekEndDate: true,
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
    })

    if (!report) {
      throw new Error('Rapport non trouvé')
    }

    if (report.createdById !== userId) {
      throw new Error("Vous n'avez pas la permission de voir ce rapport")
    }

    return report
  })

/**
 * Récupérer les statistiques des rapports
 */
export const getReportStats = authActionClient.action(async ({ ctx }) => {
  const { userId } = ctx

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // Fetch all reports for the user
  const reports = await prisma.report.findMany({
    where: { createdById: userId },
    select: {
      id: true,
      reportType: true,
      format: true,
      createdAt: true,
    },
  })

  // Calculate stats
  const stats = {
    total: reports.length,
    weekly: reports.filter((r) => r.reportType === 'WEEKLY').length,
    monthly: reports.filter((r) => r.reportType === 'MONTHLY').length,
    individual: reports.filter((r) => !r.reportType || r.reportType === 'INDIVIDUAL').length,
    thisMonth: reports.filter((r) => new Date(r.createdAt) >= startOfMonth).length,
    thisYear: reports.filter((r) => new Date(r.createdAt) >= startOfYear).length,
    byFormat: {
      pdf: reports.filter((r) => r.format === 'pdf').length,
      word: reports.filter((r) => r.format === 'word').length,
      excel: reports.filter((r) => r.format === 'excel').length,
    },
  }

  return stats
})

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
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { includeTimesheets, includeTasks, startDate, endDate, projectId } = parsedInput

    const data: any = {}

    // Récupérer les feuilles de temps
    if (includeTimesheets) {
      const where: any = {
        userId,
      }

      if (startDate && endDate) {
        where.weekStartDate = {
          gte: startDate,
          lte: endDate,
        }
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
          weekStartDate: 'desc',
        },
      })
    }

    // Récupérer les tâches
    if (includeTasks) {
      const where: any = {
        createdBy: userId,
        isActive: true,
      }

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate,
        }
      }

      if (projectId && projectId !== 'all') {
        where.projectId = projectId
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
          createdAt: 'desc',
        },
      })
    }

    return data
  })
