import { inngest } from './client'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'

/**
 * Job: Envoi des messages programmés
 * Fréquence: Toutes les minutes
 * Cron: "* * * * *"
 *
 * Vérifie la table ScheduledMessage pour les messages à envoyer
 * et les crée dans la conversation correspondante.
 */
export const sendScheduledMessages = inngest.createFunction(
  {
    id: 'send-scheduled-messages',
    name: 'Send Scheduled Messages',
    retries: 3,
  },
  { cron: '* * * * *' },
  async ({ step }) => {
    const now = new Date()

    // Étape 1: Trouver les messages programmés à envoyer
    const scheduledMessages = await step.run('find-scheduled-messages', async () => {
      return prisma.scheduledMessage.findMany({
        where: {
          scheduledFor: { lte: now },
          sentAt: null, // Non encore envoyé
        },
        include: {
          User: { select: { id: true, name: true } },
          Conversation: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        take: 50,
      })
    })

    if (scheduledMessages.length === 0) {
      return { processed: 0, message: 'Aucun message programmé à envoyer' }
    }

    // Étape 2: Créer les messages réels
    const results: Array<{ scheduledId: string; messageId: string }> = []

    for (const scheduled of scheduledMessages) {
      const result = await step.run(`send-message-${scheduled.id}`, async () => {
        // Créer le message dans la conversation
        const message = await prisma.message.create({
          data: {
            id: nanoid(),
            content: scheduled.content,
            senderId: scheduled.senderId,
            conversationId: scheduled.conversationId,
            attachments: scheduled.attachments ?? undefined,
            updatedAt: now,
          },
        })

        // Mettre à jour la conversation (lastMessageAt via updatedAt)
        await prisma.conversation.update({
          where: { id: scheduled.conversationId },
          data: { updatedAt: now },
        })

        // Marquer le message programmé comme envoyé
        await prisma.scheduledMessage.update({
          where: { id: scheduled.id },
          data: { sentAt: now },
        })

        // Créer des notifications pour les membres de la conversation
        const members = await prisma.conversationMember.findMany({
          where: {
            conversationId: scheduled.conversationId,
            userId: { not: scheduled.senderId }, // Exclure l'expéditeur
            isMuted: false,
          },
          select: { userId: true },
        })

        // Créer les notifications in-app
        if (members.length > 0) {
          await prisma.notification.createMany({
            data: members.map((member) => ({
              id: nanoid(),
              userId: member.userId,
              title: 'Nouveau message',
              message: `${scheduled.User.name || "Quelqu'un"} a envoyé un message${scheduled.Conversation.name ? ` dans ${scheduled.Conversation.name}` : ''}`,
              type: 'chat',
              link: `/dashboard/chat/${scheduled.conversationId}`,
            })),
          })
        }

        return { scheduledId: scheduled.id, messageId: message.id }
      })
      results.push(result)
    }

    return {
      processed: scheduledMessages.length,
      results,
      timestamp: now.toISOString(),
    }
  },
)

/**
 * Job: Envoi des rappels de messages
 * Fréquence: Toutes les 5 minutes
 * Cron: every 5 minutes
 *
 * Vérifie la table MessageReminder pour les rappels à envoyer
 * et crée des notifications pour les utilisateurs concernés.
 */
export const sendMessageReminders = inngest.createFunction(
  {
    id: 'send-message-reminders',
    name: 'Send Message Reminders',
    retries: 3,
  },
  { cron: '*/5 * * * *' },
  async ({ step }) => {
    const now = new Date()

    // Étape 1: Trouver les rappels dus
    const dueReminders = await step.run('find-due-reminders', async () => {
      return prisma.messageReminder.findMany({
        where: {
          remindAt: { lte: now },
          remindedAt: null, // Non encore traité
        },
        include: {
          User: { select: { id: true, name: true, email: true } },
          Message: {
            include: {
              Conversation: {
                select: { id: true, name: true, type: true },
              },
              User: { select: { name: true } },
            },
          },
        },
        take: 100,
      })
    })

    if (dueReminders.length === 0) {
      return { processed: 0, message: 'Aucun rappel de message à traiter' }
    }

    // Étape 2: Envoyer les notifications
    let processedCount = 0

    for (const reminder of dueReminders) {
      await step.run(`process-reminder-${reminder.id}`, async () => {
        // Tronquer le contenu du message pour la notification
        const contentPreview =
          reminder.Message.content.length > 50
            ? `${reminder.Message.content.substring(0, 50)}...`
            : reminder.Message.content

        // Créer notification in-app
        await prisma.notification.create({
          data: {
            id: nanoid(),
            userId: reminder.userId,
            title: '🔔 Rappel de message',
            message: `Rappel: "${contentPreview}" de ${reminder.Message.User?.name || "Quelqu'un"}`,
            type: 'message_reminder',
            link: `/dashboard/chat/${reminder.Message.conversationId}`,
          },
        })

        // Marquer comme traité
        await prisma.messageReminder.update({
          where: { id: reminder.id },
          data: { remindedAt: now },
        })

        processedCount++
      })
    }

    // Étape 3: Envoyer les push notifications (optionnel)
    await step.run('send-push-notifications', async () => {
      const { sendPushNotificationForNotification } = await import('@/lib/notification-helpers')

      for (const reminder of dueReminders) {
        const contentPreview =
          reminder.Message.content.length > 50
            ? `${reminder.Message.content.substring(0, 50)}...`
            : reminder.Message.content

        await sendPushNotificationForNotification(reminder.userId, {
          id: reminder.id,
          title: '🔔 Rappel de message',
          message: `Rappel: "${contentPreview}"`,
          type: 'message_reminder',
          link: `/dashboard/chat/${reminder.Message.conversationId}`,
        }).catch(console.error)
      }
    })

    return {
      processed: processedCount,
      timestamp: now.toISOString(),
    }
  },
)

// Export des fonctions chat
export const chatFunctions = [sendScheduledMessages, sendMessageReminders]
