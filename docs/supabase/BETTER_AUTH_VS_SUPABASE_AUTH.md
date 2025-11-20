# 🔍 Better Auth vs Supabase Auth : Comprendre la Différence

## ⚠️ Problème Identifié

Votre application utilise **Better Auth**, mais l'utilisateur admin a peut-être été créé dans **Supabase Auth** par erreur. Ces deux systèmes sont **incompatibles** et utilisent des formats de hash différents.

---

## 📊 Différences Clés

### Better Auth (ce que vous utilisez)
```
Tables utilisées:
- public.User        ← Stocke les utilisateurs
- public.Account     ← Stocke les identifiants (email/password)
- public.Session     ← Stocke les sessions

Hash de mot de passe:
- Algorithme: bcrypt
- Bibliothèque: @node-rs/bcrypt
- Format: $2y$10$... ou $2a$10$... (60 caractères)
```

### Supabase Auth (à NE PAS utiliser)
```
Tables utilisées:
- auth.users         ← Système d'authentification Supabase
- auth.sessions      ← Sessions Supabase

Hash de mot de passe:
- Algorithme: Propriétaire Supabase (basé sur postgres)
- Format: Différent de bcrypt
- INCOMPATIBLE avec Better Auth
```

---

## 🐛 Source du Problème

L'erreur `Invalid password hash` survient quand :

1. ❌ L'utilisateur existe dans `auth.users` (Supabase Auth)
2. ❌ Le mot de passe est hashé avec l'algorithme Supabase
3. ❌ Better Auth essaie de vérifier le hash avec bcrypt
4. 💥 **INCOMPATIBILITÉ** → Erreur "Invalid password hash"

---

## ✅ Solution : Diagnostic puis Correction

### Étape 1 : Diagnostic

**Exécutez** `DIAGNOSE_USER.sql` dans le SQL Editor Supabase pour savoir où est l'utilisateur :

```
👉 https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/sql/new
```

Le script va vous montrer :
- ✅ Si l'utilisateur est dans `auth.users` (Supabase Auth) → **À SUPPRIMER**
- ✅ Si l'utilisateur est dans `public.User` (Better Auth) → **OK**
- ✅ Si le compte existe dans `public.Account` → **OK**
- ✅ Format du hash de mot de passe

### Étape 2 : Correction

**Exécutez** `FIX_USER_LOCATION.sql` pour :
1. Nettoyer complètement l'utilisateur (auth.users ET public.User)
2. Recréer l'utilisateur UNIQUEMENT dans Better Auth (public.User + public.Account)
3. Avec le hash bcrypt correct : `$2y$10$sfVpf2N1Oocfjs3wxU6x4.fO2.AVH14khBhdR/zruH6cUmNl26Eoy`

---

## 📋 Règles à Suivre

### ✅ Pour Better Auth (votre configuration)

```
CRÉER UN UTILISATEUR :
1. Insérer dans public."User"
2. Insérer dans public."Account" avec hash bcrypt
3. NE PAS toucher à auth.users

HASH DU MOT DE PASSE :
- Utiliser bcrypt (rounds=10)
- Généré avec @node-rs/bcrypt
- Format: $2y$10$... (60 caractères)
```

### ❌ À NE PAS FAIRE

```
❌ NE PAS créer d'utilisateur dans auth.users
❌ NE PAS utiliser le Dashboard Supabase > Authentication > Users
❌ NE PAS mélanger Better Auth et Supabase Auth
❌ NE PAS utiliser les API Supabase Auth (signUp, signIn, etc.)
```

---

## 🎯 Architecture Correcte

