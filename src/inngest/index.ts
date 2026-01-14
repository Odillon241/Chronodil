/**
 * Point d'entrée principal des fonctions Inngest
 * Exporte tous les jobs pour l'enregistrement via l'API route
 */

// Fonctions de gestion des tâches
import { taskReminderJob } from "./functions/task-reminders";
import { taskOverdueJob } from "./functions/task-overdue";
import { taskRecurringJob } from "./functions/task-recurring";

// Fonctions de gestion des feuilles de temps RH
import { hrTimesheetValidationReminders } from "./functions/hr-timesheet-validation-reminders";
import { hrTimesheetWeeklyReport } from "./functions/hr-timesheet-weekly-report";
import { hrTimesheetOverdueDetection } from "./functions/hr-timesheet-overdue-detection";
import { hrActivityValidationChecker } from "./functions/hr-activity-validation-checker";

/**
 * Liste de toutes les fonctions Inngest à enregistrer
 * Ces fonctions seront automatiquement découvertes par Inngest Dev Server
 */
export const inngestFunctions = [
  // Tâches
  taskReminderJob,
  taskOverdueJob,
  taskRecurringJob,
  // HR Timesheet
  hrTimesheetValidationReminders,
  hrTimesheetWeeklyReport,
  hrTimesheetOverdueDetection,
  hrActivityValidationChecker,
];

export { inngest } from "./client";
