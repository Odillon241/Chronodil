import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n📋 Liste de tous les utilisateurs :\n");
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      Department: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      role: "asc",
    },
  });

  users.forEach((user) => {
    console.log(`👤 ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle: ${user.role}`);
    console.log(`   Département: ${user.Department?.name || "N/A"}`);
    console.log(`   ID: ${user.id}`);
    console.log("");
  });

  console.log(`\nTotal: ${users.length} utilisateur(s)`);
}

main()
  .catch((e) => {
    console.error("Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

