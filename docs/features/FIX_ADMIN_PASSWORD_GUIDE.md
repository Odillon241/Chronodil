# 🔐 Fix : Hash du Mot de Passe Admin

## 🐛 Problème

```
BetterAuthError: Invalid password hash
```

**Cause** : Le mot de passe admin n'est pas hashé dans le bon format attendu par Better Auth (bcrypt avec @node-rs/bcrypt).

---

## ✅ Solution : Mettre à jour le hash bcrypt

### Étape 1 : Exécuter le Script SQL

1. **Ouvrez le fichier** `FIX_ADMIN_PASSWORD.sql`
2. **Sélectionnez TOUT le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)
4. **Allez sur le SQL Editor Supabase** :
   👉 https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/sql/new
5. **Collez le script** (Ctrl+V)
6. **Exécutez** (RUN ou F5)

### Étape 2 : Vérifier le Résultat

Le script va :
1. ✅ Afficher l'utilisateur admin actuel
2. ✅ Supprimer l'ancien compte avec le mauvais hash
3. ✅ Créer un nouveau compte avec le hash bcrypt correct
4. ✅ Afficher la vérification finale

Vous devriez voir dans les résultats :
```
email: admin@chronodil.com
providerId: credential
password_length: 60  (longueur standard bcrypt)
hash_prefix: $2y$10$  (format bcrypt)
```

### Étape 3 : Tester la Connexion

1. Allez sur http://localhost:3000/auth/login
2. Connectez-vous avec :
   - **Email** : `admin@chronodil.com`
   - **Mot de passe** : `Admin2025@`
3. ✅ La connexion devrait fonctionner !

---

## 🔍 Détails Techniques

### Hash Généré
```
$2y$10$sfVpf2N1Oocfjs3wxU6x4.fO2.AVH14khBhdR/zruH6cUmNl26Eoy
```

### Paramètres
- **Algorithme** : bcrypt
- **Rounds** : 10 (standard)
- **Bibliothèque** : @node-rs/bcrypt (utilisée par Better Auth)
- **Mot de passe** : `Admin2025@`

### Format bcrypt
```
$2y$10$<salt 22 chars><hash 31 chars>
│  │  │  │
│  │  │  └─ Hash (31 caractères)
│  │  └──── Salt (22 caractères)
│  └─────── Nombre de rounds (10)
└────────── Identifiant bcrypt ($2y$)
```

---

## 🔄 Alternative : Script Manuel

Si vous préférez mettre à jour manuellement, voici le SQL complet :

```sql
-- Supprimer l'ancien compte
DELETE FROM public."Account"
WHERE "userId" IN (
  SELECT id FROM public."User" WHERE email = 'admin@chronodil.com'
);

-- Créer le nouveau compte avec le bon hash
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
  'account_admin_fixed',
  u.id,
  'credential',
  u.email,
  '$2y$10$sfVpf2N1Oocfjs3wxU6x4.fO2.AVH14khBhdR/zruH6cUmNl26Eoy',
  NOW(),
  NOW()
FROM public."User" u
WHERE u.email = 'admin@chronodil.com';
```

---

## ❓ Pourquoi ce problème ?

Better Auth utilise `@node-rs/bcrypt` pour hasher et vérifier les mots de passe. Le hash doit être :
- Au format bcrypt standard (60 caractères)
- Préfixé par `$2y$10$` ou `$2a$10$`
- Généré avec au moins 10 rounds

Si le mot de passe a été créé avec une autre méthode ou bibliothèque, le format peut être incompatible.

---

## ✅ Vérification Finale

Après exécution du script, vérifiez dans le SQL Editor :

```sql
SELECT 
  u.email,
  a."providerId",
  LENGTH(a.password) as password_length,
  LEFT(a.password, 7) as hash_format
FROM public."User" u
JOIN public."Account" a ON a."userId" = u.id
WHERE u.email = 'admin@chronodil.com';
```

**Résultat attendu** :
```
email: admin@chronodil.com
providerId: credential
password_length: 60
hash_format: $2y$10$
```

✅ Si vous voyez ces valeurs, le hash est correct !

---

## 🎉 Après la Correction

Une fois le hash corrigé :
1. ✅ La connexion fonctionne
2. ✅ L'erreur "Invalid password hash" disparaît
3. ✅ L'application est complètement opérationnelle

**Vous pouvez ensuite supprimer les fichiers temporaires** :
- `FIX_ADMIN_PASSWORD.sql`
- `scripts/fix-admin-password.ts`
- `scripts/generate-bcrypt-hash.ts`

---

**Date** : 21 octobre 2025  
**Mot de passe** : `Admin2025@`  
**Hash bcrypt** : `$2y$10$sfVpf2N1Oocfjs3wxU6x4.fO2.AVH14khBhdR/zruH6cUmNl26Eoy`

