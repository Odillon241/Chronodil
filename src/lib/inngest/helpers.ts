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
 * Send timesheet submitted notification to manager
 */
export async function notifyTimesheetSubmitted({
  userId,
  timesheetEntryIds,
}: {
  userId: string;
  timesheetEntryIds: string[];
}) {
  try {
    await inngest.send({
      name: "timesheet/submitted",
      data: {
        userId,
        timesheetEntryIds,
      },
    });
  } catch (error) {
    console.error("Error sending timesheet submitted notification:", error);
  }
}

/**
 * Send timesheet validation notification to employee
 */
export async function notifyTimesheetValidated({
  userId,
  status,
  validatorName,
  comment,
}: {
  userId: string;
  status: "APPROVED" | "REJECTED";
  validatorName: string;
  comment?: string;
}) {
  try {
    await inngest.send({
      name: "timesheet/validated",
      data: {
        userId,
        status,
        validatorName,
        comment,
      },
    });
  } catch (error) {
    console.error("Error sending timesheet validated notification:", error);
  }
}
