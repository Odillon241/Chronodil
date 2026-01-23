'use server'

import { getSession, getUserRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { actionClient, authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { logTaskActivity, logTaskChanges } from '@/lib/task-activity'
import { createAuditLog, AuditActions, AuditEntities } from '@/lib/audit'
import { updateTag } from 'next/cache'
import { syncHRActivityFromTask, archiveHRActivitiesForDeletedTask } from '@/lib/hr-task-sync'

const createTaskSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  projectId: z.string().optional(),
  parentId: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  dueDate: z.date().optional(),
  reminderDate: z.date().optional(),
  reminderTime: z.string().optional(),
  soundEnabled: z.boolean().optional(),
  isShared: z.boolean().optional(),
  sharedWith: z.array(z.string()).optional(), // Array of user IDs
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  complexity: z.enum(['FAIBLE', 'MOYEN', 'ELEVE']).optional(),
  trainingLevel: z
    .enum(['NONE', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
    .optional()
    .nullable(),
  masteryLevel: z
    .enum(['NOVICE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
    .optional()
    .nullable(),
  understandingLevel: z
    .enum(['NONE', 'SUPERFICIAL', 'WORKING', 'COMPREHENSIVE', 'EXPERT'])
    .optional()
    .nullable(),
  // Nouveau champ pour lier à un HR Timesheet
  hrTimesheetId: z.string().optional(),
  // Nouveaux champs pour intégration avec activités RH
  activityType: z.string().optional(),
  activityName: z.string().optional(),
  periodicity: z.string().optional(),
})

const updateTaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  dueDate: z.date().optional(),
  reminderDate: z.date().optional(),
  reminderTime: z.string().optional(),
  soundEnabled: z.boolean().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  // Nouveaux champs pour intégration avec activités RH
  activityType: z.string().optional(),
  activityName: z.string().optional(),
  periodicity: z.string().optional(),
})

export const createTask = actionClient.schema(createTaskSchema).action(async ({ parsedInput }) => {
  const session = await getSession()

  if (!session) {
    throw new Error('Non authentifié')
  }

  // Vérifier que l'utilisateur est membre du projet seulement si un projet est spécifié
  if (parsedInput.projectId) {
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: parsedInput.projectId,
        userId: session.user.id,
      },
    })

    if (!member && getUserRole(session) !== 'ADMIN') {
      throw new Error("Vous n'êtes pas membre de ce projet")
    }
  }

  const { sharedWith, hrTimesheetId, ...taskData } = parsedInput
  const taskId = nanoid()

  // Vérifier que le HR Timesheet existe et appartient à l'utilisateur si spécifié
  if (hrTimesheetId) {
    const timesheet = await prisma.hRTimesheet.findFirst({
      where: {
        id: hrTimesheetId,
        userId: session.user.id,
      },
    })

    if (!timesheet) {
      throw new Error("Timesheet non trouvé ou vous n'avez pas la permission")
    }
  }

  // Créer la tâche avec transaction pour garantir la cohérence
  const task = await prisma.$transaction(async (tx) => {
    // Créer la tâche
    // Exclure complexity pour le caster
    const { complexity, ...taskDataWithoutComplexity } = taskData

    const newTask = await tx.task.create({
      data: {
        id: taskId,
        ...taskDataWithoutComplexity,
        ...(complexity ? { complexity: complexity as any } : {}),
        hrTimesheetId,
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        Project: {
          select: {
            name: true,
            code: true,
          },
        },
        HRTimesheet: {
          select: {
            id: true,
            weekStartDate: true,
            weekEndDate: true,
          },
        },
      },
    })

    // Ajouter le créateur comme membre
    await tx.taskMember.create({
      data: {
        id: nanoid(),
        taskId: taskId,
        userId: session.user.id,
        role: 'creator',
      },
    })

    // Ajouter les membres partagés si spécifiés
    if (sharedWith && sharedWith.length > 0) {
      await tx.taskMember.createMany({
        data: sharedWith.map((userId) => ({
          id: nanoid(),
          taskId: taskId,
          userId: userId,
          role: 'member',
        })),
      })

      // Créer des notifications pour les utilisateurs avec qui la tâche est partagée
      const currentUser = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      })

      const notifications = await tx.notification.createMany({
        data: sharedWith.map((userId) => ({
          id: nanoid(),
          userId: userId,
          title: 'Nouvelle tâche partagée',
          message: `${currentUser?.name} a partagé la tâche "${taskData.name}" avec vous`,
          type: 'task_shared',
          link: `/dashboard/tasks`,
          isRead: false,
        })),
      })

      // Envoyer les push notifications (fire and forget, après la transaction)
      if (notifications.count > 0) {
        import('@/lib/notification-helpers')
          .then(({ sendPushNotificationsForNotifications }) => {
            // Récupérer les notifications créées pour envoyer les push
            prisma.notification
              .findMany({
                where: {
                  userId: { in: sharedWith },
                  title: 'Nouvelle tâche partagée',
                },
                orderBy: { createdAt: 'desc' },
                take: sharedWith.length,
              })
              .then((createdNotifications) => {
                // Envoyer en arrière-plan (ne pas attendre)
                sendPushNotificationsForNotifications(
                  createdNotifications.map((n) => ({
                    userId: n.userId,
                    id: n.id,
                    title: n.title,
                    message: n.message,
                    type: n.type,
                    link: n.link,
                  })),
                ).catch(console.error)
              })
          })
          .catch(console.error)
      }
    }

    return newTask
  })

  // Logger la création de la tâche
  await logTaskActivity({
    taskId: task.id,
    userId: session.user.id,
    action: 'created',
  })

  // Créer un log d'audit
  await createAuditLog({
    userId: session.user.id,
    action: AuditActions.CREATE,
    entity: AuditEntities.TASK,
    entityId: task.id,
    changes: {
      name: task.name,
      status: task.status,
      projectId: task.projectId,
      createdBy: task.createdBy,
    },
  })

  // ⚡ Next.js 16: Invalider le cache immédiatement (read-your-own-writes)
  updateTag('tasks')
  updateTag(`task-${task.id}`)
  if (task.projectId) {
    updateTag(`project-${task.projectId}-tasks`)
  }

  return task
})

