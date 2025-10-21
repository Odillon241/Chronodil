import { PrismaClient } from "@prisma/client";
import { auth } from "../../src/lib/auth";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function migrateUsers() {
  console.log("🔄 Migration des utilisateurs...\n");
  console.log("⚠️  Cette opération va :");
  console.log("   - Supprimer tous les utilisateurs existants");
  console.log("   - Recréer Admin, Manager et Employé avec comptes Better Auth");
  console.log("   - Configurer la hiérarchie complète\n");

  // 1. Nettoyage complet
  console.log("🧹 Nettoyage de la base de données...");

  await prisma.hRActivity.deleteMany();
  await prisma.hRTimesheet.deleteMany();
  await prisma.timesheetValidation.deleteMany();
  await prisma.timesheetEntry.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Base nettoyée\n");

  // 2. Créer/récupérer le département
  console.log("📁 Configuration des départements...");

  let deptRH = await prisma.department.findFirst({
    where: { code: "RH" },
  });

  if (!deptRH) {
    deptRH = await prisma.department.create({
      data: {
        id: nanoid(),
        code: "RH",
        name: "Ressources Humaines",
        description: "Département des Ressources Humaines",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log("✅ Département RH prêt\n");

  // 3. Créer l'Admin avec Better Auth
  console.log("👤 Création de l'Administrateur...");

  const adminResult = await auth.api.signUpEmail({
    body: {
      name: "Administrateur",
      email: "admin@chronodil.com",
      password: "Admin2025!",
    },
  });

  if (!adminResult || !("user" in adminResult)) {
    throw new Error("Échec création admin");
  }

  const admin = await prisma.user.update({
    where: { id: adminResult.user.id },
    data: {
      role: "ADMIN",
      emailVerified: true,
      departmentId: deptRH.id,
    },
  });

  console.log("✅ Admin créé");
  console.log(`   Email: admin@chronodil.com`);
  console.log(`   Mot de passe: Admin2025!\n`);

  // 4. Créer le Manager avec Better Auth
  console.log("👤 Création du Manager...");

  const managerResult = await auth.api.signUpEmail({
    body: {
      name: "Manager",
      email: "manager@chronodil.com",
      password: "Manager2025!",
    },
  });

  if (!managerResult || !("user" in managerResult)) {
    throw new Error("Échec création manager");
  }

  const manager = await prisma.user.update({
    where: { id: managerResult.user.id },
    data: {
      role: "MANAGER",
      emailVerified: true,
      departmentId: deptRH.id,
      managerId: admin.id, // Manager reporte à l'Admin
    },
  });

  console.log("✅ Manager créé");
  console.log(`   Email: manager@chronodil.com`);
  console.log(`   Mot de passe: Manager2025!\n`);

  // 5. Créer l'Employé avec Better Auth
  console.log("👤 Création de l'Employé...");

  const employeeResult = await auth.api.signUpEmail({
    body: {
      name: "Employé RH",
      email: "employe@chronodil.com",
      password: "Employee2025!",
    },
  });

  if (!employeeResult || !("user" in employeeResult)) {
    throw new Error("Échec création employé");
  }

  const employee = await prisma.user.update({
    where: { id: employeeResult.user.id },
    data: {
      role: "EMPLOYEE",
      emailVerified: true,
      departmentId: deptRH.id,
      managerId: manager.id, // Employé reporte au Manager
    },
  });

  console.log("✅ Employé créé");
  console.log(`   Email: employe@chronodil.com`);
  console.log(`   Mot de passe: Employee2025!\n`);

  // 6. Mettre à jour l'Admin avec un manager (pour pouvoir soumettre des timesheets)
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      managerId: manager.id,
    },
  });

  // 7. Afficher le récapitulatif
  console.log("=".repeat(80));
  console.log("✅ MIGRATION TERMINÉE AVEC SUCCÈS !\n");

  console.log("📊 Hiérarchie organisationnelle :");
  console.log("   Employé RH → Manager → Administrateur → Manager (boucle)\n");

  console.log("🔐 COMPTES CRÉÉS (tous actifs) :\n");

  console.log("1. 👨‍💼 Administrateur");
  console.log("   Email        : admin@chronodil.com");
  console.log("   Mot de passe : Admin2025!");
  console.log("   Rôle         : ADMIN");
  console.log("   Manager      : Manager\n");

  console.log("2. 👔 Manager");
  console.log("   Email        : manager@chronodil.com");
  console.log("   Mot de passe : Manager2025!");
  console.log("   Rôle         : MANAGER");
  console.log("   Manager      : Administrateur\n");

  console.log("3. 👤 Employé RH");
  console.log("   Email        : employe@chronodil.com");
  console.log("   Mot de passe : Employee2025!");
  console.log("   Rôle         : EMPLOYEE");
  console.log("   Manager      : Manager\n");

  console.log("=".repeat(80));
  console.log("\n🚀 Vous pouvez maintenant vous connecter avec n'importe quel compte !");
  console.log("🔗 http://localhost:3000/auth/login\n");

  console.log("💡 Workflow de test HR Timesheet :");
  console.log("   1. Connectez-vous en tant qu'Employé");
  console.log("   2. Créez un HR Timesheet (/dashboard/hr-timesheet/new)");
  console.log("   3. Soumettez-le");
  console.log("   4. Connectez-vous en tant que Manager");
  console.log("   5. Validez le timesheet");
  console.log("   6. Connectez-vous en tant qu'Admin");
  console.log("   7. Validation finale ✅\n");
}

migrateUsers()
  .catch((error) => {
    console.error("\n❌ Erreur lors de la migration :", error.message);
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
