"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

export const getTaskActivities = actionClient
  .schema(z.object({ taskId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await getSession();

    if (!session) {
      throw new Error("Non authentifié");
    }

    const activities = await prisma.taskActivity.findMany({
      where: {
        taskId: parsedInput.taskId,
      },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return activities;
  });

