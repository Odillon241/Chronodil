'use server'

import { authActionClient } from '@/lib/safe-action'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import {
  subMonths,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from 'date-fns'
import { fr } from 'date-fns/locale'

// ============================================
// DASHBOARD REPORT GENERATION ACTIONS
// ============================================

const reportPeriodSchema = z.enum([
  'MONTH', // Mois en cours
  'QUARTER', // Trimestre en cours
  'SEMESTER', // Semestre en cours
  'YEAR', // Année en cours
  'CUSTOM', // Période personnalisée
])

const generateReportSchema = z.object({
  period: reportPeriodSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeComparison: z.boolean().default(true), // Comparer avec la période précédente
  format: z.enum(['word', 'excel']).default('word'),
})

/**
 * Interface pour les données complètes du rapport dashboard
 */
export interface DashboardReportData {
  // Métadonnées
  title: string
  subtitle: string
  author: string
  companyName: string
  generatedAt: Date
  period: {
    label: string
    startDate: Date
    endDate: Date
  }
  previousPeriod?: {
    label: string
    startDate: Date
    endDate: Date
  }

  // Statistiques globales
  currentStats: {
    activeProjects: number
    totalProjects: number
    ongoingTasks: number
    completedTasks: number
    totalTasks: number
    totalHours: number
    usersCount: number
    averageHoursPerUser: number
    taskCompletionRate: number
  }

  // Statistiques période précédente (pour comparaison)
  previousStats?: {
    activeProjects: number
    ongoingTasks: number
    completedTasks: number
    totalHours: number
    taskCompletionRate: number
  }

  // Évolution (variation en %)
  evolution?: {
    projectsChange: number
    tasksChange: number
    hoursChange: number
    completionRateChange: number
  }

  // Activité par mois (pour graphique)
  monthlyActivity: Array<{
    month: string
    hours: number
    tasksCompleted: number
    tasksCreated: number
  }>

  // Performance par projet
  projectPerformance: Array<{
    name: string
    totalTasks: number
    completedTasks: number
    completionRate: number
    totalHours: number
    status: string
  }>

  // Performance par utilisateur (top 10)
  userPerformance: Array<{
    name: string
    email: string
    role: string
    tasksCompleted: number
    totalHours: number
    averageCompletionTime: number
    efficiency: number
  }>

  // Distribution des tâches par statut
  taskDistribution: {
    todo: number
    inProgress: number
    done: number
    blocked: number
  }

  // Distribution des tâches par priorité
  priorityDistribution: {
    low: number
    medium: number
    high: number
    urgent: number
  }

  // Insights et recommandations
  insights: string[]
  recommendations: string[]

  // Conclusion
  conclusion: {
    summary: string
    highlights: string[]
    challenges: string[]
    outlook: string
  }
}

/**
 * Calculer les dates de période basé sur le type
 */
function calculatePeriodDates(
  period: z.infer<typeof reportPeriodSchema>,
  customStart?: string,
  customEnd?: string,
): {
  start: Date
  end: Date
  label: string
  previousStart: Date
  previousEnd: Date
  previousLabel: string
} {
  const now = new Date()
  let start: Date
  let end: Date
  let label: string
  let previousStart: Date
  let previousEnd: Date
  let previousLabel: string

  switch (period) {
    case 'MONTH':
      start = startOfMonth(now)
      end = endOfMonth(now)
      label = format(now, 'MMMM yyyy', { locale: fr })
      previousStart = startOfMonth(subMonths(now, 1))
      previousEnd = endOfMonth(subMonths(now, 1))
      previousLabel = format(subMonths(now, 1), 'MMMM yyyy', { locale: fr })
      break

    case 'QUARTER':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      start = quarterStart
      end = endOfMonth(new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 2, 1))
      label = `T${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`
      previousStart = new Date(quarterStart.getFullYear(), quarterStart.getMonth() - 3, 1)
      previousEnd = endOfMonth(new Date(quarterStart.getFullYear(), quarterStart.getMonth() - 1, 1))
      previousLabel = `T${Math.floor((quarterStart.getMonth() - 3) / 3) + 1} ${quarterStart.getMonth() < 3 ? quarterStart.getFullYear() - 1 : quarterStart.getFullYear()}`
      break

    case 'SEMESTER':
      const semesterStart = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1)
      start = semesterStart
      end = endOfMonth(new Date(semesterStart.getFullYear(), semesterStart.getMonth() + 5, 1))
      label = `S${now.getMonth() < 6 ? 1 : 2} ${now.getFullYear()}`
      previousStart = new Date(
        semesterStart.getFullYear() - (semesterStart.getMonth() < 6 ? 1 : 0),
        semesterStart.getMonth() < 6 ? 6 : 0,
        1,
      )
      previousEnd = endOfMonth(
        new Date(previousStart.getFullYear(), previousStart.getMonth() + 5, 1),
      )
      previousLabel = `S${semesterStart.getMonth() < 6 ? 2 : 1} ${semesterStart.getMonth() < 6 ? semesterStart.getFullYear() - 1 : semesterStart.getFullYear()}`
      break

    case 'YEAR':
      start = startOfYear(now)
      end = endOfYear(now)
      label = `Année ${now.getFullYear()}`
      previousStart = startOfYear(subYears(now, 1))
      previousEnd = endOfYear(subYears(now, 1))
      previousLabel = `Année ${now.getFullYear() - 1}`
      break

    case 'CUSTOM':
      start = customStart ? new Date(customStart) : startOfMonth(now)
      end = customEnd ? new Date(customEnd) : endOfMonth(now)
      label = `${format(start, 'd MMM yyyy', { locale: fr })} - ${format(end, 'd MMM yyyy', { locale: fr })}`
      // Pour custom, on prend la même durée avant
      const duration = end.getTime() - start.getTime()
      previousEnd = new Date(start.getTime() - 1)
      previousStart = new Date(previousEnd.getTime() - duration)
      previousLabel = `${format(previousStart, 'd MMM yyyy', { locale: fr })} - ${format(previousEnd, 'd MMM yyyy', { locale: fr })}`
      break

    default:
      start = startOfMonth(now)
      end = endOfMonth(now)
      label = format(now, 'MMMM yyyy', { locale: fr })
      previousStart = startOfMonth(subMonths(now, 1))
      previousEnd = endOfMonth(subMonths(now, 1))
      previousLabel = format(subMonths(now, 1), 'MMMM yyyy', { locale: fr })
  }

  return { start, end, label, previousStart, previousEnd, previousLabel }
}

