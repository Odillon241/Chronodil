import { inngest } from "./client";

/**
 * Send a notification (in-app + email via Inngest)
 */
export async function sendNotification({
  userId,
  title,
  message,
  type = "info",
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
}) {
  try {
    await inngest.send({
      name: "notification/email.send",
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  } catch (error) {
    console.error("Error sending notification via Inngest:", error);
    // Don't throw - notification is not critical
  }
}

/**
 * Trigger timesheet reminders manually (useful for testing)
 * This will immediately check and send reminders to users who should receive them
 * without waiting for the cron schedule.
 */
export async function triggerTimesheetReminders() {
  try {
    // Send an event that will trigger the reminder function immediately
    // The function will check current time and day, so it will only send to users
    // who match the current time/day configuration
    await inngest.send({
      name: "reminder/timesheet.trigger",
      data: {
        triggeredAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error triggering timesheet reminders:", error);
    throw error;
  }
}

