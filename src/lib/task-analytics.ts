import { prisma } from "@/lib/db";

/**
 * Bibliothèque d'analytics pour le système de tâches
 *
 * Métriques calculées :
 * - Taux de complétion
 * - Temps moyen de résolution
 * - Compliance SLA
 * - Distribution par statut/priorité
 * - Tendances de productivité
 * - Performance par utilisateur/projet
 */

export interface TaskMetrics {
  // Métriques globales
  totalTasks: number;
  completedTasks: number;
  completionRate: number; // Pourcentage
  averageCompletionTime: number; // En heures

  // SLA Compliance
  slaCompliance: {
    onTrack: number;
    atRisk: number;
    breached: number;
    complianceRate: number; // Pourcentage
  };

  // Distribution
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;

  // Tâches en retard
  overdueTasks: number;
  averageOverdueDays: number;

  // Tâches récurrentes
  recurringTemplates: number;
  recurringInstancesCreated: number;
}

export interface UserPerformance {
  userId: string;
  userName: string;
  metrics: {
    totalAssigned: number;
    completed: number;
    completionRate: number;
    averageCompletionTime: number;
    overdueTasks: number;
    slaComplianceRate: number;
  };
}

export interface ProjectPerformance {
  projectId: string;
  projectName: string;
  metrics: {
    totalTasks: number;
    completed: number;
    completionRate: number;
    averageCompletionTime: number;
    overdueTasks: number;
    slaComplianceRate: number;
  };
}

export interface TrendData {
  date: string; // ISO date
  completed: number;
  created: number;
  netChange: number; // completed - created
}

/**
 * Calcule les métriques globales des tâches
 * @param userId - ID utilisateur (optionnel, pour filtrer par utilisateur)
 * @param projectId - ID projet (optionnel, pour filtrer par projet)
 * @param startDate - Date de début (optionnel)
 * @param endDate - Date de fin (optionnel)
 */