```
┌─────────────────────────────────────────────────────┐
│         Application CHRONODIL (Next.js 15)          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Authentification: Better Auth                       │
│  ├─ Configuration: src/lib/auth.ts                   │
│  ├─ Client: src/lib/auth-client.ts                   │
│  └─ API Routes: /api/auth/[...all]                   │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Base de Données: Supabase PostgreSQL                │
│  ├─ Tables Better Auth (à utiliser) :                │
│  │  ├─ public.User                                   │
│  │  ├─ public.Account                                │
│  │  └─ public.Session                                │
│  │                                                    │
│  └─ Tables Supabase Auth (à NE PAS utiliser) :       │
│     ├─ auth.users         ← ❌ IGNORER               │
│     └─ auth.sessions      ← ❌ IGNORER               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Création d'Utilisateurs : Méthode Correcte

### Via SQL (méthode manuelle)

```sql
-- 1. Créer l'utilisateur
INSERT INTO public."User" (
  id, email, name, role, "emailVerified", 
  "createdAt", "updatedAt", "weeklyGoal", ...
) VALUES (
  'user_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'user@example.com',
  'Nom Utilisateur',
  'EMPLOYEE',
  true,
  NOW(), NOW(), 40, ...
);

-- 2. Créer le compte avec hash bcrypt
-- (Générer le hash avec : pnpm tsx scripts/generate-bcrypt-hash.ts)
INSERT INTO public."Account" (
  id, "userId", "providerId", "accountId", password,
  "createdAt", "updatedAt"
) VALUES (
  'account_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  (SELECT id FROM public."User" WHERE email = 'user@example.com'),
  'credential',
  'user@example.com',
  '$2y$10$...',  -- Hash bcrypt ici
  NOW(), NOW()
);
```

### Via l'Application (méthode recommandée)

```typescript
// Page d'inscription (/auth/register)
// Better Auth gère automatiquement :
// - Création dans public.User
// - Création dans public.Account
// - Hash bcrypt du mot de passe
// - Validation des données

// Aucun besoin de toucher auth.users
```

---

## 🧪 Tests de Validation

Après avoir exécuté `FIX_USER_LOCATION.sql`, vérifiez :

### Test 1 : Utilisateur n'existe PAS dans auth.users
```sql
SELECT COUNT(*) FROM auth.users WHERE email = 'admin@chronodil.com';
-- Résultat attendu : 0 ✅
```

### Test 2 : Utilisateur existe dans public.User
```sql
SELECT id, email, name, role FROM public."User" WHERE email = 'admin@chronodil.com';
-- Résultat attendu : 1 ligne avec role='ADMIN' ✅
```

### Test 3 : Compte existe avec hash bcrypt
```sql
SELECT 
  "providerId", 
  LENGTH(password) as hash_length,
  LEFT(password, 7) as hash_format
FROM public."Account" a
JOIN public."User" u ON u.id = a."userId"
WHERE u.email = 'admin@chronodil.com';
-- Résultat attendu :
-- providerId: credential
-- hash_length: 60
-- hash_format: $2y$10$ ou $2a$10$
-- ✅
```

### Test 4 : Connexion fonctionne
```
1. Ouvrir http://localhost:3000/auth/login
2. Email: admin@chronodil.com
3. Mot de passe: Admin2025@
4. ✅ Connexion réussie
```

---

## 📚 Fichiers Créés

1. **`DIAGNOSE_USER.sql`** : Diagnostic complet pour voir où est l'utilisateur
2. **`FIX_USER_LOCATION.sql`** : Correction automatique complète
3. **`BETTER_AUTH_VS_SUPABASE_AUTH.md`** : Ce guide explicatif

---

## 🎉 Après Correction

Une fois le script exécuté :
- ✅ Utilisateur créé UNIQUEMENT dans Better Auth
- ✅ Hash bcrypt correct
- ✅ Connexion fonctionnelle
- ✅ Aucune erreur "Invalid password hash"

---

## 🆘 Si le Problème Persiste

1. **Vérifier les logs** : `pnpm dev` dans le terminal
2. **Vérifier la configuration Better Auth** : `src/lib/auth.ts`
3. **Vérifier que Prisma utilise les bonnes tables** : `prisma/schema.prisma`
4. **Régénérer le client Prisma** : `pnpm prisma generate`

---

**Créé le** : 21 octobre 2025  
**Problème** : Confusion Better Auth / Supabase Auth  
**Solution** : Utiliser UNIQUEMENT Better Auth (tables public.*)

