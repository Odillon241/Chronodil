-- Mettre à jour le rôle de l'utilisateur final en ADMIN

UPDATE public."User"
SET role = 'ADMIN',
    name = 'Administrateur',
    "emailVerified" = true
WHERE email = 'finaladmin@chronodil.com';

-- Vérification
SELECT 
  '✅ ADMIN FINAL CRÉÉ' as status,
  id,
  email,
  name,
  role,
  "emailVerified",
  "createdAt"
FROM public."User"
WHERE email = 'finaladmin@chronodil.com';

-- Supprimer les utilisateurs de test
DELETE FROM public."Account"
WHERE "userId" IN (
  SELECT id FROM public."User" 
  WHERE email IN ('test@test.com', 'newadmin@chronodil.com')
);

DELETE FROM public."User"
WHERE email IN ('test@test.com', 'newadmin@chronodil.com');

-- Résumé final
SELECT 
  '🎉 CONFIGURATION TERMINÉE' as titre,
  'Email: finaladmin@chronodil.com' as credentials,
  'Mot de passe: Admin2025@' as password,
  'Rôle: ADMIN' as role,
  'http://localhost:3000/auth/login' as url_connexion;

