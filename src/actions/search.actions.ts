"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getSession, getUserRole } from "@/lib/auth";
import { headers } from "next/headers";

// Action de recherche globale
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

    // Recherche dans les projets (accessibles à l'utilisateur)
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

    // Recherche dans les tâches (accessibles à l'utilisateur)
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

    // Recherche dans les utilisateurs (limitée selon les permissions)
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

    return {
      projects,
      tasks,
      users,
      total: projects.length + tasks.length + users.length,
    };
  });

