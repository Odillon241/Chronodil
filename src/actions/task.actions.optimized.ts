"use server";

// ============================================
// VERSION OPTIMISÉE DES REQUÊTES TASK
// ============================================
// Cette version optimise les requêtes Prisma en:
// 1. Utilisant des `select` spécifiques au lieu d'includes larges
// 2. Réduisant les données transférées du serveur au client
// 3. Ajoutant de la pagination
// 4. Optimisant les requêtes N+1

import { getSession, getUserRole } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

// ============================================
// SCHÉMA POUR LA PAGINATION
// ============================================
const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});

// ============================================
// OPTIMISATION: getMyTasks avec select spécifique
// ============================================
// Avant: Récupérait toutes les colonnes + includes larges
// Après: Sélection précise des champs nécessaires
export const getMyTasksOptimized = actionClient
  .schema(
    z.object({
      projectId: z.string().optional(),
      searchQuery: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
    })
  )
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());

    if (!session) {
      throw new Error("Non authentifié");
    }

    const { page, limit, projectId, searchQuery } = parsedInput;
    const skip = (page - 1) * limit;

    // ⚡ OPTIMISATION: Récupérer taskIds et projectIds en une seule requête
    const [taskMemberships, projectMemberships] = await Promise.all([
      prisma.taskMember.findMany({
        where: { userId: session.user.id },
        select: { taskId: true },
      }),
      prisma.projectMember.findMany({
        where: { userId: session.user.id },
        select: { projectId: true },
      }),
    ]);

    const taskIds = taskMemberships.map((tm) => tm.taskId);
    const projectIds = projectMemberships.map((pm) => pm.projectId);

    // Construire les conditions de visibilité
    const orVisibilityConditions: any[] = [];
    if (taskIds.length > 0) {
      orVisibilityConditions.push({ id: { in: taskIds } });
    }
    orVisibilityConditions.push({ createdBy: session.user.id });
    if (projectIds.length > 0) {
      orVisibilityConditions.push({
        projectId: { in: projectIds },
        createdBy: { not: session.user.id },
      });
    }

    const andConditions: any[] = [];
    if (projectId) {
      andConditions.push({ projectId });
    }
    if (searchQuery) {
      andConditions.push({
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
        ],
      });
    }

    const where = {
      isActive: true,
      AND: [...andConditions, { OR: orVisibilityConditions }],
    };

    // ⚡ OPTIMISATION: Requête parallèle pour count + data
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        // ⚡ SELECT SPÉCIFIQUE: Seulement les champs nécessaires
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          estimatedHours: true,
          createdAt: true,
          updatedAt: true,
          complexity: true,
          // Relations optimisées avec select
          Project: {
            select: {
              id: true,
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
          User_Task_createdByToUser: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          // ⚡ OPTIMISATION: Limiter les membres récupérés
          TaskMember: {
            select: {
              id: true,
              role: true,
              User: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            take: 10, // Limiter à 10 membres max pour la liste
          },
          // ⚡ COUNT au lieu de récupérer tous les commentaires
          _count: {
            select: {
              TaskComment: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    };
  });

// ============================================
// OPTIMISATION: getAllTasks avec pagination
// ============================================
export const getAllTasksOptimized = actionClient
  .schema(
    z.object({
      projectId: z.string().optional(),
      searchQuery: z.string().optional(),
      status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
    })
  )
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());

    if (!session) {
      throw new Error("Non authentifié");
    }

    const { page, limit, projectId, searchQuery, status } = parsedInput;
    const skip = (page - 1) * limit;

    const andConditions: any[] = [{ isActive: true }];

    if (projectId) {
      andConditions.push({ projectId });
    }
    if (status) {
      andConditions.push({ status });
    }
    if (searchQuery) {
      andConditions.push({
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
        ],
      });
    }

    const where = { AND: andConditions };

    // ⚡ REQUÊTE PARALLÈLE
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          estimatedHours: true,
          createdAt: true,
          updatedAt: true,
          Project: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
            },
          },
          User_Task_createdByToUser: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          TaskMember: {
            select: {
              User: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            take: 5,
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
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    };
  });

