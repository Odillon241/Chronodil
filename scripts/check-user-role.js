// Script pour vérifier le rôle de l'admin dans la base
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUserRole() {
  try {
    console.log("🔍 Vérification du rôle admin...\n");

    const admin = await prisma.user.findUnique({
      where: { email: "admin@chronodil.com" },
    });

    if (!admin) {
      console.log("❌ Utilisateur admin non trouvé!");
      return;
    }

    console.log("✓ Utilisateur admin trouvé:");
    console.log("  - ID:", admin.id);
    console.log("  - Email:", admin.email);
    console.log("  - Nom:", admin.name);
    console.log("  - Rôle:", admin.role);
    console.log("  - Email vérifié:", admin.emailVerified);

    if (admin.role !== "ADMIN") {
      console.log("\n⚠️  Le rôle n'est PAS ADMIN!");
      console.log("   Correction en cours...");

      await prisma.user.update({
        where: { id: admin.id },
        data: { role: "ADMIN" },
      });

      console.log("✓ Rôle corrigé en ADMIN");
    } else {
      console.log("\n✅ Le rôle est correct (ADMIN)");
    }

  } catch (error) {
    console.error("\n❌ Erreur:", error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();
