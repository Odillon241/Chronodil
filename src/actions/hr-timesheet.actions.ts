'use server'

import { authActionClient } from '@/lib/safe-action'
import { prisma } from '@/lib/db'
import {
  hrTimesheetSchema,
  hrActivitySchema,
  submitHRTimesheetSchema,
  managerApprovalSchema,
  odillonApprovalSchema,
  revertHRTimesheetStatusSchema,
  hrTimesheetFilterSchema,
  activityCatalogFilterSchema,
  hrTimesheetBaseSchema,
  hrActivityBaseSchema,
} from '@/lib/validations/hr-timesheet'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { calculateWorkingHours } from '@/lib/business-hours'
import { createAuditLog, AuditActions, AuditEntities } from '@/lib/audit'
import { revalidateTag } from 'next/cache'
import { CacheTags } from '@/lib/cache'

// ⚡ Fonctions d'invalidation du cache HR Timesheet
async function invalidateAfterTimesheetCreate(timesheetId: string, _userId: string) {
  revalidatePath('/dashboard/hr-timesheet')
  revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
  revalidateTag(CacheTags.HR_TIMESHEETS, 'max')
}

async function invalidateAfterTimesheetSubmit(timesheetId: string, _userId: string) {
  revalidatePath('/dashboard/hr-timesheet')
  revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
  revalidateTag(CacheTags.HR_TIMESHEETS, 'max')
}

async function invalidateAfterManagerApproval(
  timesheetId: string,
  _employeeUserId: string,
  _managerId: string,
) {
  revalidatePath('/dashboard/hr-timesheet')
  revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
  revalidateTag(CacheTags.HR_TIMESHEETS, 'max')
}

async function invalidateAfterOdillonApproval(
  timesheetId: string,
  _employeeUserId: string,
  _odillonId: string,
) {
  revalidatePath('/dashboard/hr-timesheet')
  revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
  revalidateTag(CacheTags.HR_TIMESHEETS, 'max')
}

async function invalidateAfterActivityChange(
  _activityId: string,
  timesheetId: string,
  _userId: string,
  taskId?: string,
) {
  revalidatePath('/dashboard/hr-timesheet')
  revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
  revalidatePath(`/dashboard/hr-timesheet/${timesheetId}/edit`)
  revalidateTag(CacheTags.HR_TIMESHEETS, 'max')
  if (taskId) {
    revalidateTag(CacheTags.TASKS, 'max')
  }
}

async function invalidateAfterTimesheetDelete(userId: string, hadLinkedTasks: boolean) {
  revalidatePath('/dashboard/hr-timesheet')
  revalidateTag(CacheTags.HR_TIMESHEETS, 'max')
  if (hadLinkedTasks) {
    revalidateTag(CacheTags.TASKS, 'max')
  }
}

async function invalidateHRTimesheetCache(timesheetId: string, _userId: string) {
  revalidatePath('/dashboard/hr-timesheet')
  revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
  revalidatePath(`/dashboard/hr-timesheet/${timesheetId}/edit`)
  revalidateTag(CacheTags.HR_TIMESHEETS, 'max')
}

// ============================================
// TIMESHEET RH - CRUD
// ============================================

/**
 * Créer un nouveau timesheet RH hebdomadaire
 */
export const createHRTimesheet = authActionClient
  .schema(hrTimesheetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx

    // Vérifier qu'il n'existe pas déjà un timesheet pour cette semaine
    const existingTimesheet = await prisma.hRTimesheet.findUnique({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: parsedInput.weekStartDate,
        },
      },
    })

    if (existingTimesheet) {
      throw new Error('Un timesheet existe déjà pour cette semaine')
    }

    // Récupérer les infos utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Department: true },
    })

    if (!user) {
      throw new Error('Utilisateur non trouvé')
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
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        HRActivity: true,
        User_HRTimesheet_userIdToUser: true,
      },
    })

    // Créer un log d'audit
    await createAuditLog({
      userId: userId,
      action: AuditActions.CREATE,
      entity: AuditEntities.HRTIMESHEET,
      entityId: timesheet.id,
      changes: {
        weekStartDate: timesheet.weekStartDate,
        weekEndDate: timesheet.weekEndDate,
        status: timesheet.status,
        employeeName: timesheet.employeeName,
      },
    })

    revalidatePath('/dashboard/hr-timesheet')
    // ⚡ Phase 2: Invalidation cache Next.js 16
    await invalidateAfterTimesheetCreate(timesheet.id, userId)
    return timesheet
  })

/**
 * Récupérer les timesheets RH de l'utilisateur
 */
