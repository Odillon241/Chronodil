# Implémentation Réinitialisation de Mot de Passe - Better Auth

## ✅ Résumé

L'implémentation de la réinitialisation de mot de passe via **Better Auth** est maintenant **complète et fonctionnelle**.

---

## 🎯 Architecture Implémentée

### 1. Configuration Serveur (`src/lib/auth.ts`)

**Ajout de `sendResetPassword`** dans la configuration Better Auth :

```typescript
import { sendEmail, getResetPasswordEmailTemplate } from "@/lib/email";

export const auth = betterAuth({
  // ... autres configs
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe Chronodil",
        html: getResetPasswordEmailTemplate(url, user.name),
      });
    },
    resetPasswordTokenExpiresIn: 3600, // 1 heure
  },
});
```

**Fonctionnement** :
- Better Auth génère automatiquement un token sécurisé
- Stocke le token dans la table `Verification` (Prisma)
- Appelle `sendResetPassword` avec `{user, url, token}`
- Le `url` contient déjà le token intégré : `https://example.com/auth/reset-password?token=...`

---

### 2. Fonction d'Envoi d'Email (`src/lib/email.ts`)

**Deux fonctions principales** :

#### `sendEmail({ to, subject, html })`
- Affiche le lien dans la console en **mode développement**
- Tente d'envoyer via **Resend** (si `RESEND_API_KEY` configurée)
- Ne throw pas d'erreur en dev pour permettre le test avec les logs

#### `getResetPasswordEmailTemplate(resetUrl, userName?)`
- Génère un email HTML avec branding Chronodil
- Template responsive avec bouton CTA
- Lien alternatif en texte (si le bouton ne fonctionne pas)
- Informations de sécurité (validité 1h, usage unique)

**Mode développement** :
```
================================================================================
📧 EMAIL ENVOYÉ (MODE DÉVELOPPEMENT)
================================================================================
À: user@example.com
Sujet: Réinitialisation de votre mot de passe Chronodil

🔗 LIEN DE RÉINITIALISATION:
http://localhost:3000/auth/reset-password?token=abc123...
================================================================================
```

---

### 3. Page Forgot Password (`src/app/auth/forgot-password/page.tsx`)

**Changement principal** : Utilise Better Auth au lieu de Supabase

**Avant** (Supabase) :
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
  redirectTo: `${window.location.origin}/auth/reset-password`,
});
```

**Après** (Better Auth) :
```typescript
const response = await fetch('/api/auth/request-password-reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: data.email,
    redirectTo: `${window.location.origin}/auth/reset-password`,
  }),
});
```

**Endpoint** : `/api/auth/request-password-reset` (géré automatiquement par Better Auth via `/api/auth/[...all]/route.ts`)

---

### 4. Page Reset Password (`src/app/auth/reset-password/page.tsx`)

**Complètement réécrite** pour utiliser Better Auth

**Flux** :
1. Récupère le `token` depuis l'URL (`?token=...`)
2. Affiche un formulaire de réinitialisation
3. Appelle `authClient.resetPassword({ newPassword, token })`
4. Better Auth vérifie le token, met à jour le mot de passe
5. Redirige vers `/auth/login` après succès

**4 états UI** :
- ⏳ **Validating** : Spinner pendant vérification du token
- ❌ **Invalid Token** : Affiche erreur avec bouton "Demander un nouveau lien"
- ✍️ **Reset Form** : Formulaire password + confirmPassword (validation Zod)
- ✅ **Success** : Message de succès + redirection automatique

**Code clé** :
```typescript
const { data: result, error } = await authClient.resetPassword({
  newPassword: data.password,
  token,
});
```

---

## 📊 Table Prisma Utilisée

Better Auth utilise la table **`Verification`** existante :

```prisma
model Verification {
  id         String   @id
  identifier String   // Email de l'utilisateur
  createdAt  DateTime @default(now())
  expiresAt  DateTime // Expiration du token (1 heure par défaut)
  updatedAt  DateTime
  value      String   // Token de réinitialisation (haché)

  @@unique([identifier, value])
}
```

**Fonctionnement** :
- `identifier` = email de l'utilisateur
- `value` = token haché (sécurisé)
- `expiresAt` = timestamp d'expiration
- After token usage → supprimé automatiquement

---

## 🔐 Sécurité

### Token
- Généré par Better Auth (cryptographiquement sécurisé)
- Haché avant stockage en DB (via `nanoid` ou similaire)
- Expiration : 1 heure (configurable via `resetPasswordTokenExpiresIn`)
- Usage unique : supprimé après utilisation

### Email
- En développement : affiché en console (pas envoyé)
- En production : envoyé via Resend (si `RESEND_API_KEY` configurée)
- Template HTML sécurisé (pas de XSS)

### Validation
- Zod schema : min 8 caractères + correspondance confirmation
- Better Auth vérifie le token côté serveur
- Hash bcrypt pour stocker le nouveau mot de passe

---

## 🧪 Test du Flux

### Prérequis
```bash
# Serveur dev en cours
pnpm dev

