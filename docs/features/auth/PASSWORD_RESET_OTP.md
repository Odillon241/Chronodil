# Réinitialisation de mot de passe par OTP

## Vue d'ensemble

Le système de réinitialisation de mot de passe utilise un code OTP (One-Time Password) à **8 chiffres** envoyé par email au lieu d'un lien magique.

## Flux utilisateur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  1. /auth/forgot-password     2. Email reçu        3. /auth/verify-otp     │
│  ┌─────────────────────┐      ┌───────────────┐    ┌─────────────────────┐ │
│  │ Entrer email        │ ───▶ │ Code: 123456  │ ──▶│ Entrer le code OTP │ │
│  └─────────────────────┘      └───────────────┘    └─────────────────────┘ │
│                                                              │              │
│                                                              ▼              │
│  5. /auth/login              4. /auth/reset-password                       │
│  ┌─────────────────────┐     ┌─────────────────────┐                       │
│  │ Connexion réussie   │ ◀── │ Nouveau mot de passe│                       │
│  └─────────────────────┘     └─────────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Configuration Supabase

### 1. Template Email - Reset Password

Allez dans **Supabase Dashboard** → **Authentication** → **Emails** → **Reset password**

Remplacez le contenu du **Body** par :

```html
<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="font-family: 'Inter', sans-serif; color: #16a34a; margin-bottom: 24px;">Réinitialisation de mot de passe</h2>

  <p style="font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.6;">Bonjour,</p>

  <p style="font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.6;">Vous avez demandé à réinitialiser votre mot de passe sur <strong>Chronodil</strong>.</p>

  <p style="font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.6;">Votre code de vérification est :</p>

  <div style="background-color: #f4f4f4; padding: 24px; text-align: center; margin: 24px 0; border-radius: 12px; border: 1px solid #e5e5e5;">
    <h1 style="font-family: 'Inter', monospace; font-size: 36px; letter-spacing: 10px; margin: 0; color: #16a34a; font-weight: 700;">{{ .Token }}</h1>
  </div>

  <p style="font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.6;">Ce code est valide pendant <strong>1 heure</strong>.</p>

  <p style="font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: #666;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>

  <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;" />

  <p style="font-family: 'Inter', sans-serif; color: #888; font-size: 12px; text-align: center;">
    Cet email a été envoyé automatiquement par Chronodil.<br />
    © 2026 ODILLON - Tous droits réservés
  </p>
</div>
```

### 2. Subject (Objet)

```
Votre code de réinitialisation Chronodil
```

### 3. Variables disponibles

| Variable | Description |
|----------|-------------|
| `{{ .Token }}` | Code OTP à 6 chiffres (utilisé ici) |
| `{{ .ConfirmationURL }}` | Lien magique (non utilisé dans ce flux) |
| `{{ .TokenHash }}` | Hash du token |
| `{{ .SiteURL }}` | URL du site |
| `{{ .Email }}` | Email de l'utilisateur |
| `{{ .RedirectTo }}` | URL de redirection |

### 4. Paramètres recommandés

Dans **Authentication** → **Providers** → **Email** :

- **Enable email confirmations** : Activé
- **Double confirm email changes** : Activé
- **Secure email change** : Activé
- **OTP Expiry** : 3600 (1 heure)
- **Min message rate limit** : 60 (1 email par minute max)

## Architecture technique

### Pages créées

| Route | Description |
|-------|-------------|
| `/auth/forgot-password` | Formulaire pour entrer l'email |
| `/auth/verify-otp` | Formulaire pour entrer le code OTP |
| `/auth/reset-password` | Formulaire pour le nouveau mot de passe |

### Composants

- `src/app/auth/forgot-password/page.tsx` - Demande d'email
- `src/app/auth/verify-otp/page.tsx` - Vérification OTP
- `src/app/auth/reset-password/page.tsx` - Nouveau mot de passe
- `src/components/auth/*` - Composants partagés

### Fonctions auth-client.ts

```typescript
// Demander un code OTP par email
resetPassword(email: string)

// Vérifier le code OTP
verifyOtpForRecovery(email: string, token: string)

// Mettre à jour le mot de passe (après vérification)
updatePassword(newPassword: string)
```

### API Routes

- `POST /api/auth/forgot-password` - Envoie le code OTP par email

## Sécurité

1. **Expiration** : Les codes OTP expirent après 1 heure
2. **Rate limiting** : Maximum 1 email par minute par utilisateur
3. **Brute force** : Après plusieurs tentatives échouées, le code est invalidé
4. **Session temporaire** : La session créée après vérification OTP est uniquement pour la réinitialisation
5. **Déconnexion automatique** : Après changement de mot de passe, l'utilisateur doit se reconnecter

## Test du flux

1. Aller sur `/auth/forgot-password`
2. Entrer un email valide
3. Vérifier la boîte de réception
4. Copier le code à 6 chiffres
5. L'entrer sur `/auth/verify-otp`
6. Définir un nouveau mot de passe sur `/auth/reset-password`
7. Se connecter avec le nouveau mot de passe

## Dépannage

### "Code invalide ou expiré"

- Le code a expiré (> 1 heure)
- Le code a déjà été utilisé
- Erreur de frappe dans le code

**Solution** : Demander un nouveau code

### "Email non trouvé"

- L'email n'est pas associé à un compte

**Solution** : Vérifier l'orthographe ou créer un compte

### Le code n'arrive pas

- Vérifier les spams/indésirables
- Attendre 1 minute entre chaque demande (rate limiting)
- Vérifier les logs Supabase : **Dashboard** → **Logs** → **Auth**
