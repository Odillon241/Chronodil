"use server";

import { getSession, getUserRole } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { actionClient, authActionClient } from "@/lib/safe-action";
import { z } from "zod";
import { nanoid } from "nanoid";
import { logTaskActivity, logTaskChanges } from "@/lib/task-activity";

const createTaskSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  parentId: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  dueDate: z.date().optional(),
  reminderDate: z.date().optional(),
  reminderTime: z.string().optional(),
  soundEnabled: z.boolean().optional(),
  isShared: z.boolean().optional(),
  sharedWith: z.array(z.string()).optional(), // Array of user IDs
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  complexity: z.enum(["FAIBLE", "MOYEN", "ÉLEVÉ"]).optional(),
  trainingLevel: z.enum(["NONE", "BASIC", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional().nullable(),
  masteryLevel: z.enum(["NOVICE", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional().nullable(),
  understandingLevel: z.enum(["NONE", "SUPERFICIAL", "WORKING", "COMPREHENSIVE", "EXPERT"]).optional().nullable(),
  // Nouveau champ pour lier à un HR Timesheet
  hrTimesheetId: z.string().optional(),
});

const updateTaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  dueDate: z.date().optional(),
  reminderDate: z.date().optional(),
  reminderTime: z.string().optional(),
  soundEnabled: z.boolean().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const createTask = actionClient
  .schema(createTaskSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());
    const userRole = getUserRole(session);

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Vérifier que l'utilisateur est membre du projet seulement si un projet est spécifié
    if (parsedInput.projectId) {
      const member = await prisma.projectMember.findFirst({
        where: {
          projectId: parsedInput.projectId,
          userId: session.user.id,
        },
      });

      if (!member && getUserRole(session) !== "ADMIN") {
        throw new Error("Vous n'êtes pas membre de ce projet");
      }
    }

    const { sharedWith, hrTimesheetId, ...taskData } = parsedInput;
    const taskId = nanoid();

    // Vérifier que le HR Timesheet existe et appartient à l'utilisateur si spécifié
    if (hrTimesheetId) {
      const timesheet = await prisma.hRTimesheet.findFirst({
        where: {
          id: hrTimesheetId,
          userId: session.user.id,
        },
      });

      if (!timesheet) {
        throw new Error("Timesheet non trouvé ou vous n'avez pas la permission");
      }
    }

    // Créer la tâche avec transaction pour garantir la cohérence
    const task = await prisma.$transaction(async (tx) => {
      // Créer la tâche
      const newTask = await tx.task.create({
        data: {
          id: taskId,
          ...taskData,
          hrTimesheetId,
          createdBy: session.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          Project: {
            select: {
              name: true,
              code: true,
            },
          },
          HRTimesheet: {
            select: {
              id: true,
              weekStartDate: true,
              weekEndDate: true,
            },
          },
        },
      });

      // Ajouter le créateur comme membre
      await tx.taskMember.create({
        data: {
          id: nanoid(),
          taskId: taskId,
          userId: session.user.id,
          role: "creator",
        },
      });

      // Ajouter les membres partagés si spécifiés
      if (sharedWith && sharedWith.length > 0) {
        await tx.taskMember.createMany({
          data: sharedWith.map((userId) => ({
            id: nanoid(),
            taskId: taskId,
            userId: userId,
            role: "member",
          })),
        });

        // Créer des notifications pour les utilisateurs avec qui la tâche est partagée
        const currentUser = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { name: true },
        });

        await tx.notification.createMany({
          data: sharedWith.map((userId) => ({
            id: nanoid(),
            userId: userId,
            title: "Nouvelle tâche partagée",
            message: `${currentUser?.name} a partagé la tâche "${taskData.name}" avec vous`,
            type: "task_shared",
            link: `/dashboard/tasks`,
            isRead: false,
          })),
        });
      }

      return newTask;
    });

    // Logger la création de la tâche
    await logTaskActivity({
      taskId: task.id,
      userId: session.user.id,
      action: "created",
    });

    return task;
  });

export const updateTask = actionClient
  .schema(updateTaskSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());
    const userRole = getUserRole(session);

    if (!session) {
      throw new Error("Non authentifié");
    }

    const { id, ...data } = parsedInput;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { Project: true },
    });

    if (!task) {
      throw new Error("Tâche non trouvée");
    }

    // Vérifier que l'utilisateur est membre du projet seulement si un projet est associé
    if (task.projectId) {
      const member = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: session.user.id,
        },
      });

      if (!member && getUserRole(session) !== "ADMIN") {
        throw new Error("Vous n'êtes pas membre de ce projet");
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        Project: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    // Logger les changements
    await logTaskChanges(id, session.user.id, task, updatedTask);

    return updatedTask;
  });

