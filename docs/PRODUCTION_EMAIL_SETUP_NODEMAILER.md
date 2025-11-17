# Configuration Email pour Production - Nodemailer + Gmail

## ✅ Solution Implémentée

Le système d'envoi d'email supporte maintenant **2 méthodes** avec fallback automatique :

1. **Nodemailer** (Gmail ou autre SMTP) - **Priorité 1**
2. **Resend** - Fallback si Nodemailer échoue

---

## 🎯 Option 1 : Gmail (Recommandé - Gratuit, Sans Domaine)

### Étape 1 : Créer un Mot de Passe d'Application Gmail

Google ne permet plus l'utilisation du mot de passe principal. Vous devez créer un **mot de passe d'application**.

#### 1.1 Activer la Validation en 2 Étapes

1. Aller sur https://myaccount.google.com/security
2. Scroll vers "Comment vous connecter à Google"
3. Cliquer sur **"Validation en 2 étapes"**
4. Suivre les instructions pour l'activer (téléphone requis)

#### 1.2 Créer un Mot de Passe d'Application

1. Une fois la 2FA activée, retourner sur https://myaccount.google.com/security
2. Scroll vers **"Validation en 2 étapes"**
3. En bas, cliquer sur **"Mots de passe des applications"**
4. Sélectionner :
   - **App** : Mail
   - **Appareil** : Autre (appareil personnalisé)
   - **Nom** : `Chronodil App`
5. Cliquer sur **"Générer"**
6. **Copier le mot de passe** (16 caractères, ex: `abcd efgh ijkl mnop`)

---

### Étape 2 : Configurer les Variables d'Environnement

Ajouter dans `.env` et `.env.production` :

```env
# ============================================
# Email Configuration - Nodemailer + Gmail
# ============================================

# Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=Chronodil <votre-email@gmail.com>

# Resend (Fallback - optionnel)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Chronodil <noreply@chronodil.app>
```

**Important** : Remplacer :
- `votre-email@gmail.com` par votre vraie adresse Gmail
- `abcd efgh ijkl mnop` par le mot de passe d'application copié (sans espaces)

---

### Étape 3 : Tester l'Envoi

```bash
# Redémarrer le serveur dev
pnpm dev

# Aller sur http://localhost:3000/auth/forgot-password
# Entrer un email de test
# Vérifier la console serveur ET votre boîte Gmail
```

**Résultat attendu** :
```
================================================================================
📧 EMAIL ENVOYÉ (MODE DÉVELOPPEMENT)
================================================================================
À: test@example.com

🔗 LIEN DE RÉINITIALISATION:
http://localhost:3000/auth/reset-password?token=...
================================================================================
✅ Email envoyé avec succès via Nodemailer: <message-id@gmail.com>
```

**Et vous recevrez un vrai email dans votre boîte Gmail** ! 📧

---

## 🔄 Option 2 : Outlook/Hotmail (Gratuit, Sans Domaine)

### Configuration Outlook

```env
# Outlook/Hotmail SMTP
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre-email@outlook.com
EMAIL_PASS=votre-mot-de-passe
EMAIL_FROM=Chronodil <votre-email@outlook.com>
```

