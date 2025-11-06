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

