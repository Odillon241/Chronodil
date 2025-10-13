// Script pour tester le hash du mot de passe
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@chronodil.com";
const ADMIN_PASSWORD = "Admin2025!";

async function testPasswordHash() {
  try {
    console.log("🔍 Test du hash de mot de passe...\n");

    // Récupérer le compte
    const user = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      include: {
        Account: true,
      },
    });

    if (!user || !user.Account || user.Account.length === 0) {
      console.log("❌ Utilisateur ou compte non trouvé!");
      return;
    }

    const account = user.Account[0];
    console.log("✓ Compte trouvé");
    console.log("  Hash stocké:", account.password.substring(0, 30) + "...");

    // Tester la vérification bcrypt
    console.log("\n🔐 Test de vérification bcrypt...");
    console.log("  Mot de passe testé:", ADMIN_PASSWORD);

    const isValid = await bcrypt.compare(ADMIN_PASSWORD, account.password);

    if (isValid) {
      console.log("✅ Le mot de passe est VALIDE!");
      console.log("\n⚠️  Le hash est correct mais Better Auth ne peut pas l'utiliser.");
      console.log("   Cela suggère un problème de configuration Better Auth.");
    } else {
      console.log("❌ Le mot de passe est INVALIDE!");
      console.log("\n📝 Cela signifie que le hash ne correspond pas au mot de passe.");
      console.log("   Tentative de correction...");

      // Recréer le hash
      const newHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      console.log("\n  Nouveau hash créé:", newHash.substring(0, 30) + "...");

      // Vérifier le nouveau hash
      const newIsValid = await bcrypt.compare(ADMIN_PASSWORD, newHash);
      console.log("  Nouveau hash valide:", newIsValid ? "✓" : "✗");

      // Mettre à jour dans la base
      await prisma.account.update({
        where: { id: account.id },
        data: {
          password: newHash,
          updatedAt: new Date(),
        },
      });

      console.log("\n✅ Hash mis à jour dans la base de données!");
    }

  } catch (error) {
    console.error("\n❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordHash();
