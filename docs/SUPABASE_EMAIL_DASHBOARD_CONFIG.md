# Configuration Email Supabase - Guide Complet (Sans Domaine Personnalisé)

## 🎯 Objectif
Configurer Supabase pour envoyer des emails de réinitialisation de mot de passe en utilisant le **service email intégré** (pas besoin de domaine personnalisé comme avec Resend).

---

## ⚠️ Pourquoi PAS Resend ?
**Problème** : Resend nécessite un domaine vérifié avec DNS records (SPF, DKIM). Avec `chronodil-app.vercel.app`, vous ne pouvez pas configurer ces records.

**Solution** : Utiliser le service email par défaut de Supabase qui fonctionne sans domaine personnalisé.

---

## 📋 Configuration Dashboard - Étape par Étape

### Étape 1 : Accéder aux Paramètres Auth

1. **Ouvrir le dashboard Supabase** :
   ```
   https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq
   ```

2. **Menu latéral gauche** → Cliquer sur **"Authentication"**

3. **Sous-menu** → Cliquer sur **"Settings"**

   Ou directement :
   ```
   https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/settings/auth
   ```

---

### Étape 2 : Configuration Email de Base

Dans la section **"General settings"** (ou "Auth Settings") :

#### 2.1 Site URL
```
Field: Site URL
Value: https://chronodil-app.vercel.app
```

> ✅ **Essentiel** : C'est l'URL de base pour tous les liens de réinitialisation

---

#### 2.2 Redirect URLs
```
Field: Redirect URLs
Values (une par ligne):
  http://localhost:3000/**
  https://chronodil-app.vercel.app/**
```

> ℹ️ Le wildcard `**` permet toutes les sous-routes (ex: `/auth/reset-password`)

---

#### 2.3 Email Confirmations
```
Toggle: Enable email confirmations
Status: ✅ ACTIVÉ (coché)
```

> ⚠️ **CRITIQUE** : Si désactivé, aucun email ne sera envoyé !

---

### Étape 3 : Configuration SMTP (À NE PAS FAIRE)

Dans la section **"SMTP Settings"** :

```
Toggle: Enable Custom SMTP
Status: ❌ DÉSACTIVÉ (non coché)
```

> ✅ **Laisser désactivé** pour utiliser le service email intégré de Supabase

**Si activé par erreur** :
- Cliquer sur le toggle pour désactiver
- Sauvegarder les changements

---

### Étape 4 : Configurer le Template Email

1. **Menu latéral** → **"Authentication"** → **"Email Templates"**

   Ou directement :
   ```
   https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/auth/templates
   ```

2. **Sélectionner le template** : **"Reset Password"** (ou "Confirm Recovery")

3. **Remplacer le contenu HTML** par le template Chronodil :

   **📂 Source** : `docs/EMAIL_TEMPLATE_RESET_PASSWORD.html`

   **Copier tout le contenu** et coller dans l'éditeur Supabase

4. **Configurer le Subject** :
   ```
   Réinitialisation de votre mot de passe Chronodil
   ```

5. **Cliquer sur "Save"** (Sauvegarder)

---

### Étape 5 : Configuration Rate Limiting (Recommandé)

Dans **"Settings" → "Auth"**, section **"Rate Limits"** :

```
Email rate limit: 3 emails per hour per IP
Password reset limit: 5 attempts per hour per IP
```

> 🔒 **Sécurité** : Empêche les abus et le spam

---

 ## ✅ Vérification de la Configuration

### Checklist de Validation

Vérifiez que TOUS ces paramètres sont corrects :

- [ ] **Site URL** = `https://chronodil-app.vercel.app`
- [ ] **Redirect URLs** contient :
  - `http://localhost:3000/**`
  - `https://chronodil-app.vercel.app/**`
- [ ] **Enable email confirmations** = ✅ ACTIVÉ
- [ ] **Enable Custom SMTP** = ❌ DÉSACTIVÉ
- [ ] **Email Template "Reset Password"** = Personnalisé avec branding Chronodil
- [ ] **Subject** = "Réinitialisation de votre mot de passe Chronodil"

---

## 🧪 Test de la Configuration

### Test 1 : Envoi Email Depuis l'Application

1. **Ouvrir** : http://localhost:3000/auth/forgot-password

2. **Entrer une adresse email valide** (créée via `/auth/register`)

3. **Cliquer** : "Envoyer le lien de réinitialisation"

4. **Vérifier** :
   - Message "Email envoyé! Vérifiez votre boîte de réception."
   - Pas d'erreur dans la console (F12)
   - Pas d'erreur dans les logs du serveur dev

5. **Consulter l'email** :
   - Boîte de réception
   - **⚠️ Vérifier le dossier SPAM**
   - Délai : 1-5 minutes

---

### Test 2 : Vérifier les Logs Supabase

Si aucun email reçu :

1. **Dashboard Supabase** → **"Logs"** → **"Auth Logs"**

   ```
   https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/logs/auth-logs
   ```

2. **Chercher** :
   - Événement `"password_recovery"`
   - Status : `"success"` ou `"error"`
   - Message d'erreur si échec

3. **Erreurs fréquentes** :
   - `Email not enabled` → Activer "Enable email confirmations"
   - `Invalid redirect URL` → Vérifier Redirect URLs
   - `Rate limit exceeded` → Attendre 1 heure ou augmenter le limit

---

## 🚨 Troubleshooting

### Problème 1 : Aucun Email Reçu

**Diagnostic** :
```
✅ Message "Email envoyé" affiché
❌ Aucun email dans boîte de réception/spam
```

