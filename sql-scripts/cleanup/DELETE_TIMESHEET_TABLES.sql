-- ============================================================
-- Script de suppression des tables Timesheet
-- ============================================================
-- Ce script supprime complètement la fonctionnalité de timesheet
-- de la base de données (différente de hr-timesheet qui reste)
--
-- AVERTISSEMENT : Cette opération est IRRÉVERSIBLE
-- Toutes les données dans ces tables seront définitivement perdues
--
-- Tables supprimées :
-- - TimesheetValidation (dépend de TimesheetEntry)
-- - TimesheetEntry (table principale)
--
-- Date de création : 2025-11-05
-- ============================================================

BEGIN;

-- Étape 1 : Supprimer la table TimesheetValidation (dépendance)
-- Cette table contient les validations des entrées de timesheet
DROP TABLE IF EXISTS "TimesheetValidation" CASCADE;

-- Étape 2 : Supprimer la table TimesheetEntry (table principale)
-- Cette table contient les entrées de temps des utilisateurs
DROP TABLE IF EXISTS "TimesheetEntry" CASCADE;

-- Étape 3 : Supprimer l'enum TimesheetStatus s'il n'est plus utilisé
-- Note : L'enum TimeType est toujours utilisé, donc on ne le supprime pas
DROP TYPE IF EXISTS "TimesheetStatus" CASCADE;

COMMIT;

-- ============================================================
-- Vérification post-suppression
-- ============================================================
-- Exécutez cette requête pour vérifier que les tables ont été supprimées :
--
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('TimesheetEntry', 'TimesheetValidation');
--
-- Le résultat devrait être vide (0 lignes)
-- ============================================================
