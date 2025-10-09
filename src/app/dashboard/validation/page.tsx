"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getPendingValidations, validateTimesheetEntry, getValidationStats } from "@/actions/validation.actions";

export default function ValidationPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesResult, statsResult] = await Promise.all([
        getPendingValidations({}),
        getValidationStats({
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          endDate: new Date(),
        }),
      ]);

      if (entriesResult?.data) {
        setEntries(entriesResult.data);
      }

      if (statsResult?.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = (entry: any, validationAction: "APPROVED" | "REJECTED") => {
    setSelectedEntry(entry);
    setAction(validationAction);
    setDialogOpen(true);
  };

  const confirmValidation = async () => {
    if (!selectedEntry || !action) return;

    try {
      const result = await validateTimesheetEntry({
        timesheetEntryId: selectedEntry.id,
        status: action,
        comment: comment || undefined,
      });

      if (result?.data) {
        const actionText = action === "APPROVED" ? "approuvée" : "rejetée";
        toast.success(`Saisie ${actionText} avec succès !`);
        setDialogOpen(false);
        setComment("");
        setSelectedEntry(null);
        setAction(null);
        loadData();
      } else {
        toast.error(result?.serverError || "Erreur lors de la validation");
      }
    } catch (error) {
      toast.error("Erreur lors de la validation");
    }
  };

  const statsCards = [
    {
      title: "En attente",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Approuvées",
      value: stats.approved,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Rejetées",
      value: stats.rejected,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Validation des temps</h1>
        <p className="text-muted-foreground">
          Validez ou rejetez les saisies de temps de votre équipe
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-md`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saisies à valider</CardTitle>
          <CardDescription>Liste des saisies en attente de validation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune saisie à valider
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 space-y-4 hover:border-rusty-red transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{entry.user.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          • {entry.user.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-rusty-red">
                          {entry.project.name}
                        </span>
                        {entry.task && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{entry.task.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-rusty-red">
                        {entry.duration}h
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(entry.date), "dd MMM yyyy", { locale: fr })}
                      </div>
                    </div>
                  </div>

                  {entry.description && (
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          entry.type === "OVERTIME"
                            ? "bg-bright-pink/20 text-bright-pink-700"
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

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleValidation(entry, "REJECTED")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeter
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleValidation(entry, "APPROVED")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approuver
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "APPROVED" ? "Approuver" : "Rejeter"} la saisie
            </DialogTitle>
            <DialogDescription>
              {selectedEntry && (
                <>
                  {selectedEntry.user.name} - {selectedEntry.duration}h sur{" "}
                  {selectedEntry.project.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                Commentaire {action === "REJECTED" && "(requis)"}
              </Label>
              <Input
                id="comment"
                placeholder="Ajoutez un commentaire..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className={
                action === "APPROVED"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
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
