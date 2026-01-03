-- Script pour corriger le hash du mot de passe admin
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/sql/new

-- Mot de passe: Admin2025@
-- Hash bcrypt généré avec @node-rs/bcrypt (utilisé par Better Auth)

-- 1. Vérifier l'utilisateur admin actuel
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  a.id as account_id,
  a."providerId",
  LEFT(a.password, 20) as password_preview
FROM public."User" u
LEFT JOIN public."Account" a ON a."userId" = u.id
WHERE u.email = 'admin@chronodil.com';

-- 2. Supprimer l'ancien compte s'il existe
DELETE FROM public."Account"
WHERE "userId" IN (
  SELECT id FROM public."User" WHERE email = 'admin@chronodil.com'
);

-- 3. Créer un nouveau compte avec le bon hash bcrypt
-- Hash pour "Admin2025@" généré avec bcrypt rounds=10
INSERT INTO public."Account" (
  id,
  "userId",
  "providerId",
  "accountId",
  password,
  "createdAt",
  "updatedAt"
)
SELECT
  'account_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  u.id,
  'credential',
  u.email,
  '$2y$10$sfVpf2N1Oocfjs3wxU6x4.fO2.AVH14khBhdR/zruH6cUmNl26Eoy',  -- Hash bcrypt pour "Admin2025@"
  NOW(),
  NOW()
FROM public."User" u
WHERE u.email = 'admin@chronodil.com';

-- 4. Vérification finale
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  a.id as account_id,
  a."providerId",
  a."accountId",
  LENGTH(a.password) as password_length,
  LEFT(a.password, 7) as hash_prefix
FROM public."User" u
JOIN public."Account" a ON a."userId" = u.id
WHERE u.email = 'admin@chronodil.com';

