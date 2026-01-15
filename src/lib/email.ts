import { Resend } from 'resend';

// Configuration Resend (service principal)
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface SendOTPEmailOptions {
  to: string;
  otp: string;
  userName?: string;
}

/**
 * Envoie un email via Resend
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // Log en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL ENVOYÉ (MODE DÉVELOPPEMENT)');
    console.log('='.repeat(80));
    console.log('À:', to);
    console.log('Sujet:', subject);
    console.log('Contenu HTML:', html.substring(0, 500) + '...');
    console.log('='.repeat(80) + '\n');
  }

  // Vérifier la configuration Resend
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY non configurée');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Configuration email manquante (RESEND_API_KEY)');
    }
    return { success: false, error: 'API key manquante' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Chronodil <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Échec d'envoi d'email: ${error.message}`);
      }
      return { success: false, error: error.message };
    }

    console.log('✅ Email envoyé avec succès via Resend:', data?.id);
    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi d\'email:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return { success: false, error: error.message };
  }
}

/**
 * Envoie un email OTP via Resend
 */
export async function sendOTPEmail({ to, otp, userName }: SendOTPEmailOptions) {
  const formattedOTP = `${otp.slice(0, 4)}-${otp.slice(4)}`;
  
  // Log spécial pour les OTP en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('\n' + '🔑'.repeat(40));
    console.log('📧 CODE OTP ENVOYÉ');
    console.log('🔑'.repeat(40));
    console.log('Email:', to);
    console.log('Code OTP:', otp);
    console.log('Format:', formattedOTP);
    console.log('🔑'.repeat(40) + '\n');
  }

  return sendEmail({
    to,
    subject: 'Votre code de vérification Chronodil',
    html: getOTPEmailTemplate(otp, userName),
  });
}

/**
 * Template HTML pour l'email OTP
 */
export function getOTPEmailTemplate(otp: string, userName?: string): string {
  const formattedOTP = `${otp.slice(0, 4)}-${otp.slice(4)}`;
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de vérification - Chronodil</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">
                ⏱️ Chronodil
              </h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">
                Gestion du temps optimisée
              </p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                Code de vérification
              </h2>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                ${userName ? `Bonjour ${userName},` : 'Bonjour,'}
              </p>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Voici votre code de vérification :
              </p>

              <!-- Code OTP -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 30px; text-align: center; margin: 24px 0; border-radius: 12px; border: 2px solid #10b981;">
                <h1 style="font-family: 'SF Mono', 'Consolas', monospace; font-size: 42px; letter-spacing: 12px; margin: 0; color: #059669; font-weight: 700;">
                  ${formattedOTP}
                </h1>
              </div>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                ⏰ Ce code expire dans <strong>1 heure</strong>
              </p>

              <!-- Informations de sécurité -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="color: #92400e; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                      🔒 <strong>Sécurité</strong>
                    </p>
                    <p style="color: #92400e; font-size: 14px; line-height: 1.5; margin: 0;">
                      Ne partagez jamais ce code. Chronodil ne vous demandera jamais ce code par téléphone ou SMS.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                Si vous n'avez pas demandé ce code, ignorez cet email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px 0;">
                Cet email a été envoyé par <strong style="color: #6b7280;">Chronodil</strong>
              </p>
              <p style="color: #d1d5db; font-size: 11px; margin: 0;">
                © 2026 ODILLON. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
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
  <title>Réinitialisation de mot de passe - Chronodil</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
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

          <!-- Corps -->
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                Réinitialisation de votre mot de passe
              </h2>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                ${userName ? `Bonjour ${userName},` : 'Bonjour,'}
              </p>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
              </p>

              <!-- Bouton CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${resetUrl}"
                       style="display: inline-block;
                              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                              color: #ffffff;
                              font-size: 16px;
                              font-weight: 600;
                              text-decoration: none;
                              padding: 14px 40px;
                              border-radius: 6px;
                              box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Informations -->
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
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
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
                      Si le bouton ne fonctionne pas, copiez ce lien :
                    </p>
                    <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0; word-break: break-all;">
                      <a href="${resetUrl}" style="color: #10b981; text-decoration: underline;">${resetUrl}</a>
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
              <p style="color: #d1d5db; font-size: 11px; margin: 0;">
                © 2026 ODILLON. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

/**
 * Interface pour les options de notification email
 */
interface NotificationEmailOptions {
  title: string;
  message: string;
  link?: string | null;
  type?: string;
  userName?: string;
}

/**
 * Envoie un email de notification
 */
export async function sendNotificationEmail(to: string, options: NotificationEmailOptions) {
  return sendEmail({
    to,
    subject: `🔔 ${options.title} - Chronodil`,
    html: getNotificationEmailTemplate(options),
  });
}

/**
 * Template HTML pour les emails de notification génériques
 */
export function getNotificationEmailTemplate(options: NotificationEmailOptions): string {
  const { title, message, link, type = 'info', userName } = options;
  
  // Icônes et couleurs selon le type
  const typeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
    info: { icon: 'ℹ️', color: '#3b82f6', bgColor: '#eff6ff' },
    success: { icon: '✅', color: '#10b981', bgColor: '#f0fdf4' },
    warning: { icon: '⚠️', color: '#f59e0b', bgColor: '#fffbeb' },
    error: { icon: '❌', color: '#ef4444', bgColor: '#fef2f2' },
    task_assigned: { icon: '📋', color: '#8b5cf6', bgColor: '#f5f3ff' },
    task_completed: { icon: '🎉', color: '#10b981', bgColor: '#f0fdf4' },
    message: { icon: '💬', color: '#06b6d4', bgColor: '#ecfeff' },
    reminder: { icon: '⏰', color: '#f97316', bgColor: '#fff7ed' },
  };
  
  const config = typeConfig[type] || typeConfig.info;
  const actionUrl = link ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://chronodil.com'}${link}` : null;
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Chronodil</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">
                ⏱️ Chronodil
              </h1>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                ${userName ? `Bonjour ${userName},` : 'Bonjour,'}
              </p>

              <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;">
                Vous avez reçu une nouvelle notification :
              </p>

              <!-- Notification Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${config.bgColor}; border-radius: 8px; border-left: 4px solid ${config.color};">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">
                      ${config.icon} ${title}
                    </h2>
                    <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0;">
                      ${message}
                    </p>
                  </td>
                </tr>
              </table>

              ${actionUrl ? `
              <!-- Bouton CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${actionUrl}"
                       style="display: inline-block;
                              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                              color: #ffffff;
                              font-size: 16px;
                              font-weight: 600;
                              text-decoration: none;
                              padding: 14px 40px;
                              border-radius: 6px;
                              box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                      Voir dans Chronodil
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
                Vous recevez cet email car vous avez activé les notifications email sur Chronodil.
              </p>
              <p style="color: #d1d5db; font-size: 11px; margin: 0;">
                © 2026 ODILLON. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
}