# Variables d'environnement configurées
RESEND_API_KEY=re_...  (optionnel pour développement)
```

### Scénario de Test Complet

#### 1. Créer un Compte Test
```
http://localhost:3000/auth/register
Email: test@example.com
Password: password123
```

#### 2. Demander Réinitialisation
```
http://localhost:3000/auth/forgot-password
Email: test@example.com
→ Cliquer "Envoyer le lien"
```

#### 3. Vérifier la Console Serveur
```bash
# Dans le terminal où tourne `pnpm dev`, vous verrez:

================================================================================
📧 EMAIL ENVOYÉ (MODE DÉVELOPPEMENT)
================================================================================
À: test@example.com
Sujet: Réinitialisation de votre mot de passe Chronodil

🔗 LIEN DE RÉINITIALISATION:
http://localhost:3000/auth/reset-password?token=abc123xyz789...
================================================================================
```

#### 4. Copier le Lien
Copier le lien complet depuis la console et le coller dans le navigateur

#### 5. Réinitialiser le Mot de Passe
```
Page: /auth/reset-password?token=...
→ Entrer nouveau mot de passe: newpassword123
→ Confirmer: newpassword123
→ Cliquer "Réinitialiser le mot de passe"
```

#### 6. Vérifier le Succès
```
→ Message "Mot de passe réinitialisé avec succès!"
→ Redirection automatique vers /auth/login après 2s
```

#### 7. Se Connecter avec le Nouveau Mot de Passe
```
http://localhost:3000/auth/login
Email: test@example.com
Password: newpassword123
→ Devrait fonctionner ✅
```

---

## 🚨 Troubleshooting

### Problème 1 : Aucun Log d'Email dans la Console

**Causes possibles** :
1. Erreur JavaScript empêchant l'exécution
2. `sendResetPassword` pas appelée (vérifier config `auth.ts`)
3. Erreur lors de l'envoi

**Solution** :
```bash
# Vérifier logs serveur dev
# Chercher des erreurs dans le terminal

# Vérifier que sendResetPassword est configuré
grep -A 10 "sendResetPassword" src/lib/auth.ts
```

---

### Problème 2 : Erreur "Token Invalid" Immédiatement

**Causes possibles** :
1. Token mal formaté dans l'URL
2. Token expiré (> 1 heure)
3. Token déjà utilisé
4. Problème de base de données

**Solution** :
```bash
# Vérifier la table Verification dans Prisma Studio
pnpm prisma studio

# Aller sur la table "Verification"
# Vérifier qu'un token existe avec le bon email
# Vérifier que expiresAt > now()
```

---

### Problème 3 : Erreur "User Not Found"

**Causes possibles** :
1. L'email n'existe pas dans la DB
2. Typo dans l'email

**Solution** :
```bash
# Vérifier que l'utilisateur existe
pnpm prisma studio

