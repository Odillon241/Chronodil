/**
 * Script de test pour les rappels de saisie de temps
 * 
 * Usage:
 *   pnpm tsx scripts/testing/test-reminders.ts
 * 
 * Ce script permet de :
 * 1. Vérifier les préférences de rappel d'un utilisateur
 * 2. Déclencher manuellement les rappels
 * 3. Vérifier que les notifications sont créées
 */

import { PrismaClient } from "@prisma/client";
import { triggerTimesheetReminders } from "@/lib/inngest/helpers";

const prisma = new PrismaClient();

async function testReminders() {
  console.log("🧪 Test des rappels de saisie de temps\n");

  try {
    // 1. Lister les utilisateurs avec rappels activés
    console.log("1️⃣ Recherche des utilisateurs avec rappels activés...");
    const usersWithReminders = await prisma.user.findMany({
      where: {
        enableTimesheetReminders: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        reminderTime: true,
        reminderDays: true,
        emailNotificationsEnabled: true,
      },
    });

    console.log(`   ✅ ${usersWithReminders.length} utilisateur(s) avec rappels activés\n`);

    if (usersWithReminders.length === 0) {
      console.log("   ⚠️  Aucun utilisateur avec rappels activés. Activez les rappels dans /dashboard/settings/reminders");
      return;
    }

    // Afficher les utilisateurs
    usersWithReminders.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || user.email}`);
      console.log(`      - Heure: ${user.reminderTime || "Non configurée"}`);
      console.log(`      - Jours: ${user.reminderDays?.join(", ") || "Aucun"}`);
      console.log(`      - Email activé: ${user.emailNotificationsEnabled ? "Oui" : "Non"}`);
    });

    // 2. Vérifier les temps saisis aujourd'hui
    console.log("\n2️⃣ Vérification des temps saisis aujourd'hui...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const user of usersWithReminders) {
      const hasTimeToday = await prisma.hRActivity.findFirst({
        where: {
          HRTimesheet: {
            userId: user.id,
          },
          startDate: {
            lte: tomorrow,
          },
          endDate: {
            gte: today,
          },
          totalHours: {
            gt: 0,
          },
        },
      });

      console.log(`   ${user.name || user.email}: ${hasTimeToday ? "✅ Temps saisi" : "❌ Aucun temps saisi"}`);
    }

    // 3. Déclencher les rappels manuellement
    console.log("\n3️⃣ Déclenchement manuel des rappels...");
    try {
      await triggerTimesheetReminders();
      console.log("   ✅ Rappels déclenchés avec succès");
      console.log("   📧 Vérifiez les notifications dans /dashboard/notifications");
      console.log("   📬 Vérifiez les emails (si activés)");
    } catch (error) {
      console.error("   ❌ Erreur lors du déclenchement:", error);
      console.log("\n   💡 Assurez-vous que :");
      console.log("      - Inngest Dev Server est lancé (pnpm dlx inngest-cli@latest dev)");
      console.log("      - Les variables INNGEST_EVENT_KEY et INNGEST_SIGNING_KEY sont configurées");
    }

    // 4. Vérifier les notifications créées récemment
    console.log("\n4️⃣ Vérification des notifications créées...");
    const recentNotifications = await prisma.notification.findMany({
      where: {
        type: "reminder",
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Dernières 5 minutes
        },
      },
      select: {
        id: true,
        userId: true,
        title: true,
        message: true,
        createdAt: true,
        User: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    if (recentNotifications.length > 0) {
      console.log(`   ✅ ${recentNotifications.length} notification(s) de rappel créée(s) récemment :\n`);
      recentNotifications.forEach((notif) => {
        console.log(`   - ${notif.User?.name || notif.User?.email || "Utilisateur inconnu"}`);
        console.log(`     "${notif.title}"`);
        console.log(`     ${notif.createdAt.toLocaleString("fr-FR")}\n`);
      });
    } else {
      console.log("   ⚠️  Aucune notification de rappel créée récemment");
      console.log("   💡 Cela peut être normal si :");
      console.log("      - Tous les utilisateurs ont déjà saisi leur temps");
      console.log("      - L'heure actuelle ne correspond à aucune préférence");
      console.log("      - Le jour actuel n'est pas dans les jours configurés");
    }

    console.log("\n✅ Test terminé !");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testReminders()
  .then(() => {
    console.log("\n🎉 Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erreur fatale:", error);
    process.exit(1);
  });

