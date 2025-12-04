import { inngest } from "./client";
import { Resend } from "resend";
import { prisma } from "@/lib/db";

// Import des fonctions chat
// TODO: Implémenter les fonctions chat (module functions-chat manquant)
// export * from "./functions-chat";

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
    const notification = await step.run("create-notification", async () => {
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

    // Step 2.5: Send push notification
    await step.run("send-push-notification", async () => {
      const { sendPushNotificationForNotification } = await import('@/lib/notification-helpers');
      const result = await sendPushNotificationForNotification(userId, {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
      });
      return result;
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

// Timesheet reminder function - runs every hour to check for users who need reminders
// Can also be triggered manually via event "reminder/timesheet.trigger"
export const sendTimesheetReminders = inngest.createFunction(
  {
    id: "send-timesheet-reminders",
    name: "Send Timesheet Reminders",
    retries: 2,
  },
  // Run every hour at minute 0 (e.g., 17:00, 18:00, etc.)
  // Also supports manual trigger via event
  [
    { cron: "0 * * * *" },
    { event: "reminder/timesheet.trigger" },
  ],
  async ({ event, step }) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = now.getDay();
    const dayMap: Record<number, string> = {
      0: "SUNDAY",
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      5: "FRIDAY",
      6: "SATURDAY",
    };
    const currentDay = dayMap[dayOfWeek];

    // Step 1: Find users who have reminders enabled for this time and day
    const usersToRemind = await step.run("find-users-to-remind", async () => {
      return await prisma.user.findMany({
        where: {
          enableTimesheetReminders: true,
          reminderTime: currentTime,
          reminderDays: {
            has: currentDay,
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          reminderTime: true,
          reminderDays: true,
          emailNotificationsEnabled: true,
          desktopNotificationsEnabled: true,
        },
      });
    });

    if (usersToRemind.length === 0) {
      return { 
        message: `No users to remind at ${currentTime} on ${currentDay}`,
        usersReminded: 0,
      };
    }

    // Step 2: Check which users haven't logged time today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const usersWithoutTime = await step.run("check-users-without-time", async () => {
      const usersNeedingReminder: typeof usersToRemind = [];

      for (const user of usersToRemind) {
        // Check if user has any HRTimesheet with activities that overlap today
        // An activity overlaps today if:
        // - startDate <= tomorrow AND endDate >= today
        // This covers activities that start before today and end after, or are entirely within today
        const hasTimeToday = await prisma.hRActivity.findFirst({
          where: {
            HRTimesheet: {
              userId: user.id,
              status: {
                in: ["DRAFT", "PENDING", "APPROVED"],
              },
            },
            startDate: {
              lte: tomorrow,
            },
            endDate: {
              gte: today,
            },
            // Only count activities with actual hours logged
            totalHours: {
              gt: 0,
            },
          },
        });

        if (!hasTimeToday) {
          usersNeedingReminder.push(user);
        }
      }

      return usersNeedingReminder;
    });

    if (usersWithoutTime.length === 0) {
      return {
        message: `All ${usersToRemind.length} users have already logged time today`,
        usersReminded: 0,
        usersChecked: usersToRemind.length,
      };
    }

    // Step 3: Send notifications to users who need reminders
    const notificationResults = await step.run("send-reminders", async () => {
      const { nanoid } = require("nanoid");
      const results = [];

      for (const user of usersWithoutTime) {
        const title = "Rappel : Saisie de temps";
        const message = `N'oubliez pas de saisir vos heures de travail pour aujourd'hui.`;
        const link = "/dashboard/hr-timesheet/new";

        // Create in-app notification
        const notification = await prisma.notification.create({
          data: {
            id: nanoid(),
            userId: user.id,
            title,
            message,
            type: "reminder",
            link,
          },
        });

        // Send push notification (fire and forget)
        import('@/lib/notification-helpers').then(({ sendPushNotificationForNotification }) => {
          sendPushNotificationForNotification(user.id, {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
          }).catch(console.error);
        }).catch(console.error);

        // Send email notification if enabled
        if (user.emailNotificationsEnabled && process.env.RESEND_API_KEY) {
          try {
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
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${link}" class="button">Saisir mes heures</a>
                    </div>
                    <div class="footer">
                      <p>Ceci est un email automatique de Chronodil. Vous pouvez modifier vos préférences de rappel dans les paramètres.</p>
                    </div>
                  </div>
                </body>
              </html>
            `;

            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || "Chronodil <noreply@chronodil.app>",
              to: user.email,
              subject: title,
              html: htmlContent,
            });
          } catch (error) {
            console.error(`Failed to send email to ${user.email}:`, error);
          }
        }

        results.push({
          userId: user.id,
          email: user.email,
          notificationSent: true,
        });
      }

      return results;
    });

    return {
      message: `Reminders sent to ${usersWithoutTime.length} users`,
      usersReminded: usersWithoutTime.length,
      usersChecked: usersToRemind.length,
      results: notificationResults,
    };
  }
);

// Export all functions
export const inngestFunctions = [
  sendEmailNotification,
  sendTimesheetReminders,
];