export const updateTask = actionClient.schema(updateTaskSchema).action(async ({ parsedInput }) => {
  const session = await getSession()

  if (!session) {
    throw new Error('Non authentifié')
  }

  const { id, ...data } = parsedInput

  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      priority: true,
      createdBy: true,
      projectId: true,
    },
  })

  if (!task) {
    throw new Error('Tâche non trouvée')
  }

  // Vérifier que l'utilisateur est le créateur de la tâche ou un administrateur
  const isCreator = task.createdBy === session.user.id
  const isAdmin = getUserRole(session) === 'ADMIN'

  if (!isCreator && !isAdmin) {
    throw new Error(
      "Vous n'avez pas la permission de modifier cette tâche. Seul le créateur ou un administrateur peut modifier une tâche.",
    )
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      priority: true,
      isActive: true,
      estimatedHours: true,
      dueDate: true,
      reminderDate: true,
      reminderTime: true,
      soundEnabled: true,
      createdBy: true,
      updatedAt: true,
      Project: {
        select: {
          name: true,
          code: true,
        },
      },
    },
  })

  // Logger les changements
  await logTaskChanges(id, session.user.id, task, updatedTask)

  // 🔄 Synchronisation bidirectionnelle : si le statut a changé, mettre à jour les HRActivity liées
  if (data.status && data.status !== task.status) {
    await syncHRActivityFromTask(id, data.status as any)
  }

  // Créer un log d'audit
  await createAuditLog({
    userId: session.user.id,
    action: AuditActions.UPDATE,
    entity: AuditEntities.TASK,
    entityId: id,
    changes: {
      previous: {
        name: task.name,
        status: task.status,
        priority: task.priority,
        description: task.description,
      },
      new: {
        name: updatedTask.name,
        status: updatedTask.status,
        priority: updatedTask.priority,
        description: updatedTask.description,
      },
    },
  })

  // ⚡ Next.js 16: Invalider le cache immédiatement (read-your-own-writes)
  updateTag('tasks')
  updateTag(`task-${id}`)
  if (task.projectId) {
    updateTag(`project-${task.projectId}-tasks`)
  }

  return updatedTask
})

