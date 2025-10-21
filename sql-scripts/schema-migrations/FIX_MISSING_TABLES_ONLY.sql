-- Créer UNIQUEMENT les tables et types manquants (ignore ce qui existe déjà)

-- ============================================================
-- ENUMS (créer uniquement s'ils n'existent pas)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP', 'PROJECT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HRActivityStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HRActivityType" AS ENUM ('OPERATIONAL', 'REPORTING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HRPeriodicity" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'PUNCTUAL', 'WEEKLY_MONTHLY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HRTimesheetStatus" AS ENUM ('DRAFT', 'PENDING', 'MANAGER_APPROVED', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'INDIVIDUAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'HR', 'DIRECTEUR', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TimeType" AS ENUM ('NORMAL', 'OVERTIME', 'NIGHT', 'WEEKEND');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TimesheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LOCKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskComplexity" AS ENUM ('FAIBLE', 'MOYEN', 'ÉLEVÉ');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TrainingLevel" AS ENUM ('NONE', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MasteryLevel" AS ENUM ('NOVICE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "UnderstandingLevel" AS ENUM ('NONE', 'SUPERFICIAL', 'WORKING', 'COMPREHENSIVE', 'EXPERT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- TABLES (créer uniquement si elles n'existent pas)
-- ============================================================

-- TaskActivity (la table qui manquait)
CREATE TABLE IF NOT EXISTS "TaskActivity" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);

-- TaskComment
CREATE TABLE IF NOT EXISTS "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- TaskMember
CREATE TABLE IF NOT EXISTS "TaskMember" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskMember_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- INDEX (créer uniquement s'ils n'existent pas)
-- ============================================================

CREATE INDEX IF NOT EXISTS "TaskActivity_taskId_idx" ON "TaskActivity"("taskId");
CREATE INDEX IF NOT EXISTS "TaskActivity_userId_idx" ON "TaskActivity"("userId");
CREATE INDEX IF NOT EXISTS "TaskActivity_createdAt_idx" ON "TaskActivity"("createdAt");
CREATE INDEX IF NOT EXISTS "TaskActivity_action_idx" ON "TaskActivity"("action");

CREATE INDEX IF NOT EXISTS "TaskComment_taskId_idx" ON "TaskComment"("taskId");
CREATE INDEX IF NOT EXISTS "TaskComment_userId_idx" ON "TaskComment"("userId");
CREATE INDEX IF NOT EXISTS "TaskComment_createdAt_idx" ON "TaskComment"("createdAt");

CREATE INDEX IF NOT EXISTS "TaskMember_taskId_idx" ON "TaskMember"("taskId");
CREATE INDEX IF NOT EXISTS "TaskMember_userId_idx" ON "TaskMember"("userId");

-- ============================================================
-- FOREIGN KEYS (ajouter uniquement si elles n'existent pas)
-- ============================================================

DO $$
BEGIN
  -- TaskActivity -> Task
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'TaskActivity_taskId_fkey'
  ) THEN
    ALTER TABLE "TaskActivity" 
    ADD CONSTRAINT "TaskActivity_taskId_fkey" 
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE;
  END IF;

  -- TaskActivity -> User
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'TaskActivity_userId_fkey'
  ) THEN
    ALTER TABLE "TaskActivity" 
    ADD CONSTRAINT "TaskActivity_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;

  -- TaskComment -> Task
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'TaskComment_taskId_fkey'
  ) THEN
    ALTER TABLE "TaskComment" 
    ADD CONSTRAINT "TaskComment_taskId_fkey" 
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE;
  END IF;

  -- TaskComment -> User
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'TaskComment_userId_fkey'
  ) THEN
    ALTER TABLE "TaskComment" 
    ADD CONSTRAINT "TaskComment_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;

  -- TaskMember -> Task
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'TaskMember_taskId_fkey'
  ) THEN
    ALTER TABLE "TaskMember" 
    ADD CONSTRAINT "TaskMember_taskId_fkey" 
    FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE;
  END IF;

  -- TaskMember -> User
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'TaskMember_userId_fkey'
  ) THEN
    ALTER TABLE "TaskMember" 
    ADD CONSTRAINT "TaskMember_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;

  -- TaskMember unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'TaskMember_taskId_userId_key'
  ) THEN
    ALTER TABLE "TaskMember" 
    ADD CONSTRAINT "TaskMember_taskId_userId_key" UNIQUE ("taskId", "userId");
  END IF;
END $$;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================

SELECT 
  '✅ TABLES CRÉÉES' as status,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('TaskActivity', 'TaskComment', 'TaskMember')
ORDER BY table_name;

