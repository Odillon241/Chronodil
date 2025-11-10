import { z } from "zod";

// Schéma de base pour une activité RH (sans validation)
const hrActivityBaseSchema = z.object({
  activityType: z.enum(["OPERATIONAL", "REPORTING"]),
  activityName: z.string().min(1, "Le nom de l'activité est requis"),
  description: z.string().optional(),
  periodicity: z.enum(["DAILY", "WEEKLY", "MONTHLY", "PUNCTUAL", "WEEKLY_MONTHLY"]),
  weeklyQuantity: z.number().int().min(1).max(20).optional(),
  totalHours: z.number().min(0).optional(),
  startDate: z.date({
    required_error: "La date de début est requise",
  }),
  endDate: z.date({
    required_error: "La date de fin est requise",
  }),
  status: z.enum(["IN_PROGRESS", "COMPLETED"]).default("IN_PROGRESS"),
  catalogId: z.string().optional(),
  // Nouveaux champs pour intégration avec Task
  taskId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  complexity: z.enum(["FAIBLE", "MOYEN", "LEV_"]).optional(),
  estimatedHours: z.number().min(0).optional(),
  dueDate: z.date().optional(),
  reminderDate: z.date().optional(),
  reminderTime: z.string().optional(),
  soundEnabled: z.boolean().default(true),
  sharedWith: z.array(z.string()).optional(), // IDs des utilisateurs avec qui partager
});

// Schéma pour une activité RH avec validation
export const hrActivitySchema = hrActivityBaseSchema.refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "La date de fin doit être supérieure ou égale à la date de début",
    path: ["endDate"],
  }
);

// Schéma de base pour un timesheet RH (sans validation)
const hrTimesheetBaseSchema = z.object({
  weekStartDate: z.date({
    required_error: "La date de début de semaine est requise",
  }),
  weekEndDate: z.date({
    required_error: "La date de fin de semaine est requise",
  }),
  employeeName: z.string().min(1, "Le nom de l'employé est requis"),
  position: z.string().min(1, "Le poste est requis"),
  site: z.string().min(1, "Le site est requis"),
  employeeObservations: z.string().optional(),
});

// Schéma pour créer/mettre à jour un timesheet RH avec validation
export const hrTimesheetSchema = hrTimesheetBaseSchema.refine(
  (data) => data.weekEndDate >= data.weekStartDate,
  {
    message: "La date de fin de semaine doit être supérieure ou égale à la date de début",
    path: ["weekEndDate"],
  }
);

// Schéma pour soumettre un timesheet
export const submitHRTimesheetSchema = z.object({
  timesheetId: z.string(),
});

// Schéma pour approuver/rejeter un timesheet (Manager)
export const managerApprovalSchema = z.object({
  timesheetId: z.string(),
  action: z.enum(["approve", "reject"]),
  comments: z.string().optional(),
});

// Schéma pour validation finale (Odillon)
export const odillonApprovalSchema = z.object({
  timesheetId: z.string(),
  action: z.enum(["approve", "reject"]),
  comments: z.string().optional(),
});

// Schéma pour filtrer les timesheets
export const hrTimesheetFilterSchema = z.object({
  userId: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING", "MANAGER_APPROVED", "APPROVED", "REJECTED"]).optional(),
  weekStartDate: z.date().optional(),
  weekEndDate: z.date().optional(),
});

// Schéma pour obtenir le catalogue d'activités
export const activityCatalogFilterSchema = z.object({
  category: z.string().optional(),
  type: z.enum(["OPERATIONAL", "REPORTING"]).optional(),
  isActive: z.boolean().optional(),
});

// Exporter les schémas de base pour permettre .partial()
export { hrActivityBaseSchema, hrTimesheetBaseSchema };

// Types inférés pour TypeScript
export type HRActivityInput = z.infer<typeof hrActivitySchema>;
export type HRTimesheetInput = z.infer<typeof hrTimesheetSchema>;
export type SubmitHRTimesheetInput = z.infer<typeof submitHRTimesheetSchema>;
export type ManagerApprovalInput = z.infer<typeof managerApprovalSchema>;
export type OdillonApprovalInput = z.infer<typeof odillonApprovalSchema>;
export type HRTimesheetFilterInput = z.infer<typeof hrTimesheetFilterSchema>;
export type ActivityCatalogFilterInput = z.infer<typeof activityCatalogFilterSchema>;

