"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { nanoid } from "nanoid";
import { CacheTags } from "@/lib/cache";

const projectSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  code: z.string().min(1, "Le code est requis"),
  description: z.string().optional(),
  color: z.string().default("#3b82f6"),
  departmentId: z.string().optional(),
  budgetHours: z.number().optional(),
  hourlyRate: z.number().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  memberIds: z.array(z.string()).optional(),
});

// Créer un projet
export const createProject = authActionClient
  .schema(projectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Tous les utilisateurs authentifiés peuvent créer un projet

    const project = await prisma.project.create({
      data: {
        id: nanoid(),
        name: parsedInput.name,
        code: parsedInput.code,
        description: parsedInput.description,
        color: parsedInput.color,
        departmentId: parsedInput.departmentId,
        budgetHours: parsedInput.budgetHours,
        hourlyRate: parsedInput.hourlyRate,
        startDate: parsedInput.startDate,
        endDate: parsedInput.endDate,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Ajouter les membres au projet - toujours inclure le créateur
    const memberIdsToAdd = parsedInput.memberIds && parsedInput.memberIds.length > 0
      ? [...new Set([...parsedInput.memberIds, userId])] // Inclure le créateur et dédupliquer
      : [userId];

    await Promise.all(
      memberIdsToAdd.map((memberId) =>
        prisma.projectMember.create({
          data: {
            id: nanoid(),
            projectId: project.id,
            userId: memberId,
            role: "member",
            createdAt: new Date(),
          },
        })
      )
    );

    // Invalider le cache des projets
    revalidatePath("/dashboard/projects");
    revalidateTag(CacheTags.PROJECTS);
    return project;
  });

// Récupérer tous les projets
export const getProjects = authActionClient
  .schema(z.object({
    isActive: z.boolean().optional(),
    departmentId: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    const { isActive, departmentId } = parsedInput;

    const projects = await prisma.project.findMany({
      where: {
        ...(isActive !== undefined && { isActive }),
        ...(departmentId && { departmentId }),
      },
      include: {
        Department: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ProjectMember: {
          include: {
            User: true,
          },
        },
        _count: {
          select: {
            Task: true,
            TimesheetEntry: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Calculer les heures utilisées pour chaque projet
    const projectsWithHours = await Promise.all(
      projects.map(async (project) => {
        const entries = await prisma.timesheetEntry.findMany({
          where: { projectId: project.id },
          select: { duration: true },
        });

        const usedHours = entries.reduce((sum, entry) => sum + entry.duration, 0);

        return {
          ...project,
          usedHours,
        };
      })
    );

    return projectsWithHours;
  });

// Récupérer un projet par ID
export const getProjectById = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const project = await prisma.project.findUnique({
      where: { id: parsedInput.id },
      include: {
        Department: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ProjectMember: {
          include: {
            User: true,
          },
        },
        Task: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!project) {
      throw new Error("Projet non trouvé");
    }

    // Calculer les heures utilisées
    const entries = await prisma.timesheetEntry.findMany({
      where: { projectId: project.id },
      select: { duration: true },
    });

    const usedHours = entries.reduce((sum, entry) => sum + entry.duration, 0);

    return {
      ...project,
      usedHours,
    };
  });

// Mettre à jour un projet
export const updateProject = authActionClient
  .schema(
    z.object({
      id: z.string(),
      data: projectSchema.partial(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userRole, userId } = ctx;
    const { id, data } = parsedInput;

    // Récupérer le projet avec son créateur
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { id: true, createdBy: true },
    });

    if (!existingProject) {
      throw new Error("Projet non trouvé");
    }

    // Vérifier les permissions : ADMIN/MANAGER/HR ou créateur du projet
    const isAdmin = ["ADMIN", "MANAGER", "HR"].includes(userRole);
    const isCreator = existingProject.createdBy === userId;

    if (!isAdmin && !isCreator) {
      throw new Error("Vous n'avez pas la permission de modifier ce projet");
    }

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard/projects");
    revalidateTag(CacheTags.PROJECTS);
    return project;
  });

// Archiver/Réactiver un projet (toggle)
export const archiveProject = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userRole, userId } = ctx;

    // Récupérer le projet avec son créateur et son état actuel
    const existingProject = await prisma.project.findUnique({
      where: { id: parsedInput.id },
      select: { id: true, createdBy: true, isActive: true },
    });

    if (!existingProject) {
      throw new Error("Projet non trouvé");
    }

    // Vérifier les permissions : ADMIN/MANAGER/HR ou créateur du projet
    const isAdmin = ["ADMIN", "MANAGER", "HR"].includes(userRole);
    const isCreator = existingProject.createdBy === userId;

    if (!isAdmin && !isCreator) {
      throw new Error("Vous n'avez pas la permission de gérer ce projet");
    }

    // Basculer l'état isActive (toggle)
    const project = await prisma.project.update({
      where: { id: parsedInput.id },
      data: { isActive: !existingProject.isActive },
    });

    revalidatePath("/dashboard/projects");
    revalidateTag(CacheTags.PROJECTS);
    return project;
  });

// Ajouter un membre à un projet
export const addProjectMember = authActionClient
  .schema(
    z.object({
      projectId: z.string(),
      userId: z.string(),
      role: z.string().default("member"),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userRole, userId } = ctx;

    // Récupérer le projet avec son créateur
    const project = await prisma.project.findUnique({
      where: { id: parsedInput.projectId },
      select: { id: true, createdBy: true },
    });

    if (!project) {
      throw new Error("Projet non trouvé");
    }

    // Vérifier les permissions : ADMIN/MANAGER/HR ou créateur du projet
    const isAdmin = ["ADMIN", "MANAGER", "HR"].includes(userRole);
    const isCreator = project.createdBy === userId;

    if (!isAdmin && !isCreator) {
      throw new Error("Vous n'avez pas la permission de gérer les membres de ce projet");
    }

    const member = await prisma.projectMember.create({
      data: {
        id: nanoid(),
        projectId: parsedInput.projectId,
        userId: parsedInput.userId,
        role: parsedInput.role,
        createdAt: new Date(),
      },
      include: {
        User: true,
      },
    });

    revalidatePath("/dashboard/projects");
    return member;
  });

// Retirer un membre d'un projet
export const removeProjectMember = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userRole, userId } = ctx;

    // Récupérer le membre avec le projet
    const member = await prisma.projectMember.findUnique({
      where: { id: parsedInput.id },
      include: {
        Project: {
          select: { id: true, createdBy: true },
        },
      },
    });

    if (!member) {
      throw new Error("Membre non trouvé");
    }

    // Vérifier les permissions : ADMIN/MANAGER/HR ou créateur du projet
    const isAdmin = ["ADMIN", "MANAGER", "HR"].includes(userRole);
    const isCreator = member.Project.createdBy === userId;

    if (!isAdmin && !isCreator) {
      throw new Error("Vous n'avez pas la permission de gérer les membres de ce projet");
    }

    await prisma.projectMember.delete({
      where: { id: parsedInput.id },
    });

    revalidatePath("/dashboard/projects");
    return { success: true };
  });

// Récupérer les projets de l'utilisateur
export const getMyProjects = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const projectMembers = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        Project: {
          include: {
            _count: {
              select: {
                ProjectMember: true,
                Task: true,
              },
            },
          },
        },
      },
    });

    return projectMembers.map((pm) => pm.Project);
  });

