"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format } from "date-fns";

interface ReportFilters {
  period?: "week" | "month" | "quarter" | "year" | "custom";
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
  userId?: string;
}

export async function getReportSummary(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const { startDate, endDate } = getDateRange(filters);

    // Total des heures
    const totalHoursResult = await prisma.timesheetEntry.aggregate({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      _sum: {
        duration: true,
      },
    });

    // Heures par statut
    const hoursByStatus = await prisma.timesheetEntry.groupBy({
      by: ["status"],
      where: {
        date: { gte: startDate, lte: endDate },
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      _sum: {
        duration: true,
      },
    });

    // Heures par type
    const hoursByType = await prisma.timesheetEntry.groupBy({
      by: ["type"],
      where: {
        date: { gte: startDate, lte: endDate },
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      _sum: {
        duration: true,
      },
    });

    // Nombre de projets actifs
    const activeProjects = await prisma.project.count({
      where: {
        isActive: true,
        ...(filters.projectId && { id: filters.projectId }),
      },
    });

    const totalHours = totalHoursResult._sum.duration || 0;
    const approvedHours = hoursByStatus.find(s => s.status === "APPROVED")?._sum.duration || 0;
    const normalHours = hoursByType.find(t => t.type === "NORMAL")?._sum.duration || 0;
    const overtimeHours = hoursByType.find(t => t.type === "OVERTIME")?._sum.duration || 0;

    return {
      data: {
        totalHours,
        billableHours: approvedHours,
        activeProjects,
        validationRate: totalHours > 0 ? Math.round((approvedHours / totalHours) * 100) : 0,
        normalHours,
        overtimeHours,
        nightHours: hoursByType.find(t => t.type === "NIGHT")?._sum.duration || 0,
        weekendHours: hoursByType.find(t => t.type === "WEEKEND")?._sum.duration || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching report summary:", error);
    return { serverError: "Erreur lors du chargement des données" };
  }
}

export async function getWeeklyActivity(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const { startDate, endDate } = getDateRange(filters);

    const entries = await prisma.timesheetEntry.groupBy({
      by: ["date"],
      where: {
        date: { gte: startDate, lte: endDate },
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      _sum: {
        duration: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    const weeklyData = entries.map((entry) => ({
      day: format(new Date(entry.date), "EEE"),
      date: entry.date,
      hours: entry._sum.duration || 0,
    }));

    return { data: weeklyData };
  } catch (error) {
    console.error("Error fetching weekly activity:", error);
    return { serverError: "Erreur lors du chargement de l'activité hebdomadaire" };
  }
}

export async function getProjectDistribution(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const { startDate, endDate } = getDateRange(filters);

    const projectData = await prisma.timesheetEntry.groupBy({
      by: ["projectId"],
      where: {
        date: { gte: startDate, lte: endDate },
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      _sum: {
        duration: true,
      },
    });

    const projectIds = projectData.map(item => item.projectId);
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, color: true, code: true },
    });

    const projectMap = new Map(projects.map(p => [p.id, p]));

    const distribution = projectData.map((item) => {
      const project = projectMap.get(item.projectId);
      return {
        name: project?.name || "Inconnu",
        code: project?.code || "",
        hours: item._sum.duration || 0,
        color: project?.color || "#3b82f6",
      };
    }).sort((a, b) => b.hours - a.hours);

    return { data: distribution };
  } catch (error) {
    console.error("Error fetching project distribution:", error);
    return { serverError: "Erreur lors du chargement de la répartition par projet" };
  }
}

export async function getDetailedReport(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const { startDate, endDate } = getDateRange(filters);

    const entries = await prisma.timesheetEntry.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        Project: {
          select: {
            name: true,
            code: true,
            color: true,
          },
        },
        Task: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return { data: entries };
  } catch (error) {
    console.error("Error fetching detailed report:", error);
    return { serverError: "Erreur lors du chargement du rapport détaillé" };
  }
}

export async function getProjectReport(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const { startDate, endDate } = getDateRange(filters);

    const projectStats = await prisma.project.findMany({
      where: {
        isActive: true,
        ...(filters.projectId && { id: filters.projectId }),
      },
      include: {
        TimesheetEntry: {
          where: {
            date: { gte: startDate, lte: endDate },
            ...(filters.userId && { userId: filters.userId }),
          },
          select: {
            duration: true,
            type: true,
            status: true,
          },
        },
        ProjectMember: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const report = projectStats.map((project) => {
      const totalHours = project.TimesheetEntry.reduce((sum, entry) => sum + entry.duration, 0);
      const normalHours = project.TimesheetEntry
        .filter(e => e.type === "NORMAL")
        .reduce((sum, entry) => sum + entry.duration, 0);
      const overtimeHours = project.TimesheetEntry
        .filter(e => e.type === "OVERTIME")
        .reduce((sum, entry) => sum + entry.duration, 0);
      const approvedHours = project.TimesheetEntry
        .filter(e => e.status === "APPROVED")
        .reduce((sum, entry) => sum + entry.duration, 0);

      return {
        id: project.id,
        name: project.name,
        code: project.code,
        color: project.color,
        budgetHours: project.budgetHours,
        totalHours,
        normalHours,
        overtimeHours,
        approvedHours,
        members: project.ProjectMember.length,
        progress: project.budgetHours ? (totalHours / project.budgetHours) * 100 : 0,
      };
    });

    return { data: report };
  } catch (error) {
    console.error("Error fetching project report:", error);
    return { serverError: "Erreur lors du chargement du rapport par projet" };
  }
}

export async function getUserReport(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const { startDate, endDate } = getDateRange(filters);

    const userStats = await prisma.user.findMany({
      where: {
        ...(filters.userId && { id: filters.userId }),
      },
      include: {
        TimesheetEntry: {
          where: {
            date: { gte: startDate, lte: endDate },
            ...(filters.projectId && { projectId: filters.projectId }),
          },
          select: {
            duration: true,
            type: true,
            status: true,
            Project: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        Department: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    const report = userStats.map((user) => {
      const totalHours = user.TimesheetEntry.reduce((sum, entry) => sum + entry.duration, 0);
      const approvedHours = user.TimesheetEntry
        .filter(e => e.status === "APPROVED")
        .reduce((sum, entry) => sum + entry.duration, 0);
      const pendingHours = user.TimesheetEntry
        .filter(e => e.status === "SUBMITTED")
        .reduce((sum, entry) => sum + entry.duration, 0);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.Department?.name || "N/A",
        totalHours,
        approvedHours,
        pendingHours,
        validationRate: totalHours > 0 ? Math.round((approvedHours / totalHours) * 100) : 0,
      };
    });

    return { data: report };
  } catch (error) {
    console.error("Error fetching user report:", error);
    return { serverError: "Erreur lors du chargement du rapport par utilisateur" };
  }
}

function getDateRange(filters: ReportFilters) {
  const now = new Date();

  if (filters.startDate && filters.endDate) {
    return { startDate: filters.startDate, endDate: filters.endDate };
  }

  switch (filters.period) {
    case "week":
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }),
        endDate: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "quarter":
      return {
        startDate: startOfQuarter(now),
        endDate: endOfQuarter(now),
      };
    case "year":
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };
    case "month":
    default:
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
  }
}