/**
 * Générer les insights automatiques basés sur les données
 */
function generateInsights(
  currentStats: DashboardReportData['currentStats'],
  previousStats?: DashboardReportData['previousStats'],
  evolution?: DashboardReportData['evolution'],
): string[] {
  const insights: string[] = []

  // Analyse du taux de complétion
  if (currentStats.taskCompletionRate >= 80) {
    insights.push(
      `Excellent taux de complétion des tâches à ${currentStats.taskCompletionRate.toFixed(1)}%, indiquant une bonne productivité de l'équipe.`,
    )
  } else if (currentStats.taskCompletionRate >= 60) {
    insights.push(
      `Taux de complétion des tâches de ${currentStats.taskCompletionRate.toFixed(1)}%, dans la moyenne attendue.`,
    )
  } else {
    insights.push(
      `Le taux de complétion des tâches de ${currentStats.taskCompletionRate.toFixed(1)}% nécessite une attention particulière.`,
    )
  }

  // Analyse de l'évolution
  if (evolution) {
    if (evolution.hoursChange > 0) {
      insights.push(
        `Augmentation de ${evolution.hoursChange.toFixed(1)}% des heures travaillées par rapport à la période précédente.`,
      )
    } else if (evolution.hoursChange < -10) {
      insights.push(
        `Diminution notable de ${Math.abs(evolution.hoursChange).toFixed(1)}% des heures travaillées.`,
      )
    }

    if (evolution.completionRateChange > 5) {
      insights.push(
        `Amélioration du taux de complétion de ${evolution.completionRateChange.toFixed(1)} points.`,
      )
    } else if (evolution.completionRateChange < -5) {
      insights.push(
        `Le taux de complétion a diminué de ${Math.abs(evolution.completionRateChange).toFixed(1)} points.`,
      )
    }
  }

  // Analyse de la charge de travail
  if (currentStats.averageHoursPerUser > 0) {
    insights.push(
      `Moyenne de ${currentStats.averageHoursPerUser.toFixed(1)} heures par utilisateur sur la période.`,
    )
  }

  return insights
}

