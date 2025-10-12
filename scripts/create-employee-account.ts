import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Création du compte Better Auth pour l'employé...");

  // Vérifier si l'utilisateur existe
  const existingUser = await prisma.user.findUnique({
    where: { email: "employe@chronodil.com" },
  });

  if (!existingUser) {
    console.error(
      "❌ Utilisateur employe@chronodil.com non trouvé. Exécutez create-employee.ts d'abord."
    );
    process.exit(1);
  }

  // Vérifier si un compte existe déjà
  const existingAccount = await prisma.account.findFirst({
    where: { userId: existingUser.id },
  });

  if (existingAccount) {
    console.log(
      "✓ Un compte existe déjà pour cet utilisateur. Suppression..."
    );
    await prisma.account.deleteMany({
      where: { userId: existingUser.id },
    });
    await prisma.session.deleteMany({
      where: { userId: existingUser.id },
    });
  }

  // Créer le compte Better Auth
  console.log("Création du compte Better Auth...");

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: existingUser.name,
        email: existingUser.email,
        password: "Employee2025!",
      },
    });

    if (result && "user" in result) {
      // Mettre à jour avec les informations existantes
      await prisma.user.update({
        where: { id: result.user.id },
        data: {
          role: existingUser.role,
          emailVerified: true,
          managerId: existingUser.managerId,
          departmentId: existingUser.departmentId,
        },
      });

      console.log("\n✅ Compte employé créé avec succès !");
      console.log("\n📋 Informations de connexion :");
      console.log("   Email        : employe@chronodil.com");
      console.log("   Mot de passe : Employee2025!");
      console.log("\n🔗 Connectez-vous sur : http://localhost:3000/auth/login");
      console.log(
        "\n💡 Vous pouvez maintenant créer et soumettre des timesheets HR !"
      );
    } else {
      throw new Error("Échec de la création du compte");
    }
  } catch (error: any) {
    console.error("❌ Erreur lors de la création:", error.message);
    throw error;
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
