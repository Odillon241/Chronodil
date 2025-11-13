-- =====================================================
-- Script SQL pour activer Supabase Realtime sur les tables de tâches
-- =====================================================
-- 
-- Ce script active les publications Realtime pour les tables suivantes:
-- - Task (tâches principales)
-- - TaskComment (commentaires sur les tâches)
-- - TaskMember (membres des tâches partagées)
-- - TaskActivity (historique des activités)
--
-- INSTRUCTIONS:
-- 1. Ouvrez Supabase Dashboard: https://supabase.com/dashboard
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script
-- 4. Exécutez le script
--
-- =====================================================

-- Activer Realtime pour la table Task
ALTER PUBLICATION supabase_realtime ADD TABLE "Task";

-- Activer Realtime pour la table TaskComment
ALTER PUBLICATION supabase_realtime ADD TABLE "TaskComment";

-- Activer Realtime pour la table TaskMember
ALTER PUBLICATION supabase_realtime ADD TABLE "TaskMember";

-- Activer Realtime pour la table TaskActivity
ALTER PUBLICATION supabase_realtime ADD TABLE "TaskActivity";

-- Vérifier que les publications sont actives
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('Task', 'TaskComment', 'TaskMember', 'TaskActivity')
ORDER BY tablename;

-- =====================================================
-- NOTES IMPORTANTES:
-- =====================================================
-- 
-- 1. Les publications Realtime sont nécessaires pour que Supabase
--    puisse diffuser les changements en temps réel via WebSocket.
--
-- 2. Par défaut, Supabase Realtime est activé pour toutes les tables
--    dans certains projets, mais il est recommandé de l'activer
--    explicitement pour les tables critiques.
--
-- 3. Si vous rencontrez des erreurs, vérifiez que:
--    - Vous avez les permissions nécessaires (admin)
--    - La publication 'supabase_realtime' existe
--    - Les tables existent dans le schéma 'public'
--
-- 4. Pour désactiver Realtime sur une table:
--    ALTER PUBLICATION supabase_realtime DROP TABLE "Task";
--
-- =====================================================

