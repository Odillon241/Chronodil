import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/bcrypt";

const prisma = new PrismaClient();

async function resetAdminAccount() {
  try {
    console.log("🔍 Recherche du compte Admin existant...");

    // Trouver l'admin existant
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: "admin", mode: "insensitive" } },
          { role: "ADMIN" },
        ],
      },
    });

    if (existingAdmin) {
      console.log(`📧 Compte trouvé: ${existingAdmin.email}`);
      console.log(`🗑️  Suppression du compte Admin existant...`);

      // Supprimer l'ancien admin et ses données associées
      await prisma.account.deleteMany({
        where: { userId: existingAdmin.id },
      });

      await prisma.user.delete({
        where: { id: existingAdmin.id },
      });

      console.log("✅ Ancien compte Admin supprimé!");
    } else {
      console.log("ℹ️  Aucun compte Admin existant trouvé");
    }

    // Créer le nouveau compte Admin avec bcrypt
    console.log("\n🔐 Création du nouveau compte Admin avec bcrypt...");

    const adminEmail = existingAdmin?.email || "admin@chronodil.app";
    const adminPassword = "Admin2025@";
    const hashedPassword = await hash(adminPassword, 10);

    const newAdmin = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: adminEmail,
        name: "Administrator",
        role: "ADMIN",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: newAdmin.id,
        accountId: newAdmin.id,
        providerId: "credential",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Nouveau compte Admin créé avec succès!");
    console.log(`\n📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Role: ADMIN`);
    console.log(`\n🎉 Vous pouvez maintenant vous connecter!`);
  } catch (error) {
    console.error("❌ Erreur:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminAccount();
