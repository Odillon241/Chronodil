-- Désactiver les contraintes temporairement
SET session_replication_role = 'replica';

-- Supprimer tous les enregistrements dans l'ordre inverse des dépendances
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
