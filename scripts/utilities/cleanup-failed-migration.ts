import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🧹 Nettoyage de la migration échouée...\n");

  try {
    console.log("📝 Suppression du type Role_new s'il existe...");
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "Role_new";`);
    console.log("✅ Nettoyage terminé\n");
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
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
