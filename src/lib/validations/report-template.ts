import { z } from "zod";

// ============================================
// ENUMS
// ============================================

export const ReportTemplateFrequency = z.enum(["WEEKLY", "MONTHLY", "INDIVIDUAL"]);
export const ReportTemplateFormat = z.enum(["word", "pdf", "excel"]);

// ============================================
// REPORT TEMPLATE SCHEMAS
// ============================================

/**
 * Schéma de création d'un modèle de rapport
 */
export const createReportTemplateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long"),
  description: z.string().optional(),
  frequency: ReportTemplateFrequency,
  format: ReportTemplateFormat.default("word"),
  templateContent: z.string().min(1, "Le contenu du modèle est requis"),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

/**
 * Schéma de mise à jour d'un modèle de rapport
 */
export const updateReportTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  frequency: ReportTemplateFrequency.optional(),
  format: ReportTemplateFormat.optional(),
  templateContent: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

/**
 * Schéma de suppression d'un modèle de rapport
 */
export const deleteReportTemplateSchema = z.object({
  id: z.string(),
});

/**
 * Schéma pour définir un modèle comme défaut
 */
export const setDefaultTemplateSchema = z.object({
  id: z.string(),
  frequency: ReportTemplateFrequency,
});

// ============================================
// REPORT GENERATION SCHEMAS
// ============================================

/**
 * Schéma pour générer un rapport depuis une feuille de temps
 */
export const generateReportFromTimesheetSchema = z.object({
  hrTimesheetId: z.string(),
  templateId: z.string().optional(),
  title: z.string().optional(),
  format: ReportTemplateFormat.default("word"),
  includeSummary: z.boolean().default(false),
  customContent: z.string().optional(),
});

/**
 * Schéma pour consolider des rapports hebdomadaires en rapport mensuel
 */
export const consolidateMonthlyReportSchema = z.object({
  userId: z.string().optional(), // Si non fourni, utilise l'utilisateur connecté
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  templateId: z.string().optional(),
  title: z.string().optional(),
  format: ReportTemplateFormat.default("word"),
  includeSummary: z.boolean().default(true),
});

/**
 * Schéma pour exporter un rapport
 */
export const exportReportSchema = z.object({
  reportId: z.string(),
  format: ReportTemplateFormat,
});

// ============================================
// TYPES
// ============================================

export type CreateReportTemplateInput = z.infer<typeof createReportTemplateSchema>;
export type UpdateReportTemplateInput = z.infer<typeof updateReportTemplateSchema>;
export type DeleteReportTemplateInput = z.infer<typeof deleteReportTemplateSchema>;
export type SetDefaultTemplateInput = z.infer<typeof setDefaultTemplateSchema>;
export type GenerateReportFromTimesheetInput = z.infer<typeof generateReportFromTimesheetSchema>;
export type ConsolidateMonthlyReportInput = z.infer<typeof consolidateMonthlyReportSchema>;
export type ExportReportInput = z.infer<typeof exportReportSchema>;
