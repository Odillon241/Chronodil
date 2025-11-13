-- ============================================
-- ACTIVER ROW LEVEL SECURITY (RLS)
-- ============================================
-- Script SQL pour activer RLS sur toutes les tables
-- CRITIQUE POUR LA SÉCURITÉ ET LES PERFORMANCES REALTIME
-- Exécuter ce script dans Supabase SQL Editor
-- Date: 2025-11-13

-- ⚠️ ATTENTION: Ce script active RLS mais NE CRÉE PAS les politiques
-- Les politiques doivent être créées après selon vos besoins métier

-- ============================================
-- PARTIE 1: ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================

-- Tables principales
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HRTimesheet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HRActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Tables secondaires
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Holiday" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityCatalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReportType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReportRecipient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReportTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanySetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Verification" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTIE 2: CRÉER DES POLITIQUES RLS DE BASE
-- ============================================
-- Ces politiques permettent aux utilisateurs de voir/modifier leurs propres données

-- ===== TASK =====
-- Les utilisateurs peuvent voir les tâches dont ils sont créateurs ou membres
CREATE POLICY "Users can view their own tasks"
ON "Task"
FOR SELECT
USING (
  auth.uid()::text = "createdBy"
  OR EXISTS (
    SELECT 1 FROM "TaskMember"
    WHERE "TaskMember"."taskId" = "Task"."id"
    AND "TaskMember"."userId" = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "ProjectMember"
    WHERE "ProjectMember"."projectId" = "Task"."projectId"
    AND "ProjectMember"."userId" = auth.uid()::text
  )
);

-- Les utilisateurs peuvent créer des tâches
CREATE POLICY "Users can create tasks"
ON "Task"
FOR INSERT
WITH CHECK (auth.uid()::text = "createdBy");

-- Les créateurs peuvent modifier leurs tâches
CREATE POLICY "Creators can update their tasks"
ON "Task"
FOR UPDATE
USING (auth.uid()::text = "createdBy")
WITH CHECK (auth.uid()::text = "createdBy");

-- Les créateurs peuvent supprimer leurs tâches
CREATE POLICY "Creators can delete their tasks"
ON "Task"
FOR DELETE
USING (auth.uid()::text = "createdBy");

-- ===== TASKMEMBER =====
-- Voir les membres des tâches auxquelles on a accès
CREATE POLICY "Users can view task members"
ON "TaskMember"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Task"
    WHERE "Task"."id" = "TaskMember"."taskId"
    AND (
      auth.uid()::text = "Task"."createdBy"
      OR EXISTS (
        SELECT 1 FROM "TaskMember" tm
        WHERE tm."taskId" = "Task"."id"
        AND tm."userId" = auth.uid()::text
      )
    )
  )
);

-- Les créateurs peuvent ajouter des membres
CREATE POLICY "Creators can add task members"
ON "TaskMember"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Task"
    WHERE "Task"."id" = "TaskMember"."taskId"
    AND auth.uid()::text = "Task"."createdBy"
  )
);

-- ===== HRTIMESHEET =====
-- Les utilisateurs peuvent voir leurs propres timesheets
CREATE POLICY "Users can view their own timesheets"
ON "HRTimesheet"
FOR SELECT
USING (auth.uid()::text = "userId");

-- Les utilisateurs peuvent créer leurs timesheets
CREATE POLICY "Users can create their own timesheets"
ON "HRTimesheet"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Les utilisateurs peuvent modifier leurs timesheets en DRAFT
CREATE POLICY "Users can update their draft timesheets"
ON "HRTimesheet"
FOR UPDATE
USING (
  auth.uid()::text = "userId"
  AND "status" = 'DRAFT'
)
WITH CHECK (
  auth.uid()::text = "userId"
);

-- ===== HRACTIVITY =====
-- Les utilisateurs peuvent voir les activités de leurs timesheets
CREATE POLICY "Users can view their own activities"
ON "HRActivity"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "HRTimesheet"
    WHERE "HRTimesheet"."id" = "HRActivity"."hrTimesheetId"
    AND auth.uid()::text = "HRTimesheet"."userId"
  )
);

