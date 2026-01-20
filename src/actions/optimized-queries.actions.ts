'use server'

import { prisma } from '@/lib/db'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'

/**
 * Fichier regroupant les requêtes optimisées pour utiliser les index de la base de données
 * Ces fonctions sont conçues pour maximiser les performances en utilisant les index existants
 */

// ========================================
// USERS - Index: User_departmentId_idx, User_lastSeenAt_idx
// ========================================

/**
 * Récupérer les utilisateurs d'un département
 * Utilise l'index User_departmentId_idx pour des performances optimales
 */
export const getUsersByDepartment = authActionClient
  .schema(
    z.object({
      departmentId: z.string(),
      includeInactive: z.boolean().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { departmentId, includeInactive } = parsedInput
    const { userRole } = ctx

    // Vérifier les permissions
    if (!['MANAGER', 'DIRECTEUR', 'ADMIN', 'HR'].includes(userRole)) {
      throw new Error('Accès non autorisé')
    }

    // Cette requête utilise l'index User_departmentId_idx
    const users = await prisma.user.findMany({
      where: {
        departmentId,
        // Par défaut, exclure les utilisateurs qui ont pu être désactivés d'une manière ou d'une autre
        ...(includeInactive ? {} : {}),
      },
      include: {
        Department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            HRTimesheet_HRTimesheet_userIdToUser: true,
            Task_Task_createdByToUser: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    })

    // Calculer les statistiques par rôle
    const roleStats = {
      EMPLOYEE: users.filter((u) => u.role === 'EMPLOYEE').length,
      MANAGER: users.filter((u) => u.role === 'MANAGER').length,
      HR: users.filter((u) => u.role === 'HR').length,
      DIRECTEUR: users.filter((u) => u.role === 'DIRECTEUR').length,
      ADMIN: users.filter((u) => u.role === 'ADMIN').length,
    }

    return { users, totalUsers: users.length, roleStats }
  })

/**
 * Récupérer les utilisateurs récemment actifs
 * Utilise l'index User_lastSeenAt_idx pour des performances optimales
 */
export const getRecentlyActiveUsers = authActionClient
  .schema(
    z.object({
      hours: z.number().min(1).max(168).optional(), // Par défaut 24h, max 1 semaine
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { hours = 24 } = parsedInput
    const { userRole } = ctx

    // Vérifier les permissions
    if (!['MANAGER', 'DIRECTEUR', 'ADMIN', 'HR'].includes(userRole)) {
      throw new Error('Accès non autorisé')
    }

    // Calculer la date limite (maintenant - X heures)
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hours)

    // Cette requête utilise l'index User_lastSeenAt_idx
    const users = await prisma.user.findMany({
      where: {
        lastSeenAt: {
          gte: cutoffDate,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        lastSeenAt: true,
        Department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    })

    return { users, totalActive: users.length, hours }
  })

// ========================================
// PROJECTS - Index: Project_departmentId_idx
// ========================================

/**
 * Récupérer les projets d'un département
 * Utilise l'index Project_departmentId_idx pour des performances optimales
 */
export const getProjectsByDepartment = authActionClient
  .schema(
    z.object({
      departmentId: z.string(),
      includeInactive: z.boolean().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { departmentId, includeInactive } = parsedInput

    // Cette requête utilise l'index Project_departmentId_idx
    const projects = await prisma.project.findMany({
      where: {
        departmentId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        Department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    })

    // Calculer les statistiques
    const stats = {
      total: projects.length,
      active: projects.filter((p) => p.isActive).length,
      inactive: projects.filter((p) => !p.isActive).length,
    }

    return { projects, stats }
  })

// ========================================
// ACCOUNTS - Index: Account_userId_idx
// ========================================

/**
 * Récupérer les comptes liés à un utilisateur
 * Utilise l'index Account_userId_idx pour des performances optimales
 */
export const getUserAccounts = authActionClient
  .schema(
    z.object({
      userId: z.string().optional(), // Si non fourni, utilise l'utilisateur connecté
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = parsedInput
    const targetUserId = userId || ctx.userId

    // Vérifier les permissions
    if (targetUserId !== ctx.userId && ctx.userRole !== 'ADMIN') {
      throw new Error('Vous ne pouvez voir que vos propres comptes')
    }

    // Cette requête utilise l'index Account_userId_idx
    const accounts = await prisma.account.findMany({
      where: {
        userId: targetUserId,
      },
      select: {
        id: true,
        providerId: true,
        createdAt: true,
        updatedAt: true,
        accessTokenExpiresAt: true,
        // Exclure les tokens sensibles
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { accounts, totalAccounts: accounts.length }
  })

// ========================================
// REPORTS - Index: Report_templateId_idx, ReportTemplate_createdById_idx
// ========================================

/**
 * Récupérer les rapports générés à partir d'un template
 * Utilise l'index Report_templateId_idx pour des performances optimales
 */
export const getReportsByTemplate = authActionClient
  .schema(
    z.object({
      templateId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { templateId, startDate, endDate } = parsedInput
    const { userRole } = ctx

    // Vérifier les permissions
    if (!['MANAGER', 'DIRECTEUR', 'ADMIN', 'HR'].includes(userRole)) {
      throw new Error('Accès non autorisé')
    }

    // Construire le filtre de dates
    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.gte = startDate
      if (endDate) dateFilter.createdAt.lte = endDate
    }

    // Cette requête utilise l'index Report_templateId_idx
    const reports = await prisma.report.findMany({
      where: {
        templateId,
        ...dateFilter,
      },
      include: {
        ReportTemplate: {
          select: {
            id: true,
            name: true,
            frequency: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculer les statistiques
    const stats = {
      total: reports.length,
      avgFileSize:
        reports.length > 0 ? reports.reduce((sum, r) => sum + r.fileSize, 0) / reports.length : 0,
      formats: {
        pdf: reports.filter((r) => r.format === 'pdf').length,
        word: reports.filter((r) => r.format === 'word').length,
        excel: reports.filter((r) => r.format === 'excel').length,
      },
    }

    return { reports, stats }
  })

/**
 * Récupérer les templates de rapports créés par un utilisateur
 * Utilise l'index ReportTemplate_createdById_idx pour des performances optimales
 */
export const getTemplatesByCreator = authActionClient
  .schema(
    z.object({
      creatorId: z.string().optional(), // Si non fourni, utilise l'utilisateur connecté
      includeInactive: z.boolean().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { creatorId, includeInactive } = parsedInput
    const targetCreatorId = creatorId || ctx.userId

    // Vérifier les permissions
    if (
      targetCreatorId !== ctx.userId &&
      !['MANAGER', 'DIRECTEUR', 'ADMIN', 'HR'].includes(ctx.userRole)
    ) {
      throw new Error('Vous ne pouvez voir que vos propres templates')
    }

    // Cette requête utilise l'index ReportTemplate_createdById_idx
    const templates = await prisma.reportTemplate.findMany({
      where: {
        createdById: targetCreatorId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        frequency: true,
        format: true,
        templateContent: true,
        variables: true,
        isActive: true,
        isDefault: true,
        sortOrder: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    // Calculer les statistiques
    const stats = {
      total: templates.length,
      active: templates.filter((t) => t.isActive).length,
      inactive: templates.filter((t) => !t.isActive).length,
      defaults: templates.filter((t) => t.isDefault).length,
      frequencies: {
        WEEKLY: templates.filter((t) => t.frequency === 'WEEKLY').length,
        MONTHLY: templates.filter((t) => t.frequency === 'MONTHLY').length,
        INDIVIDUAL: templates.filter((t) => t.frequency === 'INDIVIDUAL').length,
      },
    }

    return { templates, stats }
  })