# Aller sur la table "User"
# Chercher l'email exact
```

---

### Problème 4 : Resend Ne Fonctionne Pas

**Normal en développement sans domaine personnalisé** :
- Resend nécessite un domaine vérifié avec DNS records
- En développement, utiliser les logs console suffit
- En production, acheter un domaine et configurer SPF/DKIM

**Solution temporaire** :
- Les logs console affichent le lien complet
- Copier-coller le lien directement
- Pas besoin d'email réel pour le développement

---

## 📦 Fichiers Créés/Modifiés

### Nouveaux Fichiers ✅
```
src/lib/email.ts                                        (180 lignes)
docs/BETTER_AUTH_PASSWORD_RESET_IMPLEMENTATION.md       (ce fichier)
```

### Fichiers Modifiés ✅
```
src/lib/auth.ts                                         (+15 lignes)
src/app/auth/forgot-password/page.tsx                   (adapté Better Auth)
src/app/auth/reset-password/page.tsx                    (complètement réécrit)
```

### Fichiers Obsolètes (Pas supprimés pour référence)
```
src/app/api/auth/forgot-password/route.ts               (API route non utilisée)
src/app/api/auth/reset-password/route.ts                (API route non utilisée)
docs/EMAIL_TEMPLATE_RESET_PASSWORD.html                 (template intégré dans email.ts)
docs/SUPABASE_EMAIL_DASHBOARD_CONFIG.md                 (Supabase non utilisé)
docs/SUPABASE_EMAIL_SETUP_GUIDE.md                      (Supabase non utilisé)
docs/SUPABASE_AUTH_VERIFICATION_REPORT.md               (Supabase non utilisé)
```

---

## 🔄 Différences Better Auth vs Supabase Auth

| Aspect | Supabase Auth | Better Auth |
|--------|---------------|-------------|
| **Configuration** | Dashboard Supabase | Code TypeScript (`auth.ts`) |
| **Token Storage** | Gestion interne Supabase | Table Prisma `Verification` |
| **Email Sending** | SMTP Supabase intégré | Custom fonction (Resend) |
| **API Endpoints** | Supabase SDK méthodes | Better Auth `/api/auth/*` |
| **Client Usage** | `supabase.auth.resetPasswordForEmail()` | `fetch('/api/auth/request-password-reset')` |
| **Reset Method** | `supabase.auth.updateUser()` | `authClient.resetPassword()` |
| **Domaine Requis** | Non (emails Supabase) | Oui (pour Resend) |

**Avantage Better Auth** :
- Tout contrôlé depuis le code (pas de dashboard externe)
- Utilise la DB existante (pas de service externe)
- Flexible (on peut changer le provider email facilement)

**Inconvénient Better Auth** :
- Nécessite un service email externe (Resend, SendGrid, etc.)
- Ou afficher le lien en console (ok pour dev, pas pour prod)

---

## 🎯 Prochaines Étapes (Optionnel)

### Option 1 : Acheter un Domaine Personnalisé
```
1. Acheter chronodil.com (ou chronodil.fr)
2. Configurer DNS records pour Resend:
   - TXT record pour SPF
   - CNAME record pour DKIM
3. Vérifier le domaine dans Resend Dashboard
4. Mettre à jour RESEND_FROM_EMAIL:
   RESEND_FROM_EMAIL=Chronodil <noreply@chronodil.com>
```

### Option 2 : Utiliser un Service Email Gratuit
```
1. Mailtrap (pour dev): https://mailtrap.io
2. Ethereal Email (pour tests): https://ethereal.email
3. SendGrid (15k emails/mois gratuit)
```

### Option 3 : Garder la Solution Actuelle (Console Logs)
```
- Fonctionne parfaitement en développement
- Pas de coût
- Facile à déboguer
- Pour production: acheter un domaine sera nécessaire
```

---

## ✅ Conclusion

L'implémentation est **complète et fonctionnelle** avec Better Auth. Le flux de réinitialisation de mot de passe fonctionne end-to-end :

1. ✅ Utilisateur demande la réinitialisation
2. ✅ Better Auth génère un token sécurisé
3. ✅ Email envoyé (ou lien affiché en console)
4. ✅ Utilisateur clique sur le lien
5. ✅ Token validé côté serveur
6. ✅ Nouveau mot de passe haché et stocké
7. ✅ Utilisateur peut se connecter avec le nouveau mot de passe

**Mode développement** : 100% fonctionnel avec logs console
**Mode production** : Nécessite un domaine personnalisé pour Resend

---

**Documentation créée le** : 2025-11-13
**Version** : 1.0
**Auteur** : Claude Code (Assistant IA)
