"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { subMonths, startOfMonth, format } from "date-fns";
import { fr } from "date-fns/locale";

// Récupérer les statistiques globales
export const getDashboardStats = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userId, userRole } = ctx;
    const isAdmin = userRole === "ADMIN" || userRole === "DIRECTEUR";

    if (isAdmin) {
      const [activeProjects, ongoingTasks, totalHoursResult, usersCount] = await Promise.all([
        // Projets actifs
        prisma.project.count({
          where: { isActive: true },
        }),
        // Tâches en cours (TODO ou IN_PROGRESS)
        prisma.task.count({
          where: {
            isActive: true,
            status: { not: "DONE" }
          },
        }),
        // Total des heures (somme de totalHours dans HRTimesheet)
        prisma.hRTimesheet.aggregate({
          _sum: {
            totalHours: true,
          },
        }),
        // Nombre d'utilisateurs
        prisma.user.count(),
      ]);

      return {
        activeProjects,
        ongoingTasks,
        totalHours: totalHoursResult._sum.totalHours || 0,
        usersCount,
        viewType: "GLOBAL",
      };
    } else {
      // Statistiques pour un utilisateur spécifique
      const [activeProjects, ongoingTasks, totalHoursResult, completedTasks] = await Promise.all([
        // Projets actifs où l'utilisateur est membre
        prisma.project.count({
          where: { 
            isActive: true,
            ProjectMember: {
              some: { userId }
            }
          },
        }),
        // Tâches en cours assignées à l'utilisateur
        prisma.task.count({
          where: {
            isActive: true,
            status: { not: "DONE" },
            TaskMember: {
              some: { userId }
            }
          },
        }),
        // Ses heures totales
        prisma.hRTimesheet.aggregate({
          where: { userId },
          _sum: {
            totalHours: true,
          },
        }),
        // Ses tâches terminées
        prisma.task.count({
          where: {
            isActive: true,
            status: "DONE",
            TaskMember: {
              some: { userId }
            }
          },
        }),
      ]);

      return {
        activeProjects,
        ongoingTasks,
        totalHours: totalHoursResult._sum.totalHours || 0,
        completedTasks,
        viewType: "PERSONAL",
      };
    }
  });

// Récupérer l'activité récente (AuditLogs)
export const getRecentActivity = authActionClient
  .schema(z.object({ limit: z.number().default(5) }))
  .action(async ({ ctx, parsedInput }) => {
    const { userId, userRole } = ctx;
    const isAdmin = userRole === "ADMIN" || userRole === "DIRECTEUR";

    const whereClause = isAdmin ? {} : { userId };

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      take: parsedInput.limit,
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: {
            name: true,
            avatar: true,
            email: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      user: {
        name: log.User?.name || "Système",
        avatar: log.User?.avatar,
        initials: log.User?.name
          ? log.User.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
          : "SY",
      },
      action: formatAction(log.action),
      type: log.action,
      target: log.entity,
      time: formatTimeAgo(log.createdAt),
      createdAt: log.createdAt,
    }));
  });

// Récupérer les données pour le graphique d'activité (heures par mois)
export const getActivityChartData = authActionClient
  .schema(z.object({ months: z.number().default(6) }))
  .action(async ({ ctx, parsedInput }) => {
    const { userId, userRole } = ctx;
    const isAdmin = userRole === "ADMIN" || userRole === "DIRECTEUR";
    const { months } = parsedInput;
    
    const startDate = startOfMonth(subMonths(new Date(), months - 1));

    // Filtre de base
    const whereClause: any = {
        weekStartDate: {
          gte: startDate,
        },
    };

    // Si pas admin, on filtre par userId
    if (!isAdmin) {
        whereClause.userId = userId;
    }

    // On récupère les feuilles de temps depuis startDate
    const timesheets = await prisma.hRTimesheet.findMany({
      where: whereClause,
      select: {
        weekStartDate: true,
        totalHours: true,
      },
      orderBy: {
        weekStartDate: "asc",
      },
    });

    // Grouper par mois
    const groupedData: Record<string, number> = {};
    
    // Initialiser les mois
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, "MMM", { locale: fr });
      // Capitalize first letter
      const formattedMonth = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
      groupedData[formattedMonth] = 0;
    }

    // Remplir avec les données
    timesheets.forEach((ts) => {
      const monthKey = format(ts.weekStartDate, "MMM", { locale: fr });
      const formattedMonth = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
      if (groupedData[formattedMonth] !== undefined) {
        groupedData[formattedMonth] += ts.totalHours;
      }
    });

    // Convertir en tableau pour Recharts
    return Object.entries(groupedData).map(([name, total]) => ({
      name,
      total: Math.round(total),
    }));
  });

// Helpers
function formatAction(action: string): string {
  const map: Record<string, string> = {
    CREATE: "a créé",
    UPDATE: "a mis à jour",
    DELETE: "a supprimé",
    LOGIN: "s'est connecté",
  };
  return map[action] || action;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours} h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `Il y a ${diffInDays} j`;
}
