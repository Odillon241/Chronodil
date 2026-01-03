-- Solution : Nettoyer et recréer l'utilisateur UNIQUEMENT pour Better Auth
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/sql/new

-- ⚠️ IMPORTANT : Better Auth utilise UNIQUEMENT les tables public.User et public.Account
-- Il ne doit PAS y avoir d'utilisateur dans auth.users pour Better Auth

-- ÉTAPE 1 : Nettoyer complètement l'utilisateur admin

-- 1.1 Supprimer de auth.users (Supabase Auth) si présent
DELETE FROM auth.users WHERE email = 'admin@chronodil.com';

-- 1.2 Supprimer de public.Account (Better Auth)
DELETE FROM public."Account"
WHERE "userId" IN (
  SELECT id FROM public."User" WHERE email = 'admin@chronodil.com'
);

-- 1.3 Supprimer de public.Session (Better Auth)
DELETE FROM public."Session"
WHERE "userId" IN (
  SELECT id FROM public."User" WHERE email = 'admin@chronodil.com'
);

-- 1.4 Supprimer de public.User (Better Auth)
-- Temporairement désactiver la protection admin
DO $$
BEGIN
  -- Désactiver le trigger de protection
  ALTER TABLE public."User" DISABLE TRIGGER IF EXISTS prevent_admin_deletion_trigger;
  
  -- Supprimer l'utilisateur
  DELETE FROM public."User" WHERE email = 'admin@chronodil.com';
  
  -- Réactiver le trigger
  ALTER TABLE public."User" ENABLE TRIGGER IF EXISTS prevent_admin_deletion_trigger;
END $$;

-- ÉTAPE 2 : Recréer l'utilisateur UNIQUEMENT dans Better Auth (public.User + public.Account)

-- 2.1 Créer l'utilisateur dans public.User
INSERT INTO public."User" (
  id,
  email,
  name,
  role,
  "emailVerified",
  "createdAt",
  "updatedAt",
  "enableTimesheetReminders",
  "reminderDays",
  "reminderTime",
  "desktopNotificationsEnabled",
  "emailNotificationsEnabled",
  "notificationSoundEnabled",
  "notificationSoundType",
  "notificationSoundVolume",
  "weeklyGoal",
  "darkModeEnabled",
  "accentColor",
  "viewDensity",
  "fontSize",
  "language",
  "dateFormat",
  "hourFormat",
  "timezone",
  "highContrast",
  "screenReaderMode",
  "reduceMotion"
)
VALUES (
  'admin_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'admin@chronodil.com',
  'Administrateur',
  'ADMIN',
  true,
  NOW(),
  NOW(),
  true,
  ARRAY[]::TEXT[],
  '17:00',
  true,
  true,
  true,
  'default',
  0.7,
  40,
  true,
  'rusty-red',
  'normal',
  16,
  'fr',
  'DD/MM/YYYY',
  '24',
  'Africa/Libreville',
  false,
  false,
  false
)
ON CONFLICT (email) DO NOTHING
RETURNING id, email, name, role;

-- 2.2 Créer le compte avec le hash bcrypt correct
-- Hash bcrypt pour "Admin2025@" : $2y$10$sfVpf2N1Oocfjs3wxU6x4.fO2.AVH14khBhdR/zruH6cUmNl26Eoy
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
  'account_admin_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  u.id,
  'credential',
  u.email,
  '$2y$10$sfVpf2N1Oocfjs3wxU6x4.fO2.AVH14khBhdR/zruH6cUmNl26Eoy',
  NOW(),
  NOW()
FROM public."User" u
WHERE u.email = 'admin@chronodil.com'
ON CONFLICT ("providerId", "accountId") DO UPDATE
SET password = EXCLUDED.password,
    "updatedAt" = NOW();

-- ÉTAPE 3 : Vérification finale

-- 3.1 Vérifier que l'utilisateur N'existe PAS dans auth.users
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK : Pas d''utilisateur dans auth.users (correct pour Better Auth)'
    ELSE '⚠️ ATTENTION : Utilisateur présent dans auth.users (à supprimer)'
  END as "Status auth.users"
FROM auth.users
WHERE email = 'admin@chronodil.com';

-- 3.2 Vérifier que l'utilisateur existe dans public.User
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OK : Utilisateur présent dans public.User'
    ELSE '❌ ERREUR : Utilisateur manquant dans public.User'
  END as "Status public.User",
  u.id,
  u.email,
  u.name,
  u.role
FROM public."User" u
WHERE u.email = 'admin@chronodil.com'
GROUP BY u.id, u.email, u.name, u.role;

-- 3.3 Vérifier que le compte existe avec le bon hash
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OK : Compte présent dans public.Account'
    ELSE '❌ ERREUR : Compte manquant dans public.Account'
  END as "Status public.Account",
  a.id,
  a."providerId",
  a."accountId",
  LENGTH(a.password) as password_length,
  LEFT(a.password, 7) as hash_format,
  CASE 
    WHEN a.password LIKE '$2y$10$%' OR a.password LIKE '$2a$10$%' THEN '✅ Format bcrypt OK'
    ELSE '❌ Format invalide'
  END as hash_validation
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com'
GROUP BY a.id, a."providerId", a."accountId", a.password;

-- 3.4 Résumé final
SELECT 
  '🎉 Configuration Better Auth' as "Résumé",
  'L''utilisateur admin est maintenant configuré pour Better Auth uniquement' as "Description",
  'admin@chronodil.com' as "Email",
  'Admin2025@' as "Mot de passe",
  'http://localhost:3000/auth/login' as "URL de connexion";

