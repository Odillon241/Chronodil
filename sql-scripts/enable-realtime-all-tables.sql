-- =====================================================
-- Script SQL pour activer Supabase Realtime sur TOUTES les tables nécessaires
-- =====================================================
-- 
-- Ce script active les publications Realtime pour toutes les tables utilisées
-- dans les fonctionnalités real-time de l'application Chronodil:
--
-- NOTE: Les tables de tâches (Task, TaskComment, TaskMember, TaskActivity)
-- sont déjà activées via le script enable-realtime-tasks.sql
--
-- HR TIMESHEETS:
-- - HRTimesheet (feuilles de temps RH)
-- - HRActivity (activités RH)
--
-- CHAT:
-- - Conversation (conversations)
-- - ConversationMember (membres des conversations)
-- - Message (messages)
--
-- PROJETS:
-- - Project (projets)
-- - ProjectMember (membres des projets)
--
-- INSTRUCTIONS:
-- 1. Ouvrez Supabase Dashboard: https://supabase.com/dashboard
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script
-- 4. Exécutez le script
--
-- =====================================================

-- =====================================================
-- HR TIMESHEETS
-- =====================================================

-- Activer Realtime pour la table HRTimesheet
ALTER PUBLICATION supabase_realtime ADD TABLE "HRTimesheet";

-- Activer Realtime pour la table HRActivity
ALTER PUBLICATION supabase_realtime ADD TABLE "HRActivity";

-- =====================================================
-- CHAT
-- =====================================================

-- Activer Realtime pour la table Conversation
ALTER PUBLICATION supabase_realtime ADD TABLE "Conversation";

-- Activer Realtime pour la table ConversationMember
ALTER PUBLICATION supabase_realtime ADD TABLE "ConversationMember";

-- Activer Realtime pour la table Message
ALTER PUBLICATION supabase_realtime ADD TABLE "Message";

-- =====================================================
-- PROJETS
-- =====================================================

-- Activer Realtime pour la table Project
ALTER PUBLICATION supabase_realtime ADD TABLE "Project";

-- Activer Realtime pour la table ProjectMember
ALTER PUBLICATION supabase_realtime ADD TABLE "ProjectMember";

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier que toutes les publications sont actives
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN (
    'HRTimesheet',
    'HRActivity',
    'Conversation',
    'ConversationMember',
    'Message',
    'Project',
    'ProjectMember'
  )
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
--    ALTER PUBLICATION supabase_realtime DROP TABLE "TableName";
--
-- 5. Ce script est idempotent - vous pouvez l'exécuter plusieurs fois
--    sans problème. Si une table est déjà activée, l'erreur sera ignorée.
--
-- =====================================================

