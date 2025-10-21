-- Solution FINALE : Supprimer l'ancien admin et le recréer via Better Auth

-- 1. Désactiver temporairement la protection et supprimer l'ancien admin
DO $$
BEGIN
  -- Désactiver le trigger
  EXECUTE 'ALTER TABLE public."User" DISABLE TRIGGER prevent_admin_deletion_trigger';
  
  -- Supprimer les comptes
  DELETE FROM public."Account"
  WHERE "userId" IN (SELECT id FROM public."User" WHERE email = 'admin@chronodil.com');
  
  -- Supprimer les sessions
  DELETE FROM public."Session"
  WHERE "userId" IN (SELECT id FROM public."User" WHERE email = 'admin@chronodil.com');
  
  -- Supprimer l'utilisateur
  DELETE FROM public."User" WHERE email = 'admin@chronodil.com';
  
  -- Réactiver le trigger
  EXECUTE 'ALTER TABLE public."User" ENABLE TRIGGER prevent_admin_deletion_trigger';
  
  RAISE NOTICE 'Ancien admin supprimé avec succès';
END $$;

-- 2. Vérification
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Ancien admin supprimé'
    ELSE '❌ Ancien admin toujours présent'
  END as status
FROM public."User"
WHERE email = 'admin@chronodil.com';

-- 3. Instructions pour la suite
SELECT 
  '📝 PROCHAINES ÉTAPES' as titre,
  '1. Créez un nouvel admin via http://localhost:3000/test-signup' as etape_1,
  '2. Email: admin@chronodil.com, Password: Admin2025@, Name: Administrateur' as etape_2,
  '3. Mettez à jour le rôle en ADMIN avec le script suivant' as etape_3;

