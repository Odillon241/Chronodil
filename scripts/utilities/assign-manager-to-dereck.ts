import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔧 Attribution d'un manager à Déreck...\n");

  // Trouver Anna (MANAGER)
  const anna = await prisma.user.findFirst({
    where: {
      email: "anna@odillon.com",
      role: "MANAGER",
    },
  });

  if (!anna) {
    throw new Error("❌ Anna (manager) non trouvée");
  }

  console.log(`✅ Manager trouvé: ${anna.name} (${anna.email})`);

  // Trouver Déreck (EMPLOYEE)
  const dereck = await prisma.user.findFirst({
    where: {
      email: "dereckdanel01@chronodil.com",
      role: "EMPLOYEE",
    },
  });

  if (!dereck) {
    throw new Error("❌ Déreck (employé) non trouvé");
  }

  console.log(`✅ Employé trouvé: ${dereck.name} (${dereck.email})`);

  // Assigner Anna comme manager de Déreck
  const updatedUser = await prisma.user.update({
    where: {
      id: dereck.id,
    },
    data: {
      managerId: anna.id,
    },
    include: {
      User: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  console.log(
    `\n✅ Manager assigné avec succès! ${updatedUser.name} → Manager: ${updatedUser.User?.name}\n`
  );

  // Vérifier la mise à jour
  const employees = await prisma.user.findMany({
    where: {
      managerId: anna.id,
    },
    select: {
      name: true,
      email: true,
      role: true,
    },
  });

  console.log(`📋 Employés gérés par ${anna.name}:`);
  employees.forEach((emp) => {
    console.log(`   - ${emp.name} (${emp.email}) - ${emp.role}`);
  });
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
