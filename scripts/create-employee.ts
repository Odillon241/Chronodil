import { prisma } from "../src/lib/db";
import { nanoid } from "nanoid";

async function createEmployee() {
  console.log("👤 Création d'un compte employé...\n");

  // Récupérer le manager
  const manager = await prisma.user.findFirst({
    where: { email: "manager@chronodil.com" },
  });

  if (!manager) {
    console.error("❌ Manager non trouvé. Exécutez setup-hierarchy.ts d'abord.");
    process.exit(1);
  }

  // Récupérer ou créer un département
  let department = await prisma.department.findFirst({
    where: { code: "RH" },
  });

  if (!department) {
    department = await prisma.department.create({
      data: {
        id: nanoid(),
        code: "RH",
        name: "Ressources Humaines",
        description: "Département RH",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✅ Département RH créé");
  }

  // Créer l'employé
  const employee = await prisma.user.upsert({
    where: { email: "employe@chronodil.com" },
    update: {
      managerId: manager.id,
      departmentId: department.id,
    },
    create: {
      id: nanoid(),
      email: "employe@chronodil.com",
      name: "Employé RH",
      role: "EMPLOYEE",
      departmentId: department.id,
      emailVerified: true,
      managerId: manager.id, // ✅ IMPORTANT : Assigner le manager
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Employé créé avec succès !");
  console.log("\n📋 Informations :");
  console.log(`   Nom: ${employee.name}`);
  console.log(`   Email: ${employee.email}`);
  console.log(`   Rôle: ${employee.role}`);
  console.log(`   Manager: ${manager.name} (${manager.email})`);
  console.log(`   Département: ${department.name}`);
  console.log("\n⚠️  Prochaines étapes :");
  console.log(
    "   1. Créer un compte Better Auth pour cet utilisateur:"
  );
  console.log("      pnpm exec tsx scripts/create-admin.ts");
  console.log(
    "      (Utilisez employe@chronodil.com avec le mot de passe de votre choix)"
  );
  console.log("\n   2. Ou inscrivez-vous via l'interface : /auth/register");
  console.log("      avec l'email: employe@chronodil.com");
}

createEmployee()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
