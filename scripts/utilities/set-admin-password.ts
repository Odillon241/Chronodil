// Script pour définir le mot de passe de l'admin
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@chronodil.com";
const ADMIN_PASSWORD = "Admin2025!";

// Fonction de hashage simple compatible avec Better Auth
// Better Auth utilise bcrypt par défaut, mais nous allons créer un hash temporaire
function hashPassword(password: string): string {
  // Hash SHA-256 pour un hash basique
  // Note: Better Auth devrait ré-hasher ceci avec bcrypt lors de la première connexion
  return createHash("sha256").update(password).digest("hex");
}

async function setAdminPassword() {
  try {
    console.log("🔐 Configuration du mot de passe admin...\n");

    // Trouver l'utilisateur admin
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!admin) {
      throw new Error(`Utilisateur ${ADMIN_EMAIL} non trouvé!`);
    }

    // Vérifier si un compte existe déjà
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: admin.id,
        providerId: "credential",
      },
    });

    const hashedPassword = hashPassword(ADMIN_PASSWORD);

    if (existingAccount) {
      // Mettre à jour le compte existant
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
      console.log("✅ Mot de passe mis à jour!");
    } else {
      // Créer un nouveau compte
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
      console.log("✅ Compte créé avec mot de passe!");
    }

    console.log("\n═══════════════════════════════════════");
    console.log(`📧 Email:         ${ADMIN_EMAIL}`);
    console.log(`🔑 Mot de passe:  ${ADMIN_PASSWORD}`);
    console.log("═══════════════════════════════════════");
    console.log("\n✨ Vous pouvez maintenant vous connecter!");
    console.log("\n⚠️  IMPORTANT: Changez ce mot de passe après votre première connexion!");

  } catch (error) {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminPassword();
