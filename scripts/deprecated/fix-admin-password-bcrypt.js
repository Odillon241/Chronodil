// Script pour corriger le mot de passe admin avec bcrypt
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@chronodil.com";
const ADMIN_PASSWORD = "Admin2025!";

async function fixAdminPassword() {
  try {
    console.log("🔐 Correction du mot de passe admin...\n");

    // Vérifier que l'admin existe
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!admin) {
      throw new Error(`Utilisateur ${ADMIN_EMAIL} non trouvé!`);
    }

    console.log("✓ Utilisateur trouvé:", admin.id);

    // Hasher le mot de passe avec bcrypt (comme Better Auth)
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    console.log("✓ Mot de passe hashé avec bcrypt");

    // Supprimer l'ancien compte
    await prisma.account.deleteMany({
      where: {
        userId: admin.id,
        providerId: "credential",
      },
    });
    console.log("✓ Ancien compte supprimé");

    // Créer le nouveau compte avec le bon hash
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: admin.id,
        accountId: ADMIN_EMAIL,
        providerId: "credential",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✓ Nouveau compte créé avec bcrypt");

    console.log("\n═══════════════════════════════════════");
    console.log("✅ Mot de passe admin corrigé!");
    console.log(`📧 Email:         ${ADMIN_EMAIL}`);
    console.log(`🔑 Mot de passe:  ${ADMIN_PASSWORD}`);
    console.log("═══════════════════════════════════════");
    console.log("\n✨ Vous pouvez maintenant vous connecter!");

  } catch (error) {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();
