-- Vérifier s'il y a plusieurs comptes pour admin@chronodil.com

-- 1. Compter les comptes
SELECT 
  'NOMBRE DE COMPTES' as info,
  COUNT(*) as total
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com';

-- 2. Lister TOUS les comptes
SELECT 
  'LISTE DES COMPTES' as info,
  a.id,
  a."providerId",
  a."accountId",
  LENGTH(a.password) as pwd_length,
  LEFT(a.password, 10) as pwd_preview,
  a."createdAt"
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com'
ORDER BY a."createdAt" DESC;

-- 3. Trouver le bon compte et supprimer les autres
-- D'abord, identifier le compte avec providerId = 'email' et le bon hash
SELECT 
  'COMPTE À GARDER' as info,
  a.id,
  a."providerId",
  a."accountId",
  LEFT(a.password, 10) as pwd_preview,
  a."createdAt"
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com'
  AND a."providerId" = 'email'
  AND a.password LIKE '$2y$10$sfV%'
ORDER BY a."createdAt" DESC
LIMIT 1;

-- 4. Supprimer les comptes avec le mauvais providerId ou le mauvais hash
DELETE FROM public."Account"
WHERE "userId" IN (
  SELECT u.id FROM public."User" u WHERE u.email = 'admin@chronodil.com'
)
AND (
  "providerId" != 'email'
  OR password NOT LIKE '$2y$10$sfV%'
);

-- 5. Vérification finale - il ne doit rester qu'UN SEUL compte
SELECT 
  'VÉRIFICATION FINALE' as info,
  COUNT(*) as total_comptes,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Un seul compte (correct)'
    WHEN COUNT(*) = 0 THEN '❌ Aucun compte (problème)'
    ELSE '⚠️ Plusieurs comptes encore (' || COUNT(*) || ')'
  END as status
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com';

-- 6. Afficher le compte final
SELECT 
  'COMPTE FINAL' as info,
  a.id,
  a."providerId" as provider,
  a."accountId" as account,
  LENGTH(a.password) as pwd_length,
  LEFT(a.password, 10) as pwd_hash_start,
  u.email,
  u.name,
  u.role
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com';

