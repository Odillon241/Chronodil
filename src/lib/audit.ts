/**
 * Utilitaires pour la création de logs d'audit
 * 
 * Ce module fournit des fonctions pour créer des logs d'audit de manière centralisée.
 * Tous les audits incluent automatiquement l'IP et le userAgent.
 * 
 * @example
 * // Création simple
 * await createAuditLog({
 *   userId: session.user.id,
 *   action: "CREATE",
 *   entity: "Task",
 *   entityId: task.id,
 * });
 * 
 * // Avec changements détaillés
 * await createAuditLog({
 *   userId: session.user.id,
 *   action: "UPDATE",
 *   entity: "Task",
 *   entityId: task.id,
 *   changes: {
 *     previousStatus: "TODO",
 *     newStatus: "IN_PROGRESS",
 *   },
 * });
 */

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import { getClientIP } from "@/lib/utils";

export interface CreateAuditLogParams {
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  changes?: any;
}

/**
 * Crée un log d'audit avec IP et userAgent automatiquement capturés
 * 
 * @param params - Paramètres du log d'audit
 * @param params.userId - ID de l'utilisateur qui a effectué l'action (null pour actions système)
 * @param params.action - Type d'action (CREATE, UPDATE, DELETE, etc.)
 * @param params.entity - Type d'entité (Task, Project, User, HRTimesheet, etc.)
 * @param params.entityId - ID de l'entité concernée
 * @param params.changes - Objet contenant les détails des changements (optionnel)
 * 
 * @example
 * await createAuditLog({
 *   userId: session.user.id,
 *   action: "CREATE",
 *   entity: "Task",
 *   entityId: task.id,
 *   changes: { name: task.name, status: task.status },
 * });
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    const requestHeaders = await headers();
    const clientIP = getClientIP(requestHeaders);
    const userAgent = requestHeaders.get("user-agent");

    // Log pour debug (uniquement en développement)
    if (process.env.NODE_ENV === "development" && !clientIP) {
      console.warn(
        "[Audit] Aucune IP détectée dans les headers. " +
        "En développement local, l'IP peut ne pas être disponible. " +
        "En production (Vercel, etc.), l'IP sera automatiquement capturée."
      );
    }

    await prisma.auditLog.create({
      data: {
        id: nanoid(),
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        changes: params.changes || null,
        ipAddress: clientIP,
        userAgent: userAgent,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    // Ne pas faire échouer l'opération principale si le log d'audit échoue
    console.error("Erreur lors de la création du log d'audit:", error);
  }
}

/**
 * Actions d'audit standardisées
 */
export const AuditActions = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  SUBMIT: "SUBMIT",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  REVERT: "REVERT",
  REVERT_TIMESHEET_STATUS: "REVERT_TIMESHEET_STATUS",
} as const;

/**
 * Entités auditées
 */
export const AuditEntities = {
  TASK: "Task",
  PROJECT: "Project",
  USER: "User",
  HRTIMESHEET: "HRTimesheet",
  HRACTIVITY: "HRActivity",
  MESSAGE: "Message",
  NOTIFICATION: "Notification",
  SETTINGS: "Settings",
} as const;

