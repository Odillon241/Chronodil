// Types et constantes partagés pour les composants de gestion de tâches

export interface TaskOwner {
  id: string;
  name: string;
  email?: string;
  image?: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  dueDate?: string | Date;
  startAt?: string | Date;
  endAt?: string | Date;
  estimatedHours?: number;
  status: string;
  priority: string;
  isShared?: boolean;
  isActive?: boolean;
  reminderDate?: string | Date;
  owner?: TaskOwner;
  group?: string;
  initiative?: string;
  release?: string;
  color?: string;
  project?: {
    name: string;
    color: string;
  };
  Project?: {
    name: string;
    color: string;
  };
}

export const STATUS_COLORS = {
  PLANNED: "#6B7280",
  IN_PROGRESS: "#F59E0B",
  DONE: "#10B981",
  TODO: "#6B7280",
  PENDING: "#6B7280",
  COMPLETED: "#10B981",
} as const;
