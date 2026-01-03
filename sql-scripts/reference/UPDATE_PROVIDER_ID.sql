-- Si le problème persiste, essayer de changer le providerId
-- Better Auth avec emailAndPassword peut utiliser différents providerId

-- Option 1 : Mettre à jour vers "email" (utilisé par certaines versions de Better Auth)
UPDATE public."Account"
SET "providerId" = 'email'
WHERE "userId" IN (
  SELECT id FROM public."User" WHERE email = 'admin@chronodil.com'
);

-- Vérification
SELECT 
  a."providerId",
  a."accountId",
  u.email,
  '✅ Provider mis à jour vers "email"' as status
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com';

-- Si cela ne fonctionne toujours pas, essayer "credential"
-- UPDATE public."Account"
-- SET "providerId" = 'credential'
-- WHERE "userId" IN (
--   SELECT id FROM public."User" WHERE email = 'admin@chronodil.com'
-- );

