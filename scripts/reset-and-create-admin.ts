import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Nettoyage de la base de données...");

  // Supprimer tous les utilisateurs et leurs données associées
  // L'ordre est important à cause des relations
  await prisma.timesheetValidation.deleteMany();
  await prisma.timesheetEntry.deleteMany();
  await prisma.hRActivity.deleteMany();
  await prisma.hRTimesheet.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.task.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Base de données nettoyée");

  // Créer le compte admin via Better Auth API
  console.log("🔐 Création du compte administrateur...");

  const adminEmail = "admin@chronodil.com";
  const adminPassword = "Admin2025!";

  // Utiliser l'API Better Auth pour créer l'utilisateur avec un mot de passe hashé correctement
  const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
      name: "Administrateur",
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de la création du compte: ${response.statusText}`);
  }

  const result = await response.json();

  // Mettre à jour le rôle en ADMIN et vérifier l'email
  await prisma.user.update({
    where: { email: adminEmail },
    data: {
      role: "ADMIN",
      emailVerified: true,
    },
  });

  console.log("✅ Compte administrateur créé avec succès!");
  console.log(`📧 Email: ${adminEmail}`);
  console.log(`🔑 Mot de passe: ${adminPassword}`);
  console.log(`\n⚠️  IMPORTANT: Conservez ces identifiants en lieu sûr!`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
