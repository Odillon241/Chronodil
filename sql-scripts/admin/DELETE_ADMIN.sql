-- Temporarily disable admin protection to delete admin@chronodil.com

-- 1. Disable the protection trigger
ALTER TABLE "User" DISABLE TRIGGER protect_admin_delete;

-- 2. Delete all related data for admin@chronodil.com
-- Delete in order of foreign key dependencies
DELETE FROM "Account" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "Session" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "TaskComment" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "TaskActivity" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "TaskMember" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "Task" WHERE "createdBy" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com')
   OR "evaluatedBy" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "ProjectMember" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "Project" WHERE "createdBy" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "TimesheetEntry" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "TimesheetValidation" WHERE "validatorId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "HRTimesheet" WHERE "managerSignedById" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com')
   OR "odillonSignedById" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com')
   OR "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "Notification" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "Report" WHERE "createdById" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "ReportRecipient" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "Conversation" WHERE "createdBy" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "ConversationMember" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "Message" WHERE "senderId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');
DELETE FROM "AuditLog" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'admin@chronodil.com');

-- 3. Delete the admin user
DELETE FROM "User" WHERE email = 'admin@chronodil.com';

-- 4. Re-enable the protection trigger
ALTER TABLE "User" ENABLE TRIGGER protect_admin_delete;

-- Verify deletion
SELECT COUNT(*) as admin_count FROM "User" WHERE email = 'admin@chronodil.com';
