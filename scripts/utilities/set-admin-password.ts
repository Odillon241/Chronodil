// Script pour définir le mot de passe de l'admin
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/bcrypt";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "finaladmin@chronodil.com";
const ADMIN_PASSWORD = "Admin2025!";

// Fonction de hashage bcrypt compatible avec Better Auth
// IMPORTANT: Doit utiliser bcrypt comme configuré dans auth.ts
async function hashPassword(password: string): Promise<string> {
  return await hash(password, 10);
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

    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

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
          id: randomUUID(),
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
