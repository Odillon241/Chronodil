// Script pour créer un utilisateur temporaire avec Admin2025! et copier le hash
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@chronodil.com";
const ADMIN_PASSWORD = "Admin2025!";
const TEMP_EMAIL = "temp_admin_hash@chronodil.com";

async function createTempAndCopy() {
  try {
    console.log("🔧 Création d'un utilisateur temporaire pour générer le hash...\n");

    // 1. Créer un utilisateur temporaire via l'API
    console.log("📝 Étape 1: Création via Better Auth API...");
    const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: TEMP_EMAIL,
        password: ADMIN_PASSWORD, // Utiliser le mot de passe admin!
        name: "Temp Hash Generator",
      }),
    });

    if (!response.ok) {
      // Si l'utilisateur existe, le supprimer d'abord
      console.log("⚠️  L'utilisateur temp existe, suppression...");
      const existingTemp = await prisma.user.findUnique({
        where: { email: TEMP_EMAIL },
      });
      if (existingTemp) {
        await prisma.account.deleteMany({ where: { userId: existingTemp.id } });
        await prisma.user.delete({ where: { id: existingTemp.id } });
        console.log("✓ Utilisateur temp supprimé, nouvelle tentative...");

        // Réessayer
        const retryResponse = await fetch("http://localhost:3000/api/auth/sign-up/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: TEMP_EMAIL,
            password: ADMIN_PASSWORD,
            name: "Temp Hash Generator",
          }),
        });

        if (!retryResponse.ok) {
          throw new Error(`Impossible de créer l'utilisateur temp: ${retryResponse.statusText}`);
        }
      } else {
        throw new Error(`Erreur API: ${response.statusText}`);
      }
    }

    console.log("✓ Utilisateur temporaire créé");

    // 2. Récupérer le hash
    console.log("\n📝 Étape 2: Récupération du hash Better Auth...");
    const tempUser = await prisma.user.findUnique({
      where: { email: TEMP_EMAIL },
      include: { Account: true },
    });

    if (!tempUser || tempUser.Account.length === 0) {
      throw new Error("Utilisateur temp non trouvé après création");
    }

    const correctHash = tempUser.Account[0].password;
    console.log("✓ Hash récupéré");
    console.log("  Format:", correctHash.substring(0, 30) + "...");
    console.log("  Longueur:", correctHash.length);

    // 3. Appliquer le hash à l'admin
    console.log("\n📝 Étape 3: Application du hash au compte admin...");
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!admin) {
      throw new Error("Admin non trouvé");
    }

    // Supprimer l'ancien compte admin
    await prisma.account.deleteMany({
      where: { userId: admin.id },
    });

    // Créer un nouveau compte avec le hash correct
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: admin.id,
        accountId: admin.id, // Better Auth utilise userId comme accountId
        providerId: "credential",
        password: correctHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✓ Hash appliqué au compte admin");

    // 4. Nettoyer l'utilisateur temporaire
    console.log("\n📝 Étape 4: Nettoyage de l'utilisateur temporaire...");
    await prisma.account.deleteMany({ where: { userId: tempUser.id } });
    await prisma.user.delete({ where: { id: tempUser.id } });
    console.log("✓ Utilisateur temporaire supprimé");

    console.log("\n═══════════════════════════════════════");
    console.log("✅ Compte admin FONCTIONNEL!");
    console.log(`📧 Email:         ${ADMIN_EMAIL}`);
    console.log(`🔑 Mot de passe:  ${ADMIN_PASSWORD}`);
    console.log("═══════════════════════════════════════");
    console.log("\n✨ Vous pouvez maintenant vous connecter!");

  } catch (error) {
    console.error("\n❌ Erreur:", error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

createTempAndCopy();
