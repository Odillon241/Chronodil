import { prisma } from "../src/lib/db";

async function listUsers() {
  console.log("📋 Liste des utilisateurs :\n");

  const users = await prisma.user.findMany({
    include: {
      User: true, // Manager
      Department: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  console.table(
    users.map((u) => ({
      Nom: u.name,
      Email: u.email,
      Rôle: u.role,
      Département: u.Department?.name || "Aucun",
      Manager: u.User?.name || "❌ AUCUN",
      ManagerId: u.managerId || "❌ NULL",
    }))
  );

  console.log(
    `\n💡 Utilisateurs sans manager: ${users.filter((u) => !u.managerId).length}`
  );

  const usersWithoutManager = users.filter((u) => !u.managerId);
  if (usersWithoutManager.length > 0) {
    console.log("\n⚠️  Utilisateurs qui DOIVENT avoir un manager :");
    usersWithoutManager.forEach((u) => {
      console.log(`   - ${u.name} (${u.email}) [${u.role}]`);
    });
  }
}

listUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
