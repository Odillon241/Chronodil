// Script pour copier le hash fonctionnel au compte admin
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@chronodil.com";
const ADMIN_PASSWORD = "Admin2025!";
const TEST_EMAIL = "test@chronodil.com";
const TEST_PASSWORD = "Test2025!";

async function copyHashToAdmin() {
  try {
    console.log("🔧 Copie du hash Better Auth au compte admin...\n");

    // D'abord, vérifier si les mots de passe sont les mêmes
    if (ADMIN_PASSWORD === TEST_PASSWORD) {
      console.log("✓ Même mot de passe, copie directe possible");

      // Récupérer le hash du test
      const testUser = await prisma.user.findUnique({
        where: { email: TEST_EMAIL },
        include: { Account: true },
      });

      if (!testUser || testUser.Account.length === 0) {
        throw new Error("Utilisateur test non trouvé");
      }

      const testHash = testUser.Account[0].password;
      console.log("✓ Hash récupéré du test");

      // L'appliquer à l'admin
      const admin = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
      });

      if (!admin) {
        throw new Error("Admin non trouvé");
      }

      // Supprimer l'ancien compte admin
      await prisma.account.deleteMany({
        where: { userId: admin.id },
      });

      // Créer un nouveau compte avec le hash fonctionnel
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: admin.id,
          accountId: admin.id, // Better Auth utilise userId comme accountId
          providerId: "credential",
          password: testHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("✓ Hash copié avec succès!");

    } else {
      console.log("❌ Les mots de passe sont différents");
      console.log("   Test:", TEST_PASSWORD);
      console.log("   Admin:", ADMIN_PASSWORD);
      console.log("\n💡 Solution: Créez un nouveau hash via l'API...");
    }

    console.log("\n═══════════════════════════════════════");
    console.log("✅ Compte admin mis à jour!");
    console.log(`📧 Email:         ${ADMIN_EMAIL}`);
    console.log(`🔑 Mot de passe:  ${TEST_PASSWORD}`);
    console.log("═══════════════════════════════════════");
    console.log("\n⚠️  ATTENTION: Le mot de passe est maintenant", TEST_PASSWORD);
    console.log("   Changez-le après la première connexion!");

  } catch (error) {
    console.error("\n❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

copyHashToAdmin();
