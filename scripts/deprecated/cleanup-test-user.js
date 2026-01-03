// Script pour nettoyer l'utilisateur test
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupTestUser() {
  try {
    console.log("🧹 Nettoyage de l'utilisateur test...\n");

    const testUser = await prisma.user.findUnique({
      where: { email: "test@chronodil.com" },
    });

    if (testUser) {
      // Supprimer les comptes d'authentification
      await prisma.account.deleteMany({
        where: { userId: testUser.id },
      });

      // Supprimer l'utilisateur
      await prisma.user.delete({
        where: { id: testUser.id },
      });

      console.log("✓ Utilisateur test supprimé");
    } else {
      console.log("ℹ️  Aucun utilisateur test à supprimer");
    }

    console.log("\n✅ Nettoyage terminé!");

  } catch (error) {
    console.error("\n❌ Erreur:", error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestUser();
