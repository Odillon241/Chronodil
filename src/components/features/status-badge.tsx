import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TimesheetStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "LOCKED";

interface StatusBadgeProps {
  status: TimesheetStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  TimesheetStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Brouillon",
    className: "bg-gray-100 text-gray-800 border-gray-300",
  },
  SUBMITTED: {
    label: "En attente",
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },
  APPROVED: {
    label: "Approuvé",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  REJECTED: {
    label: "Rejeté",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  LOCKED: {
    label: "Verrouillé",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export function getStatusLabel(status: string): string {
  return STATUS_CONFIG[status as TimesheetStatus]?.label || status;
}

export function getStatusClassName(status: string): string {
  return STATUS_CONFIG[status as TimesheetStatus]?.className || STATUS_CONFIG.DRAFT.className;
}
