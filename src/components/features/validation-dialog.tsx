"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { validateTimesheetEntry, bulkValidateEntries } from "@/actions/validation.actions";
import { toast } from "sonner";
import { formatDuration } from "@/lib/utils/timesheet.utils";

interface TimesheetEntry {
  id: string;
  date: Date;
  duration: number;
  type: string;
  description: string | null;
  user: {
    name: string | null;
    email: string;
  };
  project: {
    name: string;
    color: string | null;
  };
  task: {
    name: string;
  } | null;
}

interface ValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: TimesheetEntry | null;
  entryIds?: string[];
  onComplete: () => void;
}

const validationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
});

type ValidationFormData = z.infer<typeof validationSchema>;

export function ValidationDialog({
  open,
  onOpenChange,
  entry,
  entryIds,
  onComplete,
}: ValidationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"APPROVED" | "REJECTED" | null>(null);

  const isBulkMode = Boolean(entryIds && entryIds.length > 0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ValidationFormData>({
    resolver: zodResolver(validationSchema),
  });

  const onSubmit = async (data: ValidationFormData) => {
    if (!selectedStatus) {
      toast.error("Veuillez sélectionner une action");
      return;
    }

    setIsLoading(true);

    try {
      if (isBulkMode && entryIds) {
        // Validation en masse
        const result = await bulkValidateEntries({
          entryIds,
          status: selectedStatus,
          comment: data.comment,
        });

        if (result?.data) {
          toast.success(
            `${entryIds.length} entrée(s) ${
              selectedStatus === "APPROVED" ? "approuvée(s)" : "rejetée(s)"
            }`
          );
          reset();
          setSelectedStatus(null);
          onComplete();
        }
      } else if (entry) {
        // Validation unique
        const result = await validateTimesheetEntry({
          timesheetEntryId: entry.id,
          status: selectedStatus,
          comment: data.comment,
        });

        if (result?.data) {
          toast.success(
            `Entrée ${selectedStatus === "APPROVED" ? "approuvée" : "rejetée"} avec succès`
          );
          reset();
          setSelectedStatus(null);
          onComplete();
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (status: "APPROVED" | "REJECTED") => {
    setSelectedStatus(status);
    // Soumettre automatiquement si approuvé sans commentaire
    if (status === "APPROVED") {
      handleSubmit((data) => onSubmit({ ...data, status }))();
    }
  };

  const handleClose = () => {
    reset();
    setSelectedStatus(null);
    onOpenChange(false);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      NORMAL: "Normal",
      OVERTIME: "Heures sup.",
      NIGHT: "Heures nuit",
      WEEKEND: "Week-end",
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isBulkMode
              ? `Valider ${entryIds?.length} entrée(s)`
              : "Valider l'entrée de temps"}
          </DialogTitle>
          <DialogDescription>
            {isBulkMode
              ? "Approuvez ou rejetez les entrées sélectionnées"
              : "Approuvez ou rejetez cette entrée de temps"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Détails de l'entrée (mode simple) */}
          {!isBulkMode && entry && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(entry.date), "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                </div>
                <Badge variant="outline">{getTypeLabel(entry.type)}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Utilisateur</p>
                  <p className="font-medium">{entry.user.name || "Utilisateur inconnu"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Durée</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDuration(entry.duration)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Projet</p>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.project.color || "#3b82f6" }}
                  />
                  <p className="font-medium">{entry.project.name}</p>
                </div>
              </div>

              {entry.task && (
                <div>
                  <p className="text-sm text-muted-foreground">Tâche</p>
                  <p className="font-medium">{entry.task.name}</p>
                </div>
              )}

              {entry.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{entry.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Mode bulk */}
          {isBulkMode && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm">
                Vous êtes sur le point de valider{" "}
                <span className="font-semibold">{entryIds?.length} entrée(s)</span> de temps.
              </p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => handleAction("APPROVED")}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Approuver
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSelectedStatus("REJECTED");
              }}
              disabled={isLoading}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Rejeter
            </Button>
          </div>

          {/* Commentaire (obligatoire pour rejet) */}
          {selectedStatus === "REJECTED" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="comment" className="text-red-600">
                Commentaire de rejet *
              </Label>
              <Textarea
                id="comment"
                placeholder="Expliquez pourquoi vous rejetez cette entrée..."
                {...register("comment", {
                  required: selectedStatus === "REJECTED" ? "Le commentaire est requis pour un rejet" : false,
                })}
                rows={4}
                className="resize-none"
              />
              {errors.comment && (
                <p className="text-sm text-red-600">{errors.comment.message}</p>
              )}
            </div>
          )}

          {/* Actions du dialog */}
          {selectedStatus === "REJECTED" && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedStatus(null);
                  reset();
                }}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isLoading}
              >
                {isLoading ? "Rejet en cours..." : "Confirmer le rejet"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