// Cloner un projet
export const cloneProject = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Tous les utilisateurs authentifiés peuvent cloner un projet
    // Le clone appartient à l'utilisateur qui le crée

    // Récupérer le projet original
    const originalProject = await prisma.project.findUnique({
      where: { id: parsedInput.id },
      include: {
        ProjectMember: true,
      },
    });

    if (!originalProject) {
      throw new Error("Projet non trouvé");
    }

    // Créer le nouveau projet (clone)
    const clonedProject = await prisma.project.create({
      data: {
        id: nanoid(),
        name: `${originalProject.name} (Copie)`,
        code: `${originalProject.code}-COPY`,
        description: originalProject.description,
        color: originalProject.color,
        departmentId: originalProject.departmentId,
        budgetHours: originalProject.budgetHours,
        hourlyRate: originalProject.hourlyRate,
        startDate: originalProject.startDate,
        endDate: originalProject.endDate,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Copier les membres du projet
    if (originalProject.ProjectMember.length > 0) {
      await Promise.all(
        originalProject.ProjectMember.map((member) =>
          prisma.projectMember.create({
            data: {
              id: nanoid(),
              projectId: clonedProject.id,
              userId: member.userId,
              role: member.role,
              createdAt: new Date(),
            },
          })
        )
      );
    }

    revalidatePath("/dashboard/projects");
    return clonedProject;
  });

// Supprimer un projet
export const deleteProject = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userRole, userId } = ctx;

    // Récupérer le projet avec son créateur
    const project = await prisma.project.findUnique({
      where: { id: parsedInput.id },
      select: { id: true, name: true, createdBy: true },
    });

    if (!project) {
      throw new Error("Projet non trouvé");
    }

    // Vérifier les permissions :
    // - ADMIN peut supprimer n'importe quel projet
    // - Le créateur peut supprimer son propre projet
    const isAdmin = userRole === "ADMIN";
    const isCreator = project.createdBy === userId;

    if (!isAdmin && !isCreator) {
      throw new Error("Vous n'avez pas la permission de supprimer ce projet. Seul le créateur ou un administrateur peut supprimer un projet.");
    }

    // Supprimer le projet (cascade deletion pour les membres et entrées de timesheet)
    await prisma.project.delete({
      where: { id: parsedInput.id },
    });

    revalidatePath("/dashboard/projects");
    return { success: true, projectName: project.name };
  });
