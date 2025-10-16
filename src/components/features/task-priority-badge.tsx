import { Badge } from "@/components/ui/badge";
import { ArrowDown, Minus, ArrowUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskPriorityBadgeProps {
  priority: string;
  className?: string;
}

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  const variants = {
    LOW: {
      className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
      icon: ArrowDown,
      label: "Basse",
    },
    MEDIUM: {
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      icon: Minus,
      label: "Moyenne",
    },
    HIGH: {
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      icon: ArrowUp,
      label: "Haute",
    },
    URGENT: {
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 animate-pulse",
      icon: AlertTriangle,
      label: "Urgent",
    },
  };

  const variant = variants[priority as keyof typeof variants] || variants.MEDIUM;
  const Icon = variant.icon;

  return (
    <Badge variant="outline" className={cn(variant.className, "gap-1", className)}>
      <Icon className="h-3 w-3" />
      <span>{variant.label}</span>
    </Badge>
  );
}

