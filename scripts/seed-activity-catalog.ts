/**
 * Script de peuplement du catalogue d'activités RH
 * Source: MODIFICATION SUR LA FRH DU 12-11-2025.csv
 * Date: 2025-11-13
 *
 * Usage: pnpm tsx scripts/seed-activity-catalog.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const activities = [
  // CATÉGORIE 1: ADMINISTRATION (Type: OPERATIONAL)
  {
    category: "ADMINISTRATION",
    type: "OPERATIONAL" as const,
    activities: [
      { name: "Courrier / Correspondances", periodicity: "WEEKLY", description: "Gestion du courrier et des correspondances", sortOrder: 1 },
      { name: "Archivage hebdomadaire", periodicity: "WEEKLY", description: "Archivage des documents administratifs", sortOrder: 2 },
      { name: "Renseignement des cartes de travail", periodicity: "WEEKLY", description: "Mise à jour des cartes de travail", sortOrder: 3 },
      { name: "Renseignement des registres", periodicity: "WEEKLY", description: "Mise à jour des registres administratifs", sortOrder: 4 },
      { name: "Immatriculation / retraits (CNSS/CNAMGS/ASSURANCE)", periodicity: "PUNCTUAL", description: "Gestion des immatriculations et retraits CNSS/CNAMGS/Assurance", sortOrder: 5 },
      { name: "Entretiens de recrutement", periodicity: "PUNCTUAL", description: "Conduite des entretiens de recrutement", sortOrder: 6 },
      { name: "Analyse CV des candidats", periodicity: "PUNCTUAL", description: "Analyse et sélection des CV", sortOrder: 7 },
      { name: "Rédaction des fiches de poste", periodicity: "PUNCTUAL", description: "Rédaction et mise à jour des fiches de poste", sortOrder: 8 },
      { name: "Rédaction des fiches d'objectifs", periodicity: "PUNCTUAL", description: "Rédaction des fiches d'objectifs", sortOrder: 9 },
      { name: "AUTRES - Administration", periodicity: null, description: "Autres activités administratives", sortOrder: 10 },
    ],
  },
  // CATÉGORIE 2: CONTROLE ET REPORTING (Type: REPORTING)
  {
    category: "CONTROLE ET REPORTING",
    type: "REPORTING" as const,
    activities: [
      { name: "Tableaux de bord", periodicity: "WEEKLY", description: "Préparation et mise à jour des tableaux de bord", sortOrder: 20 },
      { name: "Indicateurs de performance", periodicity: "MONTHLY", description: "Calcul et analyse des indicateurs de performance", sortOrder: 21 },
      { name: "Variables de la paie", periodicity: "MONTHLY", description: "Suivi et contrôle des variables de paie", sortOrder: 22 },
      { name: "Dossiers du personnel", periodicity: "WEEKLY", description: "Gestion et mise à jour des dossiers du personnel", sortOrder: 23 },
      { name: "Contrats de travail", periodicity: "PUNCTUAL", description: "Gestion des contrats de travail", sortOrder: 24 },
      { name: "Periode d'essai", periodicity: "PUNCTUAL", description: "Suivi des périodes d'essai", sortOrder: 25 },
      { name: "Rapport des incident", periodicity: "PUNCTUAL", description: "Rédaction des rapports d'incident", sortOrder: 26 },
      { name: "Rapport des CDD", periodicity: "MONTHLY", description: "Rapport sur les contrats à durée déterminée", sortOrder: 27 },
      { name: "Rapport des réclamations", periodicity: "MONTHLY", description: "Rapport des réclamations du personnel", sortOrder: 28 },
      { name: "Evaluation des fin de CDD", periodicity: "PUNCTUAL", description: "Évaluation en fin de contrat CDD", sortOrder: 29 },
      { name: "Rapport mensuel", periodicity: "MONTHLY", description: "Rapport mensuel d'activité RH", sortOrder: 30 },
      { name: "Rapport hebdomadaire", periodicity: "WEEKLY", description: "Rapport hebdomadaire d'activité RH", sortOrder: 31 },
      { name: "Suivi du plan de congé", periodicity: "WEEKLY", description: "Suivi et contrôle du plan de congé", sortOrder: 32 },
      { name: "Suivi du plan de formation", periodicity: "MONTHLY", description: "Suivi du plan de formation", sortOrder: 33 },
      { name: "Checklists (Recrutement, paie, congés, discipline, fin de contrat)", periodicity: "WEEKLY", description: "Gestion des checklists opérationnelles", sortOrder: 34 },
      { name: "Suivi des dossiers de mise en retraite", periodicity: "MONTHLY", description: "Suivi des dossiers de mise en retraite", sortOrder: 35 },
      { name: "AUTRES - Contrôle et Reporting", periodicity: null, description: "Autres activités de contrôle et reporting", sortOrder: 36 },
    ],
  },
  // CATÉGORIE 3: PROJETS & AUDITS (Type: OPERATIONAL)
  {
    category: "PROJETS & AUDITS",
    type: "OPERATIONAL" as const,
    activities: [
      { name: "Projet - clients", periodicity: "PUNCTUAL", description: "Gestion des projets clients", sortOrder: 40 },
      { name: "Projet - Odillon", periodicity: "PUNCTUAL", description: "Projets internes Odillon", sortOrder: 41 },
      { name: "Prospection client", periodicity: "PUNCTUAL", description: "Activités de prospection client", sortOrder: 42 },
      { name: "Projet RSE Odillon", periodicity: "PUNCTUAL", description: "Projets de Responsabilité Sociale et Environnementale", sortOrder: 43 },
      { name: "Audit externe (clients)", periodicity: "PUNCTUAL", description: "Audits RH externes pour les clients", sortOrder: 44 },
      { name: "AUTRES - Projets & Audits", periodicity: null, description: "Autres projets et audits", sortOrder: 45 },
    ],
  },
  // CATÉGORIE 4: DEVELOPPEMENT/LEARNING (Type: OPERATIONAL)
  {
    category: "DEVELOPPEMENT/LEARNING",
    type: "OPERATIONAL" as const,
    activities: [
      { name: "Formation interne Odillon", periodicity: "PUNCTUAL", description: "Formations internes organisées par Odillon", sortOrder: 50 },
      { name: "Formation externe", periodicity: "PUNCTUAL", description: "Formations externes", sortOrder: 51 },
      { name: "Session de coaching", periodicity: "PUNCTUAL", description: "Sessions de coaching individuel ou collectif", sortOrder: 52 },
      { name: "Séminaire / conférence", periodicity: "PUNCTUAL", description: "Participation à des séminaires ou conférences", sortOrder: 53 },
      { name: "AUTRES - Développement/Learning", periodicity: null, description: "Autres activités de développement et formation", sortOrder: 54 },
    ],
  },
];

async function main() {
  console.log("🌱 Début du peuplement du catalogue d'activités RH...\n");

  // Option: Nettoyer les anciennes données (décommenter si nécessaire)
  // console.log("🗑️  Nettoyage des anciennes données...");
  // await prisma.activityCatalog.deleteMany({});
  // console.log("✅ Nettoyage terminé\n");

  let totalInserted = 0;

  for (const categoryGroup of activities) {
    console.log(`📁 Insertion de la catégorie: ${categoryGroup.category}`);

    for (const activity of categoryGroup.activities) {
      try {
        await prisma.activityCatalog.create({
          data: {
            id: crypto.randomUUID(),
            name: activity.name,
            category: categoryGroup.category,
            type: categoryGroup.type,
            defaultPeriodicity: activity.periodicity as any,
            description: activity.description,
            isActive: true,
            sortOrder: activity.sortOrder,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        console.log(`   ✓ ${activity.name}`);
        totalInserted++;
      } catch (error) {
        console.error(`   ✗ Erreur lors de l'insertion de "${activity.name}":`, error);
      }
    }
    console.log();
  }

  console.log(`\n✅ Peuplement terminé ! ${totalInserted} activités insérées.\n`);

  // Afficher un résumé par catégorie
  console.log("📊 Résumé par catégorie:");
  const summary = await prisma.activityCatalog.groupBy({
    by: ["category"],
    _count: true,
  });

  summary.forEach((item) => {
    console.log(`   ${item.category}: ${item._count} activités`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du peuplement:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
