"use server";

import { prisma } from "@/lib/db";

// Action simple sans authentification pour tester
export async function simpleGetUsers() {
  console.log("🧪 simpleGetUsers appelée");
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        image: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`✅ simpleGetUsers: ${users.length} utilisateurs récupérés`);
    return { success: true, users, count: users.length };
  } catch (error) {
    console.error("❌ Erreur dans simpleGetUsers:", error);
    throw error;
  }
}

export async function simpleGetProjects() {
  console.log("🧪 simpleGetProjects appelée");
  
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        color: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`✅ simpleGetProjects: ${projects.length} projets récupérés`);
    return { success: true, projects, count: projects.length };
  } catch (error) {
    console.error("❌ Erreur dans simpleGetProjects:", error);
    throw error;
  }
}
