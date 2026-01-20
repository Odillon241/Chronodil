// Configuration Supabase pour l'envoi d'emails via Edge Function
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

interface SendOTPEmailOptions {
  to: string
  otp: string
  userName?: string
}

/**
 * Envoie un email via Supabase Edge Function ou SMTP configuré
 * Note: Les emails d'authentification (OTP, reset password) sont gérés
 * nativement par Supabase via les templates configurés dans le dashboard.
 * Cette fonction est utilisée pour les emails de notification transactionnels.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // Log en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('\n' + '='.repeat(80))
    console.log('📧 EMAIL ENVOYÉ (MODE DÉVELOPPEMENT)')
    console.log('='.repeat(80))
    console.log('À:', to)
    console.log('Sujet:', subject)
    console.log('Contenu HTML:', html.substring(0, 500) + '...')
    console.log('='.repeat(80) + '\n')
  }

  // Vérifier la configuration Supabase
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase non configuré pour les emails')
    if (process.env.NODE_ENV === 'production') {
      console.error('Configuration email manquante (SUPABASE_SERVICE_ROLE_KEY)')
    }
    return { success: false, error: 'Configuration Supabase manquante' }
  }

  try {
    // Appeler l'Edge Function send-email si déployée
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ to, subject, html }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur Edge Function send-email:', errorText)

      // En développement, on continue sans erreur
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Email] Email logué en mode développement (Edge Function non disponible)')
        return { success: true, id: 'dev-mode' }
      }

      return { success: false, error: errorText }
    }

    const data = await response.json()
    console.log('✅ Email envoyé avec succès via Supabase:', data?.id)
    return { success: true, id: data?.id }
  } catch (error: any) {
    console.error("❌ Erreur lors de l'envoi d'email:", error)

    // En développement, on continue sans erreur
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Email] Email logué en mode développement (erreur réseau)')
      return { success: true, id: 'dev-mode' }
    }

    return { success: false, error: error.message }
  }
}

/**
 * Envoie un email OTP via Resend
 */
export async function sendOTPEmail({ to, otp, userName }: SendOTPEmailOptions) {
  const formattedOTP = `${otp.slice(0, 4)}-${otp.slice(4)}`

  // Log special pour les OTP en developpement (email masque pour securite)
  if (process.env.NODE_ENV === 'development') {
    const maskedEmail = to.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    console.log('\n' + '='.repeat(40))
    console.log('[DEV] CODE OTP ENVOYE')
    console.log('='.repeat(40))
    console.log('Email:', maskedEmail)
    console.log('Code OTP:', otp)
    console.log('Format:', formattedOTP)
    console.log('='.repeat(40) + '\n')
  }

  return sendEmail({
    to,
    subject: 'Votre code de vérification Chronodil',
    html: getOTPEmailTemplate(otp, userName),
  })
}

/**
 * Template HTML pour l'email OTP
 */
