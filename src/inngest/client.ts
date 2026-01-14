import { Inngest, EventSchemas } from "inngest";

/**
 * Schéma des événements Inngest pour le système de tâches
 * Permet le type-safety et l'autocomplétion des événements
 */
type Events = {
  "task/reminder.due": {
    data: {
      taskId: string;
      userId: string;
      taskName: string;
      reminderDate: string;
    };
  };
  "task/overdue.detected": {
    data: {
      taskId: string;
      userId: string;
      taskName: string;
      daysPastDue: number;
      dueDate: string;
    };
  };
  "task/created": {
    data: {
      taskId: string;
      userId: string;
      recurrence?: string;
      isRecurringTemplate?: boolean;
    };
  };
  "task/completed": {
    data: {
      taskId: string;
      userId: string;
      completedAt: string;
    };
  };
};

/**
 * Client Inngest pour gérer les jobs asynchrones et les événements
 * - Rappels de tâches programmées
 * - Détection de tâches en retard
 * - Génération de tâches récurrentes
 * - Escalade aux managers
 */
export const inngest = new Inngest({
  id: "chronodil-app",
  schemas: new EventSchemas().fromRecord<Events>(),
  // Configuration pour le développement local
  eventKey: process.env.INNGEST_EVENT_KEY,
});
