import { prisma } from "../src/lib/db";

async function testGeneralSettings() {
  console.log("🔍 Test des paramètres généraux Phase 1\n");

  try {
    // 1. Vérifier qu'un utilisateur existe
    console.log("1️⃣ Recherche d'un utilisateur...");
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
        // Phase 1 fields
        darkModeEnabled: true,
        accentColor: true,
        viewDensity: true,
        fontSize: true,
        language: true,
        dateFormat: true,
        hourFormat: true,
        timezone: true,
        highContrast: true,
        screenReaderMode: true,
        reduceMotion: true,
      },
    });

    if (!user) {
      console.error("❌ Aucun utilisateur trouvé dans la base de données");
      return;
    }

    console.log("✅ Utilisateur trouvé:", user.email);
    console.log("\n📊 Paramètres généraux actuels:");
    console.log({
      darkModeEnabled: user.darkModeEnabled,
      accentColor: user.accentColor,
      viewDensity: user.viewDensity,
      fontSize: user.fontSize,
      language: user.language,
      dateFormat: user.dateFormat,
      hourFormat: user.hourFormat,
      timezone: user.timezone,
      highContrast: user.highContrast,
      screenReaderMode: user.screenReaderMode,
      reduceMotion: user.reduceMotion,
    });

    // 2. Test de mise à jour
    console.log("\n2️⃣ Test de mise à jour (darkModeEnabled)...");
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        darkModeEnabled: !user.darkModeEnabled,
        accentColor: "powder-blue",
      },
      select: {
        darkModeEnabled: true,
        accentColor: true,
      },
    });

    console.log("✅ Mise à jour réussie:");
    console.log({
      darkModeEnabled: updatedUser.darkModeEnabled,
      accentColor: updatedUser.accentColor,
    });

    // 3. Restaurer l'état initial
    console.log("\n3️⃣ Restauration de l'état initial...");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        darkModeEnabled: user.darkModeEnabled,
        accentColor: user.accentColor,
      },
    });
    console.log("✅ État restauré");

    console.log("\n✨ Tous les tests sont passés avec succès !");
  } catch (error) {
    console.error("\n❌ Erreur lors des tests:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testGeneralSettings();
