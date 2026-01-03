import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Configuration Nodemailer (Gmail ou autre SMTP)
const createTransporter = () => {
  // Vérifier si les credentials Gmail/SMTP sont configurés
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return null;
};

// Configuration Resend (fallback)
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    // En développement : afficher le lien dans la console
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL ENVOYÉ (MODE DÉVELOPPEMENT)');
      console.log('='.repeat(80));
      console.log('À:', to);
      console.log('Sujet:', subject);
      console.log('Contenu HTML:', html.substring(0, 500) + '...');

      // Extraire le lien de réinitialisation depuis le HTML
      const urlMatch = html.match(/href="([^"]*reset-password[^"]*)"/);
      if (urlMatch) {
        console.log('\n🔗 LIEN DE RÉINITIALISATION:');
        console.log(urlMatch[1]);
      }
      console.log('='.repeat(80) + '\n');
    }

    // Tentative 1 : Nodemailer (Gmail/SMTP)
    const transporter = createTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to,
          subject,
          html,
        });

        console.log('✅ Email envoyé avec succès via Nodemailer:', info.messageId);
        return;
      } catch (nodemailerError: any) {
        console.error('❌ Erreur Nodemailer:', nodemailerError.message);
        // Continue vers Resend en fallback
      }
    }

    // Tentative 2 : Resend (fallback)
    if (process.env.RESEND_API_KEY) {
      try {
        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Chronodil <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        });

        if (error) {
          console.error('❌ Erreur Resend:', error);
          // Ne pas throw l'erreur en dev pour permettre le test avec les logs console
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`Échec d'envoi d'email via Resend: ${error.message}`);
          }
        } else {
          console.log('✅ Email envoyé avec succès via Resend:', data?.id);
        }
      } catch (resendError: any) {
        console.error('❌ Erreur Resend:', resendError.message);
        if (process.env.NODE_ENV === 'production') {
          throw resendError;
        }
      }
    } else {
      console.warn('⚠️  Aucun service email configuré (Nodemailer ou Resend)');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Configuration email manquante');
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi d\'email:', error);

    // En production, throw l'erreur
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

/**
 * Génère le template HTML pour l'email de réinitialisation de mot de passe
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
                ${userName ? `Bonjour ${userName},` : 'Bonjour,'}
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
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 15px 0;">
                Gestion optimisée du temps et des projets
              </p>
              <p style="color: #d1d5db; font-size: 11px; margin: 0;">
                © 2026 Chronodil. Tous droits réservés.
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