**Note** : Outlook/Hotmail accepte le mot de passe principal (pas besoin de mot de passe d'application).

---

## 🏢 Option 3 : SMTP d'Entreprise

Si votre entreprise a un serveur SMTP :

```env
# SMTP Entreprise
EMAIL_HOST=smtp.entreprise.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@entreprise.com
EMAIL_PASS=mot-de-passe-smtp
EMAIL_FROM=Chronodil <noreply@entreprise.com>
```

**Demander à votre service IT** :
- Nom d'hôte SMTP (`EMAIL_HOST`)
- Port (`EMAIL_PORT` : généralement 587 ou 465)
- Utilise SSL ? (`EMAIL_SECURE` : true pour 465, false pour 587)
- Identifiants SMTP

---

## 🚀 Déploiement Vercel

### Ajouter les Variables d'Environnement

1. Aller sur https://vercel.com/dashboard
2. Sélectionner votre projet **Chronodil**
3. Settings → Environment Variables
4. Ajouter **une par une** :

```
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_SECURE = false
EMAIL_USER = votre-email@gmail.com
EMAIL_PASS = abcd efgh ijkl mnop
EMAIL_FROM = Chronodil <votre-email@gmail.com>
```

5. Sélectionner **Production**, **Preview**, et **Development**
6. Cliquer **Save**
7. **Redéployer** l'application :
   ```bash
   git push origin main
   ```

---

## 🔍 Priorité d'Envoi

Le système essaie dans cet ordre :

1. **Nodemailer** (si `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` configurés)
2. **Resend** (si `RESEND_API_KEY` configurée)
3. **Console logs** (si rien n'est configuré, en développement uniquement)

---

## 🛠️ Troubleshooting

### Problème 1 : "Invalid login" Gmail

**Cause** : Validation en 2 étapes pas activée ou mot de passe principal utilisé

**Solution** :
1. Activer la validation en 2 étapes
2. Créer un mot de passe d'application
3. Utiliser le mot de passe d'application (PAS le mot de passe principal)

---

### Problème 2 : "Connection timeout"

**Cause** : Port bloqué par un pare-feu

**Solution** :
```env
# Essayer le port 465 avec SSL
EMAIL_PORT=465
EMAIL_SECURE=true
```

---

### Problème 3 : "Authentication failed" Outlook

**Cause** : Outlook peut bloquer les "applications moins sécurisées"

**Solution** :
1. Aller sur https://account.live.com/activity
2. Autoriser les "applications moins sécurisées"
3. Ou créer un mot de passe d'application Outlook

---

### Problème 4 : Email envoyé mais pas reçu

**Vérifier** :
1. Dossier Spam/Promotions
2. Logs serveur pour confirmer l'envoi :
   ```
   ✅ Email envoyé avec succès via Nodemailer: <message-id>
   ```
3. Vérifier que `EMAIL_FROM` correspond à `EMAIL_USER`

---

## 📊 Limites Quotidiennes

| Service | Limite Gratuite | Notes |
|---------|-----------------|-------|
| **Gmail** | 500 emails/jour | Largement suffisant |
| **Outlook** | 300 emails/jour | Adapté pour la prod |
| **Resend** | 3000 emails/mois (100/jour) | Nécessite domaine vérifié |
| **SendGrid** | 100 emails/jour | Alternative gratuite |

---

## ✅ Avantages Nodemailer + Gmail

✅ **Gratuit** - Aucun coût
✅ **Pas de domaine requis** - Fonctionne avec `@gmail.com`
✅ **Fiable** - Infrastructure Google
✅ **Rapide à configurer** - 5 minutes
✅ **500 emails/jour** - Suffisant pour la plupart des apps
✅ **Fallback automatique** - Vers Resend si Gmail échoue

---

## 🎯 Comparaison des Solutions

| Critère | Nodemailer + Gmail | Resend | SendGrid |
|---------|-------------------|--------|----------|
| **Coût** | Gratuit | Gratuit (100/jour) | Gratuit (100/jour) |
| **Domaine requis** | ❌ Non | ✅ Oui (SPF/DKIM) | ✅ Oui (recommandé) |
| **Configuration** | 5 min | 30 min + DNS | 30 min + DNS |
| **Fiabilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Limite** | 500/jour | 3000/mois | 100/jour |
| **Email FROM** | `@gmail.com` | `@chronodil.com` | `@chronodil.com` |

**Recommandation** : **Nodemailer + Gmail** pour la production sans domaine personnalisé.

---

## 📝 Exemple de Configuration Complète

**`.env.production`** :
```env
# ============================================
# Email Configuration - Production
# ============================================

# Gmail SMTP (Priorité 1)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=chronodil.app@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=Chronodil <chronodil.app@gmail.com>

# Resend (Fallback - optionnel)
RESEND_API_KEY=re_gkmdHcJp_9gUbYuZ9Ewuxx8L6aVrtbNEY
RESEND_FROM_EMAIL=Chronodil <noreply@chronodil.app>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ipghppjjhjbkhuqzqzyq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://chronodil-app.vercel.app

# App
NEXT_PUBLIC_APP_URL=https://chronodil-app.vercel.app
NODE_ENV=production
```

---

## 🎬 Conclusion

Avec **Nodemailer + Gmail**, vous avez :
- ✅ Une solution **gratuite** et **fiable**
- ✅ Pas besoin de domaine personnalisé
- ✅ Configuration en **5 minutes**
- ✅ **Fallback automatique** vers Resend si nécessaire
- ✅ **500 emails/jour** (largement suffisant)

**Prêt pour la production** ! 🚀

---

**Documentation créée le** : 2025-11-13
**Version** : 1.0
**Auteur** : Claude Code (Assistant IA)
