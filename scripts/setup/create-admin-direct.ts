// Script pour créer directement l'admin dans la DB sans passer par l'API
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@chronodil.com";
const ADMIN_NAME = "Administrateur";

async function createAdminDirect() {
  try {
    console.log("🔄 Nettoyage de la base de données...\n");

    // Supprimer dans l'ordre correct avec raw SQL
    await prisma.$executeRaw`TRUNCATE TABLE "TimesheetValidation" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "TimesheetEntry" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "HRActivity" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "HRTimesheet" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "ProjectMember" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Task" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Message" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "ConversationMember" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Conversation" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Notification" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "AuditLog" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Session" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Account" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Project" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;

    console.log("✅ Base de données nettoyée!");

    console.log("\n🔐 Création de l'utilisateur admin...\n");

    // Créer l'utilisateur admin
    const adminUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        role: "ADMIN",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Utilisateur admin créé!");
    console.log("\n═══════════════════════════════════════");
    console.log(`📧 Email:  ${ADMIN_EMAIL}`);
    console.log(`👤 ID:     ${adminUser.id}`);
    console.log(`📝 Role:   ${adminUser.role}`);
    console.log("═══════════════════════════════════════");
    console.log("\n⚠️  IMPORTANT:");
    console.log("   - Vous devez définir un mot de passe pour cet utilisateur");
    console.log("   - Utilisez la page de connexion et cliquez sur 'Mot de passe oublié'");
    console.log(`   - Ou exécutez: pnpm tsx scripts/set-admin-password.ts`);

  } catch (error) {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminDirect();