export function getOTPEmailTemplate(otp: string, userName?: string): string {
  const formattedOTP = `${otp.slice(0, 4)}-${otp.slice(4)}`

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet">
  <title>Code de vérification - Chronodil</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; background-color: #ffffff; color: #1f2937; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; color: #1f2937;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 60px 20px;">

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; text-align: left;">

          <!-- Logo Odillon -->
          <tr>
            <td style="padding-bottom: 40px; border-bottom: 1px solid #f3f4f6;">
              <img src="https://kucajoobtwptpdanuvnj.supabase.co/storage/v1/object/public/public/logo-odillon.png" alt="ODILLON" height="45" style="display: block; border: 0;">
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 48px 0;">
              <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #111827; font-family: 'Geist', sans-serif; letter-spacing: -0.02em;">
                Code de vérification
              </h1>

              <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 32px 0; font-family: 'Geist', sans-serif;">
                ${userName ? `Bonjour ${userName},` : 'Bonjour,'}<br><br>
                Voici votre code de vérification pour <strong>Chronodil</strong>.
              </p>

              <!-- Section Code OTP -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td>
                    <p style="font-size: 13px; font-weight: 600; color: #111827; margin: 0 0 12px 0; font-family: 'Geist', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">
                      Votre code de vérification
                    </p>
                    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 24px; text-align: center;">
                      <span style="font-family: 'Geist Mono', monospace; font-size: 32px; font-weight: 700; color: #95c11f; letter-spacing: 0.2em;">
                        ${formattedOTP}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Bloc Sécurité Minimaliste -->
              <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #f3f4f6;">
                <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0; font-family: 'Geist', sans-serif;">
                  Ce code est valable 60 minutes. S'il ne fonctionne plus, vous devrez refaire une demande.<br><br>
                  <em>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email en toute sécurité.</em>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #f3f4f6;">
              <p style="font-size: 12px; color: #d1d5db; margin: 0; font-family: 'Geist', sans-serif;">
                © 2026 ODILLON Ingénierie d'Entreprises • Chronodil
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`
}

/**
 * Template HTML pour l'email de réinitialisation de mot de passe (avec lien)
 */
export function getResetPasswordEmailTemplate(resetUrl: string, userName?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet">
  <title>Réinitialisation de mot de passe - Chronodil</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; background-color: #ffffff; color: #1f2937; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; color: #1f2937;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 60px 20px;">

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; text-align: left;">

          <!-- Logo Odillon -->
          <tr>
            <td style="padding-bottom: 40px; border-bottom: 1px solid #f3f4f6;">
              <img src="https://kucajoobtwptpdanuvnj.supabase.co/storage/v1/object/public/public/logo-odillon.png" alt="ODILLON" height="45" style="display: block; border: 0;">
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 48px 0;">
              <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #111827; font-family: 'Geist', sans-serif; letter-spacing: -0.02em;">
                Réinitialisation de mot de passe
              </h1>

              <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 32px 0; font-family: 'Geist', sans-serif;">
                ${userName ? `Bonjour ${userName},` : 'Bonjour,'}<br><br>
                Une demande de réinitialisation de mot de passe a été faite pour votre compte <strong>Chronodil</strong>.
              </p>

              <!-- Bouton -->
              <p style="font-size: 15px; color: #4b5563; margin: 0 0 20px 0; font-family: 'Geist', sans-serif;">
                Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
              </p>

              <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td>
                    <a href="${resetUrl}" style="display: inline-block; background-color: #95c11f; color: #000000; font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Lien alternatif -->
              <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0 0 8px 0; font-family: 'Geist', sans-serif;">
                Si le bouton ne fonctionne pas, copiez ce lien :
              </p>
              <p style="font-size: 12px; color: #6b7280; line-height: 1.5; margin: 0 0 32px 0; word-break: break-all; font-family: 'Geist', sans-serif;">
                <a href="${resetUrl}" style="color: #95c11f; text-decoration: underline;">${resetUrl}</a>
              </p>

              <!-- Bloc Sécurité Minimaliste -->
              <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #f3f4f6;">
                <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0; font-family: 'Geist', sans-serif;">
                  Ce lien est valable 60 minutes. S'il ne fonctionne plus, vous devrez refaire une demande.<br><br>
                  <em>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.</em>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #f3f4f6;">
              <p style="font-size: 12px; color: #d1d5db; margin: 0; font-family: 'Geist', sans-serif;">
                © 2026 ODILLON Ingénierie d'Entreprises • Chronodil
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `
}

/**
 * Interface pour les options de notification email
 */
interface NotificationEmailOptions {
  title: string
  message: string
  link?: string | null
  type?: string
  userName?: string
}

/**
 * Interface pour les emails transactionnels génériques
 */
export interface TransactionalEmailOptions {
  userName?: string
  title: string
  preheader?: string
  content: string
  alertType?: 'info' | 'warning' | 'error' | 'success'
  alertTitle?: string
  alertMessage?: string
  details?: Array<{ label: string; value: string }>
  buttonText?: string
  buttonUrl?: string
}

/**
 * Génère un template HTML d'email transactionnel cohérent avec le design Chronodil
 * Utilisé par toutes les fonctions Inngest pour garantir une UX email uniforme
 */