// ============================================
// OPTIMISATION: getTaskById avec select minimal
// ============================================
export const getTaskByIdOptimized = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());

    if (!session) {
      throw new Error("Non authentifié");
    }

    const task = await prisma.task.findUnique({
      where: { id: parsedInput.id },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        complexity: true,
        dueDate: true,
        reminderDate: true,
        reminderTime: true,
        soundEnabled: true,
        estimatedHours: true,
        isShared: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        projectId: true,
        parentId: true,
        hrTimesheetId: true,
        activityType: true,
        activityName: true,
        periodicity: true,
        trainingLevel: true,
        masteryLevel: true,
        understandingLevel: true,
        evaluationNotes: true,
        evaluatedBy: true,
        evaluatedAt: true,
        // Relations
        Project: {
          select: {
            id: true,
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
        User_Task_createdByToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        User_Task_evaluatedByToUser: {
          select: {
            id: true,
            name: true,
          },
        },
        TaskMember: {
          select: {
            id: true,
            role: true,
            createdAt: true,
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
        // ⚡ Récupérer seulement les 10 derniers commentaires
        TaskComment: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            isEdited: true,
            User: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        // ⚡ Récupérer seulement les 20 dernières activités
        TaskActivity: {
          select: {
            id: true,
            action: true,
            field: true,
            oldValue: true,
            newValue: true,
            description: true,
            createdAt: true,
            User: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
        _count: {
          select: {
            TaskComment: true,
            TaskActivity: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error("Tâche non trouvée");
    }

    // Vérifier les permissions
    const isCreator = task.User_Task_createdByToUser?.id === session.user.id;
    const isMember = task.TaskMember.some((m) => m.User.id === session.user.id);
    const isAdmin = getUserRole(session) === "ADMIN";

    if (!isCreator && !isMember && !isAdmin) {
      throw new Error("Vous n'avez pas accès à cette tâche");
    }

    return task;
  });

// ============================================
// OPTIMISATION: getTasksByProjectId batch
// ============================================
// Pour afficher rapidement les tâches d'un projet
export const getTasksByProjectIdOptimized = actionClient
  .schema(
    z.object({
      projectId: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
    })
  )
  .action(async ({ parsedInput }) => {
    const session = await getSession(await headers());

    if (!session) {
      throw new Error("Non authentifié");
    }

    const { projectId, page, limit } = parsedInput;
    const skip = (page - 1) * limit;

    // Vérifier que l'utilisateur est membre du projet
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: session.user.id,
      },
    });

    if (!member && getUserRole(session) !== "ADMIN") {
      throw new Error("Vous n'êtes pas membre de ce projet");
    }

    const where = {
      projectId,
      isActive: true,
    };

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          dueDate: true,
          estimatedHours: true,
          createdAt: true,
          User_Task_createdByToUser: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          TaskMember: {
            select: {
              User: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            take: 3,
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
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    };
  });

// ============================================
// NOTES D'OPTIMISATION
// ============================================
// 1. ✅ Toutes les requêtes utilisent `select` au lieu d'`include`
// 2. ✅ Pagination ajoutée sur toutes les listes
// 3. ✅ Requêtes parallèles (count + data) avec Promise.all
// 4. ✅ Limitation du nombre de relations récupérées (TaskMember: 10 max)
// 5. ✅ Limitation des commentaires et activités (10 et 20 max)
// 6. ✅ Utilisation de _count au lieu de récupérer toutes les données
//
// GAINS ATTENDUS:
// - Réduction du payload JSON: -60 à -80%
// - Réduction du temps de requête: -40 à -60%
// - Réduction de la mémoire utilisée: -50 à -70%
// - Amélioration du temps de rendu: -30 à -50%
