import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔧 Application de la migration pour ajouter le rôle DIRECTEUR...\n");

  try {
    console.log("📝 Étape 1: Création du nouveau type enum...");
    await prisma.$executeRawUnsafe(
      `CREATE TYPE "Role_new" AS ENUM ('EMPLOYEE', 'MANAGER', 'HR', 'DIRECTEUR', 'ADMIN');`
    );
    console.log("✅ Nouveau type enum créé\n");

    console.log("📝 Étape 2: Suppression de la valeur par défaut...");
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;`
    );
    console.log("✅ Valeur par défaut supprimée\n");

    console.log("📝 Étape 3: Migration de la colonne role...");
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");`
    );
    console.log("✅ Colonne migrée\n");

    console.log("📝 Étape 4: Suppression de l'ancien type...");
    await prisma.$executeRawUnsafe(`DROP TYPE "Role";`);
    console.log("✅ Ancien type supprimé\n");

    console.log("📝 Étape 5: Renommage du nouveau type...");
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role_new" RENAME TO "Role";`);
    console.log("✅ Type renommé\n");

    console.log("📝 Étape 6: Restauration de la valeur par défaut...");
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE'::"Role";`
    );
    console.log("✅ Valeur par défaut restaurée\n");

    // Vérifier les rôles disponibles
    console.log("🔍 Vérification des rôles existants:");
    const users = await prisma.$queryRaw<Array<{ role: string }>>`
      SELECT DISTINCT role FROM "User" ORDER BY role;
    `;
    users.forEach((u) => console.log(`   - ${u.role}`));

    console.log("\n✅ Le rôle DIRECTEUR est maintenant disponible!\n");
  } catch (error: any) {
    if (error.code === "P2010" && error.meta?.message?.includes("déjà existe")) {
      console.log("ℹ️  Le rôle DIRECTEUR existe déjà dans la base de données\n");
    } else {
      console.error("❌ Erreur lors de la migration:", error);
      process.exit(1);
    }
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
