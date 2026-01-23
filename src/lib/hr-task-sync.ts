/**
 * Module de synchronisation bidirectionnelle Task ↔ HRActivity
 *
 * Maintient la cohérence entre les tâches et les activités RH :
 * - Quand une HRActivity change de statut → mettre à jour la Task
 * - Quand une Task est supprimée → archiver les HRActivity liées
 * - Quand une HRActivity est supprimée → vérifier si la Task doit être désactivée
 */

import { prisma } from '@/lib/db'

// Types pour les statuts
// Note: HRActivityStatus dans la DB n'a que IN_PROGRESS et COMPLETED
type HRActivityStatus = 'IN_PROGRESS' | 'COMPLETED'
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'

// Map des statuts HRActivity → Task
const HR_TO_TASK_STATUS: Record<HRActivityStatus, TaskStatus> = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'DONE',
}

// Map inverse Task → HRActivity (CANCELLED et TODO deviennent IN_PROGRESS)
const TASK_TO_HR_STATUS: Record<TaskStatus, HRActivityStatus> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'COMPLETED',
  CANCELLED: 'IN_PROGRESS', // Pas de CANCELLED dans HRActivityStatus, on garde IN_PROGRESS
}

/**
 * Synchronise le statut d'une Task depuis une HRActivity
 * Appelé quand une HRActivity change de statut
 */
export async function syncTaskFromHRActivity(
  taskId: string,
  hrActivityStatus: HRActivityStatus,
): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, status: true },
  })

  if (!task) return

  const newStatus = HR_TO_TASK_STATUS[hrActivityStatus]

  // Ne mettre à jour que si le statut change
  if (task.status !== newStatus) {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completedAt: newStatus === 'DONE' ? new Date() : null,
        updatedAt: new Date(),
      },
    })
  }
}

/**
 * Synchronise le statut d'une HRActivity depuis une Task
 * Appelé quand une Task change de statut
 */
export async function syncHRActivityFromTask(
  taskId: string,
  taskStatus: TaskStatus,
): Promise<void> {
  const newStatus = TASK_TO_HR_STATUS[taskStatus]

  // Mettre à jour toutes les HRActivity liées à cette tâche
  await prisma.hRActivity.updateMany({
    where: { taskId },
    data: {
      status: newStatus,
      updatedAt: new Date(),
    },
  })
}

/**
 * Archive les HRActivity liées à une tâche supprimée
 * Préserve l'historique des heures travaillées
 */
export async function archiveHRActivitiesForDeletedTask(taskId: string): Promise<number> {
  // Compter les activités avant la mise à jour
  const count = await prisma.hRActivity.count({
    where: { taskId },
  })

  // Mettre taskId à null pour les HRActivity (soft-unlink)
  // Les heures restent dans le timesheet mais ne sont plus liées à la tâche
  if (count > 0) {
    await prisma.hRActivity.updateMany({
      where: { taskId },
      data: {
        taskId: null,
        updatedAt: new Date(),
      },
    })
  }

  return count
}

/**
 * Vérifie si une tâche doit être désactivée après suppression d'une HRActivity
 * Si la tâche n'a plus d'activités associées et a été créée automatiquement, la désactiver
 */
export async function checkTaskAfterHRActivityDeletion(taskId: string | null): Promise<void> {
  if (!taskId) return

  // Compter les HRActivity restantes pour cette tâche
  const remainingActivities = await prisma.hRActivity.count({
    where: { taskId },
  })

  if (remainingActivities === 0) {
    // Vérifier si la tâche a été créée automatiquement (a des champs activityType/activityName)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        activityType: true,
        activityName: true,
      },
    })

    // Si la tâche a des champs d'activité RH, elle a été créée automatiquement
    // On la désactive car elle n'a plus d'activité associée
    if (task?.activityType || task?.activityName) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      })
    }
  }
}

/**
 * Recalcule les heures estimées d'une tâche depuis ses HRActivity
 */
export async function recalculateTaskHoursFromActivities(taskId: string): Promise<number> {
  const result = await prisma.hRActivity.aggregate({
    _sum: { totalHours: true },
    where: { taskId },
  })

  const totalHours = result._sum.totalHours || 0

  await prisma.task.update({
    where: { id: taskId },
    data: {
      estimatedHours: totalHours,
      updatedAt: new Date(),
    },
  })

  return totalHours
}

/**
 * Synchronise complètement une tâche avec ses HRActivity
 * Utile pour les migrations ou corrections manuelles
 */
export async function fullSyncTaskWithActivities(taskId: string): Promise<{
  totalHours: number
  activityCount: number
  status: TaskStatus
}> {
  // Récupérer toutes les HRActivity de la tâche
  const activities = await prisma.hRActivity.findMany({
    where: { taskId },
    select: {
      id: true,
      status: true,
      totalHours: true,
    },
  })

  if (activities.length === 0) {
    return { totalHours: 0, activityCount: 0, status: 'TODO' }
  }

  // Calculer les heures totales
  const totalHours = activities.reduce((sum, a) => sum + a.totalHours, 0)

  // Déterminer le statut basé sur les activités
  const allCompleted = activities.every((a) => a.status === 'COMPLETED')
  const anyInProgress = activities.some((a) => a.status === 'IN_PROGRESS')

  let status: TaskStatus = 'TODO'
  if (allCompleted) {
    status = 'DONE'
  } else if (anyInProgress) {
    status = 'IN_PROGRESS'
  }

  // Mettre à jour la tâche
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      estimatedHours: totalHours,
      completedAt: status === 'DONE' ? new Date() : null,
      updatedAt: new Date(),
    },
  })

  return {
    totalHours,
    activityCount: activities.length,
    status,
  }
}
