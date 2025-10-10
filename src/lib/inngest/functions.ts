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

// Timesheet submission notification
export const sendTimesheetSubmittedNotification = inngest.createFunction(
  {
    id: "send-timesheet-submitted-notification",
    name: "Send Timesheet Submitted Notification",
  },
  { event: "timesheet/submitted" },
  async ({ event, step }) => {
    const { userId, timesheetEntryIds } = event.data;

    // Get user and their manager
    const user = await step.run("get-user-and-manager", async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          User: { select: { id: true, email: true, name: true } },
        },
      });
    });

    if (!user?.User) {
      return { success: false, reason: "No manager found" };
    }

    // Notify manager
    await step.run("notify-manager", async () => {
      return await inngest.send({
        name: "notification/email.send",
        data: {
          userId: user.User!.id,
          title: "Nouvelle feuille de temps à valider",
          message: `${user.name || user.email} a soumis une feuille de temps pour validation. ${timesheetEntryIds.length} entrée(s) en attente.`,
          type: "info",
          link: "/dashboard/validations",
        },
      });
    });

    return { success: true };
  }
);

// Timesheet validation notification
export const sendTimesheetValidatedNotification = inngest.createFunction(
  {
    id: "send-timesheet-validated-notification",
    name: "Send Timesheet Validated Notification",
  },
  { event: "timesheet/validated" },
  async ({ event, step }) => {
    const { userId, status, validatorName, comment } = event.data;

    const statusText = status === "APPROVED" ? "approuvée" : "rejetée";
    const statusType = status === "APPROVED" ? "success" : "error";

    await step.run("notify-employee", async () => {
      return await inngest.send({
        name: "notification/email.send",
        data: {
          userId,
          title: `Feuille de temps ${statusText}`,
          message: `Votre feuille de temps a été ${statusText} par ${validatorName}.${comment ? ` Commentaire: ${comment}` : ""}`,
          type: statusType,
          link: "/dashboard/timesheet",
        },
      });
    });

    return { success: true };
  }
);

// Export all functions
export const inngestFunctions = [
  sendEmailNotification,
  sendTimesheetSubmittedNotification,
  sendTimesheetValidatedNotification,
];
