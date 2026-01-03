-- SOLUTION COMPLÈTE : Recréer l'utilisateur admin avec la bonne configuration
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- ═══════════════════════════════════════════════════════════════
-- ÉTAPE 1 : NETTOYAGE COMPLET
-- ═══════════════════════════════════════════════════════════════

-- 1.1 Supprimer TOUS les comptes admin
DELETE FROM public."Account"
WHERE "userId" IN (
  SELECT id FROM public."User" WHERE email = 'admin@chronodil.com'
);

-- 1.2 Supprimer les sessions
DELETE FROM public."Session"
WHERE "userId" IN (
  SELECT id FROM public."User" WHERE email = 'admin@chronodil.com'
);

-- 1.3 Supprimer de auth.users si présent (éviter les conflits)
DELETE FROM auth.users WHERE email = 'admin@chronodil.com';

-- 1.4 Désactiver temporairement la protection admin et supprimer l'utilisateur
DO $$
BEGIN
  ALTER TABLE public."User" DISABLE TRIGGER IF EXISTS prevent_admin_deletion_trigger;
  DELETE FROM public."User" WHERE email = 'admin@chronodil.com';
  ALTER TABLE public."User" ENABLE TRIGGER IF EXISTS prevent_admin_deletion_trigger;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- ÉTAPE 2 : RECRÉATION AVEC LA BONNE CONFIGURATION
-- ═══════════════════════════════════════════════════════════════

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
  'admin_final_' || EXTRACT(EPOCH FROM NOW())::TEXT,
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
RETURNING id, email, name, role;

-- 2.2 Créer le compte avec providerId = 'email' (IMPORTANT pour Better Auth)
-- Hash bcrypt pour "Admin2025@"
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
  'account_final_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  u.id,
  'email',  -- ⚠️ IMPORTANT : Better Auth emailAndPassword utilise 'email' comme providerId
  u.email,
  '$2y$10$sfVpf2N1Oocfjs3wxU6x4.fO2.AVH14khBhdR/zruH6cUmNl26Eoy',  -- Hash bcrypt pour "Admin2025@"
  NOW(),
  NOW()
FROM public."User" u
WHERE u.email = 'admin@chronodil.com'
RETURNING id, "providerId", "accountId";

-- ═══════════════════════════════════════════════════════════════
-- ÉTAPE 3 : VÉRIFICATIONS FINALES
-- ═══════════════════════════════════════════════════════════════

-- 3.1 Vérifier l'utilisateur
SELECT 
  '✅ UTILISATEUR CRÉÉ' as status,
  id,
  email,
  name,
  role
FROM public."User"
WHERE email = 'admin@chronodil.com';

-- 3.2 Vérifier le compte
SELECT 
  '✅ COMPTE CRÉÉ' as status,
  a.id,
  a."providerId" as provider_id,
  a."accountId" as account_id,
  LENGTH(a.password) as password_length,
  LEFT(a.password, 10) as hash_preview,
  u.email
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com';

-- 3.3 Vérifier qu'il n'y a PAS d'utilisateur dans auth.users
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PAS DE CONFLIT : Utilisateur uniquement dans Better Auth'
    ELSE '❌ CONFLIT DÉTECTÉ : Utilisateur dans auth.users'
  END as auth_status,
  COUNT(*) as count_in_supabase_auth
FROM auth.users
WHERE email = 'admin@chronodil.com';

-- 3.4 Résumé final
SELECT 
  '🎉 CONFIGURATION COMPLÈTE' as titre,
  'Email: admin@chronodil.com' as email,
  'Mot de passe: Admin2025@' as password,
  'ProviderId: email' as provider,
  'Hash: bcrypt $2y$10$' as hash_type,
  'URL: http://localhost:3000/auth/login' as login_url;

