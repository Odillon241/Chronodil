-- Script SQL pour ajouter les relations bidirectionnelles Task ↔ HRTimesheet
-- Date: 2025-11-06
-- Description: Ajoute les champs nécessaires pour l'intégration bidirectionnelle

-- 1. Ajouter les nouveaux champs à HRActivity pour l'intégration avec Task
ALTER TABLE "HRActivity"
ADD COLUMN IF NOT EXISTS "taskId" TEXT,
ADD COLUMN IF NOT EXISTS "priority" TEXT,
ADD COLUMN IF NOT EXISTS "complexity" TEXT,
ADD COLUMN IF NOT EXISTS "estimatedHours" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reminderDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reminderTime" TEXT,
ADD COLUMN IF NOT EXISTS "soundEnabled" BOOLEAN NOT NULL DEFAULT true;

-- 2. Ajouter la contrainte UNIQUE sur taskId
ALTER TABLE "HRActivity"
ADD CONSTRAINT "HRActivity_taskId_key" UNIQUE ("taskId");

-- 3. Ajouter l'index sur taskId
CREATE INDEX IF NOT EXISTS "HRActivity_taskId_idx" ON "HRActivity"("taskId");

-- 4. Ajouter le champ hrTimesheetId à Task
ALTER TABLE "Task"
ADD COLUMN IF NOT EXISTS "hrTimesheetId" TEXT;

-- 5. Ajouter l'index sur hrTimesheetId
CREATE INDEX IF NOT EXISTS "Task_hrTimesheetId_idx" ON "Task"("hrTimesheetId");

-- 6. Ajouter la foreign key de HRActivity vers Task
ALTER TABLE "HRActivity"
ADD CONSTRAINT "HRActivity_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "Task"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Ajouter la foreign key de Task vers HRTimesheet
ALTER TABLE "Task"
ADD CONSTRAINT "Task_hrTimesheetId_fkey"
FOREIGN KEY ("hrTimesheetId") REFERENCES "HRTimesheet"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Vérification des colonnes ajoutées
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'HRActivity'
AND column_name IN ('taskId', 'priority', 'complexity', 'estimatedHours', 'dueDate', 'reminderDate', 'reminderTime', 'soundEnabled')
ORDER BY ordinal_position;

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Task'
AND column_name = 'hrTimesheetId';
