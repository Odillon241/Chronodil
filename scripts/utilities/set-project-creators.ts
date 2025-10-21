import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setProjectCreators() {
  console.log("Mise à jour des créateurs de projets...");

  try {
    // Récupérer tous les projets sans créateur
    const projects = await prisma.project.findMany({
      where: {
        createdBy: null,
      },
      include: {
        ProjectMember: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
          include: {
            User: true,
          },
        },
      },
    });

    console.log(`${projects.length} projets à mettre à jour.`);

    // Récupérer un admin par défaut au cas où un projet n'aurait pas de membre
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      console.error("Aucun utilisateur ADMIN trouvé dans la base de données.");
      return;
    }

    // Mettre à jour chaque projet
    for (const project of projects) {
      const creatorId =
        project.ProjectMember.length > 0
          ? project.ProjectMember[0].userId
          : adminUser.id;

      await prisma.project.update({
        where: { id: project.id },
        data: { createdBy: creatorId },
      });

      console.log(
        `✓ Projet "${project.name}" (${project.code}) - Créateur: ${
          project.ProjectMember.length > 0
            ? project.ProjectMember[0].User.name
            : adminUser.name
        }`
      );
    }

    console.log("\n✅ Tous les projets ont été mis à jour avec succès.");
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setProjectCreators();

