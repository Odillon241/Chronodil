/**
 * Types d'événements Inngest
 * Centralisation des types pour réutilisation dans l'app
 */

export type TaskReminderDueEvent = {
  name: "task/reminder.due";
  data: {
    taskId: string;
    userId: string;
    taskName: string;
    reminderDate: string;
  };
};

export type TaskOverdueEvent = {
  name: "task/overdue.detected";
  data: {
    taskId: string;
    userId: string;
    taskName: string;
    daysPastDue: number;
    dueDate: string;
  };
};

export type TaskCreatedEvent = {
  name: "task/created";
  data: {
    taskId: string;
    userId: string;
    recurrence?: string;
    isRecurringTemplate?: boolean;
  };
};

export type TaskCompletedEvent = {
  name: "task/completed";
  data: {
    taskId: string;
    userId: string;
    completedAt: string;
  };
};

export type InngestEvent =
  | TaskReminderDueEvent
  | TaskOverdueEvent
  | TaskCreatedEvent
  | TaskCompletedEvent;
