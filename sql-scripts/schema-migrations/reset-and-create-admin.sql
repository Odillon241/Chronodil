-- Script SQL pour nettoyer la base et créer un admin
-- À exécuter avec: psql -U postgres -d chronodil -f scripts/reset-and-create-admin.sql

-- Désactiver les contraintes temporairement
SET session_replication_role = 'replica';

-- Supprimer tous les enregistrements
TRUNCATE TABLE "TimesheetValidation" CASCADE;
TRUNCATE TABLE "TimesheetEntry" CASCADE;
TRUNCATE TABLE "HRActivity" CASCADE;
TRUNCATE TABLE "HRTimesheet" CASCADE;
TRUNCATE TABLE "ProjectMember" CASCADE;
TRUNCATE TABLE "Task" CASCADE;
TRUNCATE TABLE "Message" CASCADE;
TRUNCATE TABLE "ConversationMember" CASCADE;
TRUNCATE TABLE "Conversation" CASCADE;
TRUNCATE TABLE "Notification" CASCADE;
TRUNCATE TABLE "AuditLog" CASCADE;
TRUNCATE TABLE "Session" CASCADE;
TRUNCATE TABLE "Account" CASCADE;
TRUNCATE TABLE "Project" CASCADE;
TRUNCATE TABLE "User" CASCADE;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- Créer l'utilisateur admin
INSERT INTO "User" (
  id,
  email,
  name,
  role,
  "emailVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'admin@chronodil.com',
  'Administrateur',
  'ADMIN',
  true,
  NOW(),
  NOW()
);

-- Créer le compte avec mot de passe (vous devrez hasher le mot de passe via Better Auth après)
-- Le mot de passe sera: Admin2025!

SELECT 'Base de données nettoyée et utilisateur admin créé!' as status;
SELECT id, email, name, role FROM "User" WHERE email = 'admin@chronodil.com';