/**
 * Générer les recommandations basées sur l'analyse
 */
function generateRecommendations(
  currentStats: DashboardReportData['currentStats'],
  taskDistribution: DashboardReportData['taskDistribution'],
  priorityDistribution: DashboardReportData['priorityDistribution'],
): string[] {
  const recommendations: string[] = []

  // Recommandations basées sur les tâches bloquées
  if (taskDistribution.blocked > 0) {
    recommendations.push(
      `Traiter en priorité les ${taskDistribution.blocked} tâche(s) bloquée(s) pour débloquer l'avancement des projets.`,
    )
  }

  // Recommandations basées sur la distribution des priorités
  if (priorityDistribution.urgent > 5) {
    recommendations.push(
      `Revoir la priorisation : ${priorityDistribution.urgent} tâches marquées urgentes peuvent indiquer un problème de planification.`,
    )
  }

  // Recommandations basées sur le taux de complétion
  if (currentStats.taskCompletionRate < 60) {
    recommendations.push(
      'Envisager une revue des processus de gestion des tâches pour améliorer le taux de complétion.',
    )
  }

  // Recommandations générales
  if (currentStats.ongoingTasks > currentStats.usersCount * 5) {
    recommendations.push(
      'Le nombre de tâches en cours semble élevé. Considérer une priorisation plus stricte.',
    )
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Continuer les bonnes pratiques actuelles et maintenir le rythme de productivité.',
    )
  }

  return recommendations
}

/**
 * Générer la conclusion du rapport
 */
function generateConclusion(
  currentStats: DashboardReportData['currentStats'],
  evolution?: DashboardReportData['evolution'],
  period?: { label: string },
): DashboardReportData['conclusion'] {
  const highlights: string[] = []
  const challenges: string[] = []

  // Points positifs
  if (currentStats.taskCompletionRate >= 70) {
    highlights.push('Bon taux de complétion des tâches')
  }
  if (currentStats.activeProjects > 0) {
    highlights.push(`${currentStats.activeProjects} projet(s) actif(s) en cours de réalisation`)
  }
  if (evolution && evolution.hoursChange > 0) {
    highlights.push("Augmentation de l'activité par rapport à la période précédente")
  }

  // Défis
  if (currentStats.ongoingTasks > 50) {
    challenges.push('Volume important de tâches en cours nécessitant une gestion efficace')
  }
  if (evolution && evolution.completionRateChange < 0) {
    challenges.push('Légère baisse du taux de complétion à surveiller')
  }

  // Résumé
  let summary = `Sur la période ${period?.label || 'analysée'}, l'activité affiche `
  if (currentStats.taskCompletionRate >= 70) {
    summary += 'de bons résultats globaux '
  } else {
    summary += 'des résultats mitigés '
  }
  summary += `avec ${currentStats.completedTasks} tâche(s) terminée(s) sur ${currentStats.totalTasks} au total (${currentStats.taskCompletionRate.toFixed(1)}% de complétion).`

  // Perspective
  let outlook = ''
  if (evolution && evolution.tasksChange > 0 && evolution.completionRateChange >= 0) {
    outlook =
      'Les indicateurs sont favorables pour maintenir une dynamique positive sur la prochaine période.'
  } else if (evolution && evolution.completionRateChange < -5) {
    outlook =
      "Une attention particulière devra être portée sur l'organisation et la priorisation pour améliorer les performances."
  } else {
    outlook =
      "Les prochaines semaines permettront de consolider les acquis et d'optimiser les processus de travail."
  }

  return {
    summary,
    highlights: highlights.length > 0 ? highlights : ['Données en cours de collecte'],
    challenges: challenges.length > 0 ? challenges : ['Aucun défi majeur identifié'],
    outlook,
  }
}

