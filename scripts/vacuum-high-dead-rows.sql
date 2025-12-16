-- ============================================
-- SCRIPT VACUUM POUR TABLES AVEC DEAD ROWS ÉLEVÉS
-- ============================================
-- À exécuter manuellement dans Supabase SQL Editor
-- VACUUM ne peut pas être exécuté dans une transaction
-- Date: 2025-01-08
--
-- IMPORTANT: Exécuter chaque commande séparément ou toutes ensemble
--            en dehors d'une transaction

-- Tables avec >100% dead rows (CRITIQUE)
VACUUM ANALYZE "User";
VACUUM ANALYZE "HRTimesheet";
VACUUM ANALYZE "Account";
VACUUM ANALYZE "Holiday";
VACUUM ANALYZE "Conversation";
VACUUM ANALYZE "TaskActivity";

-- Tables avec dead rows modérés (>20%)
VACUUM ANALYZE "Task";
VACUUM ANALYZE "HRActivity";
VACUUM ANALYZE "Notification";
VACUUM ANALYZE "ConversationMember";

-- Vérification après VACUUM
SELECT 
  schemaname,
  relname as tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  CASE 
    WHEN n_live_tup > 0 
    THEN ROUND(100.0 * n_dead_tup / n_live_tup, 2)
    ELSE 0 
  END as dead_rows_percent,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 0
ORDER BY dead_rows_percent DESC;

