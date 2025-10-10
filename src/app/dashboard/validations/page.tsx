"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, User, Calendar, AlertCircle } from "lucide-react";
import { getPendingValidations, getValidationStats } from "@/actions/validation.actions";
import { ValidationDialog } from "@/components/features/validation-dialog";
import { toast } from "sonner";
import { formatDuration } from "@/lib/utils/timesheet.utils";

interface TimesheetEntry {
  id: string;
  date: Date;
  duration: number;
  type: string;
  description: string | null;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  project: {
    id: string;
    name: string;
    color: string | null;
  };
  task: {
    id: string;
    name: string;
  } | null;
}

interface ValidationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  approvalRate: number;
}

export default function ValidationsPage() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  });
  const [selectedEntry, setSelectedEntry] = useState<TimesheetEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [entriesResult, statsResult] = await Promise.all([
        getPendingValidations(dateRange),
        getValidationStats(dateRange),
      ]);

      if (entriesResult?.data) {
        setEntries(entriesResult.data as unknown as TimesheetEntry[]);
      }

      if (statsResult?.data) {
        setStats(statsResult.data as ValidationStats);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const handleSelectEntry = (entryId: string) => {
    setSelectedEntries((prev) =>
      prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEntries.length === entries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(entries.map((e) => e.id));
    }
  };

  const handleValidate = (entry: TimesheetEntry) => {
    setSelectedEntry(entry);
    setIsBulkMode(false);
    setIsDialogOpen(true);
  };

  const handleBulkValidate = () => {
    if (selectedEntries.length === 0) {
      toast.error("Veuillez sélectionner au moins une entrée");
      return;
    }
    setIsBulkMode(true);
    setIsDialogOpen(true);
  };

  const handleValidationComplete = () => {
    setIsDialogOpen(false);
    setSelectedEntry(null);
    setSelectedEntries([]);
    setIsBulkMode(false);
    loadData();
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

  const getTypeColor = (type: string) => {
    const colors = {
      NORMAL: "default",
      OVERTIME: "secondary",
      NIGHT: "destructive",
      WEEKEND: "outline",
    };
    return colors[type as keyof typeof colors] || "default";
  };

  // Grouper les entrées par utilisateur
  const entriesByUser = entries.reduce((acc, entry) => {
    const userId = entry.user.id;
    if (!acc[userId]) {
      acc[userId] = {
        user: entry.user,
        entries: [],
        totalHours: 0,
      };
    }
    acc[userId].entries.push(entry);
    acc[userId].totalHours += entry.duration;
    return acc;
  }, {} as Record<string, { user: TimesheetEntry["user"]; entries: TimesheetEntry[]; totalHours: number }>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-rusty-red" />
          <p className="text-muted-foreground">Chargement des validations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Validations</h1>
        <p className="text-muted-foreground">
          Validez les feuilles de temps soumises par votre équipe
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux d&apos;approbation</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.approvalRate.toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Entrées en attente</CardTitle>
              <CardDescription>
                {entries.length} entrée(s) à valider
                {selectedEntries.length > 0 && ` • ${selectedEntries.length} sélectionnée(s)`}
              </CardDescription>
            </div>
            {selectedEntries.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkValidate}
                  variant="outline"
                  size="sm"
                >
                  Valider la sélection ({selectedEntries.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">Tout est à jour !</h3>
              <p className="text-muted-foreground">
                Aucune feuille de temps en attente de validation.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(entriesByUser).map(({ user, entries: userEntries, totalHours }) => (
                <div key={user.id} className="border rounded-lg p-4">
                  {/* En-tête utilisateur */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-rusty-red/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-rusty-red" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.name || "Utilisateur inconnu"}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-rusty-red">
                        {formatDuration(totalHours)}
                      </p>
                    </div>
                  </div>

                  {/* Table des entrées */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={userEntries.every((e) => selectedEntries.includes(e.id))}
                            onCheckedChange={() => {
                              const allSelected = userEntries.every((e) =>
                                selectedEntries.includes(e.id)
                              );
                              if (allSelected) {
                                setSelectedEntries((prev) =>
                                  prev.filter((id) => !userEntries.find((e) => e.id === id))
                                );
                              } else {
                                setSelectedEntries((prev) => [
                                  ...prev,
                                  ...userEntries.filter((e) => !prev.includes(e.id)).map((e) => e.id),
                                ]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Projet</TableHead>
                        <TableHead>Tâche</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedEntries.includes(entry.id)}
                              onCheckedChange={() => handleSelectEntry(entry.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(entry.date), "dd/MM/yyyy", { locale: fr })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.project.color || "#3b82f6" }}
                              />
                              <span className="font-medium">{entry.project.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.task ? (
                              <span className="text-sm text-muted-foreground">{entry.task.name}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTypeColor(entry.type) as any}>
                              {getTypeLabel(entry.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{formatDuration(entry.duration)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {entry.description || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleValidate(entry)}
                            >
                              Valider
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de validation */}
      <ValidationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entry={selectedEntry}
        entryIds={isBulkMode ? selectedEntries : undefined}
        onComplete={handleValidationComplete}
      />
    </div>
  );
}
