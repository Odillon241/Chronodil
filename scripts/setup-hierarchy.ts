import { prisma } from "../src/lib/db";
import { nanoid } from "nanoid";

async function setupHierarchy() {
  console.log("🚀 Configuration de la hiérarchie organisationnelle...\n");

  // Vérifier si un département existe
  let department = await prisma.department.findFirst({
    where: { code: "DEV" },
  });

  if (!department) {
    department = await prisma.department.create({
      data: {
        id: nanoid(),
        code: "DEV",
        name: "Développement",
        description: "Équipe de développement",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✅ Département créé:", department.name);
  }

  // 1. Créer/Vérifier un Admin
  let admin = await prisma.user.findFirst({
    where: { email: "admin@chronodil.com" },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        id: nanoid(),
        email: "admin@chronodil.com",
        name: "Admin Principal",
        role: "ADMIN",
        departmentId: department.id,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✅ Admin créé:", admin.email);
  } else {
    console.log("✓ Admin existe déjà:", admin.email);
  }

  // 2. Créer/Vérifier un Manager
  let manager = await prisma.user.findFirst({
    where: { email: "manager@chronodil.com" },
  });

  if (!manager) {
    manager = await prisma.user.create({
      data: {
        id: nanoid(),
        email: "manager@chronodil.com",
        name: "Manager Équipe",
        role: "MANAGER",
        departmentId: department.id,
        emailVerified: true,
        managerId: admin.id, // Le manager reporte à l'admin
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✅ Manager créé:", manager.email);
  } else {
    // Mettre à jour le manager avec l'admin si besoin
    if (!manager.managerId) {
      manager = await prisma.user.update({
        where: { id: manager.id },
        data: { managerId: admin.id },
      });
      console.log("✓ Manager mis à jour avec admin comme supérieur");
    } else {
      console.log("✓ Manager existe déjà:", manager.email);
    }
  }

  // 3. Assigner le manager à tous les employés qui n'en ont pas
  const employeesWithoutManager = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
      managerId: null,
    },
  });

  if (employeesWithoutManager.length > 0) {
    console.log(
      `\n📋 Assignation du manager à ${employeesWithoutManager.length} employé(s)...`
    );

    for (const employee of employeesWithoutManager) {
      await prisma.user.update({
        where: { id: employee.id },
        data: { managerId: manager.id },
      });
      console.log(
        `   ✅ ${employee.name} (${employee.email}) → Manager: ${manager.name}`
      );
    }
  } else {
    console.log("\n✓ Tous les employés ont déjà un manager assigné");
  }

  // 4. Statistiques finales
  console.log("\n📊 Hiérarchie actuelle :");
  const users = await prisma.user.findMany({
    include: {
      User: true, // Manager
      other_User: true, // Subordinates
    },
    orderBy: {
      role: "asc",
    },
  });

  for (const user of users) {
    const managerName = user.User ? user.User.name : "Aucun";
    const subordinatesCount = user.other_User.length;
    console.log(
      `   ${user.role.padEnd(10)} | ${user.name.padEnd(20)} | Manager: ${managerName.padEnd(20)} | Équipe: ${subordinatesCount} personnes`
    );
  }

  console.log("\n🎉 Configuration terminée avec succès !");
  console.log("\n⚠️  Note importante :");
  console.log(
    "   - Les utilisateurs créés n'ont PAS de mot de passe Better Auth"
  );
  console.log("   - Ils doivent s'inscrire via /auth/register");
  console.log("   - Ou vous pouvez créer leurs comptes via le script create-admin.ts");
}

setupHierarchy()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
