"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { nanoid } from "nanoid";

const createTaskSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  projectId: z.string(),
  parentId: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
});

const updateTaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createTask = actionClient
  .schema(createTaskSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Vérifier que l'utilisateur est membre du projet
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: parsedInput.projectId,
        userId: session.user.id,
      },
    });

    if (!member && session.user.role !== "ADMIN") {
      throw new Error("Vous n'êtes pas membre de ce projet");
    }

    const task = await prisma.task.create({
      data: {
        id: nanoid(),
        ...parsedInput,
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
      },
    });

    return task;
  });

export const updateTask = actionClient
  .schema(updateTaskSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

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

    // Vérifier que l'utilisateur est membre du projet
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: session.user.id,
      },
    });

    if (!member && session.user.role !== "ADMIN") {
      throw new Error("Vous n'êtes pas membre de ce projet");
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

    return updatedTask;
  });

export const deleteTask = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

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

    // Vérifier que l'utilisateur est membre du projet
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: session.user.id,
      },
    });

    if (!member && session.user.role !== "ADMIN") {
      throw new Error("Vous n'êtes pas membre de ce projet");
    }

    await prisma.task.delete({
      where: { id: parsedInput.id },
    });

    return { success: true };
  });

export const getProjectTasks = actionClient
  .schema(z.object({ projectId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

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
            TimesheetEntry: true,
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
  .schema(z.object({ projectId: z.string().optional() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

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

    const tasks = await prisma.task.findMany({
      where: {
        projectId: parsedInput.projectId
          ? parsedInput.projectId
          : { in: projectIds },
        isActive: true,
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
        _count: {
          select: {
            TimesheetEntry: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return tasks;
  });
