// Script pour corriger le mot de passe admin en utilisant Better Auth API
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@chronodil.com";
const ADMIN_PASSWORD = "Admin2025!";

async function fixAdminPassword() {
  try {
    console.log("🔐 Correction du mot de passe admin...\n");

    // Vérifier que l'admin existe
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!admin) {
      throw new Error(`Utilisateur ${ADMIN_EMAIL} non trouvé!`);
    }

    console.log("✓ Utilisateur trouvé:", admin.id);

    // Supprimer l'ancien compte avec le mauvais hash
    await prisma.account.deleteMany({
      where: {
        userId: admin.id,
        providerId: "credential",
      },
    });

    console.log("✓ Ancien compte supprimé");

    // Utiliser l'API Better Auth pour créer le compte avec le bon hash
    console.log("✓ Création du compte via Better Auth API...");

    const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: "Administrateur",
      }),
    });

    if (!response.ok) {
      // Si l'utilisateur existe déjà, essayons de mettre à jour via l'endpoint de reset
      console.log("! L'utilisateur existe déjà, tentative de réinitialisation...");

      // Note: Better Auth ne permet pas de forcer un nouveau mot de passe sans token
      // On va donc supprimer l'utilisateur et le recréer
      await prisma.user.delete({
        where: { id: admin.id },
      });

      console.log("✓ Utilisateur supprimé, recréation...");

      // Recréer via l'API
      const retryResponse = await fetch("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          name: "Administrateur",
        }),
      });

      if (!retryResponse.ok) {
        throw new Error(`Erreur API: ${retryResponse.statusText}`);
      }
    }

    console.log("✓ Compte créé avec le bon hash");

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
    console.log("✅ Mot de passe admin corrigé!");
    console.log(`📧 Email:         ${ADMIN_EMAIL}`);
    console.log(`🔑 Mot de passe:  ${ADMIN_PASSWORD}`);
    console.log("═══════════════════════════════════════");
    console.log("\n✨ Vous pouvez maintenant vous connecter!");

  } catch (error) {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();