/**
 * Action principale pour générer les données du rapport du dashboard
 */
export const generateDashboardReportData = authActionClient
  .schema(generateReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userRole, user } = ctx
    const { period, startDate, endDate, includeComparison } = parsedInput
    const userName = user?.name || 'Utilisateur'

    // Vérifier les permissions (admin, manager, directeur, RH)
    const allowedRoles = ['ADMIN', 'MANAGER', 'DIRECTEUR', 'HR']
    if (!allowedRoles.includes(userRole as string)) {
      throw new Error("Vous n'avez pas la permission de générer ce rapport")
    }

    // Calculer les dates de la période
    const dates = calculatePeriodDates(period, startDate, endDate)

    // ============================================
    // RÉCUPÉRATION DES DONNÉES - PÉRIODE COURANTE
    // ============================================

    const [
      // Statistiques des projets
      projectStats,
      // Statistiques des tâches
      taskStats,
      // Heures totales
      hoursStats,
      // Nombre d'utilisateurs
      usersCount,
      // Activité mensuelle
      monthlyTimesheets,
      // Distribution des tâches
      tasksByStatus,
      tasksByPriority,
      // Projets avec performance
      projectsWithStats,
      // Top utilisateurs
      topUsers,
    ] = await Promise.all([
      // Projets
      prisma.project
        .aggregate({
          where: {
            createdAt: { lte: dates.end },
          },
          _count: true,
        })
        .then(async (total) => {
          const active = await prisma.project.count({
            where: {
              isActive: true,
              createdAt: { lte: dates.end },
            },
          })
          return { total: total._count, active }
        }),

      // Tâches
      prisma.task.groupBy({
        by: ['status'],
        where: {
          isActive: true,
          createdAt: { gte: dates.start, lte: dates.end },
        },
        _count: true,
      }),

      // Heures
      prisma.hRTimesheet.aggregate({
        where: {
          weekStartDate: { gte: dates.start, lte: dates.end },
        },
        _sum: { totalHours: true },
      }),

      // Utilisateurs
      prisma.user.count(),

      // Activité mensuelle (6 derniers mois)
      prisma.hRTimesheet.findMany({
        where: {
          weekStartDate: { gte: subMonths(dates.end, 6), lte: dates.end },
        },
        select: {
          weekStartDate: true,
          totalHours: true,
        },
      }),

      // Distribution par statut
      prisma.task.groupBy({
        by: ['status'],
        where: { isActive: true },
        _count: true,
      }),

      // Distribution par priorité
      prisma.task.groupBy({
        by: ['priority'],
        where: { isActive: true },
        _count: true,
      }),

      // Projets avec stats (HRTimesheet n'a pas de relation directe avec Project)
      prisma.project.findMany({
        where: { isActive: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          Task: {
            where: { isActive: true },
            select: { status: true },
          },
        },
      }),

      // Top utilisateurs
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          TaskMember: {
            where: {
              Task: {
                isActive: true,
                status: 'DONE',
                updatedAt: { gte: dates.start, lte: dates.end },
              },
            },
            select: { taskId: true },
          },
          HRTimesheet_HRTimesheet_userIdToUser: {
            where: {
              weekStartDate: { gte: dates.start, lte: dates.end },
            },
            select: { totalHours: true },
          },
        },
      }),
    ])

    // Calculer les statistiques actuelles
    const totalTasksInPeriod = taskStats.reduce((sum, t) => sum + t._count, 0)
    const completedTasksInPeriod = taskStats.find((t) => t.status === 'DONE')?._count || 0
    const ongoingTasks =
      (taskStats.find((t) => t.status === 'IN_PROGRESS')?._count || 0) +
      (taskStats.find((t) => t.status === 'TODO')?._count || 0)
    const totalHours = hoursStats._sum.totalHours || 0

    const currentStats: DashboardReportData['currentStats'] = {
      activeProjects: projectStats.active,
      totalProjects: projectStats.total,
      ongoingTasks,
      completedTasks: completedTasksInPeriod,
      totalTasks: totalTasksInPeriod,
      totalHours,
      usersCount,
      averageHoursPerUser: usersCount > 0 ? totalHours / usersCount : 0,
      taskCompletionRate:
        totalTasksInPeriod > 0 ? (completedTasksInPeriod / totalTasksInPeriod) * 100 : 0,
    }

    // ============================================
    // RÉCUPÉRATION DES DONNÉES - PÉRIODE PRÉCÉDENTE (si demandé)
    // ============================================

    let previousStats: DashboardReportData['previousStats'] | undefined
    let evolution: DashboardReportData['evolution'] | undefined

    if (includeComparison) {
      const [prevProjects, prevTasks, prevHours] = await Promise.all([
        prisma.project.count({
          where: {
            isActive: true,
            createdAt: { lte: dates.previousEnd },
          },
        }),
        prisma.task.groupBy({
          by: ['status'],
          where: {
            isActive: true,
            createdAt: { gte: dates.previousStart, lte: dates.previousEnd },
          },
          _count: true,
        }),
        prisma.hRTimesheet.aggregate({
          where: {
            weekStartDate: { gte: dates.previousStart, lte: dates.previousEnd },
          },
          _sum: { totalHours: true },
        }),
      ])

      const prevTotalTasks = prevTasks.reduce((sum, t) => sum + t._count, 0)
      const prevCompletedTasks = prevTasks.find((t) => t.status === 'DONE')?._count || 0
      const prevOngoing =
        (prevTasks.find((t) => t.status === 'IN_PROGRESS')?._count || 0) +
        (prevTasks.find((t) => t.status === 'TODO')?._count || 0)
      const prevTotalHours = prevHours._sum.totalHours || 0
      const prevCompletionRate =
        prevTotalTasks > 0 ? (prevCompletedTasks / prevTotalTasks) * 100 : 0

      previousStats = {
        activeProjects: prevProjects,
        ongoingTasks: prevOngoing,
        completedTasks: prevCompletedTasks,
        totalHours: prevTotalHours,
        taskCompletionRate: prevCompletionRate,
      }

      // Calculer l'évolution
      evolution = {
        projectsChange:
          prevProjects > 0
            ? ((currentStats.activeProjects - prevProjects) / prevProjects) * 100
            : 0,
        tasksChange:
          prevTotalTasks > 0 ? ((totalTasksInPeriod - prevTotalTasks) / prevTotalTasks) * 100 : 0,
        hoursChange:
          prevTotalHours > 0 ? ((totalHours - prevTotalHours) / prevTotalHours) * 100 : 0,
        completionRateChange: currentStats.taskCompletionRate - prevCompletionRate,
      }
    }

    // ============================================
    // FORMATER LES DONNÉES POUR LE RAPPORT
    // ============================================

    // Activité mensuelle
    const monthlyActivity: DashboardReportData['monthlyActivity'] = []
    const monthGroups: Record<string, { hours: number }> = {}

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(dates.end, i)
      const monthKey = format(date, 'MMM yyyy', { locale: fr })
      monthGroups[monthKey] = { hours: 0 }
    }

    monthlyTimesheets.forEach((ts) => {
      const monthKey = format(ts.weekStartDate, 'MMM yyyy', { locale: fr })
      if (monthGroups[monthKey]) {
        monthGroups[monthKey].hours += ts.totalHours
      }
    })

    Object.entries(monthGroups).forEach(([month, data]) => {
      monthlyActivity.push({
        month,
        hours: Math.round(data.hours),
        tasksCompleted: 0, // À calculer si nécessaire
        tasksCreated: 0,
      })
    })

    // Performance par projet (heures non disponibles directement - HRTimesheet lié à User, pas Project)
    const projectPerformance: DashboardReportData['projectPerformance'] = projectsWithStats.map(
      (project) => {
        const totalTasks = project.Task.length
        const completedTasks = project.Task.filter((t) => t.status === 'DONE').length

        return {
          name: project.name,
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          totalHours: 0, // HRTimesheet n'est pas directement lié à Project
          status: project.isActive ? 'Actif' : 'Inactif',
        }
      },
    )

    // Performance par utilisateur
    const userPerformance: DashboardReportData['userPerformance'] = topUsers
      .map((user) => {
        const tasksCompleted = user.TaskMember.length
        const userHours = user.HRTimesheet_HRTimesheet_userIdToUser.reduce(
          (sum, ts) => sum + ts.totalHours,
          0,
        )

        return {
          name: user.name || 'Non défini',
          email: user.email,
          role: user.role || 'EMPLOYEE',
          tasksCompleted,
          totalHours: userHours,
          averageCompletionTime: 0, // À calculer si nécessaire
          efficiency: userHours > 0 && tasksCompleted > 0 ? (tasksCompleted / userHours) * 100 : 0,
        }
      })
      .filter((u) => u.tasksCompleted > 0 || u.totalHours > 0)
      .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
      .slice(0, 10)

    // Distribution des tâches
    const taskDistribution: DashboardReportData['taskDistribution'] = {
      todo: tasksByStatus.find((t) => t.status === 'TODO')?._count || 0,
      inProgress: tasksByStatus.find((t) => t.status === 'IN_PROGRESS')?._count || 0,
      done: tasksByStatus.find((t) => t.status === 'DONE')?._count || 0,
      blocked: tasksByStatus.find((t) => t.status === 'BLOCKED')?._count || 0,
    }

    // Distribution par priorité
    const priorityDistribution: DashboardReportData['priorityDistribution'] = {
      low: tasksByPriority.find((t) => t.priority === 'LOW')?._count || 0,
      medium: tasksByPriority.find((t) => t.priority === 'MEDIUM')?._count || 0,
      high: tasksByPriority.find((t) => t.priority === 'HIGH')?._count || 0,
      urgent: tasksByPriority.find((t) => t.priority === 'URGENT')?._count || 0,
    }

    // Générer insights et recommandations
    const insights = generateInsights(currentStats, previousStats, evolution)
    const recommendations = generateRecommendations(
      currentStats,
      taskDistribution,
      priorityDistribution,
    )

    // Générer la conclusion
    const conclusion = generateConclusion(currentStats, evolution, { label: dates.label })

    // ============================================
    // CONSTRUIRE L'OBJET DE RAPPORT FINAL
    // ============================================

    const reportData: DashboardReportData = {
      title: "Rapport d'Activité",
      subtitle: `Période : ${dates.label}`,
      author: userName || 'Système',
      companyName: 'Chronodil',
      generatedAt: new Date(),
      period: {
        label: dates.label,
        startDate: dates.start,
        endDate: dates.end,
      },
      previousPeriod: includeComparison
        ? {
            label: dates.previousLabel,
            startDate: dates.previousStart,
            endDate: dates.previousEnd,
          }
        : undefined,
      currentStats,
      previousStats,
      evolution,
      monthlyActivity,
      projectPerformance,
      userPerformance,
      taskDistribution,
      priorityDistribution,
      insights,
      recommendations,
      conclusion,
    }

    return reportData
  })

