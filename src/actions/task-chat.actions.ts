'use server'

/**
 * Actions pour lier les messages de chat aux tâches
 *
 * Fonctionnalités :
 * - Récupérer les messages liés à une tâche
 * - Envoyer un message lié à une tâche
 * - Compter les messages par tâche
 */

import { authActionClient } from '@/lib/safe-action'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'

/**
 * Récupérer les messages liés à une tâche
 */
export const getTaskMessages = authActionClient
  .schema(
    z.object({
      taskId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { taskId, limit, cursor } = parsedInput
    const { userId } = ctx

    // Vérifier que la tâche existe et que l'utilisateur y a accès
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdBy: userId },
          { TaskMember: { some: { userId } } },
          { Project: { ProjectMember: { some: { userId } } } },
        ],
      },
      select: { id: true, name: true },
    })

    if (!task) {
      throw new Error('Tâche non trouvée ou accès non autorisé')
    }

    // Récupérer les messages liés à cette tâche
    const messages = await prisma.message.findMany({
      where: {
        taskId,
        isDeleted: false,
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        attachments: true,
        createdAt: true,
        updatedAt: true,
        isEdited: true,
        reactions: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        Conversation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const hasMore = messages.length > limit
    const items = hasMore ? messages.slice(0, -1) : messages
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined

    return {
      messages: items,
      nextCursor,
      hasMore,
      task: {
        id: task.id,
        name: task.name,
      },
    }
  })

/**
 * Envoyer un message lié à une tâche
 * Crée le message dans une conversation existante du projet de la tâche
 */
export const sendTaskMessage = authActionClient
  .schema(
    z.object({
      taskId: z.string(),
      content: z.string().min(1, 'Le contenu est requis'),
      conversationId: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { taskId, content, conversationId } = parsedInput
    const { userId } = ctx

    // Vérifier que la tâche existe et récupérer son projet
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdBy: userId },
          { TaskMember: { some: { userId } } },
          { Project: { ProjectMember: { some: { userId } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        projectId: true,
        Project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!task) {
      throw new Error('Tâche non trouvée ou accès non autorisé')
    }

    // Trouver ou créer la conversation
    let targetConversationId = conversationId

    if (!targetConversationId) {
      // Chercher une conversation de type PROJECT liée au projet de la tâche
      if (task.projectId) {
        const projectConversation = await prisma.conversation.findFirst({
          where: {
            projectId: task.projectId,
            type: 'PROJECT',
          },
          select: { id: true },
        })

        if (projectConversation) {
          targetConversationId = projectConversation.id
        }
      }

      // Si pas de conversation projet, chercher un DM ou créer une conversation
      if (!targetConversationId) {
        // Créer une nouvelle conversation de type DIRECT pour la tâche
        const newConversation = await prisma.conversation.create({
          data: {
            id: nanoid(),
            name: `Discussion: ${task.name}`,
            type: 'DIRECT',
            createdBy: userId,
            projectId: task.projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })

        // Ajouter l'utilisateur comme membre
        await prisma.conversationMember.create({
          data: {
            id: nanoid(),
            conversationId: newConversation.id,
            userId,
            joinedAt: new Date(),
          },
        })

        targetConversationId = newConversation.id
      }
    }

    // Créer le message avec le lien vers la tâche
    const message = await prisma.message.create({
      data: {
        id: nanoid(),
        conversationId: targetConversationId,
        senderId: userId,
        content,
        taskId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        taskId: true,
        User: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        Conversation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Mettre à jour la date de dernière activité de la conversation
    await prisma.conversation.update({
      where: { id: targetConversationId },
      data: { updatedAt: new Date() },
    })

    revalidatePath('/dashboard/chat')
    revalidatePath(`/dashboard/tasks`)

    return message
  })

/**
 * Compter les messages par tâche
 */
export const countTaskMessages = authActionClient
  .schema(z.object({ taskId: z.string() }))
  .action(async ({ parsedInput }) => {
    const { taskId } = parsedInput

    const count = await prisma.message.count({
      where: {
        taskId,
        isDeleted: false,
      },
    })

    return { count }
  })

/**
 * Lier un message existant à une tâche
 */
export const linkMessageToTask = authActionClient
  .schema(
    z.object({
      messageId: z.string(),
      taskId: z.string(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { messageId, taskId } = parsedInput
    const { userId } = ctx

    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
      },
    })

    if (!message) {
      throw new Error('Message non trouvé ou non autorisé')
    }

    // Vérifier que la tâche existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    })

    if (!task) {
      throw new Error('Tâche non trouvée')
    }

    // Mettre à jour le message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        taskId,
        updatedAt: new Date(),
      },
    })

    return updatedMessage
  })

/**
 * Délier un message d'une tâche
 */
export const unlinkMessageFromTask = authActionClient
  .schema(z.object({ messageId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { messageId } = parsedInput
    const { userId } = ctx

    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
      },
    })

    if (!message) {
      throw new Error('Message non trouvé ou non autorisé')
    }

    // Supprimer le lien
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        taskId: null,
        updatedAt: new Date(),
      },
    })

    return updatedMessage
  })

/**
 * Récupérer les tâches avec leurs compteurs de messages
 */
export const getTasksWithMessageCounts = authActionClient
  .schema(
    z.object({
      taskIds: z.array(z.string()),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { taskIds } = parsedInput

    const counts = await prisma.message.groupBy({
      by: ['taskId'],
      _count: { id: true },
      where: {
        taskId: { in: taskIds },
        isDeleted: false,
      },
    })

    // Créer un map taskId -> count
    const countMap: Record<string, number> = {}
    for (const item of counts) {
      if (item.taskId) {
        countMap[item.taskId] = item._count.id
      }
    }

    return countMap
  })
