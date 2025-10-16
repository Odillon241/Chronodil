/**
 * Utilitaires pour logger l'historique des activités sur les tâches
 */

import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

// Types d'actions
export type TaskActionType =
  | "created"
  | "updated"
  | "status_changed"
  | "priority_changed"
  | "assigned"
  | "unassigned"
  | "commented"
  | "completed"
  | "reopened"
  | "name_changed"
  | "description_changed"
  | "due_date_changed"
  | "reminder_set"
  | "shared"
  | "unshared";

// Labels français pour les statuts
const STATUS_LABELS: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  REVIEW: "En révision",
  DONE: "Terminée",
  BLOCKED: "Bloquée",
};

// Labels français pour les priorités
const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente",
};

// Labels français pour les actions
const ACTION_LABELS: Record<TaskActionType, string> = {
  created: "a créé la tâche",
  updated: "a modifié la tâche",
  status_changed: "a changé le statut",
  priority_changed: "a changé la priorité",
  assigned: "a ajouté un membre",
  unassigned: "a retiré un membre",
  commented: "a commenté",
  completed: "a marqué comme terminée",
  reopened: "a réouvert la tâche",
  name_changed: "a renommé la tâche",
  description_changed: "a modifié la description",
  due_date_changed: "a modifié la date d'échéance",
  reminder_set: "a défini un rappel",
  shared: "a partagé la tâche",
  unshared: "a rendu la tâche privée",
};

interface LogActivityParams {
  taskId: string;
  userId: string;
  action: TaskActionType;
  field?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}

/**
 * Formatte une description lisible de l'activité
 */
function formatDescription(params: LogActivityParams): string {
  const actionLabel = ACTION_LABELS[params.action];

  switch (params.action) {
    case "created":
      return actionLabel;

    case "status_changed":
      const oldStatus = STATUS_LABELS[params.oldValue || ""] || params.oldValue;
      const newStatus = STATUS_LABELS[params.newValue || ""] || params.newValue;
      return `${actionLabel} de "${oldStatus}" à "${newStatus}"`;

    case "priority_changed":
      const oldPriority = PRIORITY_LABELS[params.oldValue || ""] || params.oldValue;
      const newPriority = PRIORITY_LABELS[params.newValue || ""] || params.newValue;
      return `${actionLabel} de "${oldPriority}" à "${newPriority}"`;

    case "assigned":
      return `${actionLabel} "${params.newValue}"`;

    case "unassigned":
      return `${actionLabel} "${params.oldValue}"`;

    case "name_changed":
      return `${actionLabel} : "${params.oldValue}" → "${params.newValue}"`;

    case "due_date_changed":
      if (!params.oldValue && params.newValue) {
        return `a défini la date d'échéance au ${params.newValue}`;
      } else if (params.oldValue && !params.newValue) {
        return `a supprimé la date d'échéance`;
      } else {
        return `${actionLabel} : ${params.oldValue} → ${params.newValue}`;
      }

    case "completed":
      return actionLabel;

    case "reopened":
      return actionLabel;

    case "shared":
      return actionLabel;

    case "commented":
      return actionLabel;

    default:
      return actionLabel;
  }
}

/**
 * Enregistre une activité dans l'historique
 */
export async function logTaskActivity(params: LogActivityParams): Promise<void> {
  try {
    const description = formatDescription(params);

    await prisma.taskActivity.create({
      data: {
        id: nanoid(),
        taskId: params.taskId,
        userId: params.userId,
        action: params.action,
        field: params.field,
        oldValue: params.oldValue,
        newValue: params.newValue,
        description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'activité:", error);
    // Ne pas faire échouer l'opération principale si le log échoue
  }
}

/**
 * Détecte et log les changements entre deux objets
 */
export async function logTaskChanges(
  taskId: string,
  userId: string,
  oldTask: any,
  newTask: any
): Promise<void> {
  const changes: LogActivityParams[] = [];

  // Changement de nom
  if (oldTask.name !== newTask.name) {
    changes.push({
      taskId,
      userId,
      action: "name_changed",
      field: "name",
      oldValue: oldTask.name,
      newValue: newTask.name,
    });
  }

  // Changement de description
  if (oldTask.description !== newTask.description) {
    changes.push({
      taskId,
      userId,
      action: "description_changed",
      field: "description",
      oldValue: oldTask.description || "vide",
      newValue: newTask.description || "vide",
    });
  }

  // Changement de statut
  if (oldTask.status !== newTask.status) {
    changes.push({
      taskId,
      userId,
      action: "status_changed",
      field: "status",
      oldValue: oldTask.status,
      newValue: newTask.status,
    });
  }

  // Changement de priorité
  if (oldTask.priority !== newTask.priority) {
    changes.push({
      taskId,
      userId,
      action: "priority_changed",
      field: "priority",
      oldValue: oldTask.priority,
      newValue: newTask.priority,
    });
  }

  // Changement de date d'échéance
  if (oldTask.dueDate?.getTime() !== newTask.dueDate?.getTime()) {
    changes.push({
      taskId,
      userId,
      action: "due_date_changed",
      field: "dueDate",
      oldValue: oldTask.dueDate?.toLocaleDateString("fr-FR"),
      newValue: newTask.dueDate?.toLocaleDateString("fr-FR"),
    });
  }

  // Enregistrer tous les changements
  for (const change of changes) {
    await logTaskActivity(change);
  }
}

