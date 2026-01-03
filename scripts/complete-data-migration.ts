/**
 * Script complet de migration des données de l'ancienne base vers la nouvelle
 * Inclut : ActivityCatalog, Holiday, HRTimesheet, HRActivity, Task, TaskMember
 * 
 * Usage: npx tsx scripts/complete-data-migration.ts
 */

import { PrismaClient, HRActivityType, HRPeriodicity, HRActivityStatus, HRTimesheetStatus, TaskComplexity } from "@prisma/client";

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

function mapUserId(oldId: string | null | undefined): string | null {
  if (!oldId) return null;
  return ID_MAPPING[oldId] || null;
}

// Données exportées depuis l'ancienne base
const activityCatalog = [
  {"id":"346569b0-86bf-46a3-97e0-35ef9754eba7","name":"Courrier / Correspondances","category":"ADMINISTRATION","type":"OPERATIONAL","defaultPeriodicity":"WEEKLY","description":"Gestion du courrier et des correspondances","isActive":true,"sortOrder":1},
  {"id":"056b7a88-9a61-4aff-b4e6-aa00e5b5c7ca","name":"Archivage hebdomadaire","category":"ADMINISTRATION","type":"OPERATIONAL","defaultPeriodicity":"WEEKLY","description":"Archivage des documents administratifs","isActive":true,"sortOrder":2},
  {"id":"806d3208-8356-4d94-b30d-7aeb72f96761","name":"Renseignement des cartes de travail","category":"ADMINISTRATION","type":"OPERATIONAL","defaultPeriodicity":"WEEKLY","description":"Mise à jour des cartes de travail","isActive":true,"sortOrder":3},
  {"id":"a9ca8cc6-d467-4aff-8084-14d7e3feebcb","name":"Renseignement des registres","category":"ADMINISTRATION","type":"OPERATIONAL","defaultPeriodicity":"WEEKLY","description":"Mise à jour des registres administratifs","isActive":true,"sortOrder":4},
  {"id":"f87f5e02-f390-44d3-81a7-54bb6025b4b1","name":"Immatriculation / retraits (CNSS/CNAMGS/ASSURANCE)","category":"ADMINISTRATION","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Gestion des immatriculations et retraits CNSS/CNAMGS/Assurance","isActive":true,"sortOrder":5},
  {"id":"711d85eb-5c70-4dec-8dae-84a65d2f48f7","name":"Entretiens de recrutement","category":"ADMINISTRATION","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Conduite des entretiens de recrutement","isActive":true,"sortOrder":6},
  {"id":"7b8edc17-f749-479f-839f-099956783ef6","name":"Analyse CV des candidats","category":"ADMINISTRATION","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Analyse et sélection des CV","isActive":true,"sortOrder":7},
  {"id":"26504206-9b6d-47da-8ccd-f7979a46c483","name":"Rédaction des fiches de poste","category":"ADMINISTRATION","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Rédaction et mise à jour des fiches de poste","isActive":true,"sortOrder":8},
  {"id":"790e8e0d-cfdf-464d-a2da-d046392c56de","name":"Rédaction des fiches d'objectifs","category":"ADMINISTRATION","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Rédaction des fiches d'objectifs","isActive":true,"sortOrder":9},
  {"id":"74b05556-0a1c-43da-9ed4-29ccacf137e5","name":"AUTRES - Administration","category":"ADMINISTRATION","type":"OPERATIONAL","defaultPeriodicity":null,"description":"Autres activités administratives","isActive":true,"sortOrder":10},
  {"id":"e6797366-dfad-4684-a442-c209477d07f7","name":"Tableaux de bord","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"WEEKLY","description":"Préparation et mise à jour des tableaux de bord","isActive":true,"sortOrder":20},
  {"id":"7734cc30-6935-4598-80b7-ba84c82f5f4e","name":"Indicateurs de performance","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"MONTHLY","description":"Calcul et analyse des indicateurs de performance","isActive":true,"sortOrder":21},
  {"id":"0cb7fc92-34ce-40be-930a-b4897507c81d","name":"Variables de la paie","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"MONTHLY","description":"Suivi et contrôle des variables de paie","isActive":true,"sortOrder":22},
  {"id":"858ffa4e-ce8a-4b8b-ba01-1747effed93b","name":"Dossiers du personnel","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"WEEKLY","description":"Gestion et mise à jour des dossiers du personnel","isActive":true,"sortOrder":23},
  {"id":"2f87a7d2-9690-44af-854d-7a581a36ccb4","name":"Contrats de travail","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"PUNCTUAL","description":"Gestion des contrats de travail","isActive":true,"sortOrder":24},
  {"id":"4201ec70-f2a1-4a8a-b8bc-57c856195863","name":"Periode d'essai","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"PUNCTUAL","description":"Suivi des périodes d'essai","isActive":true,"sortOrder":25},
  {"id":"c4687242-a469-4065-9d66-045d662ea154","name":"Rapport des incident","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"PUNCTUAL","description":"Rédaction des rapports d'incident","isActive":true,"sortOrder":26},
  {"id":"79e522a9-d051-4189-8b7d-251492abb645","name":"Rapport des CDD","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"MONTHLY","description":"Rapport sur les contrats à durée déterminée","isActive":true,"sortOrder":27},
  {"id":"f71b5542-61c8-43eb-a3b5-c20e3034bf7a","name":"Rapport des réclamations","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"MONTHLY","description":"Rapport des réclamations du personnel","isActive":true,"sortOrder":28},
  {"id":"c38dbae1-e23f-4567-a0ed-8ad75afb211b","name":"Evaluation des fin de CDD","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"PUNCTUAL","description":"Évaluation en fin de contrat CDD","isActive":true,"sortOrder":29},
  {"id":"c602b05d-44b3-4e68-803b-6e5d96337bda","name":"Rapport mensuel","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"MONTHLY","description":"Rapport mensuel d'activité RH","isActive":true,"sortOrder":30},
  {"id":"1450935c-9f41-463a-99d0-302c92dd5761","name":"Rapport hebdomadaire","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"WEEKLY","description":"Rapport hebdomadaire d'activité RH","isActive":true,"sortOrder":31},
  {"id":"78b3210d-3e7b-43f8-b830-03673185a406","name":"Suivi du plan de congé","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"WEEKLY","description":"Suivi et contrôle du plan de congé","isActive":true,"sortOrder":32},
  {"id":"821ac8d7-cecf-4e56-b8cc-c2d6bfcfabe3","name":"Suivi du plan de formation","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"MONTHLY","description":"Suivi du plan de formation","isActive":true,"sortOrder":33},
  {"id":"4d560a8a-fb5a-4b1a-87f0-0c67861400cc","name":"Checklists (Recrutement, paie, congés, discipline, fin de contrat)","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"WEEKLY","description":"Gestion des checklists opérationnelles","isActive":true,"sortOrder":34},
  {"id":"486690dc-c7c6-4986-8513-0885fb5f4337","name":"Suivi des dossiers de mise en retraite","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":"MONTHLY","description":"Suivi des dossiers de mise en retraite","isActive":true,"sortOrder":35},
  {"id":"37eb303c-25b6-4700-9da1-22fedc8c13bd","name":"AUTRES - Contrôle et Reporting","category":"CONTROLE ET REPORTING","type":"REPORTING","defaultPeriodicity":null,"description":"Autres activités de contrôle et reporting","isActive":true,"sortOrder":36},
  {"id":"30433f9e-86a0-4e6d-9ddc-3e53d92d9ee9","name":"Projet - clients","category":"PROJETS & AUDITS","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Gestion des projets clients","isActive":true,"sortOrder":40},
  {"id":"795037cc-d730-4d3e-ab65-533b553d0ab5","name":"Projet - Odillon","category":"PROJETS & AUDITS","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Projets internes Odillon","isActive":true,"sortOrder":41},
  {"id":"982888d3-72ab-40db-871d-f5402da6ec72","name":"Prospection client","category":"PROJETS & AUDITS","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Activités de prospection client","isActive":true,"sortOrder":42},
  {"id":"9bdbeb21-aa09-49e6-885f-67713aeab0cd","name":"Projet RSE Odillon","category":"PROJETS & AUDITS","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Projets de Responsabilité Sociale et Environnementale","isActive":true,"sortOrder":43},
  {"id":"d974586d-cab0-498e-a050-a5a33f8a450b","name":"Audit externe (clients)","category":"PROJETS & AUDITS","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Audits RH externes pour les clients","isActive":true,"sortOrder":44},
  {"id":"c2367676-8384-4c72-9eaf-30e1e14f3cda","name":"AUTRES - Projets & Audits","category":"PROJETS & AUDITS","type":"OPERATIONAL","defaultPeriodicity":null,"description":"Autres projets et audits","isActive":true,"sortOrder":45},
  {"id":"24d28e57-4c90-4c8a-8599-1d223d4bd504","name":"Formation interne Odillon","category":"DEVELOPPEMENT/LEARNING","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Formations internes organisées par Odillon","isActive":true,"sortOrder":50},
  {"id":"9b4c516e-9c16-4a9c-8dee-4ed34b23df55","name":"Formation externe","category":"DEVELOPPEMENT/LEARNING","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Formations externes","isActive":true,"sortOrder":51},
  {"id":"e7387107-cfc6-4f16-98a0-9a479cefca31","name":"Session de coaching","category":"DEVELOPPEMENT/LEARNING","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Sessions de coaching individuel ou collectif","isActive":true,"sortOrder":52},
  {"id":"e8949c62-3deb-4c61-8ac4-f6a4b1619be3","name":"Séminaire / conférence","category":"DEVELOPPEMENT/LEARNING","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Participation à des séminaires ou conférences","isActive":true,"sortOrder":53},
  {"id":"79de6ac6-cda7-45d0-a604-cd65d83628d6","name":"AUTRES - Développement/Learning","category":"DEVELOPPEMENT/LEARNING","type":"OPERATIONAL","defaultPeriodicity":null,"description":"Autres activités de développement et formation","isActive":true,"sortOrder":54},
  {"id":"2cef880b-eec0-4a00-8ff3-42f37580ca41","name":"Activité tierce","category":"AUTRES","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Activité ne rentrant dans aucune catégorie prédéfinie","isActive":true,"sortOrder":100},
  {"id":"407c3fa8-1bea-4b17-98ce-99ed250c385a","name":"Reporting tierce","category":"AUTRES","type":"REPORTING","defaultPeriodicity":"PUNCTUAL","description":"Reporting ou activité de reporting ne rentrant dans aucune catégorie prédéfinie","isActive":true,"sortOrder":101},
  {"id":"20291a8f-1edf-4444-96a6-ccd6c6fb3640","name":"Déplacement professionnel externe","category":"AUTRES","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Déplacement pour mission professionnelle hors de l'entreprise","isActive":true,"sortOrder":102},
  {"id":"dffd397d-439d-4e71-8aee-97d2aed62d67","name":"Mission externe (hors site)","category":"AUTRES","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Mission ou intervention réalisée en dehors de l'enceinte de l'entreprise","isActive":true,"sortOrder":103},
  {"id":"f5414ec4-5451-49c8-910c-72cd05b408d4","name":"Rendez-vous client/partenaire","category":"AUTRES","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Rendez-vous professionnel avec client ou partenaire externe","isActive":true,"sortOrder":104},
  {"id":"1d22ae2c-fc5b-4fde-b9cf-1abb7b6c7b52","name":"Visite de site/chantier","category":"AUTRES","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Visite ou inspection de site/chantier externe","isActive":true,"sortOrder":105},
  {"id":"ee22610b-44b8-4198-9ab1-fc8b8be02eae","name":"Représentation entreprise (événement externe)","category":"AUTRES","type":"OPERATIONAL","defaultPeriodicity":"PUNCTUAL","description":"Participation à un événement externe pour représenter l'entreprise","isActive":true,"sortOrder":106}
];

const holidays = [
  {"id":"bqVruCdWN8p2mEmvRkNOr","name":"Jour de l'An","date":"2024-12-31T23:00:00.000Z","description":"Premier jour de l'année civile","isRecurring":false},
  {"id":"rlFgb_n8wBazOlY9uOli2","name":"Fête de fin du Ramadan (Aïd al-Fitr)","date":"2025-03-29T23:00:00.000Z","description":"Fête marquant la fin du mois de Ramadan","isRecurring":false},
  {"id":"QfzJysuXzk0TKmKKqBwbh","name":"Journée des droits de la femme","date":"2025-04-16T23:00:00.000Z","description":"Journée internationale des droits de la femme au Gabon","isRecurring":false},
  {"id":"8_qvb1_86CqzZnshVc5Er","name":"Lundi de Pâques","date":"2025-04-20T23:00:00.000Z","description":"Lendemain du dimanche de Pâques","isRecurring":false},
  {"id":"0B9F9fTegx9KpfgkljoZL","name":"Fête du Travail","date":"2025-04-30T23:00:00.000Z","description":"Journée internationale des travailleurs","isRecurring":false},
  {"id":"IkbG0yDdNs1YVB-qFF4qm","name":"Ascension","date":"2025-05-28T23:00:00.000Z","description":"Célébration de l'Ascension du Christ","isRecurring":false},
  {"id":"3Jzfjk26vb6WvEPG3DqUq","name":"Fête du Sacrifice (Aïd al-Adha)","date":"2025-06-05T23:00:00.000Z","description":"Fête du sacrifice","isRecurring":false},
  {"id":"gr1jix6ktlHFqmrUpqdqr","name":"Lundi de Pentecôte","date":"2025-06-08T23:00:00.000Z","description":"Célébration de la Pentecôte","isRecurring":false},
  {"id":"doyW_AJv_xPoyT_e-jSPu","name":"Assomption de Marie","date":"2025-08-14T23:00:00.000Z","description":"Fête de l'Assomption de la Vierge Marie","isRecurring":false},
  {"id":"xRBYvxBknC1Vflvu1MeS2","name":"Jour de l'Indépendance","date":"2025-08-15T23:00:00.000Z","description":"Célébration de l'indépendance du Gabon (1960)","isRecurring":false},
  {"id":"vDfJwJO95A8fU2cN7Z0hT","name":"Jour de l'Indépendance (suite)","date":"2025-08-16T23:00:00.000Z","description":"Célébration de l'indépendance du Gabon - Jour 2","isRecurring":false},
  {"id":"sCdDo30dYutMU6lc7W8H4","name":"Toussaint","date":"2025-10-31T23:00:00.000Z","description":"Fête de tous les saints","isRecurring":false},
  {"id":"p7RH1j90p32nsCtkgN-Hl","name":"Noël","date":"2025-12-24T23:00:00.000Z","description":"Célébration de la naissance de Jésus-Christ","isRecurring":false}
];

async function migrateData() {
  console.log("🚀 Migration complète des données...\n");

  let stats = {
    activityCatalog: { created: 0, skipped: 0 },
    holidays: { created: 0, skipped: 0 },
  };

  try {
    // 1. Migration des ActivityCatalog
    console.log("📋 Étape 1: Migration des ActivityCatalog...");
    for (const ac of activityCatalog) {
      try {
        const exists = await prisma.activityCatalog.findUnique({ where: { id: ac.id } });
        if (exists) {
          stats.activityCatalog.skipped++;
          continue;
        }
        await prisma.activityCatalog.create({
          data: {
            id: ac.id,
            name: ac.name,
            category: ac.category,
            type: ac.type as HRActivityType,
            defaultPeriodicity: ac.defaultPeriodicity as HRPeriodicity | null,
            description: ac.description,
            isActive: ac.isActive,
            sortOrder: ac.sortOrder,
          },
        });
        stats.activityCatalog.created++;
      } catch (error: any) {
        console.error(`   ❌ Erreur ActivityCatalog ${ac.name}: ${error.message}`);
      }
    }
    console.log(`   ✅ ActivityCatalog: ${stats.activityCatalog.created} créés, ${stats.activityCatalog.skipped} ignorés`);

    // 2. Migration des Holidays
    console.log("\n📋 Étape 2: Migration des Holidays...");
    for (const h of holidays) {
      try {
        const exists = await prisma.holiday.findUnique({ where: { id: h.id } });
        if (exists) {
          stats.holidays.skipped++;
          continue;
        }
        await prisma.holiday.create({
          data: {
            id: h.id,
            name: h.name,
            date: new Date(h.date),
            description: h.description,
            isRecurring: h.isRecurring,
          },
        });
        stats.holidays.created++;
      } catch (error: any) {
        console.error(`   ❌ Erreur Holiday ${h.name}: ${error.message}`);
      }
    }
    console.log(`   ✅ Holidays: ${stats.holidays.created} créés, ${stats.holidays.skipped} ignorés`);

    // Résumé
    console.log("\n" + "=".repeat(60));
    console.log("📊 RÉSUMÉ DE LA MIGRATION");
    console.log("=".repeat(60));
    console.log(`ActivityCatalog: ${stats.activityCatalog.created} créés, ${stats.activityCatalog.skipped} ignorés`);
    console.log(`Holidays: ${stats.holidays.created} créés, ${stats.holidays.skipped} ignorés`);
    console.log("=".repeat(60));

    console.log("\n✅ Migration des données de référence terminée !");
    console.log("\n⚠️ Note: Les HRTimesheets, HRActivities, Tasks et TaskMembers");
    console.log("   doivent être migrés séparément car ils contiennent des données utilisateur.");

  } catch (error: any) {
    console.error("❌ Erreur de migration :", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateData().catch(console.error);