export async function calculateTaskMetrics(
  userId?: string,
  projectId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<TaskMetrics> {
  const whereConditions: any = {
    isActive: true,
  };

  // Filtre par utilisateur
  if (userId) {
    whereConditions.OR = [
      { createdBy: userId },
      { TaskMember: { some: { userId } } },
    ];
  }

  // Filtre par projet
  if (projectId) {
    whereConditions.projectId = projectId;
  }

  // Filtre par dates
  if (startDate || endDate) {
    whereConditions.createdAt = {};
    if (startDate) whereConditions.createdAt.gte = startDate;
    if (endDate) whereConditions.createdAt.lte = endDate;
  }

  // Requêtes parallèles pour optimiser les performances
  const [
    totalTasks,
    completedTasks,
    tasksByStatus,
    tasksByPriority,
    overdueTasks,
    slaStats,
    completionTimes,
    recurringStats,
  ] = await Promise.all([
    // Total des tâches
    prisma.task.count({ where: whereConditions }),

    // Tâches complétées
    prisma.task.count({
      where: {
        ...whereConditions,
        status: "DONE",
      },
    }),

    // Distribution par statut
    prisma.task.groupBy({
      by: ["status"],
      where: whereConditions,
      _count: { status: true },
    }),

    // Distribution par priorité
    prisma.task.groupBy({
      by: ["priority"],
      where: whereConditions,
      _count: { priority: true },
    }),

    // Tâches en retard
    prisma.task.findMany({
      where: {
        ...whereConditions,
        overdueDays: { gt: 0 },
      },
      select: {
        overdueDays: true,
      },
    }),

    // Statistiques SLA
    prisma.task.groupBy({
      by: ["slaStatus"],
      where: whereConditions,
      _count: { slaStatus: true },
    }),

    // Temps de complétion
    prisma.task.findMany({
      where: {
        ...whereConditions,
        status: "DONE",
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    }),

    // Statistiques récurrence
    Promise.all([
      prisma.task.count({
        where: {
          isRecurringTemplate: true,
          isActive: true,
        },
      }),
      prisma.task.count({
        where: {
          parentId: { not: null },
          ...(startDate || endDate ? { createdAt: whereConditions.createdAt } : {}),
        },
      }),
    ]),
  ]);

  // Calculer le taux de complétion
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculer le temps moyen de complétion (en heures)
  const completionTimesInHours = completionTimes.map((task) => {
    const created = new Date(task.createdAt).getTime();
    const completed = new Date(task.completedAt!).getTime();
    return (completed - created) / (1000 * 60 * 60); // Convertir en heures
  });
  const averageCompletionTime =
    completionTimesInHours.length > 0
      ? completionTimesInHours.reduce((a, b) => a + b, 0) / completionTimesInHours.length
      : 0;

  // Distribution par statut
  const byStatus: Record<string, number> = {};
  tasksByStatus.forEach((item) => {
    byStatus[item.status] = item._count.status;
  });

  // Distribution par priorité
  const byPriority: Record<string, number> = {};
  tasksByPriority.forEach((item) => {
    byPriority[item.priority] = item._count.priority;
  });

  // Statistiques de retard
  const overdueDaysArray = overdueTasks.map((t) => t.overdueDays || 0);
  const averageOverdueDays =
    overdueDaysArray.length > 0
      ? overdueDaysArray.reduce((a, b) => a + b, 0) / overdueDaysArray.length
      : 0;

  // SLA Compliance
  const slaMap: Record<string, number> = {};
  slaStats.forEach((item) => {
    slaMap[item.slaStatus || "ON_TRACK"] = item._count.slaStatus;
  });

  const slaCompliance = {
    onTrack: slaMap["ON_TRACK"] || 0,
    atRisk: slaMap["AT_RISK"] || 0,
    breached: slaMap["BREACHED"] || 0,
    complianceRate:
      totalTasks > 0 ? ((slaMap["ON_TRACK"] || 0) / totalTasks) * 100 : 100,
  };

  return {
    totalTasks,
    completedTasks,
    completionRate,
    averageCompletionTime,
    slaCompliance,
    byStatus,
    byPriority,
    overdueTasks: overdueTasks.length,
    averageOverdueDays,
    recurringTemplates: recurringStats[0],
    recurringInstancesCreated: recurringStats[1],
  };
}

/**
 * Calcule la performance par utilisateur
 * @param startDate - Date de début (optionnel)
 * @param endDate - Date de fin (optionnel)
 * @param limit - Nombre max d'utilisateurs à retourner
 */
export async function calculateUserPerformance(
  startDate?: Date,
  endDate?: Date,
  limit = 10
): Promise<UserPerformance[]> {
  // Récupérer tous les utilisateurs avec leurs tâches
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { Task_Task_createdByToUser: { some: { isActive: true } } },
        { TaskMember: { some: { Task: { isActive: true } } } },
      ],
    },
    select: {
      id: true,
      name: true,
      Task_Task_createdByToUser: {
        where: {
          isActive: true,
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        select: {
          status: true,
          createdAt: true,
          completedAt: true,
          overdueDays: true,
          slaStatus: true,
        },
      },
      TaskMember: {
        where: {
          Task: {
            isActive: true,
            ...(startDate || endDate
              ? {
                  createdAt: {
                    ...(startDate ? { gte: startDate } : {}),
                    ...(endDate ? { lte: endDate } : {}),
                  },
                }
              : {}),
          },
        },
        select: {
          Task: {
            select: {
              status: true,
              createdAt: true,
              completedAt: true,
              overdueDays: true,
              slaStatus: true,
            },
          },
        },
      },
    },
    take: limit,
  });

  return users.map((user) => {
    // Combiner les tâches créées et assignées
    const allTasks = [
      ...user.Task_Task_createdByToUser,
      ...user.TaskMember.map((tm) => tm.Task),
    ];

    const totalAssigned = allTasks.length;
    const completed = allTasks.filter((t) => t.status === "DONE").length;
    const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;

    // Temps moyen de complétion
    const completedTasks = allTasks.filter(
      (t) => t.status === "DONE" && t.completedAt
    );
    const avgTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            const created = new Date(task.createdAt).getTime();
            const completed = new Date(task.completedAt!).getTime();
            return sum + (completed - created) / (1000 * 60 * 60);
          }, 0) / completedTasks.length
        : 0;

    const overdueTasks = allTasks.filter((t) => (t.overdueDays || 0) > 0).length;
    const onTrackTasks = allTasks.filter((t) => t.slaStatus === "ON_TRACK").length;
    const slaComplianceRate =
      totalAssigned > 0 ? (onTrackTasks / totalAssigned) * 100 : 100;

    return {
      userId: user.id,
      userName: user.name,
      metrics: {
        totalAssigned,
        completed,
        completionRate,
        averageCompletionTime: avgTime,
        overdueTasks,
        slaComplianceRate,
      },
    };
  });
}

/**
 * Calcule la performance par projet
 * @param startDate - Date de début (optionnel)
 * @param endDate - Date de fin (optionnel)
 */
