import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔍 Vérification des relations manager-employé :\n");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managerId: true,
      User: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
      // Employés dont cet utilisateur est le manager
      other_User: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      role: "asc",
    },
  });

  users.forEach((user) => {
    console.log(`👤 ${user.name} (${user.role})`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);

    if (user.managerId) {
      console.log(`   ✅ Manager assigné: ${user.User?.name} (${user.User?.email})`);
    } else {
      console.log(`   ❌ Aucun manager assigné`);
    }

    if (user.other_User.length > 0) {
      console.log(`   👥 Manage ${user.other_User.length} employé(s):`);
      user.other_User.forEach((emp) => {
        console.log(`      - ${emp.name} (${emp.email})`);
      });
    }

    console.log("");
  });

  console.log(`\nTotal: ${users.length} utilisateur(s)\n`);

  const usersWithoutManager = users.filter(
    (u) => !u.managerId && u.role !== "ADMIN"
  );

  if (usersWithoutManager.length > 0) {
    console.log(`⚠️  ${usersWithoutManager.length} utilisateur(s) sans manager :`);
    usersWithoutManager.forEach((u) => {
      console.log(`   - ${u.name} (${u.email}) - ${u.role}`);
    });
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