export function getTransactionalEmailTemplate(options: TransactionalEmailOptions): string {
  const {
    userName,
    title,
    preheader = '',
    content,
    alertType,
    alertTitle,
    alertMessage,
    details,
    buttonText,
    buttonUrl,
  } = options

  // Couleurs selon le type d'alerte
  const alertColors = {
    info: { bg: '#e8f4f8', border: '#17a2b8', text: '#0c5460' },
    warning: { bg: '#fef3e2', border: '#fd9d24', text: '#856404' },
    error: { bg: '#fde8e8', border: '#e53935', text: '#721c24' },
    success: { bg: '#e8f5e9', border: '#43a047', text: '#1b5e20' },
  }

  const alert = alertType ? alertColors[alertType] : null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const fullButtonUrl = buttonUrl
    ? buttonUrl.startsWith('http')
      ? buttonUrl
      : `${appUrl}${buttonUrl}`
    : null

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title} - Chronodil</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; background-color: #ffffff; color: #1f2937; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; color: #1f2937;">
  ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>` : ''}

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 60px 20px;">

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; text-align: left;">

          <!-- Logo Odillon -->
          <tr>
            <td style="padding-bottom: 40px; border-bottom: 1px solid #f3f4f6;">
              <img src="https://kucajoobtwptpdanuvnj.supabase.co/storage/v1/object/public/public/logo-odillon.png" alt="ODILLON" height="45" style="display: block; border: 0;">
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 48px 0;">
              <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #111827; font-family: 'Geist', sans-serif; letter-spacing: -0.02em;">
                ${title}
              </h1>

              <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 24px 0; font-family: 'Geist', sans-serif;">
                ${userName ? `Bonjour ${userName},` : 'Bonjour,'}
              </p>

              <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 24px 0; font-family: 'Geist', sans-serif;">
                ${content}
              </p>

              ${
                alert && alertTitle
                  ? `
              <!-- Bloc Alerte -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: ${alert.bg}; border-left: 4px solid ${alert.border}; border-radius: 0 8px 8px 0; padding: 16px 20px;">
                    <p style="font-size: 14px; font-weight: 600; color: ${alert.text}; margin: 0 0 4px 0; font-family: 'Geist', sans-serif;">
                      ${alertTitle}
                    </p>
                    ${alertMessage ? `<p style="font-size: 14px; color: ${alert.text}; margin: 0; font-family: 'Geist', sans-serif;">${alertMessage}</p>` : ''}
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              ${
                details && details.length > 0
                  ? `
              <!-- Détails -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 13px; font-weight: 600; color: #6b7280; margin: 0 0 12px 0; font-family: 'Geist', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">
                      Détails
                    </p>
                    ${details
                      .map(
                        (d) => `
                    <p style="font-size: 14px; color: #374151; margin: 8px 0; font-family: 'Geist', sans-serif;">
                      <span style="color: #6b7280;">${d.label} :</span> <strong>${d.value}</strong>
                    </p>
                    `,
                      )
                      .join('')}
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              ${
                fullButtonUrl && buttonText
                  ? `
              <!-- Bouton -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
                <tr>
                  <td>
                    <a href="${fullButtonUrl}" style="display: inline-block; background-color: #95c11f; color: #000000; font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- Bloc info -->
              <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f3f4f6;">
                <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0; font-family: 'Geist', sans-serif;">
                  Vous recevez cet email car vous avez un compte Chronodil. Vous pouvez modifier vos préférences de notification dans les paramètres.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #f3f4f6;">
              <p style="font-size: 12px; color: #d1d5db; margin: 0; font-family: 'Geist', sans-serif;">
                © 2026 ODILLON Ingénierie d'Entreprises • Chronodil
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`
}

/**
 * Envoie un email de notification
 */
export async function sendNotificationEmail(to: string, options: NotificationEmailOptions) {
  return sendEmail({
    to,
    subject: `🔔 ${options.title} - Chronodil`,
    html: getNotificationEmailTemplate(options),
  })
}

/**
 * Template HTML pour les emails de notification génériques
 */
export function getNotificationEmailTemplate(options: NotificationEmailOptions): string {
  const { title, message, link, userName } = options

  const actionUrl = link
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://chronodil.com'}${link}`
    : null

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet">
  <title>${title} - Chronodil</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; background-color: #ffffff; color: #1f2937; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; color: #1f2937;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 60px 20px;">

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; text-align: left;">

          <!-- Logo Odillon -->
          <tr>
            <td style="padding-bottom: 40px; border-bottom: 1px solid #f3f4f6;">
              <img src="https://kucajoobtwptpdanuvnj.supabase.co/storage/v1/object/public/public/logo-odillon.png" alt="ODILLON" height="45" style="display: block; border: 0;">
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 48px 0;">
              <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 24px 0; color: #111827; font-family: 'Geist', sans-serif; letter-spacing: -0.02em;">
                ${title}
              </h1>

              <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 0 0 32px 0; font-family: 'Geist', sans-serif;">
                ${userName ? `Bonjour ${userName},` : 'Bonjour,'}<br><br>
                Vous avez reçu une nouvelle notification sur <strong>Chronodil</strong>.
              </p>

              <!-- Notification Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td>
                    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 24px;">
                      <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0; font-family: 'Geist', sans-serif;">
                        ${message}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              ${
                actionUrl
                  ? `
              <!-- Bouton -->
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="${actionUrl}" style="display: inline-block; background-color: #95c11f; color: #000000; font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
                      Voir dans Chronodil
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- Bloc info -->
              <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #f3f4f6;">
                <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0; font-family: 'Geist', sans-serif;">
                  Vous recevez cet email car vous avez activé les notifications email sur Chronodil.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #f3f4f6;">
              <p style="font-size: 12px; color: #d1d5db; margin: 0; font-family: 'Geist', sans-serif;">
                © 2026 ODILLON Ingénierie d'Entreprises • Chronodil
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`
}
