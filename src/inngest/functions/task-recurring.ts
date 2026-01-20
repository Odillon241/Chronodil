import { inngest } from '../client'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import { CronExpressionParser } from 'cron-parser'

/**
 * Job Inngest : Génération automatique de tâches récurrentes
 *
 * Fréquence : Chaque jour à minuit (00:00)
 *
 * Fonctionnement :
 * 1. Recherche les templates de tâches récurrentes (isRecurringTemplate = true)
 * 2. Pour chaque template, vérifie si une nouvelle instance doit être générée (via cron expression)
 * 3. Crée les nouvelles instances avec dueDate calculée
 * 4. Gère les exceptions (jours fériés, vacances)
 *
 * Format de récurrence (cron) :
 * - "0 9 * * 1"     → Chaque lundi à 9h
 * - "0 9 1 * *"     → Le 1er de chaque mois à 9h
 * - "0 9 * * 1-5"   → Chaque jour de semaine à 9h
 * - "0 9 1,15 * *"  → Le 1er et 15 de chaque mois
 *
 * Bénéfices :
 * - ✅ Automatisation complète des tâches répétitives
 * - ✅ Gain de temps (plus de création manuelle)
 * - ✅ Cohérence (templates réutilisables)
 * - ✅ Flexibilité (expressions cron standard)
 */
