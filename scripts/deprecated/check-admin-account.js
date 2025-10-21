// Script pour vérifier le compte admin dans la base de données
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@chronodil.com";

async function checkAdminAccount() {
  try {
    console.log("🔍 Vérification du compte admin...\n");

    // Vérifier l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!user) {
      console.log("❌ Utilisateur non trouvé!");
      return;
    }

    console.log("✓ Utilisateur trouvé:");
    console.log("  - ID:", user.id);
    console.log("  - Email:", user.email);
    console.log("  - Nom:", user.name);
    console.log("  - Rôle:", user.role);
    console.log("  - Email vérifié:", user.emailVerified);

    // Vérifier le compte d'authentification
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
    });

    console.log("\n✓ Comptes d'authentification trouvés:", accounts.length);

    accounts.forEach((account, index) => {
      console.log(`\n  Compte ${index + 1}:`);
      console.log("  - ID:", account.id);
      console.log("  - Provider ID:", account.providerId);
      console.log("  - Account ID:", account.accountId);
      console.log("  - Password présent:", !!account.password);
      if (account.password) {
        console.log("  - Password hash (début):", account.password.substring(0, 30) + "...");
        console.log("  - Password hash length:", account.password.length);

        // Vérifier si c'est un hash bcrypt valide
        const isBcrypt = account.password.startsWith("$2") || account.password.startsWith("$2a") || account.password.startsWith("$2b");
        console.log("  - Format bcrypt:", isBcrypt ? "✓ OUI" : "❌ NON");
      }
    });

  } catch (error) {
    console.error("\n❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminAccount();
