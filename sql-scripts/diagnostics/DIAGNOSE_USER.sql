-- Script de diagnostic : Où est l'utilisateur admin ?
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/sql/new

-- 1. Vérifier si l'utilisateur existe dans auth.users (Supabase Auth)
SELECT 
  'SUPABASE AUTH (auth.users)' as source,
  id,
  email,
  email_confirmed_at,
  encrypted_password IS NOT NULL as has_password,
  LENGTH(encrypted_password) as password_length,
  LEFT(encrypted_password, 20) as password_preview,
  created_at
FROM auth.users
WHERE email = 'admin@chronodil.com';

-- 2. Vérifier si l'utilisateur existe dans public.User (Better Auth)
SELECT 
  'BETTER AUTH (public.User)' as source,
  id,
  email,
  name,
  role,
  "emailVerified",
  "createdAt"
FROM public."User"
WHERE email = 'admin@chronodil.com';

-- 3. Vérifier les comptes dans public.Account (Better Auth)
SELECT 
  'BETTER AUTH ACCOUNTS' as source,
  a.id,
  a."userId",
  a."providerId",
  a."accountId",
  a.password IS NOT NULL as has_password,
  LENGTH(a.password) as password_length,
  LEFT(a.password, 20) as password_preview,
  u.email
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com';

-- 4. Résumé : Où l'utilisateur existe-t-il ?
SELECT 
  EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@chronodil.com') as "Dans auth.users (Supabase)",
  EXISTS(SELECT 1 FROM public."User" WHERE email = 'admin@chronodil.com') as "Dans public.User (Better Auth)",
  EXISTS(
    SELECT 1 FROM public."Account" a 
    JOIN public."User" u ON u.id = a."userId" 
    WHERE u.email = 'admin@chronodil.com'
  ) as "A un Account (Better Auth)";