export async function calculateProjectPerformance(
  startDate?: Date,
  endDate?: Date
): Promise<ProjectPerformance[]> {
  const projects = await prisma.project.findMany({
    where: {
      Task: {
        some: {
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      Task: {
        where: {
          isActive: true,
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        select: {
          status: true,
          createdAt: true,
          completedAt: true,
          overdueDays: true,
          slaStatus: true,
        },
      },
    },
  });

  return projects.map((project) => {
    const totalTasks = project.Task.length;
    const completed = project.Task.filter((t) => t.status === "DONE").length;
    const completionRate = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;

    // Temps moyen de complétion
    const completedTasks = project.Task.filter(
      (t) => t.status === "DONE" && t.completedAt
    );
    const avgTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            const created = new Date(task.createdAt).getTime();
            const completed = new Date(task.completedAt!).getTime();
            return sum + (completed - created) / (1000 * 60 * 60);
          }, 0) / completedTasks.length
        : 0;

    const overdueTasks = project.Task.filter((t) => (t.overdueDays || 0) > 0).length;
    const onTrackTasks = project.Task.filter((t) => t.slaStatus === "ON_TRACK").length;
    const slaComplianceRate = totalTasks > 0 ? (onTrackTasks / totalTasks) * 100 : 100;

    return {
      projectId: project.id,
      projectName: project.name,
      metrics: {
        totalTasks,
        completed,
        completionRate,
        averageCompletionTime: avgTime,
        overdueTasks,
        slaComplianceRate,
      },
    };
  });
}

/**
 * Calcule les tendances de productivité (données pour graphique)
 * @param userId - ID utilisateur (optionnel)
 * @param days - Nombre de jours à analyser (défaut: 30)
 */
export async function calculateProductivityTrends(
  userId?: string,
  days = 30
): Promise<TrendData[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const whereConditions: any = {
    isActive: true,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (userId) {
    whereConditions.OR = [
      { createdBy: userId },
      { TaskMember: { some: { userId } } },
    ];
  }

  // Récupérer toutes les tâches dans la période
  const tasks = await prisma.task.findMany({
    where: whereConditions,
    select: {
      createdAt: true,
      completedAt: true,
      status: true,
    },
  });

  // Grouper par jour
  const dailyStats = new Map<string, { created: number; completed: number }>();

  // Initialiser tous les jours avec 0
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    dailyStats.set(dateStr, { created: 0, completed: 0 });
  }

  // Compter les créations et complétions par jour
  tasks.forEach((task) => {
    const createdDate = new Date(task.createdAt).toISOString().split("T")[0];
    const stats = dailyStats.get(createdDate);
    if (stats) {
      stats.created++;
    }

    if (task.status === "DONE" && task.completedAt) {
      const completedDate = new Date(task.completedAt).toISOString().split("T")[0];
      const completedStats = dailyStats.get(completedDate);
      if (completedStats) {
        completedStats.completed++;
      }
    }
  });

  // Convertir en tableau pour le graphique
  return Array.from(dailyStats.entries())
    .map(([date, stats]) => ({
      date,
      completed: stats.completed,
      created: stats.created,
      netChange: stats.completed - stats.created,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calcule les insights intelligents basés sur les données
 */
export async function calculateInsights(userId?: string): Promise<{
  insights: string[];
  recommendations: string[];
}> {
  const metrics = await calculateTaskMetrics(userId);
  const trends = await calculateProductivityTrends(userId, 7);

  const insights: string[] = [];
  const recommendations: string[] = [];

  // Insight : Taux de complétion
  if (metrics.completionRate >= 80) {
    insights.push(`Excellent taux de complétion : ${metrics.completionRate.toFixed(1)}%`);
  } else if (metrics.completionRate >= 60) {
    insights.push(`Bon taux de complétion : ${metrics.completionRate.toFixed(1)}%`);
    recommendations.push("Continuez à maintenir ce rythme de travail");
  } else {
    insights.push(`Taux de complétion à améliorer : ${metrics.completionRate.toFixed(1)}%`);
    recommendations.push("Priorisez la fin des tâches en cours avant d'en créer de nouvelles");
  }

  // Insight : Tâches en retard
  if (metrics.overdueTasks > 0) {
    insights.push(`${metrics.overdueTasks} tâche(s) en retard`);
    recommendations.push("Revoyez les priorités et dates d'échéance");
  }

  // Insight : SLA Compliance
  if (metrics.slaCompliance.complianceRate < 70) {
    insights.push(`Attention : ${metrics.slaCompliance.breached} tâches en breach SLA`);
    recommendations.push("Activez les rappels automatiques pour respecter les délais");
  }

  // Insight : Tendance
  const recentTrend = trends.slice(-3);
  const avgNetChange =
    recentTrend.reduce((sum, t) => sum + t.netChange, 0) / recentTrend.length;
  if (avgNetChange > 0) {
    insights.push("Tendance positive : plus de tâches complétées que créées");
  } else if (avgNetChange < -2) {
    insights.push("Backlog en augmentation");
    recommendations.push("Limitez la création de nouvelles tâches cette semaine");
  }

  return { insights, recommendations };
}
