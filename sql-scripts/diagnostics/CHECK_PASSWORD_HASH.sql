-- Vérifier le format du hash du mot de passe
-- À exécuter dans le SQL Editor de Supabase Dashboard

SELECT 
  a.id as account_id,
  a."providerId",
  a."accountId",
  u.email,
  u.name,
  u.role,
  -- Informations sur le hash
  LENGTH(a.password) as hash_length,
  LEFT(a.password, 10) as hash_prefix,
  CASE 
    WHEN a.password LIKE '$2y$10$%' THEN '✅ Format bcrypt $2y$ (OK pour Better Auth)'
    WHEN a.password LIKE '$2a$10$%' THEN '✅ Format bcrypt $2a$ (OK pour Better Auth)'
    WHEN a.password LIKE '$2b$10$%' THEN '✅ Format bcrypt $2b$ (OK pour Better Auth)'
    WHEN a.password IS NULL THEN '❌ Pas de mot de passe'
    ELSE '❌ Format invalide pour Better Auth'
  END as hash_status,
  -- Détails
  CASE 
    WHEN LENGTH(a.password) = 60 THEN '✅ Longueur correcte (60 caractères)'
    ELSE '❌ Longueur incorrecte (devrait être 60)'
  END as length_status
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com';

