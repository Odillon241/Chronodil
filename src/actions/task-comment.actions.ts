'use server'

import { getSession, getUserRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { actionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { logTaskActivity } from '@/lib/task-activity'

const createCommentSchema = z.object({
  taskId: z.string(),
  content: z
    .string()
    .min(1, 'Le commentaire ne peut pas être vide')
    .max(1000, 'Maximum 1000 caractères'),
})

const updateCommentSchema = z.object({
  id: z.string(),
  content: z.string().min(1).max(1000),
})

export const createTaskComment = actionClient
  .schema(createCommentSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    // Vérifier que la tâche existe et que l'utilisateur y a accès
    const task = await prisma.task.findUnique({
      where: { id: parsedInput.taskId },
      include: {
        TaskMember: {
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

    if (!task) {
      throw new Error('Tâche non trouvée')
    }

    // Créer le commentaire
    const comment = await prisma.taskComment.create({
      data: {
        id: nanoid(),
        taskId: parsedInput.taskId,
        userId: session.user.id,
        content: parsedInput.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
    })

    // Notifier tous les membres de la tâche sauf l'auteur du commentaire
    if (task.TaskMember.length > 0) {
      const otherMembers = task.TaskMember.filter((m) => m.userId !== session.user.id)

      if (otherMembers.length > 0) {
        const notifications = await prisma.notification.createMany({
          data: otherMembers.map((member) => ({
            id: nanoid(),
            userId: member.userId,
            title: 'Nouveau commentaire',
            message: `${session.user.name} a commenté la tâche "${task.name}"`,
            type: 'task_comment',
            link: `/dashboard/tasks`,
            isRead: false,
          })),
        })

        // Envoyer les push notifications (fire and forget)
        if (notifications.count > 0) {
          import('@/lib/notification-helpers')
            .then(({ sendPushNotificationsForNotifications }) => {
              // Récupérer les notifications créées
              prisma.notification
                .findMany({
                  where: {
                    userId: { in: otherMembers.map((m) => m.userId) },
                    title: 'Nouveau commentaire',
                  },
                  orderBy: { createdAt: 'desc' },
                  take: otherMembers.length,
                })
                .then((createdNotifications) => {
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
    }

    // Logger l'activité
    await logTaskActivity({
      taskId: parsedInput.taskId,
      userId: session.user.id,
      action: 'commented',
    })

    return comment
  })

export const getTaskComments = actionClient
  .schema(z.object({ taskId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    const comments = await prisma.taskComment.findMany({
      where: {
        taskId: parsedInput.taskId,
      },
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
      orderBy: {
        createdAt: 'asc',
      },
    })

    return comments
  })

export const updateTaskComment = actionClient
  .schema(updateCommentSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    // Vérifier que le commentaire appartient à l'utilisateur
    const existingComment = await prisma.taskComment.findUnique({
      where: { id: parsedInput.id },
    })

    if (!existingComment) {
      throw new Error('Commentaire non trouvé')
    }

    if (existingComment.userId !== session.user.id) {
      throw new Error('Vous ne pouvez modifier que vos propres commentaires')
    }

    const comment = await prisma.taskComment.update({
      where: { id: parsedInput.id },
      data: {
        content: parsedInput.content,
        isEdited: true,
      },
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
    })

    return comment
  })

export const deleteTaskComment = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession()

    if (!session) {
      throw new Error('Non authentifié')
    }

    // Vérifier que le commentaire appartient à l'utilisateur
    const existingComment = await prisma.taskComment.findUnique({
      where: { id: parsedInput.id },
    })

    if (!existingComment) {
      throw new Error('Commentaire non trouvé')
    }

    if (existingComment.userId !== session.user.id && getUserRole(session) !== 'ADMIN') {
      throw new Error('Vous ne pouvez supprimer que vos propres commentaires')
    }

    await prisma.taskComment.delete({
      where: { id: parsedInput.id },
    })

    return { success: true }
  })
