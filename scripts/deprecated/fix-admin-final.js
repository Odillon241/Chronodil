// Script FINAL pour corriger le compte admin avec le bon format Better Auth
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@chronodil.com";

async function fixAdminFinal() {
  try {
    console.log("🔧 Correction FINALE du compte admin...\n");

    // Récupérer l'utilisateur test qui fonctionne
    const testUser = await prisma.user.findUnique({
      where: { email: "test@chronodil.com" },
      include: { Account: true },
    });

    if (!testUser || testUser.Account.length === 0) {
      console.log("❌ Utilisateur test non trouvé. Créez-le d'abord avec l'API.");
      return;
    }

    const testAccount = testUser.Account[0];
    const testPasswordHash = testAccount.password;

    console.log("✓ Hash récupéré du compte test (fonctionnel)");
    console.log("  Format:", testPasswordHash.substring(0, 30) + "...");
    console.log("  Longueur:", testPasswordHash.length);

    // Maintenant, supprimons l'utilisateur admin et le recréons via l'API
    console.log("\n🗑️  Mise à jour du compte admin...");

    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (admin) {
      // Juste supprimer les comptes d'authentification et les recréer
      await prisma.account.deleteMany({
        where: { userId: admin.id },
      });

      console.log("✓ Anciens comptes d'authentification supprimés");
      console.log("✓ L'utilisateur admin est conservé (protégé par les triggers)");
    } else {
      // Si pas d'admin, on le crée
      console.log("⚠️  Aucun admin trouvé, création nécessaire via API...");
    }

    // Créer le nouveau compte admin via l'API
    console.log("\n🔐 Création du nouveau compte admin via Better Auth...");

    const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: "Admin2025!",
        name: "Administrateur",
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✓ Compte créé via Better Auth");

    // Mettre à jour le rôle en ADMIN
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        role: "ADMIN",
        emailVerified: true,
      },
    });

    console.log("✓ Rôle mis à jour en ADMIN");

    console.log("\n═══════════════════════════════════════");
    console.log("✅ Compte admin CORRECTEMENT créé!");
    console.log(`📧 Email:         ${ADMIN_EMAIL}`);
    console.log(`🔑 Mot de passe:  Admin2025!`);
    console.log("═══════════════════════════════════════");
    console.log("\n✨ Vous pouvez maintenant vous connecter!");
    console.log("\n🧹 N'oubliez pas de supprimer l'utilisateur test:");
    console.log("   node scripts/cleanup-test-user.js");

  } catch (error) {
    console.error("\n❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminFinal();
