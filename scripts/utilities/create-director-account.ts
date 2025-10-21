import { PrismaClient } from "@prisma/client";
import { hashSync } from "@node-rs/bcrypt";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🎯 Création du compte Directeur...\n");

  const directorEmail = "directeur@chronodil.com";
  const directorPassword = "Directeur2024!";
  const directorName = "Odillon NANA";

  try {
    // Vérifier si le directeur existe déjà
    const existingDirector = await prisma.user.findUnique({
      where: { email: directorEmail },
    });

    if (existingDirector) {
      console.log(`ℹ️  Le compte directeur existe déjà: ${existingDirector.email}`);
      console.log(`   Nom: ${existingDirector.name}`);
      console.log(`   Rôle: ${existingDirector.role}\n`);

      // Mettre à jour le rôle si nécessaire
      if (existingDirector.role !== "DIRECTEUR") {
        console.log("📝 Mise à jour du rôle vers DIRECTEUR...");
        await prisma.user.update({
          where: { id: existingDirector.id },
          data: { role: "DIRECTEUR" },
        });
        console.log("✅ Rôle mis à jour!\n");
      }

      return;
    }

    // Hasher le mot de passe
    console.log("🔒 Hashage du mot de passe...");
    const hashedPassword = hashSync(directorPassword, 10);

    // Créer l'utilisateur directeur
    console.log("👤 Création de l'utilisateur...");
    const director = await prisma.user.create({
      data: {
        id: nanoid(),
        email: directorEmail,
        name: directorName,
        role: "DIRECTEUR",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Utilisateur créé!\n");

    // Créer le compte d'authentification
    console.log("🔐 Création du compte d'authentification...");
    await prisma.account.create({
      data: {
        id: nanoid(),
        userId: director.id,
        accountId: director.id,
        providerId: "credential",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Compte d'authentification créé!\n");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ COMPTE DIRECTEUR CRÉÉ AVEC SUCCÈS!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📧 Email:        ", directorEmail);
    console.log("🔑 Mot de passe: ", directorPassword);
    console.log("👤 Nom:          ", directorName);
    console.log("🎭 Rôle:         ", "DIRECTEUR");
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("⚠️  IMPORTANT: Changez ce mot de passe lors de la première connexion!\n");

    // Assigner le directeur comme manager d'Anna
    console.log("🔗 Assignation du directeur comme manager d'Anna...");
    const anna = await prisma.user.findFirst({
      where: { email: "anna@odillon.com" },
    });

    if (anna) {
      await prisma.user.update({
        where: { id: anna.id },
        data: { managerId: director.id },
      });
      console.log("✅ Anna a maintenant le Directeur comme manager\n");
    }

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
