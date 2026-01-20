import { inngest } from '../client'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import { sendEmail, getTransactionalEmailTemplate } from '@/lib/email'
import { ReminderActivityType } from '@/generated/prisma/enums'

/**
 * Job Inngest : Traitement des rappels personnalisés multi-activités
 *
 * Fréquence : Toutes les minutes
 * Cron: "* * * * *"
 *
 * Fonctionnement :
 * 1. Recherche les rappels actifs pour l'heure et le jour courant
 * 2. Génère des notifications personnalisées selon le type d'activité
 * 3. Envoie des notifications push et email selon les préférences utilisateur
 *
 * Types d'activités supportés :
 * - TIMESHEET : Rappel de saisie de temps (employé)
 * - HR_TIMESHEET : Rappel de validation des feuilles de temps (manager/HR)
 * - TASK : Rappel de consultation des tâches
 * - CUSTOM : Rappel personnalisé (utilise le champ `name`)
 */
export const processUserReminders = inngest.createFunction(
  {
    id: 'process-user-reminders',
    name: 'Process User Custom Reminders',
    retries: 3,
  },
  { cron: '* * * * *' },
  async ({ step }) => {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    // Mapper le jour de la semaine
    const dayMap: Record<number, string> = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
    }
    const dayOfWeek = dayMap[now.getDay()]

    // Étape 1: Trouver les rappels actifs pour cette heure/jour
    const activeReminders = await step.run('find-active-reminders', async () => {
      return prisma.userReminder.findMany({
        where: {
          isEnabled: true,
          time: currentTime,
          days: { has: dayOfWeek },
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              emailNotificationsEnabled: true,
              desktopNotificationsEnabled: true,
            },
          },
        },
      })
    })

    if (activeReminders.length === 0) {
      return {
        processed: 0,
        time: currentTime,
        day: dayOfWeek,
        message: 'Aucun rappel utilisateur à traiter',
      }
    }

    // Étape 2: Traiter chaque rappel selon son type
    const results: Array<{
      reminderId: string
      userId: string
      activityType: string
      notificationCreated: boolean
      emailSent: boolean
    }> = []

    for (const reminder of activeReminders) {
      const result = await step.run(`process-reminder-${reminder.id}`, async () => {
        let title = ''
        let message = ''
        let link = ''

        // Déterminer le contenu selon le type d'activité
        switch (reminder.activityType) {
          case ReminderActivityType.TIMESHEET:
            title = '📅 Rappel : Saisie de temps'
            message = "N'oubliez pas de saisir vos heures de travail."
            link = '/dashboard/hr-timesheet/new'
            break

          case ReminderActivityType.TASK:
            title = '✅ Rappel : Vos tâches'
            message = 'Consultez vos tâches en cours.'
            link = '/dashboard/tasks'
            break

          case ReminderActivityType.HR_TIMESHEET:
            title = '📋 Rappel : Validation feuilles de temps'
            message = 'Des feuilles de temps sont en attente de validation.'
            link = '/dashboard/hr-timesheet'
            break

          case ReminderActivityType.CUSTOM:
            title = `🔔 ${reminder.name}`
            message = `Rappel personnalisé : ${reminder.name}`
            link = '/dashboard'
            break

          default:
            title = '🔔 Rappel'
            message = reminder.name
            link = '/dashboard'
        }

        let notificationCreated = false
        let emailSent = false

        // Créer la notification in-app
        if (reminder.User.desktopNotificationsEnabled) {
          const notification = await prisma.notification.create({
            data: {
              id: nanoid(),
              userId: reminder.userId,
              title,
              message,
              type: 'reminder',
              link,
            },
          })

          // Envoyer push notification
          try {
            const { sendPushNotificationForNotification } =
              await import('@/lib/notification-helpers')
            await sendPushNotificationForNotification(reminder.userId, {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              link: notification.link,
            })
          } catch (pushError) {
            console.error(`Erreur push notification pour user ${reminder.userId}:`, pushError)
          }

          notificationCreated = true
        }

        // Envoyer email si activé
        if (reminder.User.emailNotificationsEnabled) {
          try {
            await sendEmail({
              to: reminder.User.email,
              subject: title,
              html: getTransactionalEmailTemplate({
                userName: reminder.User.name || undefined,
                title,
                preheader: message,
                content: message,
                alertType: 'info',
                alertTitle: 'Rappel programmé',
                alertMessage: `Ce rappel est configuré pour ${reminder.time} les jours de semaine.`,
                buttonText: 'Accéder',
                buttonUrl: link,
              }),
            })
            emailSent = true
          } catch (emailError) {
            console.error(`Erreur email pour user ${reminder.userId}:`, emailError)
          }
        }

        return {
          reminderId: reminder.id,
          userId: reminder.userId,
          activityType: reminder.activityType,
          notificationCreated,
          emailSent,
        }
      })

      results.push(result)
    }

    return {
      processed: activeReminders.length,
      time: currentTime,
      day: dayOfWeek,
      results,
      timestamp: now.toISOString(),
    }
  },
)
