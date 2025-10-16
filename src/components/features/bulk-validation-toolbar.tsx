"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { bulkValidateEntries } from "@/actions/validation.actions";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BulkValidationToolbarProps {
  selectedIds: string[];
  totalCount: number;
  onSelectAll: (checked: boolean) => void;
  onClearSelection: () => void;
  onValidationComplete: () => void;
}

export function BulkValidationToolbar({
  selectedIds,
  totalCount,
  onSelectAll,
  onClearSelection,
  onValidationComplete,
}: BulkValidationToolbarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [action, setAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [comment, setComment] = useState("");

  const handleBulkValidation = async (status: "APPROVED" | "REJECTED") => {
    setAction(status);
    if (status === "REJECTED") {
      setShowDialog(true);
    } else {
      await executeBulkValidation(status, "");
    }
  };

  const executeBulkValidation = async (status: "APPROVED" | "REJECTED", commentText: string) => {
    setIsLoading(true);
    try {
      const result = await bulkValidateEntries({
        entryIds: selectedIds,
        status,
        comment: commentText || undefined,
      });

      if (result?.data) {
        const actionText = status === "APPROVED" ? "approuvées" : "rejetées";
        toast.success(`${selectedIds.length} saisie(s) ${actionText} avec succès !`);
        setShowDialog(false);
        setComment("");
        onClearSelection();
        onValidationComplete();
      } else {
        toast.error(result?.serverError || "Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Bulk validation error:", error);
      toast.error("Erreur lors de la validation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!comment.trim()) {
      toast.error("Un commentaire est requis pour rejeter des saisies");
      return;
    }
    await executeBulkValidation("REJECTED", comment);
  };

  if (selectedIds.length === 0) {
    return (
      <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={false}
            onCheckedChange={(checked) => onSelectAll(checked as boolean)}
            id="select-all"
          />
          <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Tout sélectionner ({totalCount})
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Sélectionnez des saisies pour les valider en masse
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-blue-50 dark:bg-blue-950/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedIds.length === totalCount}
              onCheckedChange={(checked) => onSelectAll(checked as boolean)}
              id="select-all-selected"
            />
            <Label htmlFor="select-all-selected" className="text-sm font-medium cursor-pointer">
              Tout sélectionner
            </Label>
          </div>
          <Badge variant="secondary" className="text-sm">
            {selectedIds.length} sélectionnée(s)
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleBulkValidation("REJECTED")}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Rejeter ({selectedIds.length})
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleBulkValidation("APPROVED")}
            disabled={isLoading}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approuver ({selectedIds.length})
          </Button>
        </div>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter les saisies sélectionnées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de rejeter {selectedIds.length} saisie(s).
              Un commentaire est requis pour expliquer le rejet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reject-comment">Commentaire *</Label>
            <Input
              id="reject-comment"
              placeholder="Expliquez la raison du rejet..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDialog(false);
              setComment("");
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={!comment.trim() || isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Rejet en cours..." : "Rejeter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