**Solutions** :
1. Vérifier que "Enable email confirmations" est **ACTIVÉ**
2. Vérifier les logs Auth : Dashboard → Logs → Auth Logs
3. Vérifier que l'email existe dans la base de données :
   ```sql
   SELECT email, email_confirmed_at
   FROM auth.users
   WHERE email = 'votre-email@example.com';
   ```
4. Attendre 5-10 minutes (délai possible)
5. Vérifier le dossier spam/promotions

---

### Problème 2 : Erreur "Invalid Redirect URL"

**Symptôme** : Email reçu mais le lien ne fonctionne pas

**Solution** :
1. Ajouter l'URL exacte dans "Redirect URLs" :
   ```
   http://localhost:3000/auth/reset-password
   https://chronodil-app.vercel.app/auth/reset-password
   ```
2. **OU** utiliser le wildcard :
   ```
   http://localhost:3000/**
   https://chronodil-app.vercel.app/**
   ```

---

### Problème 3 : Lien "Token Expired" Immédiatement

**Symptôme** : Le lien redirige mais affiche "Lien invalide"

**Causes** :
1. Token déjà utilisé (les tokens sont à usage unique)
2. Token expiré (durée de vie : 1 heure par défaut)
3. Problème de session

**Solutions** :
1. Demander un nouveau lien
2. Vérifier la date/heure du serveur
3. Vérifier les cookies du navigateur (ne pas être en navigation privée)

---

### Problème 4 : Email en Spam

**Pourquoi ?** :
- Le service email par défaut de Supabase utilise `noreply@mail.supabase.io`
- Certains filtres anti-spam marquent ces emails comme suspects

**Solutions** :
1. **Marquer comme "Pas spam"** dans votre client email
2. **Ajouter à la liste blanche** : `noreply@mail.supabase.io`
3. **Pour éviter en production** : Acheter un domaine personnalisé et configurer Resend

---

## 📊 Limites du Service Email Gratuit Supabase

### Quotas Par Défaut

| Type | Limite | Notes |
|------|--------|-------|
| Emails/heure/IP | 3-4 | Rate limiting automatique |
| Emails/jour (total) | ~100-150 | Pour plan gratuit |
| Délai d'envoi | 1-5 min | Peut être plus long aux heures de pointe |

### Recommandations

**Développement** :
- ✅ Le service par défaut suffit amplement

**Production (petite échelle)** :
- ✅ Acceptable pour 100-200 utilisateurs
- ⚠️ Emails peuvent aller en spam

**Production (grande échelle)** :
- ❌ Acheter un domaine personnalisé (ex: `chronodil.com`)
- ❌ Configurer Resend avec DNS records (SPF, DKIM)
- ❌ Ou utiliser SendGrid, Mailgun, etc.

---

## 🎯 Alternative Future : Domaine Personnalisé

Quand vous aurez un domaine (ex: `chronodil.com`) :

### Option A : Resend + Domaine Personnalisé

**Avantages** :
- Emails professionnels (`noreply@chronodil.com`)
- Moins de spam
- Meilleure délivrabilité
- Tracking des emails

**Configuration** :
1. Acheter domaine sur Namecheap, Google Domains, etc.
2. Configurer DNS records dans Resend
3. Vérifier le domaine (SPF, DKIM, DMARC)
4. Activer Custom SMTP dans Supabase
5. Configurer avec Resend SMTP

**Coût** :
- Domaine : ~10-15€/an
- Resend : Gratuit jusqu'à 3000 emails/mois

---

### Option B : Supabase Email (Upgrade Plan)

**Plan Pro Supabase** :
- 50,000 emails/mois inclus
- Meilleure délivrabilité
- Support prioritaire

**Coût** :
- ~25$/mois

---

## 📝 Résumé de Configuration

### Configuration Actuelle (Sans Domaine)

```yaml
Service Email: Supabase Default (gratuit)
From Email: noreply@mail.supabase.io
Site URL: https://chronodil-app.vercel.app
Redirect URLs:
  - http://localhost:3000/**
  - https://chronodil-app.vercel.app/**
Email Confirmations: Activé
Custom SMTP: Désactivé
Template: Personnalisé Chronodil
```

### Variables Environnement (Aucun Changement)

```env
# Supabase (OK)
NEXT_PUBLIC_SUPABASE_URL=https://ipghppjjhjbkhuqzqzyq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Resend (NON UTILISÉ pour l'instant)
RESEND_API_KEY=re_gkmdHcJp_9gUbYuZ9Ewuxx8L6aVrtbNEY
RESEND_FROM_EMAIL=Chronodil <noreply@chronodil.app>
```

> ℹ️ Les variables Resend sont conservées pour usage futur avec domaine personnalisé

---

## ✅ Action Immédiate Requise

1. **Aller sur** : https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/settings/auth

2. **Vérifier/Modifier** :
   - ✅ Site URL = `https://chronodil-app.vercel.app`
   - ✅ Redirect URLs contient `http://localhost:3000/**` et `https://chronodil-app.vercel.app/**`
   - ✅ Enable email confirmations = **ACTIVÉ**
   - ✅ Enable Custom SMTP = **DÉSACTIVÉ**

3. **Aller sur** : https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/auth/templates

4. **Personnaliser le template "Reset Password"** avec le contenu de `docs/EMAIL_TEMPLATE_RESET_PASSWORD.html`

5. **Tester** : http://localhost:3000/auth/forgot-password

---

## 📞 Support

Si problème après configuration :
1. Vérifier Auth Logs : Dashboard → Logs → Auth Logs
2. Vérifier Edge Logs : Dashboard → Logs → Edge Logs
3. Consulter : `docs/SUPABASE_AUTH_VERIFICATION_REPORT.md`

---

**Dernière mise à jour** : 2025-11-13
**Version** : 2.0 (Service Email Supabase par défaut)