export const deleteTask = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());
    const userRole = getUserRole(session);

    if (!session) {
      throw new Error("Non authentifié");
    }

    const task = await prisma.task.findUnique({
      where: { id: parsedInput.id },
      include: { Project: true },
    });

    if (!task) {
      throw new Error("Tâche non trouvée");
    }

    // Vérifier que l'utilisateur est membre du projet seulement si un projet est associé
    if (task.projectId) {
      const member = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: session.user.id,
        },
      });

      if (!member && getUserRole(session) !== "ADMIN") {
        throw new Error("Vous n'êtes pas membre de ce projet");
      }
    }

    await prisma.task.delete({
      where: { id: parsedInput.id },
    });

    return { success: true };
  });

export const getProjectTasks = actionClient
  .schema(z.object({ projectId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());
    const userRole = getUserRole(session);

    if (!session) {
      throw new Error("Non authentifié");
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: parsedInput.projectId,
      },
      include: {
        Project: {
          select: {
            name: true,
            code: true,
          },
        },
        Task: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            TaskComment: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return tasks;
  });

export const getMyTasks = actionClient
  .schema(z.object({ projectId: z.string().optional(), searchQuery: z.string().optional() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());
    const userRole = getUserRole(session);

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Récupérer les tâches dont l'utilisateur est membre (créateur ou membre partagé)
    const taskMembers = await prisma.taskMember.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        taskId: true,
      },
    });

    const taskIds = taskMembers.map((tm) => tm.taskId);

    // Récupérer les projets dont l'utilisateur est membre
    const projectMembers = await prisma.projectMember.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        projectId: true,
      },
    });

    const projectIds = projectMembers.map((pm) => pm.projectId);

    // Construire les conditions :
    // - Tâches dont l'utilisateur est membre (TaskMember)
    // - Tâches créées par l'utilisateur
    // - Tâches des projets où l'utilisateur est membre
    // - Tâches personnelles (projectId null)
    const orVisibilityConditions: any[] = [];
    if (taskIds.length > 0) {
      orVisibilityConditions.push({ id: { in: taskIds } });
    }
    orVisibilityConditions.push({ createdBy: session.user.id });
    if (projectIds.length > 0) {
      orVisibilityConditions.push({ projectId: { in: projectIds } });
    }
    orVisibilityConditions.push({ projectId: null });

    const andConditions: any[] = [];
    if (parsedInput.projectId) {
      andConditions.push({ projectId: parsedInput.projectId });
    }
    if (parsedInput.searchQuery) {
      andConditions.push({
        OR: [
          { name: { contains: parsedInput.searchQuery, mode: "insensitive" } },
          { description: { contains: parsedInput.searchQuery, mode: "insensitive" } },
        ],
      });
    }

    const tasks = await prisma.task.findMany({
      where: {
        isActive: true,
        AND: [
          ...andConditions,
          { OR: orVisibilityConditions },
        ],
      },
      include: {
        Project: {
          select: {
            name: true,
            code: true,
            color: true,
          },
        },
        Task: {
          select: {
            id: true,
            name: true,
          },
        },
        Creator: {
          select: {
            name: true,
            email: true,
            avatar: true,
          },
        },
        TaskMember: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            TaskComment: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return tasks;
  });

export const getAvailableUsersForSharing = actionClient
  .schema(z.object({ projectId: z.string().optional() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());
    const userRole = getUserRole(session);

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Si un projet est spécifié, récupérer seulement les membres du projet
    if (parsedInput.projectId) {
      const members = await prisma.projectMember.findMany({
        where: {
          projectId: parsedInput.projectId,
          userId: { not: session.user.id }, // Exclure l'utilisateur actuel
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              departmentId: true,
            },
          },
        },
      });

      return members.map((m) => m.User);
    }

    // Sinon, récupérer tous les utilisateurs actifs sauf l'utilisateur actuel
    const users = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        departmentId: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return users;
  });

export const updateTaskStatus = actionClient
  .schema(z.object({
    id: z.string(),
    status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]),
  }))
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());
    const userRole = getUserRole(session);

    if (!session) {
      throw new Error("Non authentifié");
    }

    const task = await prisma.task.findUnique({
      where: { id: parsedInput.id },
      include: {
        TaskMember: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new Error("Tâche non trouvée");
    }

    // Mettre à jour le statut
    const updatedTask = await prisma.task.update({
      where: { id: parsedInput.id },
      data: {
        status: parsedInput.status,
        completedAt: parsedInput.status === "DONE" ? new Date() : task.completedAt,
        updatedAt: new Date(),
      },
      include: {
        Project: {
          select: {
            name: true,
            code: true,
            color: true,
          },
        },
      },
    });

    // Notifier les membres si la tâche est partagée
    if (task.isShared && task.TaskMember.length > 1) {
      const otherMembers = task.TaskMember.filter(m => m.userId !== session.user.id);
      
      if (otherMembers.length > 0) {
        await prisma.notification.createMany({
          data: otherMembers.map(member => ({
            id: nanoid(),
            userId: member.userId,
            title: "Statut de tâche modifié",
            message: `${session.user.name} a changé le statut de "${task.name}" à ${parsedInput.status}`,
            type: "task_status_changed",
            link: `/dashboard/tasks`,
            isRead: false,
          })),
        });
      }
    }

    // Logger le changement de statut
    await logTaskActivity({
      taskId: parsedInput.id,
      userId: session.user.id,
      action: "status_changed",
      field: "status",
      oldValue: task.status,
      newValue: parsedInput.status,
    });

    return updatedTask;
  });