export const getMyHRTimesheets = authActionClient
  .schema(hrTimesheetFilterSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { userId } = ctx
      const { status, weekStartDate, weekEndDate } = parsedInput

      const timesheets = await prisma.hRTimesheet.findMany({
        where: {
          userId,
          ...(status && status !== 'all' && { status }),
          ...(weekStartDate && { weekStartDate: { gte: weekStartDate } }),
          ...(weekEndDate && { weekEndDate: { lte: weekEndDate } }),
        },
        include: {
          HRActivity: {
            include: {
              ActivityCatalog: true,
              Task: {
                include: {
                  Project: {
                    select: {
                      name: true,
                      color: true,
                    },
                  },
                  User_Task_createdByToUser: {
                    select: {
                      name: true,
                      email: true,
                      avatar: true,
                      image: true,
                    },
                  },
                  TaskMember: {
                    include: {
                      User: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          avatar: true,
                          image: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          User_HRTimesheet_userIdToUser: true,
          User_HRTimesheet_managerSignedByIdToUser: true,
          User_HRTimesheet_odillonSignedByIdToUser: true,
        },
        orderBy: {
          weekStartDate: 'desc',
        },
      })

      return timesheets
    } catch (error) {
      console.error('Erreur dans getMyHRTimesheets:', error)
      throw new Error(
        `Erreur lors de la récupération des timesheets: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      )
    }
  })

/**
 * Récupérer les timesheets RH en attente de validation (pour manager/admin)
 */
export const getHRTimesheetsForApproval = authActionClient
  .schema(hrTimesheetFilterSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId: _userId, userRole } = ctx
    const { status, weekStartDate, weekEndDate } = parsedInput

    // Construire les conditions de filtre
    const whereConditions: any = {
      ...(status && status !== 'all' && { status }),
      ...(weekStartDate && { weekStartDate: { gte: weekStartDate } }),
      ...(weekEndDate && { weekEndDate: { lte: weekEndDate } }),
    }

    // Nouvelle logique : Les utilisateurs avec les rôles MANAGER, DIRECTEUR ou ADMIN
    // peuvent voir toutes les feuilles de temps en attente, sans avoir besoin
    // qu'un manager particulier soit assigné à l'utilisateur

    // ADMIN voit PENDING et MANAGER_APPROVED (comme le manager + les feuilles approuvées par manager)
    if (userRole === 'ADMIN') {
      whereConditions.status = { in: ['PENDING', 'MANAGER_APPROVED'] }
    }
    // MANAGER ou DIRECTEUR ne voient que PENDING
    else if (userRole === 'MANAGER' || userRole === 'DIRECTEUR') {
      whereConditions.status = { in: ['PENDING'] }
    }
    // HR ne voit que MANAGER_APPROVED (2ème niveau de validation)
    else if (userRole === 'HR') {
      whereConditions.status = { in: ['MANAGER_APPROVED'] }
    }

    try {
      const timesheets = await prisma.hRTimesheet.findMany({
        where: whereConditions,
        include: {
          HRActivity: {
            include: {
              ActivityCatalog: true,
              Task: {
                include: {
                  Project: {
                    select: {
                      name: true,
                      color: true,
                    },
                  },
                  User_Task_createdByToUser: {
                    select: {
                      name: true,
                      email: true,
                      avatar: true,
                      image: true,
                    },
                  },
                  TaskMember: {
                    include: {
                      User: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          avatar: true,
                          image: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          User_HRTimesheet_userIdToUser: true,
          User_HRTimesheet_managerSignedByIdToUser: true,
          User_HRTimesheet_odillonSignedByIdToUser: true,
          _count: {
            select: {
              HRActivity: true,
            },
          },
        },
        orderBy: {
          weekStartDate: 'desc',
        },
      })

      return timesheets
    } catch (error) {
      console.error('Erreur dans getHRTimesheetsForApproval:', error)
      throw new Error(
        `Erreur lors de la récupération des timesheets: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      )
    }
  })

/**
 * Récupérer les timesheets RH validés/rejetés par l'utilisateur connecté
 * Permet aux managers et admins de revoir leurs validations
 */
export const getHRTimesheetsValidatedByMe = authActionClient
  .schema(hrTimesheetFilterSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx
    const { status, weekStartDate, weekEndDate } = parsedInput

    // Construire les conditions de filtre
    const whereConditions: any = {
      ...(weekStartDate && { weekStartDate: { gte: weekStartDate } }),
      ...(weekEndDate && { weekEndDate: { lte: weekEndDate } }),
    }

    // Filtrer selon le rôle de l'utilisateur
    if (userRole === 'MANAGER' || userRole === 'DIRECTEUR') {
      // Les managers et directeurs voient les feuilles qu'ils ont validées (pas les rejetées)
      whereConditions.managerSignedById = userId
      // Inclure uniquement les statuts validés par le manager/directeur (exclure REJECTED)
      if (!status || status === 'all') {
        whereConditions.status = { in: ['MANAGER_APPROVED', 'APPROVED'] }
      } else if (status === 'REJECTED') {
        // Si REJECTED est demandé, ne rien retourner (les rejetés sont dans l'onglet "Rejeté")
        // Utiliser une condition qui ne correspondra jamais
        whereConditions.id = 'NEVER_MATCH'
      } else {
        // Si un statut spécifique est demandé, l'utiliser
        whereConditions.status = status
      }
    } else if (userRole === 'ADMIN' || userRole === 'HR') {
      // Les admins/HR voient les feuilles qu'ils ont validées (pas les rejetées)
      whereConditions.odillonSignedById = userId
      // Inclure uniquement les statuts validés par Odillon (exclure REJECTED)
      if (!status || status === 'all') {
        whereConditions.status = { in: ['APPROVED'] }
      } else if (status === 'REJECTED') {
        // Si REJECTED est demandé, ne rien retourner (les rejetés sont dans l'onglet "Rejeté")
        // Utiliser une condition qui ne correspondra jamais
        whereConditions.id = 'NEVER_MATCH'
      } else {
        // Si un statut spécifique est demandé, l'utiliser
        whereConditions.status = status
      }
    } else {
      // Les autres utilisateurs n'ont pas accès à cette fonctionnalité
      throw new Error("Vous n'avez pas la permission d'accéder à cette fonctionnalité")
    }

    try {
      const timesheets = await prisma.hRTimesheet.findMany({
        where: whereConditions,
        include: {
          HRActivity: {
            include: {
              ActivityCatalog: true,
              Task: {
                include: {
                  Project: {
                    select: {
                      name: true,
                      color: true,
                    },
                  },
                  User_Task_createdByToUser: {
                    select: {
                      name: true,
                      email: true,
                      avatar: true,
                      image: true,
                    },
                  },
                  TaskMember: {
                    include: {
                      User: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          avatar: true,
                          image: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          User_HRTimesheet_userIdToUser: true,
          User_HRTimesheet_managerSignedByIdToUser: true,
          User_HRTimesheet_odillonSignedByIdToUser: true,
          _count: {
            select: {
              HRActivity: true,
            },
          },
        },
        orderBy: {
          weekStartDate: 'desc',
        },
      })

      return timesheets
    } catch (error) {
      console.error('Erreur dans getHRTimesheetsValidatedByMe:', error)
      throw new Error(
        `Erreur lors de la récupération des timesheets: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      )
    }
  })

/**
 * Récupérer un timesheet RH par ID
 */
export const getHRTimesheet = authActionClient
  .schema(z.object({ timesheetId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx
    const { timesheetId: id } = parsedInput

    const timesheet = await prisma.hRTimesheet.findUnique({
      where: { id },
      include: {
        HRActivity: {
          include: {
            ActivityCatalog: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        User_HRTimesheet_userIdToUser: {
          include: {
            Department: true,
            User: true, // Manager
          },
        },
        User_HRTimesheet_managerSignedByIdToUser: true,
        User_HRTimesheet_odillonSignedByIdToUser: true,
      },
    })

    if (!timesheet) {
      throw new Error('Timesheet non trouvé')
    }

    // Vérifier les permissions
    // Nouvelle logique : Les utilisateurs avec les rôles MANAGER, DIRECTEUR ou ADMIN
    // peuvent voir toutes les feuilles de temps, sans avoir besoin qu'un manager
    // particulier soit assigné à l'utilisateur
    const canView =
      timesheet.userId === userId ||
      userRole === 'ADMIN' ||
      userRole === 'HR' ||
      userRole === 'MANAGER' ||
      userRole === 'DIRECTEUR'

    if (!canView) {
      throw new Error("Vous n'avez pas la permission de voir ce timesheet")
    }

    return timesheet
  })

/**
 * Mettre à jour un timesheet RH
 */
export const updateHRTimesheet = authActionClient
  .schema(
    z.object({
      id: z.string(),
      data: hrTimesheetBaseSchema.partial(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { id, data } = parsedInput

    // Vérifier que le timesheet appartient à l'utilisateur et est en DRAFT
    const existingTimesheet = await prisma.hRTimesheet.findFirst({
      where: {
        id,
        userId,
        status: 'DRAFT',
      },
    })

    if (!existingTimesheet) {
      throw new Error('Timesheet non trouvé ou non modifiable')
    }

    const timesheet = await prisma.hRTimesheet.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        HRActivity: true,
        User_HRTimesheet_userIdToUser: true,
      },
    })

    // Créer un log d'audit
    await createAuditLog({
      userId: userId,
      action: AuditActions.UPDATE,
      entity: AuditEntities.HRTIMESHEET,
      entityId: id,
      changes: {
        previous: {
          status: existingTimesheet.status,
        },
        new: data,
      },
    })

    revalidatePath('/dashboard/hr-timesheet')
    revalidatePath(`/dashboard/hr-timesheet/${id}`)
    // ⚡ Phase 2: Invalidation cache Next.js 16
    await invalidateHRTimesheetCache(id, userId)
    return timesheet
  })

/**
 * Supprimer un timesheet RH
 */
export const deleteHRTimesheet = authActionClient
  .schema(z.object({ timesheetId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx
    const { timesheetId: id } = parsedInput

    // Récupérer le timesheet avec activités (pour cache invalidation)
    const existingTimesheet = await prisma.hRTimesheet.findUnique({
      where: { id },
      include: {
        User_HRTimesheet_userIdToUser: true,
        HRActivity: { select: { taskId: true } }, // Pour vérifier tâches liées
      },
    })

    if (!existingTimesheet) {
      throw new Error('Timesheet non trouvé')
    }

    // Vérifier les permissions de suppression
    const isOwner = existingTimesheet.userId === userId
    const isAdmin = userRole === 'ADMIN'
    const isDraft = existingTimesheet.status === 'DRAFT'

    // Seul le propriétaire peut supprimer un DRAFT, ou un ADMIN peut supprimer n'importe quel timesheet
    if (!isAdmin && (!isOwner || !isDraft)) {
      throw new Error('Timesheet non trouvé ou non supprimable')
    }

    // Supprimer les activités associées d'abord
    await prisma.hRActivity.deleteMany({
      where: {
        hrTimesheetId: id,
      },
    })

    // Vérifier si des activités ont des tâches liées
    const hadLinkedTasks = existingTimesheet.HRActivity.some((a) => a.taskId)

    // Supprimer le timesheet
    await prisma.hRTimesheet.delete({
      where: { id },
    })

    revalidatePath('/dashboard/hr-timesheet')
    // ⚡ Phase 2: Invalidation cache Next.js 16
    await invalidateAfterTimesheetDelete(existingTimesheet.userId, hadLinkedTasks)
    return { success: true }
  })

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
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { timesheetId, activity } = parsedInput

    // Vérifier que le timesheet appartient à l'utilisateur et est en DRAFT
    const timesheet = await prisma.hRTimesheet.findFirst({
      where: {
        id: timesheetId,
        userId,
        status: 'DRAFT',
      },
    })

    if (!timesheet) {
      throw new Error('Timesheet non trouvé ou non modifiable')
    }

    // Calculer les heures totales: utiliser la valeur fournie ou calculer automatiquement
    // Si totalHours est fourni par l'utilisateur, on l'utilise (priorité)
    // Sinon, on calcule automatiquement basé sur les jours ouvrables (8h/jour, lundi-vendredi)
    const calculatedWorkingHours = calculateWorkingHours(activity.startDate, activity.endDate)
    const totalHours =
      activity.totalHours !== undefined && activity.totalHours > 0
        ? activity.totalHours
        : calculatedWorkingHours

    console.log('📊 addHRActivity - Calcul heures:', {
      activityName: activity.activityName,
      totalHoursFromForm: activity.totalHours,
      startDate: activity.startDate,
      endDate: activity.endDate,
      calculatedWorkingHours: calculatedWorkingHours,
      finalTotalHours: totalHours,
      taskId: activity.taskId,
    })

    // Si aucune tâche n'est liée, créer automatiquement une tâche correspondante
    let linkedTaskId: string | undefined = activity.taskId

    if (!linkedTaskId) {
      // Convertir le statut HRActivity en statut Task
      const taskStatus = activity.status === 'COMPLETED' ? 'DONE' : 'IN_PROGRESS'

      console.log("🔄 Création automatique d'une tâche pour l'activité RH:", {
        activityName: activity.activityName,
        activityType: activity.activityType,
        periodicity: activity.periodicity,
      })

      const linkedTask = await prisma.task.create({
        data: {
          id: nanoid(),
          name: activity.activityName,
          description: activity.description,
          createdBy: userId,
          hrTimesheetId: timesheetId,
          status: taskStatus,
          priority: activity.priority || 'MEDIUM',
          complexity: (activity.complexity || 'MOYEN') as any,
          estimatedHours: activity.estimatedHours || totalHours,
          dueDate: activity.dueDate || activity.endDate,
          reminderDate: activity.reminderDate,
          reminderTime: activity.reminderTime,
          soundEnabled: activity.soundEnabled ?? true,
          isActive: true,
          // Nouveaux champs d'activité RH
          activityType: activity.activityType,
          activityName: activity.activityName,
          periodicity: activity.periodicity,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Ajouter le créateur comme membre de la tâche
      await prisma.taskMember.create({
        data: {
          id: nanoid(),
          taskId: linkedTask.id,
          userId: userId,
          role: 'creator',
        },
      })

      linkedTaskId = linkedTask.id

      console.log('✅ Tâche créée automatiquement:', {
        taskId: linkedTask.id,
        taskName: linkedTask.name,
      })
    }

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
        // Nouveaux champs Task-related
        taskId: linkedTaskId,
        priority: activity.priority,
        complexity: activity.complexity as any,
        estimatedHours: activity.estimatedHours,
        dueDate: activity.dueDate,
        reminderDate: activity.reminderDate,
        reminderTime: activity.reminderTime,
        soundEnabled: activity.soundEnabled ?? true,
        ...(activity.sharedWith && { sharedWith: activity.sharedWith }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        ActivityCatalog: true,
        Task: true,
      },
    })

    // Mettre à jour le total des heures du timesheet
    await updateTimesheetTotalHours(timesheetId)

    revalidatePath('/dashboard/hr-timesheet')
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
    revalidatePath('/dashboard/tasks')
    // ⚡ Phase 2: Invalidation cache Next.js 16
    await invalidateAfterActivityChange(newActivity.id, timesheetId, userId, linkedTaskId)
    return newActivity
  })

/**
 * Mettre à jour une activité RH
 */
export const updateHRActivity = authActionClient
  .schema(
    z.object({
      id: z.string(),
      data: hrActivityBaseSchema.partial(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { id, data } = parsedInput

    // Vérifier que l'activité appartient à un timesheet de l'utilisateur en DRAFT
    const activity = await prisma.hRActivity.findFirst({
      where: {
        id,
        HRTimesheet: {
          userId,
          status: 'DRAFT',
        },
      },
      include: {
        HRTimesheet: true,
      },
    })

    if (!activity) {
      throw new Error('Activité non trouvée ou non modifiable')
    }

    // Gérer totalHours : priorité à la valeur manuelle si fournie
    let totalHours = activity.totalHours
    if (data.totalHours !== undefined && data.totalHours > 0) {
      // L'utilisateur a fourni une valeur manuelle, on l'utilise
      totalHours = data.totalHours
    } else if (data.startDate || data.endDate) {
      // Si les dates changent et aucune valeur manuelle, recalculer automatiquement
      const startDate = data.startDate || activity.startDate
      const endDate = data.endDate || activity.endDate
      // Calculer les heures ouvrables (8h/jour, lundi-vendredi)
      totalHours = calculateWorkingHours(startDate, endDate)
    }

    // Exclure les champs problématiques et les gérer avec des casts
    const {
      taskId: _taskId,
      catalogId: _catalogId,
      complexity,
      totalHours: _totalHours,
      ...updateData
    } = data

    const updatedActivity = await prisma.hRActivity.update({
      where: { id },
      data: {
        ...updateData,
        ...(complexity ? { complexity: complexity as any } : {}),
        // Toujours mettre à jour totalHours si fourni ou si les dates ont changé
        ...(data.totalHours !== undefined || data.startDate || data.endDate ? { totalHours } : {}),
        updatedAt: new Date(),
      },
      include: {
        ActivityCatalog: true,
      },
    })

    // Mettre à jour le total des heures du timesheet
    await updateTimesheetTotalHours(activity.hrTimesheetId)

    revalidatePath('/dashboard/hr-timesheet')
    revalidatePath(`/dashboard/hr-timesheet/${activity.hrTimesheetId}`)
    // ⚡ Phase 2: Invalidation cache Next.js 16
    await invalidateAfterActivityChange(
      id,
      activity.hrTimesheetId,
      userId,
      updatedActivity.taskId || undefined,
    )
    return updatedActivity
  })

/**
 * Supprimer une activité RH
 */
export const deleteHRActivity = authActionClient
  .schema(z.object({ timesheetId: z.string(), activityId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { activityId: id } = parsedInput

    // Vérifier que l'activité appartient à un timesheet de l'utilisateur en DRAFT
    const activity = await prisma.hRActivity.findFirst({
      where: {
        id,
        HRTimesheet: {
          userId,
          status: 'DRAFT',
        },
      },
      include: {
        HRTimesheet: true,
      },
    })

    if (!activity) {
      throw new Error('Activité non trouvée ou non supprimable')
    }

    // Sauvegarder taskId avant suppression
    const linkedTaskId = activity.taskId

    await prisma.hRActivity.delete({
      where: { id },
    })

    // Mettre à jour le total des heures du timesheet
    await updateTimesheetTotalHours(activity.hrTimesheetId)

    revalidatePath('/dashboard/hr-timesheet')
    revalidatePath(`/dashboard/hr-timesheet/${activity.hrTimesheetId}`)
    // ⚡ Phase 2: Invalidation cache Next.js 16
    await invalidateAfterActivityChange(
      id,
      activity.hrTimesheetId,
      userId,
      linkedTaskId || undefined,
    )
    return { success: true }
  })

// ============================================
// WORKFLOW DE VALIDATION
// ============================================

/**
 * Soumettre un timesheet RH pour validation
 */
export const submitHRTimesheet = authActionClient
  .schema(submitHRTimesheetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { timesheetId } = parsedInput

    // Vérifier que le timesheet appartient à l'utilisateur et est en DRAFT
    const timesheet = await prisma.hRTimesheet.findFirst({
      where: {
        id: timesheetId,
        userId,
        status: 'DRAFT',
      },
      include: {
        HRActivity: true,
        User_HRTimesheet_userIdToUser: true,
      },
    })

    if (!timesheet) {
      throw new Error('Timesheet non trouvé ou déjà soumis')
    }

    // Vérifier qu'il y a au moins une activité
    if (timesheet.HRActivity.length === 0) {
      throw new Error('Vous devez ajouter au moins une activité avant de soumettre')
    }

    // Plus besoin de vérifier qu'un manager est assigné
    // Les utilisateurs avec les rôles MANAGER, DIRECTEUR ou ADMIN peuvent valider toutes les feuilles

    // Signer et soumettre
    const updatedTimesheet = await prisma.hRTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: 'PENDING',
        employeeSignedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        HRActivity: true,
        User_HRTimesheet_userIdToUser: true,
      },
    })

    // Créer un log d'audit
    await createAuditLog({
      userId: userId,
      action: AuditActions.SUBMIT,
      entity: AuditEntities.HRTIMESHEET,
      entityId: timesheetId,
      changes: {
        previousStatus: timesheet.status,
        newStatus: 'PENDING',
        employeeSignedAt: updatedTimesheet.employeeSignedAt,
      },
    })

    // Notifier tous les utilisateurs avec les rôles MANAGER, DIRECTEUR ou ADMIN
    // qui peuvent valider les feuilles de temps
    const validators = await prisma.user.findMany({
      where: {
        role: { in: ['MANAGER', 'DIRECTEUR', 'ADMIN'] },
      },
    })

    // ⚡ FIX N+1: Batch insert au lieu de boucle (80-90% plus rapide)
    await prisma.notification.createMany({
      data: validators.map((validator) => ({
        id: nanoid(),
        userId: validator.id,
        title: 'Nouvelle feuille de temps RH à valider',
        message: `${timesheet.User_HRTimesheet_userIdToUser.name} a soumis sa feuille de temps hebdomadaire pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()}`,
        type: 'hr_timesheet_submitted',
        link: `/dashboard/hr-timesheet/${timesheetId}`,
      })),
      skipDuplicates: true,
    })

    // Récupérer les notifications créées pour push
    const validatorNotifications = await prisma.notification.findMany({
      where: {
        userId: { in: validators.map((v) => v.id) },
        type: 'hr_timesheet_submitted',
        link: `/dashboard/hr-timesheet/${timesheetId}`,
      },
      orderBy: { createdAt: 'desc' },
      take: validators.length,
    })

    // Envoyer les push notifications (fire and forget)
    if (validatorNotifications.length > 0) {
      const { sendPushNotificationsForNotifications } = await import('@/lib/notification-helpers')
      sendPushNotificationsForNotifications(
        validatorNotifications.map((n) => ({
          userId: n.userId,
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          link: n.link,
        })),
      ).catch(() => {
        /* Silently ignore push errors */
      })
    }

    revalidatePath('/dashboard/hr-timesheet')
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
    revalidatePath('/dashboard/hr-validations')
    // ⚡ Phase 2: Invalidation cache Next.js 16
    await invalidateAfterTimesheetSubmit(timesheetId, userId)

    return updatedTimesheet
  })

/**
 * Annuler la soumission d'un timesheet RH (le remettre en DRAFT)
 */
export const cancelHRTimesheetSubmission = authActionClient
  .schema(z.object({ timesheetId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { timesheetId } = parsedInput

    // Vérifier que le timesheet appartient à l'utilisateur et est en PENDING
    const timesheet = await prisma.hRTimesheet.findFirst({
      where: {
        id: timesheetId,
        userId,
        status: 'PENDING',
      },
      include: {
        User_HRTimesheet_userIdToUser: true,
      },
    })

    if (!timesheet) {
      throw new Error('Timesheet non trouvé ou ne peut pas être annulé')
    }

    // Remettre en DRAFT
    const updatedTimesheet = await prisma.hRTimesheet.update({
      where: { id: timesheetId },
      data: {
        status: 'DRAFT',
        employeeSignedAt: null,
        updatedAt: new Date(),
      },
      include: {
        HRActivity: true,
        User_HRTimesheet_userIdToUser: true,
      },
    })

    // Supprimer les notifications créées pour tous les validateurs (MANAGER, DIRECTEUR, ADMIN)
    const validators = await prisma.user.findMany({
      where: {
        role: { in: ['MANAGER', 'DIRECTEUR', 'ADMIN'] },
      },
      select: { id: true },
    })

    if (validators.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          userId: { in: validators.map((v) => v.id) },
          type: 'hr_timesheet_submitted',
          link: `/dashboard/hr-timesheet/${timesheetId}`,
        },
      })
    }

    revalidatePath('/dashboard/hr-timesheet')
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
    // ⚡ Phase 2: Invalidation cache Next.js 16
    await invalidateAfterTimesheetSubmit(timesheetId, userId)

    return updatedTimesheet
  })

/**
 * Approuver ou rejeter un timesheet RH (Manager)
 */
export const managerApproveHRTimesheet = authActionClient
  .schema(managerApprovalSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx
    const { timesheetId, action, comments } = parsedInput

    // Récupérer le timesheet
    const timesheet = await prisma.hRTimesheet.findUnique({
      where: { id: timesheetId },
      include: {
        User_HRTimesheet_userIdToUser: true,
      },
    })

    if (!timesheet) {
      throw new Error('Timesheet non trouvé')
    }

    // Nouvelle logique : Les utilisateurs avec les rôles MANAGER, DIRECTEUR ou ADMIN
    // peuvent valider toutes les feuilles de temps, sans avoir besoin qu'un manager
    // particulier soit assigné à l'utilisateur
    const canValidate =
      userRole === 'MANAGER' ||
      userRole === 'DIRECTEUR' ||
      userRole === 'ADMIN' ||
      userRole === 'HR'

    if (!canValidate) {
      throw new Error("Vous n'avez pas la permission de valider ce timesheet")
    }

    // Vérifier le statut
    if (timesheet.status !== 'PENDING') {
      throw new Error('Ce timesheet ne peut pas être validé dans son état actuel')
    }

    const newStatus = action === 'approve' ? 'MANAGER_APPROVED' : 'REJECTED'

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
        HRActivity: true,
        User_HRTimesheet_userIdToUser: true,
        User_HRTimesheet_managerSignedByIdToUser: true,
      },
    })

    // Créer un log d'audit
    await createAuditLog({
      userId: userId,
      action: action === 'approve' ? AuditActions.APPROVE : AuditActions.REJECT,
      entity: AuditEntities.HRTIMESHEET,
      entityId: timesheetId,
      changes: {
        previousStatus: timesheet.status,
        newStatus: newStatus,
        approverRole: 'MANAGER',
        comments: comments,
      },
    })

    // Notifier l'employé
    const _employeeNotification = await prisma.notification.create({
      data: {
        id: nanoid(),
        userId: timesheet.userId,
        title:
          action === 'approve'
            ? 'Feuille de temps RH approuvée par votre manager'
            : 'Feuille de temps RH rejetée',
        message:
          action === 'approve'
            ? `Votre feuille de temps pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()} a été approuvée par votre manager${
                comments ? `: ${comments}` : ''
              }`
            : `Votre feuille de temps pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()} a été rejetée${
                comments ? `: ${comments}` : ''
              }`,
        type: action === 'approve' ? 'success' : 'warning',
        link: `/dashboard/hr-timesheet/${timesheetId}`,
      },
    })

    // Si approuvé, notifier Odillon (Admin/HR)
    if (action === 'approve') {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'HR'] },
        },
      })

      // ⚡ FIX N+1: Batch insert au lieu de boucle
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          id: nanoid(),
          userId: admin.id,
          title: 'Feuille de temps RH en attente de validation finale',
          message: `La feuille de temps de ${timesheet.User_HRTimesheet_userIdToUser.name} pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()} est en attente de votre validation finale`,
          type: 'hr_timesheet_pending_final',
          link: `/dashboard/hr-timesheet/${timesheetId}`,
        })),
        skipDuplicates: true,
      })

      // Récupérer les notifications créées pour push
      const adminNotifications = await prisma.notification.findMany({
        where: {
          userId: { in: admins.map((a) => a.id) },
          type: 'hr_timesheet_pending_final',
          link: `/dashboard/hr-timesheet/${timesheetId}`,
        },
        orderBy: { createdAt: 'desc' },
        take: admins.length,
      })

      // Envoyer les push notifications (fire and forget)
      if (adminNotifications.length > 0) {
        const { sendPushNotificationsForNotifications } = await import('@/lib/notification-helpers')
        sendPushNotificationsForNotifications(
          adminNotifications.map((n) => ({
            userId: n.userId,
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            link: n.link,
          })),
        ).catch(() => {
          /* Silently ignore push errors */
        })
      }
    }

    revalidatePath('/dashboard/hr-timesheet')
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
    revalidatePath('/dashboard/hr-validations')
    // ⚡ Phase 2: Invalidation cache Next.js 16
    await invalidateAfterManagerApproval(timesheetId, timesheet.userId, userId)

    return updatedTimesheet
  })

/**
 * Validation finale par Odillon (Admin/HR)
 */
export const odillonApproveHRTimesheet = authActionClient
  .schema(odillonApprovalSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx
    const { timesheetId, action, comments } = parsedInput

    // Vérifier que l'utilisateur est Admin ou HR
    if (userRole !== 'ADMIN' && userRole !== 'HR') {
      throw new Error('Seuls les administrateurs et RH peuvent effectuer la validation finale')
    }

    // Récupérer le timesheet
    const timesheet = await prisma.hRTimesheet.findUnique({
      where: { id: timesheetId },
      include: {
        User_HRTimesheet_userIdToUser: true,
      },
    })

    if (!timesheet) {
      throw new Error('Timesheet non trouvé')
    }

    // Vérifier le statut
    if (timesheet.status !== 'MANAGER_APPROVED') {
      throw new Error("Ce timesheet doit d'abord être approuvé par le manager")
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

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
        HRActivity: true,
        User_HRTimesheet_userIdToUser: true,
        User_HRTimesheet_managerSignedByIdToUser: true,
        User_HRTimesheet_odillonSignedByIdToUser: true,
      },
    })

    // Créer un log d'audit
    await createAuditLog({
      userId: userId,
      action: action === 'approve' ? AuditActions.APPROVE : AuditActions.REJECT,
      entity: AuditEntities.HRTIMESHEET,
      entityId: timesheetId,
      changes: {
        previousStatus: timesheet.status,
        newStatus: newStatus,
        approverRole: userRole,
        comments: comments,
      },
    })

    // Notifier l'employé
    const finalEmployeeNotification = await prisma.notification.create({
      data: {
        id: nanoid(),
        userId: timesheet.userId,
        title:
          action === 'approve'
            ? 'Feuille de temps RH validée définitivement'
            : 'Feuille de temps RH rejetée',
        message:
          action === 'approve'
            ? `Votre feuille de temps pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()} a été validée définitivement${
                comments ? `: ${comments}` : ''
              }`
            : `Votre feuille de temps pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()} a été rejetée lors de la validation finale${
                comments ? `: ${comments}` : ''
              }`,
        type: action === 'approve' ? 'success' : 'warning',
        link: `/dashboard/hr-timesheet/${timesheetId}`,
      },
    })

    // Envoyer la push notification (fire and forget)
    const { sendPushNotificationForNotification: sendPush } =
      await import('@/lib/notification-helpers')
    sendPush(timesheet.userId, {
      id: finalEmployeeNotification.id,
      title: finalEmployeeNotification.title,
      message: finalEmployeeNotification.message,
      type: finalEmployeeNotification.type,
      link: finalEmployeeNotification.link,
    }).catch(() => {
      /* Silently ignore push errors */
    })

    revalidatePath('/dashboard/hr-timesheet')
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
    revalidatePath('/dashboard/hr-validations')
    // ⚡ Phase 2: Invalidation cache Next.js 16
    await invalidateAfterOdillonApproval(timesheetId, timesheet.userId, userId)

    return updatedTimesheet
  })

// ============================================
// CATALOGUE D'ACTIVITÉS & RAPPORTS
// ============================================

/**
 * Récupérer le catalogue d'activités RH
 */
export const getActivityCatalog = authActionClient
  .schema(activityCatalogFilterSchema)
  .action(async ({ parsedInput }) => {
    const { category, type, isActive } = parsedInput

    const activities = await prisma.activityCatalog.findMany({
      where: {
        ...(category && { category }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return activities
  })

/**
 * Récupérer les types de rapports
 */
export const getReportTypes = authActionClient.action(async () => {
  const reportTypes = await prisma.reportType.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  })

  return reportTypes
})

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
    distinct: ['category'],
    orderBy: {
      category: 'asc',
    },
  })

  return activities.map((a) => a.category)
})

/**
 * Récupérer les timesheets RH disponibles pour créer une tâche liée
 * (Timesheets en DRAFT ou PENDING de l'utilisateur)
 */
export const getAvailableHRTimesheetsForTask = authActionClient.action(async ({ ctx }) => {
  const { userId } = ctx

  const timesheets = await prisma.hRTimesheet.findMany({
    where: {
      userId,
      status: {
        in: ['DRAFT', 'PENDING'],
      },
    },
    select: {
      id: true,
      weekStartDate: true,
      weekEndDate: true,
      status: true,
      employeeName: true,
    },
    orderBy: {
      weekStartDate: 'desc',
    },
    take: 10, // Limiter aux 10 derniers
  })

  return timesheets
})

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
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx
    const { startDate, endDate } = parsedInput

    const timesheets = await prisma.hRTimesheet.findMany({
      where: {
        userId,
        weekStartDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        HRActivity: true,
      },
    })

    const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0)
    const approvedHours = timesheets
      .filter((ts) => ts.status === 'APPROVED')
      .reduce((sum, ts) => sum + ts.totalHours, 0)
    const pendingHours = timesheets
      .filter((ts) => ts.status === 'PENDING' || ts.status === 'MANAGER_APPROVED')
      .reduce((sum, ts) => sum + ts.totalHours, 0)

    const activitiesByType = timesheets
      .flatMap((ts) => ts.HRActivity)
      .reduce(
        (acc, activity) => {
          acc[activity.activityType] = (acc[activity.activityType] || 0) + activity.totalHours
          return acc
        },
        {} as Record<string, number>,
      )

    const activitiesByCategory = timesheets
      .flatMap((ts) => ts.HRActivity)
      .reduce(
        (acc, activity) => {
          const category = activity.activityName
          acc[category] = (acc[category] || 0) + activity.totalHours
          return acc
        },
        {} as Record<string, number>,
      )

    return {
      totalHours,
      approvedHours,
      pendingHours,
      timesheetsCount: timesheets.length,
      activitiesCount: timesheets.reduce((sum, ts) => sum + ts.HRActivity.length, 0),
      activitiesByType,
      activitiesByCategory,
      statusBreakdown: {
        DRAFT: timesheets.filter((ts) => ts.status === 'DRAFT').length,
        PENDING: timesheets.filter((ts) => ts.status === 'PENDING').length,
        MANAGER_APPROVED: timesheets.filter((ts) => ts.status === 'MANAGER_APPROVED').length,
        APPROVED: timesheets.filter((ts) => ts.status === 'APPROVED').length,
        REJECTED: timesheets.filter((ts) => ts.status === 'REJECTED').length,
      },
    }
  })

// ============================================
// UTILITAIRES INTERNES
// ============================================

/**
 * Mettre à jour le statut d'un timesheet RH (pour drag & drop)
 */
export const updateHRTimesheetStatus = authActionClient
  .schema(
    z.object({
      timesheetId: z.string(),
      status: z.enum(['DRAFT', 'PENDING', 'MANAGER_APPROVED', 'APPROVED', 'REJECTED']),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx
    const { timesheetId, status } = parsedInput

    // Récupérer le timesheet
    const timesheet = await prisma.hRTimesheet.findUnique({
      where: { id: timesheetId },
      include: {
        User_HRTimesheet_userIdToUser: true,
      },
    })

    if (!timesheet) {
      throw new Error('Timesheet non trouvé')
    }

    // Vérifier les permissions selon le statut cible
    // L'utilisateur propriétaire peut uniquement mettre en DRAFT ou PENDING
    if (timesheet.userId === userId) {
      if (status !== 'DRAFT' && status !== 'PENDING') {
        throw new Error('Vous ne pouvez pas changer le statut vers cet état')
      }
    } else {
      // Nouvelle logique : Les utilisateurs avec les rôles MANAGER, DIRECTEUR ou ADMIN
      // peuvent modifier les timesheets, sans avoir besoin qu'un manager particulier
      // soit assigné à l'utilisateur
      const canModify =
        userRole === 'MANAGER' ||
        userRole === 'DIRECTEUR' ||
        userRole === 'ADMIN' ||
        userRole === 'HR'

      if (!canModify) {
        throw new Error("Vous n'avez pas la permission de modifier ce timesheet")
      }

      // Les managers et directeurs peuvent mettre en MANAGER_APPROVED ou REJECTED
      // Les admins peuvent mettre en APPROVED ou REJECTED
      if (
        (userRole === 'MANAGER' || userRole === 'DIRECTEUR') &&
        status !== 'MANAGER_APPROVED' &&
        status !== 'REJECTED' &&
        status !== 'PENDING'
      ) {
        throw new Error('Statut non autorisé pour un manager ou directeur')
      }

      if ((userRole === 'ADMIN' || userRole === 'HR') && status === 'MANAGER_APPROVED') {
        // Les admins ne peuvent pas mettre en MANAGER_APPROVED
        throw new Error('Statut non autorisé pour un administrateur')
      }
    }

    // Mettre à jour le statut
    const updatedTimesheet = await prisma.hRTimesheet.update({
      where: { id: timesheetId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        HRActivity: true,
        User_HRTimesheet_userIdToUser: true,
      },
    })

    revalidatePath('/dashboard/hr-timesheet')
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)
    return updatedTimesheet
  })

/**
 * Rétrograder le statut d'un timesheet RH (Admin uniquement)
 * Utilise les MCPs Supabase pour effectuer la mise à jour
 */
export const revertHRTimesheetStatus = authActionClient
  .schema(revertHRTimesheetStatusSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx
    const { timesheetId, targetStatus, reason } = parsedInput

    // Vérifier que l'utilisateur est Admin
    if (userRole !== 'ADMIN') {
      throw new Error("Seuls les administrateurs peuvent rétrograder le statut d'un timesheet")
    }

    // Récupérer le timesheet actuel avec Prisma
    const timesheet = await prisma.hRTimesheet.findUnique({
      where: { id: timesheetId },
      include: {
        User_HRTimesheet_userIdToUser: true,
      },
    })

    if (!timesheet) {
      throw new Error('Timesheet non trouvé')
    }

    // Vérifier que le timesheet est dans un état validé
    const validatedStatuses = ['MANAGER_APPROVED', 'APPROVED']
    if (!validatedStatuses.includes(timesheet.status)) {
      throw new Error('Seuls les timesheets validés peuvent être rétrogradés')
    }

    // Vérifier que le statut cible est antérieur au statut actuel
    const statusHierarchy = {
      DRAFT: 0,
      PENDING: 1,
      MANAGER_APPROVED: 2,
      APPROVED: 3,
      REJECTED: 3,
    }

    const currentLevel = statusHierarchy[timesheet.status as keyof typeof statusHierarchy] ?? 3
    const targetLevel = statusHierarchy[targetStatus]

    if (targetLevel >= currentLevel) {
      throw new Error('Le statut cible doit être antérieur au statut actuel')
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      status: targetStatus,
      updatedAt: new Date(),
    }

    // Nettoyer les champs de signature selon le statut cible
    if (targetStatus === 'DRAFT') {
      updateData.employeeSignedAt = null
      updateData.managerSignedAt = null
      updateData.managerSignedById = null
      updateData.odillonSignedAt = null
      updateData.odillonSignedById = null
      updateData.managerComments = null
      updateData.odillonComments = null
    } else if (targetStatus === 'PENDING') {
      // Garder employeeSignedAt, mais nettoyer les autres
      updateData.managerSignedAt = null
      updateData.managerSignedById = null
      updateData.odillonSignedAt = null
      updateData.odillonSignedById = null
      updateData.managerComments = null
      updateData.odillonComments = null
    } else if (targetStatus === 'MANAGER_APPROVED') {
      // Garder employeeSignedAt et managerSignedAt, mais nettoyer odillon
      updateData.odillonSignedAt = null
      updateData.odillonSignedById = null
      updateData.odillonComments = null
    }

    // ✅ SÉCURITÉ: Utiliser Prisma ORM au lieu de SQL brut pour éviter les injections SQL
    // Mise à jour sécurisée avec requêtes paramétrées Prisma
    await prisma.hRTimesheet.update({
      where: { id: timesheetId },
      data: updateData,
    })

    // Récupérer le timesheet mis à jour avec toutes les relations
    const updatedTimesheet = await prisma.hRTimesheet.findUnique({
      where: { id: timesheetId },
      include: {
        HRActivity: true,
        User_HRTimesheet_userIdToUser: true,
        User_HRTimesheet_managerSignedByIdToUser: true,
        User_HRTimesheet_odillonSignedByIdToUser: true,
      },
    })

    if (!updatedTimesheet) {
      throw new Error('Erreur lors de la mise à jour du timesheet')
    }

    // Créer un log d'audit pour tracer la rétrogradation
    await createAuditLog({
      userId,
      action: AuditActions.REVERT_TIMESHEET_STATUS,
      entity: AuditEntities.HRTIMESHEET,
      entityId: timesheetId,
      changes: {
        previousStatus: timesheet.status,
        newStatus: targetStatus,
        reason,
      },
    })

    // Notifier l'employé concerné
    const statusNotification = await prisma.notification.create({
      data: {
        id: nanoid(),
        userId: timesheet.userId,
        title: 'Statut de feuille de temps modifié',
        message: `Votre feuille de temps pour la semaine du ${timesheet.weekStartDate.toLocaleDateString()} a été rétrogradée de "${timesheet.status}" à "${targetStatus}". Raison: ${reason}`,
        type: 'warning',
        link: `/dashboard/hr-timesheet/${timesheetId}`,
      },
    })

    // Envoyer la push notification (fire and forget)
    const { sendPushNotificationForNotification } = await import('@/lib/notification-helpers')
    sendPushNotificationForNotification(timesheet.userId, {
      id: statusNotification.id,
      title: statusNotification.title,
      message: statusNotification.message,
      type: statusNotification.type,
      link: statusNotification.link,
    }).catch(() => {
      /* Silently ignore push errors */
    })

    revalidatePath('/dashboard/hr-timesheet')
    revalidatePath(`/dashboard/hr-timesheet/${timesheetId}`)

    return updatedTimesheet
  })

/**
 * Mettre à jour le total des heures d'un timesheet
 */
async function updateTimesheetTotalHours(timesheetId: string) {
  const activities = await prisma.hRActivity.findMany({
    where: {
      hrTimesheetId: timesheetId,
    },
  })

  const totalHours = activities.reduce((sum, activity) => sum + activity.totalHours, 0)

  await prisma.hRTimesheet.update({
    where: { id: timesheetId },
    data: {
      totalHours,
      updatedAt: new Date(),
    },
  })

  return totalHours
}

/**
 * Récupérer les timesheets validés/rejetés par un administrateur Odillon
 * Utilise l'index HRTimesheet_odillonSignedById_idx pour des performances optimales
 */
export const getHRTimesheetsValidatedByOdillon = authActionClient
  .schema(
    z.object({
      odillonUserId: z.string().optional(), // Si non fourni, utilise l'utilisateur connecté
      status: z.enum(['APPROVED', 'REJECTED']).optional(),
      weekStartDate: z.date().optional(),
      weekEndDate: z.date().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx
    const { odillonUserId, status, weekStartDate, weekEndDate } = parsedInput

    // Vérifier que l'utilisateur est Admin ou HR
    if (userRole !== 'ADMIN' && userRole !== 'HR') {
      throw new Error('Seuls les administrateurs et RH peuvent voir ces informations')
    }

    // Si odillonUserId n'est pas fourni, utiliser l'utilisateur connecté
    const validatorId = odillonUserId || userId

    // Construire les conditions de filtre
    const whereConditions: any = {
      odillonSignedById: validatorId,
      ...(weekStartDate && { weekStartDate: { gte: weekStartDate } }),
      ...(weekEndDate && { weekEndDate: { lte: weekEndDate } }),
    }

    // Ajouter le filtre de statut si spécifié
    if (status) {
      whereConditions.status = status
    } else {
      // Par défaut, montrer uniquement les statuts validés/rejetés
      whereConditions.status = { in: ['APPROVED', 'REJECTED'] }
    }

    // Cette requête utilise l'index HRTimesheet_odillonSignedById_idx
    const timesheets = await prisma.hRTimesheet.findMany({
      where: whereConditions,
      include: {
        User_HRTimesheet_userIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            Department: true,
          },
        },
        User_HRTimesheet_managerSignedByIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        HRActivity: {
          select: {
            id: true,
            activityName: true,
            activityType: true,
            totalHours: true,
            status: true,
          },
        },
        _count: {
          select: {
            HRActivity: true,
          },
        },
      },
      orderBy: [{ odillonSignedAt: 'desc' }, { weekStartDate: 'desc' }],
    })

    // Calculer les statistiques
    const stats = {
      total: timesheets.length,
      approved: timesheets.filter((t) => t.status === 'APPROVED').length,
      rejected: timesheets.filter((t) => t.status === 'REJECTED').length,
      totalHours: timesheets.reduce((sum, t) => sum + t.totalHours, 0),
    }

    return { timesheets, stats }
  })

/**
 * Récupérer les activités RH par catalogue
 * Utilise l'index HRActivity_catalogId_idx pour des performances optimales
 */
export const getHRActivitiesByCatalog = authActionClient
  .schema(
    z.object({
      catalogId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      status: z.enum(['IN_PROGRESS', 'COMPLETED']).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { catalogId, startDate, endDate, status } = parsedInput
    const { userRole } = ctx

    // Vérifier les permissions (managers et admins peuvent voir toutes les activités)
    if (!['MANAGER', 'DIRECTEUR', 'ADMIN', 'HR'].includes(userRole)) {
      throw new Error("Vous n'avez pas la permission de voir ces informations")
    }

    // Construire les conditions de filtre
    const whereConditions: any = {
      catalogId,
      ...(startDate && { startDate: { gte: startDate } }),
      ...(endDate && { endDate: { lte: endDate } }),
      ...(status && { status }),
    }

    // Cette requête utilise l'index HRActivity_catalogId_idx
    const activities = await prisma.hRActivity.findMany({
      where: whereConditions,
      include: {
        HRTimesheet: {
          include: {
            User_HRTimesheet_userIdToUser: {
              select: {
                id: true,
                name: true,
                email: true,
                position: true,
              },
            },
          },
        },
        ActivityCatalog: true,
        Task: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: [{ startDate: 'desc' }, { totalHours: 'desc' }],
    })

    // Calculer les statistiques
    const stats = {
      total: activities.length,
      inProgress: activities.filter((a) => a.status === 'IN_PROGRESS').length,
      completed: activities.filter((a) => a.status === 'COMPLETED').length,
      totalHours: activities.reduce((sum, a) => sum + a.totalHours, 0),
      avgHours:
        activities.length > 0
          ? activities.reduce((sum, a) => sum + a.totalHours, 0) / activities.length
          : 0,
    }

    return { activities, stats }
  })

/**
 * Récupérer les activités RH liées à une tâche
 * Utilise l'index HRActivity_taskId_idx pour des performances optimales
 */
export const getHRActivitiesByTask = authActionClient
  .schema(
    z.object({
      taskId: z.string(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { taskId } = parsedInput

    // Vérifier que la tâche existe et que l'utilisateur y a accès
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdBy: ctx.userId },
          {
            TaskMember: {
              some: {
                userId: ctx.userId,
              },
            },
          },
        ],
      },
    })

    if (!task && !['MANAGER', 'DIRECTEUR', 'ADMIN', 'HR'].includes(ctx.userRole)) {
      throw new Error('Tâche non trouvée ou accès non autorisé')
    }

    // Cette requête utilise l'index HRActivity_taskId_idx
    const activities = await prisma.hRActivity.findMany({
      where: {
        taskId,
      },
      include: {
        HRTimesheet: {
          include: {
            User_HRTimesheet_userIdToUser: {
              select: {
                id: true,
                name: true,
                email: true,
                position: true,
              },
            },
          },
        },
        ActivityCatalog: {
          select: {
            id: true,
            name: true,
            category: true,
            type: true,
          },
        },
      },
      orderBy: [{ startDate: 'desc' }],
    })

    // Calculer les statistiques
    const stats = {
      total: activities.length,
      inProgress: activities.filter((a) => a.status === 'IN_PROGRESS').length,
      completed: activities.filter((a) => a.status === 'COMPLETED').length,
      totalHours: activities.reduce((sum, a) => sum + a.totalHours, 0),
      timesheetsInvolved: new Set(activities.map((a) => a.hrTimesheetId)).size,
    }

    return { activities, stats }
  })
