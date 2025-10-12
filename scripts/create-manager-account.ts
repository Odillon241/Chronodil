import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Création du compte Better Auth pour le Manager...");

  const existingUser = await prisma.user.findUnique({
    where: { email: "manager@chronodil.com" },
  });

  if (!existingUser) {
    console.error("❌ Manager non trouvé en base de données");
    process.exit(1);
  }

  // Supprimer les anciens comptes si présents
  await prisma.account.deleteMany({
    where: { userId: existingUser.id },
  });
  await prisma.session.deleteMany({
    where: { userId: existingUser.id },
  });

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: existingUser.name,
        email: existingUser.email,
        password: "Manager2025!",
      },
    });

    if (result && "user" in result) {
      // Conserver les infos existantes
      await prisma.user.update({
        where: { id: result.user.id },
        data: {
          role: existingUser.role,
          emailVerified: true,
          managerId: existingUser.managerId,
          departmentId: existingUser.departmentId,
        },
      });

      console.log("\n✅ Compte Manager créé avec succès !");
      console.log("\n📋 Informations de connexion :");
      console.log("   Email        : manager@chronodil.com");
      console.log("   Mot de passe : Manager2025!");
      console.log("\n🔗 http://localhost:3000/auth/login");
    }
  } catch (error: any) {
    console.error("❌ Erreur :", error.message);
    throw error;
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