export const updateTaskPriority = actionClient
  .schema(z.object({
    id: z.string(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  }))
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());
    const userRole = getUserRole(session);

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Récupérer la tâche actuelle pour le logging
    const task = await prisma.task.findUnique({
      where: { id: parsedInput.id },
    });

    if (!task) {
      throw new Error("Tâche non trouvée");
    }

    const updatedTask = await prisma.task.update({
      where: { id: parsedInput.id },
      data: {
        priority: parsedInput.priority,
        updatedAt: new Date(),
      },
      include: {
        Project: {
          select: {
            name: true,
            code: true,
            color: true,
          },
        },
      },
    });

    // Logger le changement de priorité
    await logTaskActivity({
      taskId: parsedInput.id,
      userId: session.user.id,
      action: "priority_changed",
      field: "priority",
      oldValue: task.priority,
      newValue: parsedInput.priority,
    });

    return updatedTask;
  });

const evaluateTaskSchema = z.object({
  id: z.string(),
  trainingLevel: z.enum(["NONE", "BASIC", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  masteryLevel: z.enum(["NOVICE", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  understandingLevel: z.enum(["NONE", "SUPERFICIAL", "WORKING", "COMPREHENSIVE", "EXPERT"]).optional(),
  evaluationNotes: z.string().optional(),
});

export const evaluateTask = actionClient
  .schema(evaluateTaskSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());
    const userRole = getUserRole(session);

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Vérifier que seul un manager ou directeur peut évaluer
    if (!["MANAGER", "DIRECTEUR", "ADMIN"].includes(getUserRole(session) as string)) {
      throw new Error("Seuls les managers et directeurs peuvent évaluer les tâches");
    }

    const task = await prisma.task.findUnique({
      where: { id: parsedInput.id },
    });

    if (!task) {
      throw new Error("Tâche non trouvée");
    }

    const updatedTask = await prisma.task.update({
      where: { id: parsedInput.id },
      data: {
        trainingLevel: parsedInput.trainingLevel,
        masteryLevel: parsedInput.masteryLevel,
        understandingLevel: parsedInput.understandingLevel,
        evaluationNotes: parsedInput.evaluationNotes,
        evaluatedBy: session.user.id,
        evaluatedAt: new Date(),
      },
    });

    // Logger l'évaluation
    await logTaskActivity({
      taskId: parsedInput.id,
      userId: session.user.id,
      action: "task_evaluated",
      description: `Évaluation: Formation=${parsedInput.trainingLevel}, Maîtrise=${parsedInput.masteryLevel}, Compréhension=${parsedInput.understandingLevel}`,
    });

    return updatedTask;
  });

const updateTaskComplexitySchema = z.object({
  id: z.string(),
  complexity: z.enum(["FAIBLE", "MOYEN", "ÉLEVÉ"]),
  recurrence: z.string().optional(),
});

export const updateTaskComplexity = actionClient
  .schema(updateTaskComplexitySchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());
    const userRole = getUserRole(session);

    if (!session) {
      throw new Error("Non authentifié");
    }

    const task = await prisma.task.findUnique({
      where: { id: parsedInput.id },
    });

    if (!task) {
      throw new Error("Tâche non trouvée");
    }

    // Vérifier les permissions - créateur ou manager
    if (task.createdBy !== session.user.id && !["MANAGER", "DIRECTEUR", "ADMIN"].includes(getUserRole(session) as string)) {
      throw new Error("Vous n'avez pas les permissions pour modifier cette tâche");
    }

    const updatedTask = await prisma.task.update({
      where: { id: parsedInput.id },
      data: {
        complexity: parsedInput.complexity,
        recurrence: parsedInput.recurrence,
      },
    });

    // Logger le changement de complexité
    await logTaskActivity({
      taskId: parsedInput.id,
      userId: session.user.id,
      action: "complexity_changed",
      field: "complexity",
      oldValue: task.complexity,
      newValue: parsedInput.complexity,
    });

    return updatedTask;
  });

/**
 * Récupérer les tâches de l'utilisateur connecté pour la sélection dans HR Timesheet
 * Filtre sur les tâches actives avec status TODO ou IN_PROGRESS
 */
export const getUserTasksForHRTimesheet = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    try {
      // Récupérer les tâches où l'utilisateur est créateur ou membre
      const tasks = await prisma.task.findMany({
        where: {
          isActive: true,
          status: {
            in: ["TODO", "IN_PROGRESS"],
          },
          OR: [
            { createdBy: ctx.userId },
            {
              TaskMember: {
                some: {
                  userId: ctx.userId,
                },
              },
            },
          ],
        },
        include: {
          Project: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
            },
          },
          Creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
        ],
      });

      return tasks;
    } catch (error) {
      console.error("Erreur dans getUserTasksForHRTimesheet:", error);
      throw new Error(
        `Erreur lors de la récupération des tâches: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`
      );
    }
  });
