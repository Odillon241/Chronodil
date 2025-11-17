# Guide de Configuration Email Supabase + Resend

## 🚨 Problème Actuel
**Symptôme** : Aucun email de réinitialisation de mot de passe n'est reçu.

**Cause** : Supabase n'est pas configuré pour envoyer des emails via Resend.

---

## ✅ Solution : Configuration en 3 Étapes

### Étape 1 : Configurer le Provider Email (CRITIQUE)

1. **Aller sur le dashboard Supabase** :
   ```
   https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/settings/auth
   ```

2. **Scroll vers "SMTP Settings"** (ou "Email Provider")

3. **Activer "Enable Custom SMTP"**

4. **Configurer avec Resend** :
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587 (ou 465 pour SSL)
   SMTP Username: resend
   SMTP Password: re_gkmdHcJp_9gUbYuZ9Ewuxx8L6aVrtbNEY
   Sender Email: noreply@chronodil.app
   Sender Name: Chronodil
   ```

5. **Sauvegarder les changements**

6. **Tester la configuration** :
   - Cliquer sur "Send Test Email" si disponible
   - Ou réessayer le flux de réinitialisation

---

### Étape 2 : Configurer les Redirect URLs

1. **Aller sur** :
   ```
   https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/auth/url-configuration
   ```

2. **Dans "Redirect URLs", ajouter** :
   ```
   http://localhost:3000/auth/reset-password
   https://chronodil-app.vercel.app/auth/reset-password
   ```

3. **Sauvegarder**

---

### Étape 3 : Personnaliser le Template Email

1. **Aller sur** :
   ```
   https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq/auth/templates
   ```

2. **Sélectionner "Reset Password"**

3. **Remplacer le template par** :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe - Chronodil</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">

  <!-- Container principal -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Card email -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header avec logo -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ⏱️ Chronodil
              </h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">
                Gestion du temps optimisée
              </p>
            </td>
          </tr>

          <!-- Corps du message -->
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                Réinitialisation de votre mot de passe
              </h2>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour,
              </p>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Vous avez demandé à réinitialiser votre mot de passe pour votre compte Chronodil.
              </p>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
              </p>

              <!-- Bouton CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="{{ .ConfirmationURL }}"
                       style="display: inline-block;
                              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                              color: #ffffff;
                              font-size: 16px;
                              font-weight: 600;
                              text-decoration: none;
                              padding: 14px 40px;
                              border-radius: 6px;
                              box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
                              transition: all 0.3s ease;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Informations supplémentaires -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #10b981;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                      ⏰ <strong>Ce lien est valable pendant 1 heure.</strong>
                    </p>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                      🔒 Pour des raisons de sécurité, le lien ne peut être utilisé qu'une seule fois.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe ne sera pas modifié.
              </p>
            </td>
          </tr>

          <!-- Lien alternatif -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <tr>
                  <td>
                    <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0 0 10px 0;">
                      Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                    </p>
                    <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0; word-break: break-all;">
                      <a href="{{ .ConfirmationURL }}" style="color: #10b981; text-decoration: underline;">{{ .ConfirmationURL }}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px 0;">
                Cet email a été envoyé par <strong style="color: #6b7280;">Chronodil</strong>
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 15px 0;">
                Gestion optimisée du temps et des projets
              </p>
              <p style="color: #d1d5db; font-size: 11px; margin: 0;">
                © 2025 Chronodil. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

4. **Subject line (Objet)** :
   ```
   Réinitialisation de votre mot de passe Chronodil
   ```

5. **Sauvegarder le template**

---

## 🧪 Test Après Configuration

1. **Retourner sur l'application** : http://localhost:3000/auth/forgot-password

2. **Entrer votre email de test**

3. **Vérifier** :
   - Console browser (F12) : pas d'erreur JavaScript
   - Serveur dev : pas d'erreur dans les logs
   - Dashboard Supabase → Logs → Auth Logs : vérifier l'envoi

4. **Vérifier l'email** :
   - Boîte de réception
   - Dossier Spam/Promotions
   - Délai : 1-2 minutes maximum

---

## 🔍 Si Toujours Aucun Email

### Option A : Vérifier les Logs Supabase

```
Dashboard → Logs → Auth Logs
```

Chercher :
- Erreurs d'envoi d'email
- Messages "SMTP connection failed"
- Rate limiting

### Option B : Vérifier la Configuration Resend

1. **Aller sur Resend Dashboard** : https://resend.com/emails

2. **Vérifier** :
   - API Key active : `re_gkmdHcJp_9gUbYuZ9Ewuxx8L6aVrtbNEY`
   - Domaine `chronodil.app` vérifié (SPF, DKIM)
   - Pas de limite de quota atteinte

### Option C : Tester Resend Directement

Créer un fichier test :

```typescript
// scripts/test-resend-direct.ts
import { Resend } from 'resend';

const resend = new Resend('re_gkmdHcJp_9gUbYuZ9Ewuxx8L6aVrtbNEY');

async function testResend() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Chronodil <noreply@chronodil.app>',
      to: ['VOTRE_EMAIL_TEST@example.com'], // Remplacer
      subject: 'Test Resend',
      html: '<p>Test email depuis Chronodil</p>',
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
    } else {
      console.log('✅ Email envoyé:', data);
    }
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testResend();
```

Exécuter :
```bash
pnpm tsx scripts/test-resend-direct.ts
```

---

## 🚨 Problème Fréquent : Domaine Non Vérifié

Si Resend indique "Domain not verified" :

1. **Aller sur Resend Dashboard** → Domains

2. **Vérifier le domaine `chronodil.app`**

3. **Ajouter les DNS records** :
   ```
   Type: TXT
   Name: resend._domainkey.chronodil.app
   Value: [fourni par Resend]

   Type: TXT
   Name: chronodil.app
   Value: v=spf1 include:resend.com ~all
   ```

4. **Attendre propagation DNS** (5-30 minutes)

5. **Vérifier** : Resend Dashboard → Domains → Status ✅

---

## 🎯 Alternative Temporaire : Mailtrap (Développement)

Si vous voulez tester rapidement sans configurer Resend :

1. **Créer compte Mailtrap** : https://mailtrap.io

2. **Dans Supabase SMTP Settings** :
   ```
   SMTP Host: smtp.mailtrap.io
   SMTP Port: 587
   SMTP Username: [depuis Mailtrap]
   SMTP Password: [depuis Mailtrap]
   ```

3. **Tous les emails seront capturés dans Mailtrap** (pas envoyés réellement)

---

## ✅ Checklist de Vérification

- [ ] SMTP Settings configuré dans Supabase
- [ ] Redirect URLs ajoutées
- [ ] Template email personnalisé
- [ ] API Key Resend valide
- [ ] Domaine `chronodil.app` vérifié dans Resend
- [ ] DNS records configurés (SPF, DKIM)
- [ ] Test d'envoi réussi
- [ ] Email reçu dans boîte de réception

---

## 📞 Support

Si le problème persiste après toutes ces étapes :

1. **Logs Supabase** : Dashboard → Logs → Auth Logs
2. **Logs Resend** : https://resend.com/emails
3. **Console browser** : F12 → Console tab
4. **Serveur dev** : Vérifier les logs dans le terminal

**Note** : Par défaut, Supabase utilise son propre service email uniquement pour les tests (limité à 3-4 emails/heure). Pour la production, la configuration SMTP avec Resend est **obligatoire**.
