import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

async function assignUserToProjects() {
  try {
    // Récupérer tous les projets actifs
    const projects = await prisma.project.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    console.log(`📋 Projets trouvés: ${projects.length}`);

    if (projects.length === 0) {
      console.log("❌ Aucun projet trouvé dans la base de données");
      console.log("💡 Créez d'abord des projets dans /dashboard/projects");
      return;
    }

    projects.forEach((project) => {
      console.log(`  - ${project.name} (${project.id})`);
    });

    // Récupérer l'utilisateur actuel (admin ou premier utilisateur)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { role: "ADMIN" },
          { role: "HR" },
          { role: "MANAGER" },
          { role: "EMPLOYEE" },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    if (!user) {
      console.log("❌ Aucun utilisateur trouvé");
      return;
    }

    console.log(`\n👤 Utilisateur: ${user.email} (${user.role})`);

    // Vérifier les projets déjà assignés
    const existingAssignments = await prisma.projectMember.findMany({
      where: { userId: user.id },
      select: { projectId: true },
    });

    const assignedProjectIds = new Set(existingAssignments.map((pm) => pm.projectId));
    console.log(`\n✅ Projets déjà assignés: ${assignedProjectIds.size}`);

    // Assigner l'utilisateur à tous les projets non assignés
    const projectsToAssign = projects.filter((p) => !assignedProjectIds.has(p.id));

    if (projectsToAssign.length === 0) {
      console.log("\n✅ L'utilisateur est déjà membre de tous les projets !");
      return;
    }

    console.log(`\n➕ Ajout à ${projectsToAssign.length} projets...`);

    for (const project of projectsToAssign) {
      await prisma.projectMember.create({
        data: {
          id: nanoid(),
          projectId: project.id,
          userId: user.id,
          role: "member",
          createdAt: new Date(),
        },
      });
      console.log(`  ✓ Ajouté au projet: ${project.name}`);
    }

    console.log(`\n✅ Succès ! ${projectsToAssign.length} projets assignés`);
    console.log(`\n💡 Actualisez la page timesheet pour voir les projets`);
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

assignUserToProjects();