export const deleteTask = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    const task = await prisma.task.findUnique({
      where: { id: parsedInput.id },
      select: {
        id: true,
        name: true,
        status: true,
        projectId: true,
        createdBy: true,
      },
    })

    if (!task) {
      throw new Error('Tâche non trouvée')
    }

    // Vérifier que l'utilisateur est le créateur de la tâche ou un administrateur
    const isCreator = task.createdBy === session.user.id
    const isAdmin = getUserRole(session) === 'ADMIN'

    if (!isCreator && !isAdmin) {
      throw new Error(
        "Vous n'avez pas la permission de supprimer cette tâche. Seul le créateur ou un administrateur peut supprimer une tâche.",
      )
    }

    // Sauvegarder les informations de la tâche avant suppression pour l'audit
    const taskData = {
      name: task.name,
      status: task.status,
      projectId: task.projectId,
      createdBy: task.createdBy,
    }

    // 🔄 Archiver les HRActivity liées avant suppression (préserve l'historique des heures)
    await archiveHRActivitiesForDeletedTask(parsedInput.id)

    await prisma.task.delete({
      where: { id: parsedInput.id },
    })

    // Créer un log d'audit
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.DELETE,
      entity: AuditEntities.TASK,
      entityId: parsedInput.id,
      changes: taskData,
    })

    // ⚡ Next.js 16: Invalider le cache immédiatement (read-your-own-writes)
    updateTag('tasks')
    updateTag(`task-${parsedInput.id}`)
    if (taskData.projectId) {
      updateTag(`project-${taskData.projectId}-tasks`)
    }

    return { success: true }
  })

export const getProjectTasks = actionClient
  .schema(z.object({ projectId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: parsedInput.projectId,
      },
      include: {
        Project: {
          select: {
            name: true,
            code: true,
          },
        },
        Task: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            TaskComment: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return tasks
  })

export const getMyTasks = actionClient
  .schema(z.object({ projectId: z.string().optional(), searchQuery: z.string().optional() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    // Récupérer les tâches dont l'utilisateur est membre (créateur ou membre partagé)
    const taskMembers = await prisma.taskMember.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        taskId: true,
      },
    })

    const taskIds = taskMembers.map((tm) => tm.taskId)

    // Récupérer les projets dont l'utilisateur est membre
    const projectMembers = await prisma.projectMember.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        projectId: true,
      },
    })

    const projectIds = projectMembers.map((pm) => pm.projectId)

    // Construire les conditions :
    // - Tâches dont l'utilisateur est membre (TaskMember)
    // - Tâches créées par l'utilisateur (peu importe le projet)
    // - Tâches des projets où l'utilisateur est membre
    // Note: Les tâches personnelles (projectId null) sont déjà incluses via createdBy
    const orVisibilityConditions: any[] = []
    if (taskIds.length > 0) {
      orVisibilityConditions.push({ id: { in: taskIds } })
    }
    // Tâches créées par l'utilisateur (inclut les tâches personnelles projectId null)
    orVisibilityConditions.push({ createdBy: session.user.id })
    // Tâches des projets où l'utilisateur est membre (mais pas créées par lui, déjà couvertes ci-dessus)
    if (projectIds.length > 0) {
      orVisibilityConditions.push({
        projectId: { in: projectIds },
        createdBy: { not: session.user.id }, // Exclure celles déjà créées par l'utilisateur
      })
    }

    const andConditions: any[] = []
    if (parsedInput.projectId) {
      andConditions.push({ projectId: parsedInput.projectId })
    }
    if (parsedInput.searchQuery) {
      andConditions.push({
        OR: [
          { name: { contains: parsedInput.searchQuery, mode: 'insensitive' } },
          { description: { contains: parsedInput.searchQuery, mode: 'insensitive' } },
        ],
      })
    }

    const tasks = await prisma.task.findMany({
      where: {
        isActive: true,
        AND: [...andConditions, { OR: orVisibilityConditions }],
      },
      include: {
        Project: {
          select: {
            name: true,
            code: true,
            color: true,
          },
        },
        Task: {
          select: {
            id: true,
            name: true,
          },
        },
        User_Task_createdByToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
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
              },
            },
          },
        },
        _count: {
          select: {
            TaskComment: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return tasks
  })

