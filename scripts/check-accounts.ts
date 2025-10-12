import { prisma } from "../src/lib/db";

async function checkAccounts() {
  console.log("🔐 Comptes Better Auth :\n");

  const accounts = await prisma.account.findMany({
    include: {
      User: {
        include: {
          User: true, // Manager
          Department: true,
        },
      },
    },
  });

  console.log(`Total comptes : ${accounts.length}\n`);

  accounts.forEach((account, index) => {
    console.log(`Compte ${index + 1}:`);
    console.log(`  Provider: ${account.providerId}`);
    console.log(`  User: ${account.User.name} (${account.User.email})`);
    console.log(`  Rôle: ${account.User.role}`);
    console.log(
      `  Manager: ${account.User.User?.name || "❌ AUCUN (managerId: " + account.User.managerId + ")"}`
    );
    console.log(
      `  Département: ${account.User.Department?.name || "Aucun"}\n`
    );
  });

  // Vérifier aussi les sessions actives
  console.log("🔑 Sessions actives :\n");
  const sessions = await prisma.session.findMany({
    where: {
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      User: {
        include: {
          User: true, // Manager
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  if (sessions.length === 0) {
    console.log("Aucune session active");
  } else {
    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1}:`);
      console.log(`  User: ${session.User.name} (${session.User.email})`);
      console.log(`  Rôle: ${session.User.role}`);
      console.log(
        `  Manager: ${session.User.User?.name || "❌ AUCUN (managerId: " + session.User.managerId + ")"}`
      );
      console.log(
        `  Créée: ${session.createdAt.toLocaleString("fr-FR")}`
      );
      console.log(`  Expire: ${session.expiresAt.toLocaleString("fr-FR")}\n`);
    });
  }
}

checkAccounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