/**
 * Générer et télécharger le rapport Word
 */
export const downloadDashboardReport = authActionClient
  .schema(generateReportSchema)
  .action(async ({ parsedInput }) => {
    // Générer les données
    const reportDataResult = await generateDashboardReportData(parsedInput)

    if (!reportDataResult?.data) {
      throw new Error('Erreur lors de la génération des données du rapport')
    }

    const reportData = reportDataResult.data
    const { format: exportFormat } = parsedInput

    // Générer le fichier selon le format
    let buffer: Buffer
    let filename: string
    let mimeType: string

    if (exportFormat === 'word') {
      const { exportDashboardReportToWord } = await import('@/lib/export/dashboard-word-export')
      buffer = await exportDashboardReportToWord(reportData)
      filename = `Rapport_Activite_${reportData.period.label.replace(/\s/g, '_')}.docx`
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else {
      const { exportDashboardReportToExcel } = await import('@/lib/export/dashboard-excel-export')
      buffer = await exportDashboardReportToExcel(reportData)
      filename = `Rapport_Activite_${reportData.period.label.replace(/\s/g, '_')}.xlsx`
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    // Convertir en base64 pour le transfert
    const base64 = buffer.toString('base64')

    return {
      filename,
      mimeType,
      data: base64,
      size: buffer.length,
    }
  })
