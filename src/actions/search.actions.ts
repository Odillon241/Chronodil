"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Types pour les résultats de recherche
interface QuickAction {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  category: "action" | "navigation";
}

// Actions rapides statiques
const QUICK_ACTIONS: QuickAction[] = [
  // Navigation
  { id: "nav-dashboard", name: "Tableau de bord", description: "Accéder au tableau de bord", path: "/dashboard", icon: "LayoutDashboard", category: "navigation" },
  { id: "nav-tasks", name: "Tâches", description: "Voir toutes les tâches", path: "/dashboard/tasks", icon: "FileText", category: "navigation" },
  { id: "nav-projects", name: "Projets", description: "Voir tous les projets", path: "/dashboard/projects", icon: "FolderOpen", category: "navigation" },
  { id: "nav-timesheets", name: "Feuilles de temps", description: "Gérer les feuilles de temps", path: "/dashboard/hr-timesheet", icon: "Clock", category: "navigation" },
  { id: "nav-settings", name: "Paramètres", description: "Configurer l'application", path: "/dashboard/settings", icon: "Settings", category: "navigation" },
  { id: "nav-profile", name: "Profil", description: "Voir mon profil", path: "/dashboard/settings/profile", icon: "User", category: "navigation" },
  { id: "nav-notifications", name: "Notifications", description: "Voir les notifications", path: "/dashboard/notifications", icon: "Bell", category: "navigation" },
  // Actions
  { id: "action-new-task", name: "Créer une tâche", description: "Nouvelle tâche rapidement", path: "/dashboard/tasks?new=true", icon: "Plus", category: "action" },
  { id: "action-new-timesheet", name: "Nouvelle feuille de temps", description: "Créer une feuille HR", path: "/dashboard/hr-timesheet/new", icon: "Plus", category: "action" },
  { id: "action-new-project", name: "Nouveau projet", description: "Créer un nouveau projet", path: "/dashboard/projects?new=true", icon: "Plus", category: "action" },
];

// Action de recherche globale puissante
export const globalSearch = authActionClient
  .schema(
    z.object({
      query: z.string().min(1, "La requête de recherche est requise"),
      limit: z.number().min(1).max(20).default(5),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx;
    const { query, limit } = parsedInput;

    const searchQuery = query.toLowerCase().trim();

    // 1. Actions rapides filtrées
    const quickActions = QUICK_ACTIONS.filter(
      (action) =>
        action.name.toLowerCase().includes(searchQuery) ||
        action.description.toLowerCase().includes(searchQuery)
    ).slice(0, limit);

    // 2. Recherche dans les projets (accessibles à l'utilisateur)
    const projectMembers = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const projectIds = projectMembers.map((pm) => pm.projectId);

    const projects = await prisma.project.findMany({
      where: {
        AND: [
          {
            OR: [
              { id: { in: projectIds } },
              { createdBy: userId },
            ],
          },
          {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { code: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        code: true,
        color: true,
        isActive: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    // 3. Recherche dans les tâches (accessibles à l'utilisateur)
    const taskMembers = await prisma.taskMember.findMany({
      where: { userId },
      select: { taskId: true },
    });

    const taskIds = taskMembers.map((tm) => tm.taskId);

    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          {
            OR: [
              { id: { in: taskIds } },
              { createdBy: userId },
              { projectId: { in: projectIds } },
              { projectId: null }, // Tâches personnelles
            ],
          },
          {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        projectId: true,
        Project: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // 4. Recherche dans les utilisateurs (limitée selon les permissions)
    let users: any[] = [];
    if (["ADMIN", "HR", "DIRECTEUR", "MANAGER"].includes(userRole)) {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { email: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          image: true,
        },
        take: limit,
        orderBy: { name: "asc" },
      });
    }

    // 5. Recherche dans les feuilles de temps (HRTimesheet)
    const timesheets = await prisma.hRTimesheet.findMany({
      where: {
        AND: [
          { userId }, // Uniquement ses propres timesheets (ou élargir pour managers)
          {
            OR: [
              { employeeName: { contains: searchQuery, mode: "insensitive" } },
              { position: { contains: searchQuery, mode: "insensitive" } },
              { site: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        weekStartDate: true,
        weekEndDate: true,
        employeeName: true,
        status: true,
        totalHours: true,
      },
      take: limit,
      orderBy: { weekStartDate: "desc" },
    });

    // 6. Recherche dans les notifications non lues
    const notifications = await prisma.notification.findMany({
      where: {
        AND: [
          { userId },
          { isRead: false },
          {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { message: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        link: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return {
      quickActions,
      projects,
      tasks,
      users,
      timesheets,
      notifications,
      total:
        quickActions.length +
        projects.length +
        tasks.length +
        users.length +
        timesheets.length +
        notifications.length,
    };
  });
