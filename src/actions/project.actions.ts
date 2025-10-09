"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
});

// Créer un projet
export const createProject = authActionClient
  .schema(projectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userRole } = ctx;

    // Vérifier les permissions
    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    const project = await prisma.project.create({
      data: {
        name: parsedInput.name,
        code: parsedInput.code,
        description: parsedInput.description,
        color: parsedInput.color,
        departmentId: parsedInput.departmentId,
        budgetHours: parsedInput.budgetHours,
        hourlyRate: parsedInput.hourlyRate,
        startDate: parsedInput.startDate,
        endDate: parsedInput.endDate,
      },
    });

    revalidatePath("/dashboard/projects");
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
        department: true,
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            timesheetEntries: true,
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
        department: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: {
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
    const { userRole } = ctx;
    const { id, data } = parsedInput;

    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard/projects");
    return project;
  });

// Archiver un projet
export const archiveProject = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userRole } = ctx;

    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    const project = await prisma.project.update({
      where: { id: parsedInput.id },
      data: { isActive: false },
    });

    revalidatePath("/dashboard/projects");
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
    const { userRole } = ctx;

    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: parsedInput.projectId,
        userId: parsedInput.userId,
        role: parsedInput.role,
      },
      include: {
        user: true,
      },
    });

    revalidatePath("/dashboard/projects");
    return member;
  });

// Retirer un membre d'un projet
export const removeProjectMember = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userRole } = ctx;

    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
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
        project: {
          include: {
            _count: {
              select: {
                members: true,
                tasks: true,
              },
            },
          },
        },
      },
    });

    return projectMembers.map((pm) => pm.project);
  });
