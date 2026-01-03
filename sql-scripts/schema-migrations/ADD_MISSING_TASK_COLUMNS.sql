-- Ajouter les colonnes manquantes dans la table Task
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- Vérifier les colonnes existantes
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Task' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ajouter createdBy si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Task' 
    AND column_name = 'createdBy' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public."Task" 
    ADD COLUMN "createdBy" TEXT;
    
    RAISE NOTICE 'Colonne createdBy ajoutée avec succès';
  ELSE
    RAISE NOTICE 'La colonne createdBy existe déjà';
  END IF;
END $$;

-- Ajouter evaluatedBy si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Task' 
    AND column_name = 'evaluatedBy' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public."Task" 
    ADD COLUMN "evaluatedBy" TEXT;
    
    RAISE NOTICE 'Colonne evaluatedBy ajoutée avec succès';
  ELSE
    RAISE NOTICE 'La colonne evaluatedBy existe déjà';
  END IF;
END $$;

-- Ajouter les relations (foreign keys) une fois les colonnes créées
DO $$
BEGIN
  -- Foreign key pour createdBy
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Task_createdBy_fkey'
  ) THEN
    ALTER TABLE public."Task"
    ADD CONSTRAINT "Task_createdBy_fkey" 
    FOREIGN KEY ("createdBy") 
    REFERENCES public."User"(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key createdBy ajoutée';
  END IF;

  -- Foreign key pour evaluatedBy
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Task_evaluatedBy_fkey'
  ) THEN
    ALTER TABLE public."Task"
    ADD CONSTRAINT "Task_evaluatedBy_fkey" 
    FOREIGN KEY ("evaluatedBy") 
    REFERENCES public."User"(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key evaluatedBy ajoutée';
  END IF;
END $$;

-- Vérification finale
SELECT 
  '✅ COLONNES TASK' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'Task' 
  AND column_name IN ('createdBy', 'evaluatedBy')
  AND table_schema = 'public';

