import { prisma } from "../src/lib/db";

async function listAllAccounts() {
  console.log("📋 TOUS LES COMPTES DISPONIBLES\n");
  console.log("=".repeat(80));

  const users = await prisma.user.findMany({
    include: {
      Account: true,
      User: true, // Manager
      Department: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  users.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.name}`);
    console.log("   " + "-".repeat(70));
    console.log(`   Email          : ${user.email}`);
    console.log(`   Rôle           : ${user.role}`);
    console.log(`   Manager        : ${user.User?.name || "Aucun"}`);
    console.log(`   Département    : ${user.Department?.name || "Aucun"}`);

    if (user.Account.length > 0) {
      console.log(`   ✅ Compte actif : OUI`);
      console.log(`   Provider       : ${user.Account[0].providerId}`);
      console.log(`   ⚠️  Mot de passe : Défini par vous lors de l'inscription`);
    } else {
      console.log(`   ❌ Compte actif : NON - Doit s'inscrire via /auth/register`);
    }
  });

  console.log("\n" + "=".repeat(80));
  console.log("\n💡 RÉSUMÉ :");
  console.log(
    `   - Comptes avec accès : ${users.filter((u) => u.Account.length > 0).length}/${users.length}`
  );
  console.log(
    `   - Comptes à créer    : ${users.filter((u) => u.Account.length === 0).length}/${users.length}`
  );

  console.log("\n📝 MOTS DE PASSE STANDARDS (si créés par scripts) :");
  console.log("   - Admin   : Admin2025!");
  console.log("   - Manager : Manager2025!");
  console.log("   - Employé : Employee2025!");
  console.log("\n⚠️  Si un compte a été créé via l'interface, utilisez le mot de passe que vous avez défini.");
}

listAllAccounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