-- Les utilisateurs peuvent créer des activités dans leurs timesheets
CREATE POLICY "Users can create their own activities"
ON "HRActivity"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "HRTimesheet"
    WHERE "HRTimesheet"."id" = "HRActivity"."hrTimesheetId"
    AND auth.uid()::text = "HRTimesheet"."userId"
  )
);

-- ===== NOTIFICATION =====
-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications"
ON "Notification"
FOR SELECT
USING (auth.uid()::text = "userId");

-- Les utilisateurs peuvent modifier (marquer comme lu) leurs notifications
CREATE POLICY "Users can update their own notifications"
ON "Notification"
FOR UPDATE
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- ===== PROJECT =====
-- Les utilisateurs peuvent voir les projets dont ils sont membres
CREATE POLICY "Users can view their projects"
ON "Project"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "ProjectMember"
    WHERE "ProjectMember"."projectId" = "Project"."id"
    AND "ProjectMember"."userId" = auth.uid()::text
  )
  OR auth.uid()::text = "createdBy"
);

-- ===== USER =====
-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile"
ON "User"
FOR SELECT
USING (auth.uid()::text = "id");

-- Les utilisateurs peuvent voir les autres utilisateurs (pour partage, etc.)
CREATE POLICY "Users can view other users"
ON "User"
FOR SELECT
USING (true); -- Public read pour les infos de base

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update their own profile"
ON "User"
FOR UPDATE
USING (auth.uid()::text = "id")
WITH CHECK (auth.uid()::text = "id");

-- ============================================
-- PARTIE 3: VÉRIFIER QUE RLS EST ACTIVÉ
-- ============================================

SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 1. RLS est maintenant ACTIVÉ sur toutes les tables
-- 2. Les politiques de base sont créées pour les tables principales
-- 3. Vous devez créer des politiques supplémentaires selon vos besoins:
--    - Politiques pour les managers (accès aux données des subordonnés)
--    - Politiques pour les admins (accès complet)
--    - Politiques pour les rapports, messages, etc.
--
-- 4. TESTEZ BIEN vos politiques avant de déployer en production!
--    Utilisez un compte utilisateur normal (pas supabase_admin) pour tester
--
-- 5. Les politiques RLS utilisent auth.uid() qui vient de:
--    - Supabase Auth si vous utilisez Supabase Auth
--    - JWT claims si vous utilisez Better Auth (doit être configuré)
--
-- 6. Pour Better Auth, vous devez configurer le JWT claim:
--    Dans votre configuration Better Auth, ajoutez:
--    ```
--    jwt: {
--      secret: process.env.JWT_SECRET,
--      expiresIn: "7d",
--      refreshToken: {
--        enabled: true,
--        expiresIn: "30d",
--      },
--    }
--    ```
--
-- 7. IMPACT PERFORMANCE:
--    ✅ POSITIF pour Realtime (filtrage côté serveur)
--    ⚠️ NEUTRE pour les requêtes (Postgres applique les filtres automatiquement)
--    ⚠️ ATTENTION: Politiques mal écrites peuvent ralentir les requêtes
--
-- 8. SÉCURITÉ:
--    ✅ CRITIQUE: Sans RLS, toutes les données sont accessibles publiquement
--    ✅ OBLIGATOIRE pour une app en production
--    ✅ Supabase recommande TOUJOURS d'activer RLS
--
-- 9. DEBUGGING:
--    Pour tester les politiques, utilisez:
--    ```sql
--    SET ROLE authenticated;
--    SET request.jwt.claims TO '{"sub": "user-id-here"}';
--    SELECT * FROM "Task"; -- Doit seulement retourner les tâches de cet user
--    RESET ROLE;
--    ```
--
-- 10. DÉSACTIVER TEMPORAIREMENT (POUR DEBUG SEULEMENT):
--     ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
--     ⚠️ NE JAMAIS FAIRE EN PRODUCTION!

-- ============================================
-- COMMANDES UTILES POUR LA GESTION RLS
-- ============================================

-- Lister toutes les politiques RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Supprimer une politique
-- DROP POLICY IF EXISTS "policy_name" ON "Table";

-- Désactiver RLS sur une table (DEBUG SEULEMENT)
-- ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;

-- Réactiver RLS
-- ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
