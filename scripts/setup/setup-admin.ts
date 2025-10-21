// Script pour nettoyer la DB et créer un admin
// Usage: pnpm exec tsx scripts/setup-admin.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@chronodil.com";
const ADMIN_PASSWORD = "Admin2025!";

async function setupAdmin() {
  try {
    console.log("🔄 Étape 1: Nettoyage de la base de données...\n");

    // Supprimer dans l'ordre correct
    console.log("- Suppression des validations de feuilles de temps...");
    await prisma.$executeRaw`TRUNCATE TABLE "TimesheetValidation" CASCADE`;

    console.log("- Suppression des entrées de feuilles de temps...");
    await prisma.$executeRaw`TRUNCATE TABLE "TimesheetEntry" CASCADE`;

    console.log("- Suppression des activités RH...");
    await prisma.$executeRaw`TRUNCATE TABLE "HRActivity" CASCADE`;

    console.log("- Suppression des feuilles de temps RH...");
    await prisma.$executeRaw`TRUNCATE TABLE "HRTimesheet" CASCADE`;

    console.log("- Suppression des membres de projets...");
    await prisma.$executeRaw`TRUNCATE TABLE "ProjectMember" CASCADE`;

    console.log("- Suppression des tâches...");
    await prisma.$executeRaw`TRUNCATE TABLE "Task" CASCADE`;

    console.log("- Suppression des messages...");
    await prisma.$executeRaw`TRUNCATE TABLE "Message" CASCADE`;

    console.log("- Suppression des membres de conversation...");
    await prisma.$executeRaw`TRUNCATE TABLE "ConversationMember" CASCADE`;

    console.log("- Suppression des conversations...");
    await prisma.$executeRaw`TRUNCATE TABLE "Conversation" CASCADE`;

    console.log("- Suppression des notifications...");
    await prisma.$executeRaw`TRUNCATE TABLE "Notification" CASCADE`;

    console.log("- Suppression des logs d'audit...");
    await prisma.$executeRaw`TRUNCATE TABLE "AuditLog" CASCADE`;

    console.log("- Suppression des sessions...");
    await prisma.$executeRaw`TRUNCATE TABLE "Session" CASCADE`;

    console.log("- Suppression des comptes...");
    await prisma.$executeRaw`TRUNCATE TABLE "Account" CASCADE`;

    console.log("- Suppression des projets...");
    await prisma.$executeRaw`TRUNCATE TABLE "Project" CASCADE`;

    console.log("- Suppression des utilisateurs...");
    await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;

    console.log("\n✅ Base de données nettoyée!");

    console.log("\n🔐 Étape 2: Création du compte administrateur...\n");

    // Appel à l'API Better Auth pour créer l'utilisateur
    console.log("- Appel à l'API Better Auth...");
    const response = await fetch("http://localhost:3001/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: "Administrateur",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur API: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log("- Utilisateur créé via Better Auth");

    // Mettre à jour le rôle et vérifier l'email
    console.log("- Mise à jour du rôle en ADMIN...");
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        role: "ADMIN",
        emailVerified: true,
      },
    });

    console.log("\n✅ Compte administrateur créé avec succès!\n");
    console.log("═══════════════════════════════════════");
    console.log(`📧 Email:         ${ADMIN_EMAIL}`);
    console.log(`🔑 Mot de passe:  ${ADMIN_PASSWORD}`);
    console.log("═══════════════════════════════════════");
    console.log("\n⚠️  IMPORTANT: Conservez ces identifiants en lieu sûr!");
    console.log("\n✨ Vous pouvez maintenant vous connecter à l'application.");

  } catch (error) {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
