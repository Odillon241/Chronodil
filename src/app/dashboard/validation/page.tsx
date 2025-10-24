"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getPendingValidations, validateTimesheetEntry } from "@/actions/validation.actions";
import { ChartAreaInteractive } from "@/components/features/chart-area-interactive";
import { BulkValidationToolbar } from "@/components/features/bulk-validation-toolbar";

export default function ValidationPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const entriesResult = await getPendingValidations({});

      if (entriesResult?.data) {
        setEntries(entriesResult.data);
      } else if (entriesResult?.serverError?.includes("Permissions insuffisantes")) {
        setHasPermission(false);
        toast.error("Vous n'avez pas les permissions nécessaires pour accéder à cette page");
      }
    } catch (error: any) {
      if (error?.message?.includes("Permissions insuffisantes")) {
        setHasPermission(false);
        toast.error("Vous n'avez pas les permissions nécessaires pour accéder à cette page");
      } else {
        toast.error("Erreur lors du chargement");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = (entry: any, validationAction: "APPROVED" | "REJECTED") => {
    console.log("handleValidation called:", { entry, validationAction });
    setSelectedEntry(entry);
    setAction(validationAction);
    setDialogOpen(true);
    console.log("Dialog should be open now");
  };

  const confirmValidation = async () => {
    if (!selectedEntry || !action) return;

    console.log("Confirming validation:", {
      timesheetEntryId: selectedEntry.id,
      status: action,
      comment: comment || undefined,
    });

    try {
      const result = await validateTimesheetEntry({
        timesheetEntryId: selectedEntry.id,
        status: action,
        comment: comment || undefined,
      });

      console.log("Validation result:", result);

      if (result?.data) {
        const actionText = action === "APPROVED" ? "approuvée" : "rejetée";
        toast.success(`Saisie ${actionText} avec succès !`);
        setDialogOpen(false);
        setComment("");
        setSelectedEntry(null);
        setAction(null);
        loadData();
      } else {
        console.error("Validation error:", result?.serverError);
        toast.error(result?.serverError || "Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Validation exception:", error);
      toast.error("Erreur lors de la validation");
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm sm:text-base text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 px-4">
        <XCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500" />
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold">Accès refusé</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Seuls les <span className="font-semibold">Managers</span>, <span className="font-semibold">RH</span> et{" "}
            <span className="font-semibold">Administrateurs</span> peuvent valider les temps.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto text-sm">
          Retour
        </Button>
      </div>
    );
  }

  const handleBulkValidationComplete = () => {
    setSelectedEntries([]);
    loadData();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(entries.map(e => e.id));
    } else {
      setSelectedEntries([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedEntries([]);
  };

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Validation des temps</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Validez ou rejetez les saisies de temps de votre équipe
        </p>
      </div>

      <ChartAreaInteractive />

      {entries.length > 0 && (
        <BulkValidationToolbar
          selectedIds={selectedEntries}
          totalCount={entries.length}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onValidationComplete={handleBulkValidationComplete}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Saisies à valider</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Liste des saisies en attente de validation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
                Aucune saisie à valider
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 hover:border-primary transition-colors ${
                    selectedEntries.includes(entry.id) ? "bg-muted/50 border-primary" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedEntries.includes(entry.id)}
                        onCheckedChange={() => toggleEntrySelection(entry.id)}
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{entry.User.name}</h3>
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">
                          {entry.User.email}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <span className="font-medium text-primary truncate">
                          {entry.Project?.name || "Projet non assigné"}
                        </span>
                        {entry.Task && (
                          <>
                            <span className="hidden sm:inline text-muted-foreground">•</span>
                            <span className="text-muted-foreground truncate">{entry.Task.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-xl sm:text-2xl font-bold text-primary">
                        {entry.duration}h
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {format(new Date(entry.date), "dd MMM yyyy", { locale: fr })}
                      </div>
                    </div>
                  </div>

                  {entry.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground">{entry.description}</p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full whitespace-nowrap ${
                          entry.type === "OVERTIME"
                            ? "bg-primary/20 text-primary"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {entry.type === "OVERTIME"
                          ? "Heures sup."
                          : entry.type === "NIGHT"
                          ? "Nuit"
                          : entry.type === "WEEKEND"
                          ? "Week-end"
                          : "Normal"}
                      </span>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-initial text-xs sm:text-sm"
                        onClick={() => handleValidation(entry, "REJECTED")}
                      >
                        <XCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Rejeter
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-initial text-xs sm:text-sm"
                        onClick={() => handleValidation(entry, "APPROVED")}
                      >
                        <CheckCircle2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Approuver
                      </Button>
                    </div>
                  </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {action === "APPROVED" ? "Approuver" : "Rejeter"} la saisie
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedEntry && (
                <>
                  {selectedEntry.User.name} - {selectedEntry.duration}h sur{" "}
                  {selectedEntry.Project?.name || "Projet non assigné"}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-xs sm:text-sm">
                Commentaire {action === "REJECTED" && "(requis)"}
              </Label>
              <Input
                id="comment"
                placeholder="Ajoutez un commentaire..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto text-sm">
              Annuler
            </Button>
            <Button
              className={`w-full sm:w-auto text-sm ${
                action === "APPROVED"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              onClick={confirmValidation}
              disabled={action === "REJECTED" && !comment}
            >
              {action === "APPROVED" ? "Approuver" : "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
