// Script pour appliquer la protection SQL à l'admin
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function applyProtection() {
  try {
    console.log("🔒 Application de la protection admin...\n");

    // Lire le fichier SQL
    const sqlContent = readFileSync(
      join(__dirname, "protect-admin.sql"),
      "utf-8"
    );

    // Séparer les commandes SQL (rough split)
    const commands = sqlContent
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0 && !cmd.startsWith("--"));

    // Exécuter chaque commande
    for (const command of commands) {
      if (command.includes("CREATE") || command.includes("DROP") || command.includes("SELECT")) {
        await prisma.$executeRawUnsafe(command);
      }
    }

    console.log("✅ Protection appliquée avec succès!");
    console.log("\n🛡️  Protections actives:");
    console.log("   ✓ Le compte admin ne peut pas être supprimé");
    console.log("   ✓ L'email admin ne peut pas être modifié");
    console.log("   ✓ Le rôle admin ne peut pas être modifié");
    console.log("   ✓ Seul le mot de passe peut être changé");

  } catch (error) {
    console.error("\n❌ Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyProtection();
