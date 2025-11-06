import { inngest } from "./client";
import { Resend } from "resend";
import { prisma } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email notification function
export const sendEmailNotification = inngest.createFunction(
  {
    id: "send-email-notification",
    name: "Send Email Notification",
  },
  { event: "notification/email.send" },
  async ({ event, step }) => {
    const { userId, title, message, type, link } = event.data;

    // Step 1: Get user information
    const user = await step.run("get-user", async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Step 2: Create in-app notification
    await step.run("create-notification", async () => {
      const { nanoid } = require("nanoid");
      return await prisma.notification.create({
        data: {
          id: nanoid(),
          userId,
          title,
          message,
          type: type || "info",
          link: link || null,
        },
      });
    });

    // Step 3: Send email if Resend is configured
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "") {
      await step.run("send-email", async () => {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dd2d4a 0%, #f1a7a0 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #dd2d4a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Chronodil</h1>
                  <p>${title}</p>
                </div>
                <div class="content">
                  <p>Bonjour ${user.name || user.email},</p>
                  <p>${message}</p>
                  ${link ? `<a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${link}" class="button">Voir les détails</a>` : ""}
                </div>
                <div class="footer">
                  <p>Ceci est un email automatique de Chronodil. Merci de ne pas répondre à ce message.</p>
                </div>
              </div>
            </body>
          </html>
        `;

        return await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "Chronodil <noreply@chronodil.app>",
          to: user.email,
          subject: title,
          html: htmlContent,
        });
      });
    }

    return { success: true, userId, email: user.email };
  }
);

// Export all functions
export const inngestFunctions = [
  sendEmailNotification,
];
