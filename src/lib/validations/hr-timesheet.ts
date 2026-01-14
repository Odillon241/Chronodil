import { z } from "zod";

// Schéma de base pour une activité RH (sans validation)
// Note: On utilise z.coerce.date() pour convertir automatiquement les strings ISO en Date
// car Next.js Server Actions sérialisent les dates en JSON (strings)
const hrActivityBaseSchema = z.object({
  activityType: z.enum(["OPERATIONAL", "REPORTING"]),
  activityName: z.string().min(1, "Le nom de l'activité est requis"),
  description: z.string().optional(),
  periodicity: z.enum(["DAILY", "WEEKLY", "MONTHLY", "PUNCTUAL", "WEEKLY_MONTHLY"]),
  // Permettre 0 ou undefined, transformer NaN en undefined
  weeklyQuantity: z.preprocess(
    (val) => (val === 0 || Number.isNaN(val) ? undefined : val),
    z.number().int().min(1).optional()
  ),
  totalHours: z.preprocess(
    (val) => (Number.isNaN(val) ? undefined : val),
    z.number().min(0).optional()
  ),
  startDate: z.coerce.date({ message: "La date de début est requise ou invalide" }),
  endDate: z.coerce.date({ message: "La date de fin est requise ou invalide" }),
  status: z.enum(["IN_PROGRESS", "COMPLETED"]).default("IN_PROGRESS"),
  catalogId: z.string().optional(),
  // Nouveaux champs pour intégration avec Task
  taskId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  complexity: z.enum(["FAIBLE", "MOYEN", "LEV_"]).optional(),
  estimatedHours: z.preprocess(
    (val) => (val === 0 || Number.isNaN(val) ? undefined : val),
    z.number().min(0).optional()
  ),
  dueDate: z.coerce.date().optional(),
  reminderDate: z.coerce.date().optional(),
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
// Note: On utilise z.coerce.date() pour convertir automatiquement les strings ISO en Date
const hrTimesheetBaseSchema = z.object({
  weekStartDate: z.coerce.date({ message: "La date de début de semaine est requise ou invalide" }),
  weekEndDate: z.coerce.date({ message: "La date de fin de semaine est requise ou invalide" }),
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

// Schéma pour rétrograder le statut d'un timesheet (Admin uniquement)
export const revertHRTimesheetStatusSchema = z.object({
  timesheetId: z.string(),
  targetStatus: z.enum(["DRAFT", "PENDING", "MANAGER_APPROVED"]),
  reason: z.string().min(1, "Une raison est requise pour rétrograder le statut"),
});

// Schéma pour filtrer les timesheets
export const hrTimesheetFilterSchema = z.object({
  userId: z.string().optional(),
  status: z.enum(["all", "DRAFT", "PENDING", "MANAGER_APPROVED", "APPROVED", "REJECTED"]).optional(),
  weekStartDate: z.coerce.date().optional(),
  weekEndDate: z.coerce.date().optional(),
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
// Utiliser z.input pour les formulaires (avant transformation par Zod)
// et z.infer/z.output pour les données validées (après transformation)
export type HRActivityInput = z.input<typeof hrActivitySchema>;
export type HRActivityOutput = z.output<typeof hrActivitySchema>;
export type HRTimesheetInput = z.input<typeof hrTimesheetSchema>;
export type HRTimesheetOutput = z.output<typeof hrTimesheetSchema>;
export type SubmitHRTimesheetInput = z.infer<typeof submitHRTimesheetSchema>;
export type ManagerApprovalInput = z.infer<typeof managerApprovalSchema>;
export type OdillonApprovalInput = z.infer<typeof odillonApprovalSchema>;
export type HRTimesheetFilterInput = z.infer<typeof hrTimesheetFilterSchema>;
export type ActivityCatalogFilterInput = z.infer<typeof activityCatalogFilterSchema>;

