// Script pour vérifier comment Better Auth stocke les mots de passe
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkTestUser() {
  try {
    console.log("🔍 Vérification de l'utilisateur de test...\n");

    const user = await prisma.user.findUnique({
      where: { email: "test@chronodil.com" },
      include: {
        Account: true,
      },
    });

    if (!user) {
      console.log("❌ Utilisateur non trouvé!");
      return;
    }

    console.log("✓ Utilisateur test trouvé:");
    console.log("  - ID:", user.id);
    console.log("  - Email:", user.email);

    if (user.Account.length === 0) {
      console.log("\n❌ Aucun compte d'authentification trouvé!");
      return;
    }

    console.log("\n✓ Comptes d'authentification:", user.Account.length);

    user.Account.forEach((account, index) => {
      console.log(`\n  Compte ${index + 1}:`);
      console.log("  - ID:", account.id);
      console.log("  - Provider ID:", account.providerId);
      console.log("  - Account ID:", account.accountId);
      console.log("  - Password présent:", !!account.password);

      if (account.password) {
        console.log("  - Password hash:", account.password.substring(0, 60));
        console.log("  - Password length:", account.password.length);
      }

      // Afficher tous les champs du compte
      console.log("\n  Tous les champs du compte:");
      Object.keys(account).forEach(key => {
        if (key !== 'password') {
          console.log(`    - ${key}:`, account[key]);
        }
      });
    });

    // Comparer avec le compte admin
    console.log("\n\n═══════════════════════════════════════");
    console.log("Comparaison avec le compte admin:");
    console.log("═══════════════════════════════════════\n");

    const admin = await prisma.user.findUnique({
      where: { email: "admin@chronodil.com" },
      include: {
        Account: true,
      },
    });

    if (admin && admin.Account.length > 0) {
      const adminAccount = admin.Account[0];
      const testAccount = user.Account[0];

      console.log("Admin:");
      console.log("  - Provider ID:", adminAccount.providerId);
      console.log("  - Password présent:", !!adminAccount.password);
      console.log("  - Password length:", adminAccount.password?.length);
      console.log("  - Password start:", adminAccount.password?.substring(0, 10));

      console.log("\nTest:");
      console.log("  - Provider ID:", testAccount.providerId);
      console.log("  - Password présent:", !!testAccount.password);
      console.log("  - Password length:", testAccount.password?.length);
      console.log("  - Password start:", testAccount.password?.substring(0, 10));

      // Vérifier les différences
      const adminKeys = Object.keys(adminAccount).sort();
      const testKeys = Object.keys(testAccount).sort();

      console.log("\n Clés dans admin:", adminKeys.join(", "));
      console.log(" Clés dans test:", testKeys.join(", "));

      const missingInAdmin = testKeys.filter(k => !adminKeys.includes(k));
      const missingInTest = adminKeys.filter(k => !testKeys.includes(k));

      if (missingInAdmin.length > 0) {
        console.log("\n⚠️  Champs manquants dans le compte admin:", missingInAdmin.join(", "));
      }
      if (missingInTest.length > 0) {
        console.log("⚠️  Champs manquants dans le compte test:", missingInTest.join(", "));
      }
    }

  } catch (error) {
    console.error("\n❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestUser();