export const getAllTasks = actionClient
  .schema(z.object({ projectId: z.string().optional(), searchQuery: z.string().optional() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    const andConditions: any[] = []
    if (parsedInput.projectId) {
      andConditions.push({ projectId: parsedInput.projectId })
    }
    if (parsedInput.searchQuery) {
      andConditions.push({
        OR: [
          { name: { contains: parsedInput.searchQuery, mode: 'insensitive' } },
          { description: { contains: parsedInput.searchQuery, mode: 'insensitive' } },
        ],
      })
    }

    // Récupérer toutes les tâches actives (pour calendrier et gantt)
    const tasks = await prisma.task.findMany({
      where: {
        isActive: true,
        ...(andConditions.length > 0 && { AND: andConditions }),
      },
      include: {
        Project: {
          select: {
            name: true,
            code: true,
            color: true,
          },
        },
        Task: {
          select: {
            id: true,
            name: true,
          },
        },
        User_Task_createdByToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
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
              },
            },
          },
        },
        _count: {
          select: {
            TaskComment: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return tasks
  })

export const getAvailableUsersForSharing = actionClient
  .schema(z.object({ projectId: z.string().optional() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    // Si un projet est spécifié, récupérer seulement les membres du projet
    if (parsedInput.projectId) {
      const members = await prisma.projectMember.findMany({
        where: {
          projectId: parsedInput.projectId,
          userId: { not: session.user.id }, // Exclure l'utilisateur actuel
        },
        select: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              departmentId: true,
            },
          },
        },
      })

      return members.map((m) => m.User)
    }

    // Sinon, récupérer tous les utilisateurs actifs sauf l'utilisateur actuel
    const users = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        departmentId: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return users
  })

