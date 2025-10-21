-- Vérification COMPLÈTE de la synchronisation Supabase + Prisma + Better Auth
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- ═══════════════════════════════════════════════════════════════
-- 1. VÉRIFIER L'UTILISATEUR ADMIN
-- ═══════════════════════════════════════════════════════════════
SELECT 
  '1️⃣ UTILISATEUR ADMIN' as check_name,
  u.id,
  u.email,
  u.name,
  u.role,
  u."emailVerified",
  CASE 
    WHEN u.role = 'ADMIN' THEN '✅ OK'
    ELSE '❌ Rôle incorrect'
  END as status
FROM public."User" u
WHERE u.email = 'admin@chronodil.com';

-- ═══════════════════════════════════════════════════════════════
-- 2. VÉRIFIER LE COMPTE BETTER AUTH
-- ═══════════════════════════════════════════════════════════════
SELECT 
  '2️⃣ COMPTE BETTER AUTH' as check_name,
  a.id,
  a."providerId",
  a."accountId",
  u.email,
  LENGTH(a.password) as password_length,
  LEFT(a.password, 10) as password_preview,
  CASE 
    WHEN a."providerId" = 'email' THEN '✅ ProviderId = email (correct)'
    WHEN a."providerId" = 'credential' THEN '⚠️ ProviderId = credential (à changer vers "email")'
    ELSE '❌ ProviderId invalide: ' || a."providerId"
  END as provider_status,
  CASE 
    WHEN LENGTH(a.password) = 60 AND (a.password LIKE '$2y$10$%' OR a.password LIKE '$2a$10$%') 
    THEN '✅ Hash bcrypt valide'
    ELSE '❌ Hash invalide'
  END as hash_status
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com';

-- ═══════════════════════════════════════════════════════════════
-- 3. VÉRIFIER QU'IL N'Y A PAS DE CONFLIT AVEC SUPABASE AUTH
-- ═══════════════════════════════════════════════════════════════
SELECT 
  '3️⃣ CONFLIT SUPABASE AUTH' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Pas de conflit (utilisateur uniquement dans Better Auth)'
    ELSE '❌ CONFLIT : Utilisateur présent dans auth.users (à supprimer)'
  END as status,
  COUNT(*) as users_in_supabase_auth
FROM auth.users
WHERE email = 'admin@chronodil.com';

-- ═══════════════════════════════════════════════════════════════
-- 4. COMPTER TOUS LES COMPTES
-- ═══════════════════════════════════════════════════════════════
SELECT 
  '4️⃣ NOMBRE DE COMPTES' as check_name,
  COUNT(*) as total_accounts,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Un seul compte (correct)'
    WHEN COUNT(*) = 0 THEN '❌ Aucun compte'
    ELSE '⚠️ Plusieurs comptes (' || COUNT(*) || ')'
  END as status
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com';

-- ═══════════════════════════════════════════════════════════════
-- 5. LISTE DÉTAILLÉE DE TOUS LES COMPTES (s'il y en a plusieurs)
-- ═══════════════════════════════════════════════════════════════
SELECT 
  '5️⃣ TOUS LES COMPTES ADMIN' as check_name,
  a.id,
  a."providerId",
  a."accountId",
  a."createdAt",
  LENGTH(a.password) as pwd_length,
  LEFT(a.password, 10) as pwd_preview
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com'
ORDER BY a."createdAt" DESC;

-- ═══════════════════════════════════════════════════════════════
-- 6. RÉSUMÉ FINAL
-- ═══════════════════════════════════════════════════════════════
SELECT 
  '6️⃣ RÉSUMÉ' as check_name,
  EXISTS(SELECT 1 FROM public."User" WHERE email = 'admin@chronodil.com') as user_exists,
  EXISTS(SELECT 1 FROM public."Account" a JOIN public."User" u ON u.id = a."userId" WHERE u.email = 'admin@chronodil.com' AND a."providerId" = 'email') as account_with_email_provider,
  EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@chronodil.com') as in_supabase_auth;

