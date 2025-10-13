import { z } from "zod";

export const timesheetEntrySchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  date: z.date({
    required_error: "La date est requise",
  }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number()
    .min(0.25, "La durée minimale est de 15 minutes")
    .max(24, "La durée maximale est de 24 heures")
    .refine((val) => {
      // Vérifier que la valeur est un multiple de 0.25 (15 minutes)
      const rounded = Math.round(val * 4) / 4;
      return Math.abs(val - rounded) < 0.001;
    }, {
      message: "La durée doit être un multiple de 15 minutes (0,25h)"
    }),
  type: z.enum(["NORMAL", "OVERTIME", "NIGHT", "WEEKEND"]).default("NORMAL"),
  description: z.string().optional(),
});

export const timesheetValidationSchema = z.object({
  timesheetEntryId: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
});

export type TimesheetEntryInput = z.infer<typeof timesheetEntrySchema>;
export type TimesheetValidationInput = z.infer<typeof timesheetValidationSchema>;