export const updateTaskStatus = actionClient
  .schema(
    z.object({
      id: z.string(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    const task = await prisma.task.findUnique({
      where: { id: parsedInput.id },
      select: {
        id: true,
        name: true,
        status: true,
        createdBy: true,
        isShared: true,
        completedAt: true,
        TaskMember: {
          select: {
            userId: true,
            User: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!task) {
      throw new Error('Tâche non trouvée')
    }

    // Vérifier que l'utilisateur est le créateur de la tâche ou un administrateur
    const isCreator = task.createdBy === session.user.id
    const isAdmin = getUserRole(session) === 'ADMIN'

    if (!isCreator && !isAdmin) {
      throw new Error(
        "Vous n'avez pas la permission de modifier cette tâche. Seul le créateur ou un administrateur peut modifier une tâche.",
      )
    }

    // Mettre à jour le statut
    const updatedTask = await prisma.task.update({
      where: { id: parsedInput.id },
      data: {
        status: parsedInput.status,
        completedAt: parsedInput.status === 'DONE' ? new Date() : task.completedAt,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        isActive: true,
        completedAt: true,
        updatedAt: true,
        Project: {
          select: {
            name: true,
            code: true,
            color: true,
          },
        },
      },
    })

    // 🔄 Synchronisation bidirectionnelle : mettre à jour les HRActivity liées
    if (task.status !== parsedInput.status) {
      await syncHRActivityFromTask(parsedInput.id, parsedInput.status as any)
    }

    // Notifier les membres si la tâche est partagée
    if (task.isShared && task.TaskMember.length > 1) {
      const otherMembers = task.TaskMember.filter((m) => m.userId !== session.user.id)

      if (otherMembers.length > 0) {
        const statusNotifications = await prisma.notification.createMany({
          data: otherMembers.map((member) => ({
            id: nanoid(),
            userId: member.userId,
            title: 'Statut de tâche modifié',
            message: `${session.user.name} a changé le statut de "${task.name}" à ${parsedInput.status}`,
            type: 'task_status_changed',
            link: `/dashboard/tasks`,
            isRead: false,
          })),
        })

        // Envoyer les push notifications (fire and forget)
        if (statusNotifications.count > 0) {
          const { sendPushNotificationsForNotifications } =
            await import('@/lib/notification-helpers')
          // Récupérer les notifications créées
          const createdStatusNotifications = await prisma.notification.findMany({
            where: {
              userId: { in: otherMembers.map((m) => m.userId) },
              title: 'Statut de tâche modifié',
            },
            orderBy: { createdAt: 'desc' },
            take: otherMembers.length,
          })

          sendPushNotificationsForNotifications(
            createdStatusNotifications.map((n) => ({
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
    }

    // Logger le changement de statut
    await logTaskActivity({
      taskId: parsedInput.id,
      userId: session.user.id,
      action: 'status_changed',
      field: 'status',
      oldValue: task.status,
      newValue: parsedInput.status,
    })

    // ⚡ Next.js 16: Invalider le cache immédiatement (read-your-own-writes)
    updateTag('tasks')
    updateTag(`task-${parsedInput.id}`)

    return updatedTask
  })

export const updateTaskPriority = actionClient
  .schema(
    z.object({
      id: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    // Récupérer la tâche actuelle pour le logging et la vérification
    const task = await prisma.task.findUnique({
      where: { id: parsedInput.id },
    })

    if (!task) {
      throw new Error('Tâche non trouvée')
    }

    // Vérifier que l'utilisateur est le créateur de la tâche ou un administrateur
    const isCreator = task.createdBy === session.user.id
    const isAdmin = getUserRole(session) === 'ADMIN'

    if (!isCreator && !isAdmin) {
      throw new Error(
        "Vous n'avez pas la permission de modifier cette tâche. Seul le créateur ou un administrateur peut modifier une tâche.",
      )
    }

    const updatedTask = await prisma.task.update({
      where: { id: parsedInput.id },
      data: {
        priority: parsedInput.priority,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        isActive: true,
        updatedAt: true,
        Project: {
          select: {
            name: true,
            code: true,
            color: true,
          },
        },
      },
    })

    // Logger le changement de priorité
    await logTaskActivity({
      taskId: parsedInput.id,
      userId: session.user.id,
      action: 'priority_changed',
      field: 'priority',
      oldValue: task.priority,
      newValue: parsedInput.priority,
    })

    // ⚡ Next.js 16: Invalider le cache immédiatement (read-your-own-writes)
    updateTag('tasks')
    updateTag(`task-${parsedInput.id}`)

    return updatedTask
  })

const evaluateTaskSchema = z.object({
  id: z.string(),
  trainingLevel: z.enum(['NONE', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  masteryLevel: z.enum(['NOVICE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  understandingLevel: z
    .enum(['NONE', 'SUPERFICIAL', 'WORKING', 'COMPREHENSIVE', 'EXPERT'])
    .optional(),
  evaluationNotes: z.string().optional(),
})

export const evaluateTask = actionClient
  .schema(evaluateTaskSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    // Vérifier que seul un manager ou directeur peut évaluer
    if (!['MANAGER', 'DIRECTEUR', 'ADMIN'].includes(getUserRole(session) as string)) {
      throw new Error('Seuls les managers et directeurs peuvent évaluer les tâches')
    }

    const task = await prisma.task.findUnique({
      where: { id: parsedInput.id },
    })

    if (!task) {
      throw new Error('Tâche non trouvée')
    }

    const updatedTask = await prisma.task.update({
      where: { id: parsedInput.id },
      data: {
        trainingLevel: parsedInput.trainingLevel,
        masteryLevel: parsedInput.masteryLevel,
        understandingLevel: parsedInput.understandingLevel,
        evaluationNotes: parsedInput.evaluationNotes,
        evaluatedBy: session.user.id,
        evaluatedAt: new Date(),
      },
    })

    // Logger l'évaluation
    await logTaskActivity({
      taskId: parsedInput.id,
      userId: session.user.id,
      action: 'task_evaluated',
      description: `Évaluation: Formation=${parsedInput.trainingLevel}, Maîtrise=${parsedInput.masteryLevel}, Compréhension=${parsedInput.understandingLevel}`,
    })

    return updatedTask
  })

const updateTaskComplexitySchema = z.object({
  id: z.string(),
  complexity: z.enum(['FAIBLE', 'MOYEN', 'LEV_']),
  recurrence: z.string().optional(),
})

export const updateTaskComplexity = actionClient
  .schema(updateTaskComplexitySchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    const task = await prisma.task.findUnique({
      where: { id: parsedInput.id },
    })

    if (!task) {
      throw new Error('Tâche non trouvée')
    }

    // Vérifier les permissions - créateur ou manager
    if (
      task.createdBy !== session.user.id &&
      !['MANAGER', 'DIRECTEUR', 'ADMIN'].includes(getUserRole(session) as string)
    ) {
      throw new Error("Vous n'avez pas les permissions pour modifier cette tâche")
    }

    const updatedTask = await prisma.task.update({
      where: { id: parsedInput.id },
      data: {
        complexity: parsedInput.complexity as any,
        recurrence: parsedInput.recurrence,
      },
    })

    // Logger le changement de complexité
    await logTaskActivity({
      taskId: parsedInput.id,
      userId: session.user.id,
      action: 'complexity_changed',
      field: 'complexity',
      oldValue: task.complexity,
      newValue: parsedInput.complexity,
    })

    return updatedTask
  })

/**
 * Récupérer les tâches de l'utilisateur connecté pour la sélection dans HR Timesheet
 * Filtre sur les tâches actives avec status TODO ou IN_PROGRESS
 */
export const getUserTasksForHRTimesheet = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    try {
      // Récupérer les tâches où l'utilisateur est créateur ou membre
      const tasks = await prisma.task.findMany({
        where: {
          isActive: true,
          status: {
            in: ['TODO', 'IN_PROGRESS'],
          },
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
        include: {
          Project: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
            },
          },
          User_Task_createdByToUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      })

      return tasks
    } catch (error) {
      console.error('Erreur dans getUserTasksForHRTimesheet:', error)
      throw new Error(
        `Erreur lors de la récupération des tâches: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`,
      )
    }
  })

/**
 * Récupérer les tâches d'un projet triées par date d'échéance
 * Utilise l'index Task_projectId_dueDate_idx pour des performances optimales
 */
export const getProjectTasksByDueDate = authActionClient
  .schema(
    z.object({
      projectId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { projectId, startDate, endDate } = parsedInput

    // Vérifier que l'utilisateur est membre du projet ou admin
    const session = await getSession()
    if (!session) {
      throw new Error('Non authentifié')
    }

    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: ctx.userId,
      },
    })

    if (!member && getUserRole(session) !== 'ADMIN') {
      throw new Error("Vous n'êtes pas membre de ce projet")
    }

    // Construire le filtre de dates
    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.dueDate = {}
      if (startDate) dateFilter.dueDate.gte = startDate
      if (endDate) dateFilter.dueDate.lte = endDate
    } else {
      // Si pas de filtre, récupérer uniquement les tâches avec une date d'échéance
      dateFilter.dueDate = { not: null }
    }

    // Cette requête utilise l'index composite Task_projectId_dueDate_idx
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        isActive: true,
        ...dateFilter,
      },
      include: {
        User_Task_createdByToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
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
              },
            },
          },
        },
        _count: {
          select: {
            TaskComment: true,
            TaskActivity: true,
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    })

    return { tasks, totalTasks: tasks.length }
  })

/**
 * Récupérer les tâches d'une feuille de temps RH filtrées par statut
 * Utilise l'index Task_hrTimesheetId_status_idx pour des performances optimales
 */
export const getHRTimesheetTasksByStatus = authActionClient
  .schema(
    z.object({
      hrTimesheetId: z.string(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { hrTimesheetId, status } = parsedInput

    // Vérifier que la feuille de temps existe et appartient à l'utilisateur
    const timesheet = await prisma.hRTimesheet.findFirst({
      where: {
        id: hrTimesheetId,
        OR: [
          { userId: ctx.userId },
          // Permettre aux managers/directeurs de voir les feuilles de temps qu'ils supervisent
          { managerSignedById: ctx.userId },
          { odillonSignedById: ctx.userId },
        ],
      },
    })

    if (!timesheet) {
      throw new Error('Feuille de temps non trouvée ou accès non autorisé')
    }

    // Construire le filtre de statut
    const statusFilter: any = {}
    if (status) {
      statusFilter.status = status
    }

    // Cette requête utilise l'index composite Task_hrTimesheetId_status_idx
    const tasks = await prisma.task.findMany({
      where: {
        hrTimesheetId,
        ...statusFilter,
      },
      include: {
        Project: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
        User_Task_createdByToUser: {
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
            periodicity: true,
            totalHours: true,
            status: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }],
    })

    // Calculer les statistiques par statut
    const statusStats = {
      TODO: tasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      REVIEW: tasks.filter((t) => t.status === 'REVIEW').length,
      DONE: tasks.filter((t) => t.status === 'DONE').length,
      BLOCKED: tasks.filter((t) => t.status === 'BLOCKED').length,
    }

    return { tasks, totalTasks: tasks.length, statusStats }
  })
