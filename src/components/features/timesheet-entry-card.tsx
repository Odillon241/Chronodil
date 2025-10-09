"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface TimesheetEntry {
  id: string;
  duration: number;
  description?: string | null;
  status: string;
  project: {
    name: string;
    color?: string;
  };
}

interface TimesheetEntryCardProps {
  entry: TimesheetEntry;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

const STATUS_CONFIG = {
  DRAFT: { label: "Brouillon", className: "bg-gray-100 text-gray-800" },
  SUBMITTED: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Approuvé", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejeté", className: "bg-red-100 text-red-800" },
  LOCKED: { label: "Verrouillé", className: "bg-blue-100 text-blue-800" },
} as const;

export function TimesheetEntryCard({
  entry,
  onDelete,
  showActions = true,
}: TimesheetEntryCardProps) {
  const statusConfig = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;

  return (
    <div className="p-3 border rounded-lg space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {entry.project.color && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.project.color }}
            />
          )}
          <span className="text-sm font-medium">{entry.project.name}</span>
        </div>
        <span className="text-sm font-bold text-rusty-red">{entry.duration}h</span>
      </div>

      {entry.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{entry.description}</p>
      )}

      <div className="flex items-center justify-between pt-1">
        <Badge className={statusConfig.className}>{statusConfig.label}</Badge>

        {showActions && entry.status === "DRAFT" && onDelete && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(entry.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
