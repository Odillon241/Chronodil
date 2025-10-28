import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addDirecteurRole() {
  try {
    console.log("🔧 Ajout du rôle DIRECTEUR à l'enum Role...");

    // Vérifier si la valeur existe déjà
    const checkQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'DIRECTEUR'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
      );
    `;

    const result = await prisma.$queryRawUnsafe(checkQuery) as [{ exists: boolean }];

    if (result[0]?.exists) {
      console.log("✅ Le rôle DIRECTEUR existe déjà dans l'enum Role");
      return;
    }

    // Ajouter la valeur DIRECTEUR à l'enum
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DIRECTEUR';
    `);

    console.log("✅ Rôle DIRECTEUR ajouté avec succès à l'enum Role");
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du rôle DIRECTEUR:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addDirecteurRole();