export const taskRecurringJob = inngest.createFunction(
  {
    id: 'task-recurring-generator',
    name: 'Generate Recurring Tasks Daily at Midnight',
    retries: 3,
  },
  {
    // Chaque jour à minuit
    cron: '0 0 * * *',
  },
  async ({ step }) => {
    const now = new Date()

    // Étape 1: Trouver les templates de tâches récurrentes
    const recurringTemplates = await step.run('find-recurring-templates', async () => {
      return prisma.task.findMany({
        where: {
          isRecurringTemplate: true,
          isActive: true,
          recurrence: { not: null },
          // Vérifier que le template n'a pas de date de fin ou que la date de fin n'est pas dépassée
          OR: [{ recurrenceEndDate: null }, { recurrenceEndDate: { gte: now } }],
        },
        include: {
          User_Task_createdByToUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
    })

    if (recurringTemplates.length === 0) {
      return {
        processed: 0,
        message: 'Aucun template récurrent à traiter',
      }
    }

    // Étape 2: Générer les instances pour chaque template
    const results = []
    for (const template of recurringTemplates) {
      const result = await step.run(`process-template-${template.id}`, async () => {
        try {
          // Vérifier si on doit générer une nouvelle instance aujourd'hui
          const shouldGenerate = checkRecurrenceRule(
            template.recurrence!,
            now,
            template.recurrenceExceptions as string[] | null,
          )

          if (!shouldGenerate) {
            return {
              templateId: template.id,
              templateName: template.name,
              action: 'skipped',
              reason: "Pas de génération prévue aujourd'hui",
            }
          }

          // Vérifier qu'une instance n'a pas déjà été créée aujourd'hui
          const existingInstanceToday = await prisma.task.findFirst({
            where: {
              parentId: template.id,
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
              },
            },
          })

          if (existingInstanceToday) {
            return {
              templateId: template.id,
              templateName: template.name,
              action: 'skipped',
              reason: "Instance déjà créée aujourd'hui",
            }
          }

          // Calculer la prochaine date d'échéance
          const nextDueDate = calculateNextDueDate(
            template.recurrence!,
            template.dueDate ? new Date(template.dueDate) : null,
          )

          // Créer la nouvelle instance
          const newTaskId = nanoid()
          const _newTask = await prisma.task.create({
            data: {
              id: newTaskId,
              name: template.name,
              description: template.description,
              projectId: template.projectId,
              parentId: template.id, // Lien vers le template
              estimatedHours: template.estimatedHours,
              dueDate: nextDueDate,
              reminderDate: template.reminderDate
                ? calculateNextDueDate(template.recurrence!, new Date(template.reminderDate))
                : null,
              reminderTime: template.reminderTime,
              soundEnabled: template.soundEnabled,
              priority: template.priority,
              status: 'TODO',
              complexity: template.complexity,
              activityType: template.activityType,
              activityName: template.activityName,
              periodicity: template.periodicity,
              createdBy: template.createdBy,
              isActive: true,
              isShared: template.isShared,
              isRecurringTemplate: false, // L'instance n'est pas un template
              createdAt: now,
              updatedAt: now,
            },
          })

          // Copier les membres du template vers la nouvelle instance
          if (template.TaskMember.length > 0) {
            await prisma.taskMember.createMany({
              data: template.TaskMember.map((member) => ({
                id: nanoid(),
                taskId: newTaskId,
                userId: member.userId,
                role: member.role,
                createdAt: now,
              })),
            })
          }

          // Créer des notifications pour les membres
          const users = [
            template.User_Task_createdByToUser,
            ...template.TaskMember.map((m) => m.User),
          ].filter(Boolean)

          const uniqueUsers = Array.from(new Map(users.map((u) => [u!.id, u])).values())

          if (uniqueUsers.length > 0) {
            await prisma.notification.createMany({
              data: uniqueUsers.map((user) => ({
                id: nanoid(),
                userId: user!.id,
                title: '🔄 Nouvelle tâche récurrente',
                message: `Une nouvelle instance de "${template.name}" a été créée`,
                type: 'task_recurring',
                link: `/dashboard/tasks?task=${newTaskId}`,
                isRead: false,
              })),
            })
          }

          return {
            templateId: template.id,
            templateName: template.name,
            action: 'created',
            newTaskId: newTaskId,
            dueDate: nextDueDate.toISOString(),
          }
        } catch (error) {
          console.error(`Erreur génération instance pour template ${template.id}:`, error)
          return {
            templateId: template.id,
            templateName: template.name,
            action: 'error',
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          }
        }
      })

      results.push(result)
    }

    return {
      processed: recurringTemplates.length,
      results,
      timestamp: now.toISOString(),
    }
  },
)

/**
 * Vérifie si une tâche doit être générée aujourd'hui selon la règle de récurrence
 * @param cronExpression - Expression cron (e.g., "0 9 * * 1" pour lundi 9h)
 * @param date - Date à vérifier
 * @param exceptions - Dates à exclure (jours fériés, vacances)
 * @returns true si la tâche doit être générée
 */
function checkRecurrenceRule(
  cronExpression: string,
  date: Date,
  exceptions: string[] | null,
): boolean {
  try {
    // Vérifier les exceptions (jours fériés, vacances)
    if (exceptions && exceptions.length > 0) {
      const dateStr = date.toISOString().split('T')[0]
      if (exceptions.includes(dateStr)) {
        return false
      }
    }

    // Parser l'expression cron
    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    })

    // Obtenir la prochaine occurrence
    const next = interval.next().toDate()

    // Vérifier si la prochaine occurrence est aujourd'hui
    const isSameDay =
      next.getFullYear() === date.getFullYear() &&
      next.getMonth() === date.getMonth() &&
      next.getDate() === date.getDate()

    return isSameDay
  } catch (error) {
    console.error('Erreur parsing cron expression:', error)
    return false
  }
}

/**
 * Calcule la prochaine date d'échéance basée sur l'expression cron
 * @param cronExpression - Expression cron
 * @param baseDate - Date de base (peut être null)
 * @returns Prochaine date d'échéance
 */
function calculateNextDueDate(cronExpression: string, _baseDate: Date | null): Date {
  try {
    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate: new Date(),
    })

    return interval.next().toDate()
  } catch (error) {
    console.error('Erreur calcul prochaine date:', error)
    // Fallback: retourner dans 7 jours
    const fallback = new Date()
    fallback.setDate(fallback.getDate() + 7)
    return fallback
  }
}
