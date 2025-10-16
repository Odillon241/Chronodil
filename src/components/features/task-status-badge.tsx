import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Eye, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskStatusBadgeProps {
  status: string;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const variants = {
    TODO: {
      className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
      icon: Circle,
      label: "À faire",
    },
    IN_PROGRESS: {
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      icon: Clock,
      label: "En cours",
    },
    REVIEW: {
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      icon: Eye,
      label: "Revue",
    },
    DONE: {
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      icon: CheckCircle2,
      label: "Terminé",
    },
    BLOCKED: {
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      icon: Ban,
      label: "Bloqué",
    },
  };

  const variant = variants[status as keyof typeof variants] || variants.TODO;
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={cn(variant.className, "gap-1", className)}>
      <Icon className="h-3 w-3" />
      <span>{variant.label}</span>
    </Badge>
  );
}

