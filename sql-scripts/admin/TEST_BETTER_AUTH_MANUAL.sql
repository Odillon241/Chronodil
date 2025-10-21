-- Test : Vérifier exactement ce que Better Auth cherche

-- Better Auth avec emailAndPassword cherche dans la table Account
-- avec les critères suivants :

-- 1. Afficher EXACTEMENT ce que Better Auth voit
SELECT 
  'CE QUE BETTER AUTH VOIT' as info,
  u.id as user_id,
  u.email as user_email,
  u.name as user_name,
  u."emailVerified" as email_verified,
  a.id as account_id,
  a."providerId" as provider_id,
  a."accountId" as account_id_field,
  a.password IS NOT NULL as has_password,
  LENGTH(a.password) as password_length,
  LEFT(a.password, 15) as password_preview
FROM public."User" u
LEFT JOIN public."Account" a ON a."userId" = u.id
WHERE u.email = 'admin@chronodil.com';

-- 2. Vérifier si le compte existe EXACTEMENT comme Better Auth le cherche
-- Better Auth avec emailAndPassword cherche :
--   - providerId = 'email'
--   - accountId = l'email de l'utilisateur
SELECT 
  'RECHERCHE BETTER AUTH' as info,
  COUNT(*) as found,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Compte trouvé'
    WHEN COUNT(*) = 0 THEN '❌ Compte NON trouvé'
    ELSE '⚠️ Plusieurs comptes (' || COUNT(*) || ')'
  END as status
FROM public."Account"
WHERE "providerId" = 'email'
  AND "accountId" = 'admin@chronodil.com';

-- 3. Essayer avec un nouveau compte test pour comparer
-- Créer un utilisateur test
INSERT INTO public."User" (
  id, email, name, role, "emailVerified", 
  "createdAt", "updatedAt", "weeklyGoal",
  "enableTimesheetReminders", "reminderDays", "reminderTime",
  "desktopNotificationsEnabled", "emailNotificationsEnabled",
  "notificationSoundEnabled", "notificationSoundType", "notificationSoundVolume",
  "darkModeEnabled", "accentColor", "viewDensity", "fontSize",
  "language", "dateFormat", "hourFormat", "timezone",
  "highContrast", "screenReaderMode", "reduceMotion"
)
VALUES (
  'test_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'test@test.com',
  'Test User',
  'EMPLOYEE',
  true,
  NOW(), NOW(), 40,
  true, ARRAY[]::TEXT[], '17:00',
  true, true, true, 'default', 0.7,
  true, 'rusty-red', 'normal', 16,
  'fr', 'DD/MM/YYYY', '24', 'Africa/Libreville',
  false, false, false
)
ON CONFLICT (email) DO NOTHING
RETURNING id, email;

-- Créer le compte test avec le MÊME hash
INSERT INTO public."Account" (
  id, "userId", "providerId", "accountId", password,
  "createdAt", "updatedAt"
)
SELECT
  'account_test_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  u.id,
  'email',
  'test@test.com',
  '$2y$10$sfVpf2N1Oocfjs3wxU6x4.fO2.AVH14khBhdR/zruH6cUmNl26Eoy',
  NOW(), NOW()
FROM public."User" u
WHERE u.email = 'test@test.com'
ON CONFLICT ("providerId", "accountId") DO NOTHING
RETURNING id, "providerId", "accountId";

-- Vérifier la différence entre les deux comptes
SELECT 
  'COMPARAISON' as info,
  u.email,
  u.name,
  u.role,
  a."providerId",
  a."accountId",
  LENGTH(a.password) as pwd_len,
  LEFT(a.password, 15) as pwd_start,
  a."createdAt"
FROM public."User" u
JOIN public."Account" a ON a."userId" = u.id
WHERE u.email IN ('admin@chronodil.com', 'test@test.com')
ORDER BY u.email;

