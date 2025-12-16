-- Script de mise à jour du catalogue d'activités RH
-- Date: 2025-11-13
-- Source: MODIFICATION SUR LA FRH DU 12-11-2025.csv
--
-- Ce script REMPLACE les activités existantes avec les nouvelles données
-- Utilisation: Copier/coller dans Supabase SQL Editor

-- CATÉGORIE 1: ADMINISTRATION (Type: OPERATIONAL)
INSERT INTO "ActivityCatalog" (id, name, category, type, "defaultPeriodicity", description, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Courrier / Correspondances', 'ADMINISTRATION', 'OPERATIONAL', 'WEEKLY', 'Gestion du courrier et des correspondances', true, 1, now(), now()),
  (gen_random_uuid(), 'Archivage hebdomadaire', 'ADMINISTRATION', 'OPERATIONAL', 'WEEKLY', 'Archivage des documents administratifs', true, 2, now(), now()),
  (gen_random_uuid(), 'Renseignement des cartes de travail', 'ADMINISTRATION', 'OPERATIONAL', 'WEEKLY', 'Mise à jour des cartes de travail', true, 3, now(), now()),
  (gen_random_uuid(), 'Renseignement des registres', 'ADMINISTRATION', 'OPERATIONAL', 'WEEKLY', 'Mise à jour des registres administratifs', true, 4, now(), now()),
  (gen_random_uuid(), 'Immatriculation / retraits (CNSS/CNAMGS/ASSURANCE)', 'ADMINISTRATION', 'OPERATIONAL', 'PUNCTUAL', 'Gestion des immatriculations et retraits CNSS/CNAMGS/Assurance', true, 5, now(), now()),
  (gen_random_uuid(), 'Entretiens de recrutement', 'ADMINISTRATION', 'OPERATIONAL', 'PUNCTUAL', 'Conduite des entretiens de recrutement', true, 6, now(), now()),
  (gen_random_uuid(), 'Analyse CV des candidats', 'ADMINISTRATION', 'OPERATIONAL', 'PUNCTUAL', 'Analyse et sélection des CV', true, 7, now(), now()),
  (gen_random_uuid(), 'Rédaction des fiches de poste', 'ADMINISTRATION', 'OPERATIONAL', 'PUNCTUAL', 'Rédaction et mise à jour des fiches de poste', true, 8, now(), now()),
  (gen_random_uuid(), 'Rédaction des fiches d''objectifs', 'ADMINISTRATION', 'OPERATIONAL', 'PUNCTUAL', 'Rédaction des fiches d''objectifs', true, 9, now(), now()),
  (gen_random_uuid(), 'AUTRES - Administration', 'ADMINISTRATION', 'OPERATIONAL', null, 'Autres activités administratives', true, 10, now(), now())
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  "defaultPeriodicity" = EXCLUDED."defaultPeriodicity",
  description = EXCLUDED.description,
  "isActive" = EXCLUDED."isActive",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = now();

-- CATÉGORIE 2: CONTROLE ET REPORTING (Type: REPORTING)
INSERT INTO "ActivityCatalog" (id, name, category, type, "defaultPeriodicity", description, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Tableaux de bord', 'CONTROLE ET REPORTING', 'REPORTING', 'WEEKLY', 'Préparation et mise à jour des tableaux de bord', true, 20, now(), now()),
  (gen_random_uuid(), 'Indicateurs de performance', 'CONTROLE ET REPORTING', 'REPORTING', 'MONTHLY', 'Calcul et analyse des indicateurs de performance', true, 21, now(), now()),
  (gen_random_uuid(), 'Variables de la paie', 'CONTROLE ET REPORTING', 'REPORTING', 'MONTHLY', 'Suivi et contrôle des variables de paie', true, 22, now(), now()),
  (gen_random_uuid(), 'Dossiers du personnel', 'CONTROLE ET REPORTING', 'REPORTING', 'WEEKLY', 'Gestion et mise à jour des dossiers du personnel', true, 23, now(), now()),
  (gen_random_uuid(), 'Contrats de travail', 'CONTROLE ET REPORTING', 'REPORTING', 'PUNCTUAL', 'Gestion des contrats de travail', true, 24, now(), now()),
  (gen_random_uuid(), 'Periode d''essai', 'CONTROLE ET REPORTING', 'REPORTING', 'PUNCTUAL', 'Suivi des périodes d''essai', true, 25, now(), now()),
  (gen_random_uuid(), 'Rapport des incident', 'CONTROLE ET REPORTING', 'REPORTING', 'PUNCTUAL', 'Rédaction des rapports d''incident', true, 26, now(), now()),
  (gen_random_uuid(), 'Rapport des CDD', 'CONTROLE ET REPORTING', 'REPORTING', 'MONTHLY', 'Rapport sur les contrats à durée déterminée', true, 27, now(), now()),
  (gen_random_uuid(), 'Rapport des réclamations', 'CONTROLE ET REPORTING', 'REPORTING', 'MONTHLY', 'Rapport des réclamations du personnel', true, 28, now(), now()),
  (gen_random_uuid(), 'Evaluation des fin de CDD', 'CONTROLE ET REPORTING', 'REPORTING', 'PUNCTUAL', 'Évaluation en fin de contrat CDD', true, 29, now(), now()),
  (gen_random_uuid(), 'Rapport mensuel', 'CONTROLE ET REPORTING', 'REPORTING', 'MONTHLY', 'Rapport mensuel d''activité RH', true, 30, now(), now()),
  (gen_random_uuid(), 'Rapport hebdomadaire', 'CONTROLE ET REPORTING', 'REPORTING', 'WEEKLY', 'Rapport hebdomadaire d''activité RH', true, 31, now(), now()),
  (gen_random_uuid(), 'Suivi du plan de congé', 'CONTROLE ET REPORTING', 'REPORTING', 'WEEKLY', 'Suivi et contrôle du plan de congé', true, 32, now(), now()),
  (gen_random_uuid(), 'Suivi du plan de formation', 'CONTROLE ET REPORTING', 'REPORTING', 'MONTHLY', 'Suivi du plan de formation', true, 33, now(), now()),
  (gen_random_uuid(), 'Checklists (Recrutement, paie, congés, discipline, fin de contrat)', 'CONTROLE ET REPORTING', 'REPORTING', 'WEEKLY', 'Gestion des checklists opérationnelles', true, 34, now(), now()),
  (gen_random_uuid(), 'Suivi des dossiers de mise en retraite', 'CONTROLE ET REPORTING', 'REPORTING', 'MONTHLY', 'Suivi des dossiers de mise en retraite', true, 35, now(), now()),
  (gen_random_uuid(), 'AUTRES - Contrôle et Reporting', 'CONTROLE ET REPORTING', 'REPORTING', null, 'Autres activités de contrôle et reporting', true, 36, now(), now())
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  "defaultPeriodicity" = EXCLUDED."defaultPeriodicity",
  description = EXCLUDED.description,
  "isActive" = EXCLUDED."isActive",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = now();

-- CATÉGORIE 3: PROJETS & AUDITS (Type: OPERATIONAL)
INSERT INTO "ActivityCatalog" (id, name, category, type, "defaultPeriodicity", description, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Projet - clients', 'PROJETS & AUDITS', 'OPERATIONAL', 'PUNCTUAL', 'Gestion des projets clients', true, 40, now(), now()),
  (gen_random_uuid(), 'Projet - Odillon', 'PROJETS & AUDITS', 'OPERATIONAL', 'PUNCTUAL', 'Projets internes Odillon', true, 41, now(), now()),
  (gen_random_uuid(), 'Prospection client', 'PROJETS & AUDITS', 'OPERATIONAL', 'PUNCTUAL', 'Activités de prospection client', true, 42, now(), now()),
  (gen_random_uuid(), 'Projet RSE Odillon', 'PROJETS & AUDITS', 'OPERATIONAL', 'PUNCTUAL', 'Projets de Responsabilité Sociale et Environnementale', true, 43, now(), now()),
  (gen_random_uuid(), 'Audit externe (clients)', 'PROJETS & AUDITS', 'OPERATIONAL', 'PUNCTUAL', 'Audits RH externes pour les clients', true, 44, now(), now()),
  (gen_random_uuid(), 'AUTRES - Projets & Audits', 'PROJETS & AUDITS', 'OPERATIONAL', null, 'Autres projets et audits', true, 45, now(), now())
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  "defaultPeriodicity" = EXCLUDED."defaultPeriodicity",
  description = EXCLUDED.description,
  "isActive" = EXCLUDED."isActive",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = now();

-- CATÉGORIE 4: DEVELOPPEMENT/LEARNING (Type: OPERATIONAL)
INSERT INTO "ActivityCatalog" (id, name, category, type, "defaultPeriodicity", description, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Formation interne Odillon', 'DEVELOPPEMENT/LEARNING', 'OPERATIONAL', 'PUNCTUAL', 'Formations internes organisées par Odillon', true, 50, now(), now()),
  (gen_random_uuid(), 'Formation externe', 'DEVELOPPEMENT/LEARNING', 'OPERATIONAL', 'PUNCTUAL', 'Formations externes', true, 51, now(), now()),
  (gen_random_uuid(), 'Session de coaching', 'DEVELOPPEMENT/LEARNING', 'OPERATIONAL', 'PUNCTUAL', 'Sessions de coaching individuel ou collectif', true, 52, now(), now()),
  (gen_random_uuid(), 'Séminaire / conférence', 'DEVELOPPEMENT/LEARNING', 'OPERATIONAL', 'PUNCTUAL', 'Participation à des séminaires ou conférences', true, 53, now(), now()),
  (gen_random_uuid(), 'AUTRES - Développement/Learning', 'DEVELOPPEMENT/LEARNING', 'OPERATIONAL', null, 'Autres activités de développement et formation', true, 54, now(), now())
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  "defaultPeriodicity" = EXCLUDED."defaultPeriodicity",
  description = EXCLUDED.description,
  "isActive" = EXCLUDED."isActive",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = now();

-- Afficher le résumé
SELECT
  category,
  type,
  COUNT(*) as total
FROM "ActivityCatalog"
GROUP BY category, type
ORDER BY category;
