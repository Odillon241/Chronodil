/**
 * Script pour migrer les données de l'ancienne base vers la nouvelle
 * Remplace les anciens IDs Better Auth par les nouveaux IDs Supabase Auth
 * 
 * Usage: npx tsx scripts/migrate-all-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping des anciens IDs (Better Auth) vers les nouveaux (Supabase Auth)
const ID_MAPPING: Record<string, string> = {
  "zT54BfytlJODdWbmeKSVZnQsw2bdlYqX": "08d57180-8c8b-448f-a5f8-b67711750958", // vanessamboumba@odillon.fr
  "iV8MaMrFXuMT04aqkjJYXzvupR9n47Qq": "1df090ef-2d0d-4d72-a21a-b4113c7eadf4", // nathaliebingangoye@odillon.fr
  "S1SfLojzX9ywijHIQd4Lqftiy72b4cOQ": "3f8363ee-1abf-4588-8922-301630b99865", // elianetale@odillon.fr
  "pYcGKxZ2bm6CMreDd4PaXfGdyImop3w3": "f583973c-a7d0-4df7-a587-09e0395f9e7c", // dereckdanel@odillon.fr
  "995d5816-d145-4d16-86d5-27afbdc8f84e": "3faab6ad-1c2d-4fde-be67-317b8f23e1d2", // finaladmin@chronodil.com
  "SbaqoYkhJiwSJ6kiC7UlgqsWXdNVGYWT": "ed4719fa-fe2a-4442-b1c0-ca3abb8d4f7c", // fethiabicke@odillon.fr
  "5CUbS4Ww95utj7iNfbi5WHq8gRcFt1U3": "dba0ccfd-bf14-45fb-a97d-6f267a9bfc1d", // abigaelnfono@odillon.fr
  "uzoM3ZYUxlAdTcZz22TEBpxna0cSpHec": "36292638-20e6-40aa-8552-698617dc07fc", // test@chronodil.com
  "5Uw0oZWHbscGVi3XV0q9XWTXKV0mNUg5": "981bd103-d88f-484e-bd93-8a9fd31d92c8", // egawanekono75@gmail.com
  "b0s9x2gzuFhqkaO0SkbsfNuYOKhrSPb1": "fc2d0c9b-9084-4d9c-bb6d-9d35f7da16e5", // glwadys.as@gmail.com
  "GdwpHOgPdwWSgNnWSjHG5v0llqBVbKtg": "a1f339ea-6256-45fd-a719-512c5688492a", // nadiataty@odillon.fr
  "1jTiaBdFGTw0pvdr0KF7AQcTRWpWme4U": "24ee670e-e3f3-4719-b76a-d03b84d3b725", // manager@odillon.fr
};

// Fonction pour mapper un ancien ID vers le nouveau
function mapId(oldId: string | null | undefined): string | null {
  if (!oldId) return null;
  return ID_MAPPING[oldId] || oldId;
}

async function migrateData() {
  console.log("🚀 Migration des données de l'ancienne base vers la nouvelle...\n");

  try {
    // 1. Mise à jour des utilisateurs avec toutes leurs préférences
    console.log("📋 Étape 1: Mise à jour des utilisateurs avec leurs préférences complètes...");
    
    // Données utilisateurs complètes depuis l'ancienne base
    const usersData = [
      {
        id: "08d57180-8c8b-448f-a5f8-b67711750958",
        email: "vanessamboumba@odillon.fr",
        name: "M'BOUMBA NDOMBI Vanessa",
        role: "EMPLOYEE",
        position: "Assistante Audit",
        accentColor: "ou-crimson",
        fontSize: 13,
        darkModeEnabled: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
      },
      {
        id: "1df090ef-2d0d-4d72-a21a-b4113c7eadf4",
        email: "nathaliebingangoye@odillon.fr",
        name: "BINGANGOYE Nathalie",
        role: "DIRECTEUR",
        position: "DIRECTEUR GENERALE",
        accentColor: "rusty-red",
        fontSize: 12,
        darkModeEnabled: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
      },
      {
        id: "3f8363ee-1abf-4588-8922-301630b99865",
        email: "elianetale@odillon.fr",
        name: "Tale Eliane",
        role: "MANAGER",
        position: "Manager / Administrative support & Team Lead",
        accentColor: "rusty-red",
        fontSize: 12,
        darkModeEnabled: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
      },
      {
        id: "f583973c-a7d0-4df7-a587-09e0395f9e7c",
        email: "dereckdanel@odillon.fr",
        name: "NEXON Déreck Danel",
        role: "EMPLOYEE",
        position: "IT-Digital helpdesk support",
        accentColor: "green-teal",
        fontSize: 12,
        darkModeEnabled: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
        reminderDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        notificationSoundType: "notification-sound-effect-372475",
        notificationSoundVolume: 0.85,
      },
      {
        id: "3faab6ad-1c2d-4fde-be67-317b8f23e1d2",
        email: "finaladmin@chronodil.com",
        name: "Administrator",
        role: "ADMIN",
        position: null,
        accentColor: "green-teal",
        fontSize: 12,
        darkModeEnabled: false,
        emailVerified: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
        notificationSoundType: "notification-sound-effect-372475",
        notificationSoundVolume: 1,
      },
      {
        id: "ed4719fa-fe2a-4442-b1c0-ca3abb8d4f7c",
        email: "fethiabicke@odillon.fr",
        name: "Fethia BICKE-BI-NGUEMA",
        role: "EMPLOYEE",
        position: null,
        accentColor: "rusty-red",
        fontSize: 12,
        darkModeEnabled: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
      },
      {
        id: "dba0ccfd-bf14-45fb-a97d-6f267a9bfc1d",
        email: "abigaelnfono@odillon.fr",
        name: "NFONO Abigael",
        role: "EMPLOYEE",
        position: "Assistante Administrative et Logistique",
        accentColor: "green-teal",
        fontSize: 13,
        darkModeEnabled: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
      },
      {
        id: "36292638-20e6-40aa-8552-698617dc07fc",
        email: "test@chronodil.com",
        name: "Test User",
        role: "DIRECTEUR",
        position: null,
        accentColor: "green-teal",
        fontSize: 12,
        darkModeEnabled: true,
        emailVerified: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
        quietHoursEnabled: true,
        quietHoursDays: ["1", "2", "3", "4", "5"],
        notificationSoundType: "notification-sound-effect-372475",
        notificationSoundVolume: 0.8,
      },
      {
        id: "981bd103-d88f-484e-bd93-8a9fd31d92c8",
        email: "egawanekono75@gmail.com",
        name: "EGAWAN BONIFACE EKONO",
        role: "EMPLOYEE",
        position: null,
        accentColor: "rusty-red",
        fontSize: 12,
        darkModeEnabled: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
      },
      {
        id: "fc2d0c9b-9084-4d9c-bb6d-9d35f7da16e5",
        email: "glwadys.as@gmail.com",
        name: "Glwadys AS",
        role: "EMPLOYEE",
        position: null,
        accentColor: "rusty-red",
        fontSize: 12,
        darkModeEnabled: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
      },
      {
        id: "a1f339ea-6256-45fd-a719-512c5688492a",
        email: "nadiataty@odillon.fr",
        name: "Taty Annick Nadia",
        role: "EMPLOYEE",
        position: "BUSINESS ADMINISTRATIVE AND CLIENT RELATIONS ASSISTANT",
        accentColor: "ou-crimson",
        fontSize: 14,
        darkModeEnabled: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
      },
      {
        id: "24ee670e-e3f3-4719-b76a-d03b84d3b725",
        email: "manager@odillon.fr",
        name: "Manager Odillon",
        role: "MANAGER",
        position: null,
        accentColor: "green-teal",
        fontSize: 12,
        darkModeEnabled: true,
        emailVerified: true,
        weeklyGoal: 40,
        timezone: "Africa/Libreville",
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
        notificationSoundType: "new-notification-3-398649",
        notificationSoundVolume: 0.7,
      },
    ];

    for (const userData of usersData) {
      const { email, ...updateData } = userData;
      await prisma.user.update({
        where: { id: userData.id },
        data: {
          position: updateData.position,
          accentColor: updateData.accentColor,
          fontSize: updateData.fontSize,
          darkModeEnabled: updateData.darkModeEnabled,
          weeklyGoal: updateData.weeklyGoal,
          timezone: updateData.timezone,
          language: updateData.language,
          dateFormat: updateData.dateFormat,
          hourFormat: updateData.hourFormat,
          reminderDays: (updateData as any).reminderDays || [],
          notificationSoundType: (updateData as any).notificationSoundType || "default",
          notificationSoundVolume: (updateData as any).notificationSoundVolume || 0.7,
          quietHoursEnabled: (updateData as any).quietHoursEnabled || false,
          quietHoursDays: (updateData as any).quietHoursDays || [],
        },
      });
      console.log(`   ✅ Mise à jour: ${email}`);
    }

    console.log("\n✅ Migration terminée avec succès !");
    console.log("\n📊 Résumé :");
    console.log("   - Utilisateurs mis à jour : 12");
    console.log("\n⚠️ Note : Les autres données (Tasks, HRTimesheets, etc.) doivent être migrées");
    console.log("          via des requêtes SQL directes dans la nouvelle base.");

  } catch (error: any) {
    console.error("❌ Erreur de migration :", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateData().catch(console.error);
