-- Vérifier TOUTES les tables du schéma Prisma dans Supabase
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- Liste de TOUTES les tables attendues par Prisma (d'après votre schema.prisma)
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'Account',
    'ActivityCatalog',
    'AuditLog',
    'CompanySetting',
    'Conversation',
    'ConversationMember',
    'Department',
    'Holiday',
    'HRActivity',
    'HRTimesheet',
    'Message',
    'Notification',
    'PrivacyMember',
    'Project',
    'ProjectMember',
    'Report',
    'ReportRecipient',
    'ReportType',
    'Session',
    'Task',
    'TaskActivity',
    'TaskComment',
    'TaskMember',
    'TimesheetEntry',
    'TimesheetValidation',
    'User'
  ]) AS table_name
),
existing_tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
)
SELECT 
  e.table_name,
  CASE 
    WHEN x.table_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ MANQUANTE'
  END as status,
  CASE 
    WHEN x.table_name IS NULL THEN 'À créer via FULL_SCHEMA_MIGRATION.sql'
    ELSE 'OK'
  END as action
FROM expected_tables e
LEFT JOIN existing_tables x ON e.table_name = x.table_name
ORDER BY 
  CASE WHEN x.table_name IS NULL THEN 0 ELSE 1 END,
  e.table_name;

-- Résumé
SELECT 
  COUNT(*) FILTER (WHERE x.table_name IS NOT NULL) as tables_presentes,
  COUNT(*) FILTER (WHERE x.table_name IS NULL) as tables_manquantes,
  COUNT(*) as total_tables_attendues
FROM expected_tables e
LEFT JOIN existing_tables x ON e.table_name = x.table_name;

-- Lister les tables manquantes
SELECT 
  '🔴 TABLES MANQUANTES' as titre,
  string_agg(e.table_name, ', ' ORDER BY e.table_name) as liste_tables
FROM expected_tables e
LEFT JOIN existing_tables x ON e.table_name = x.table_name
WHERE x.table_name IS NULL;

