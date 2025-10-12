"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { timesheetEntrySchema, type TimesheetEntryInput } from "@/lib/validations/timesheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { createTimesheetEntry, getMyTimesheetEntries, deleteTimesheetEntry, submitTimesheetEntries } from "@/actions/timesheet.actions";
import { getMyProjects } from "@/actions/project.actions";
import { WeeklyTimesheet } from "@/components/features/weekly-timesheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TimesheetPage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [entries, setEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "history">("week");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    projectId: "all",
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TimesheetEntryInput>({
    resolver: zodResolver(timesheetEntrySchema),
    defaultValues: {
      date: new Date(),
      type: "NORMAL",
      duration: 0,
    },
  });

  const loadData = useCallback(async () => {
    try {
      const projectsResult = await getMyProjects({});
      if (projectsResult?.data) {
        setProjects(projectsResult.data);
      }

      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

      const entriesResult = await getMyTimesheetEntries({
        startDate: weekStart,
        endDate: weekEnd,
      });

      if (entriesResult?.data) {
        setEntries(entriesResult.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement");
    }
  }, [selectedDate]);

  const loadHistoryData = useCallback(async () => {
    try {
      const entriesResult = await getMyTimesheetEntries({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.status && filters.status !== "all" && { status: filters.status as any }),
      });

      if (entriesResult?.data) {
        let filtered = entriesResult.data;
        if (filters.projectId && filters.projectId !== "all") {
          filtered = filtered.filter((e: any) => e.projectId === filters.projectId);
        }
        setEntries(filtered);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement");
    }
  }, [filters]);

  useEffect(() => {
    if (viewMode === "week") {
      loadData();
    } else {
      loadHistoryData();
    }
  }, [viewMode, loadData, loadHistoryData]);

  const onSubmit = async (data: TimesheetEntryInput) => {
    setIsLoading(true);
    try {
      const result = await createTimesheetEntry(data);

      if (result?.data) {
        toast.success("Temps enregistré !");
        reset();
        loadData();
      } else {
        toast.error(result?.serverError || "Erreur");
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmation({
      title: "Supprimer l'entrée",
      description: "Êtes-vous sûr de vouloir supprimer cette entrée de timesheet ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteTimesheetEntry({ id });
          if (result?.data) {
            toast.success("Entrée supprimée");
            loadData();
          }
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const handleSubmitDay = async () => {
    const todayEntries = entries.filter(
      (e) =>
        format(new Date(e.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd") &&
        e.status === "DRAFT"
    );

    if (todayEntries.length === 0) {
      toast.error("Aucune entrée à soumettre");
      return;
    }

    try {
      const result = await submitTimesheetEntries({
        entryIds: todayEntries.map((e) => e.id),
      });

      if (result?.data) {
        toast.success("Journée soumise !");
        loadData();
      }
    } catch (error) {
      toast.error("Erreur lors de la soumission");
    }
  };

  const calculateDuration = () => {
    const startTime = watch("startTime");
    const endTime = watch("endTime");

    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      const duration = (endMinutes - startMinutes) / 60;
      setValue("duration", duration > 0 ? duration : 0);
    }
  };

  const todayTotal = entries
    .filter((e) => format(new Date(e.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"))
    .reduce((acc, entry) => acc + entry.duration, 0);

  const todayEntries = entries.filter(
    (e) => format(new Date(e.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
  );

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: "bg-gray-100 text-gray-800",
      SUBMITTED: "bg-amber-100 text-amber-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      LOCKED: "bg-blue-100 text-blue-800",
    };
    return badges[status as keyof typeof badges] || badges.DRAFT;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      DRAFT: "Brouillon",
      SUBMITTED: "En attente",
      APPROVED: "Approuvé",
      REJECTED: "Rejeté",
      LOCKED: "Verrouillé",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setValue("date", date);
  };

  const handleAddEntry = (date: Date) => {
    setValue("date", date);
    // Le formulaire est déjà prêt avec la date sélectionnée
  };

  const handleSubmitWeek = async (weekStart: Date, weekEnd: Date) => {
    const draftEntries = entries.filter(
      (e) => e.status === "DRAFT" && new Date(e.date) >= weekStart && new Date(e.date) <= weekEnd
    );

    if (draftEntries.length === 0) {
      toast.error("Aucune entrée à soumettre");
      return;
    }

    const confirmed = await showConfirmation({
      title: "Soumettre les entrées",
      description: `Voulez-vous soumettre ${draftEntries.length} entrée(s) de cette semaine pour validation ?`,
      confirmText: "Soumettre",
      cancelText: "Annuler",
      onConfirm: async () => {
        try {
          const result = await submitTimesheetEntries({
            entryIds: draftEntries.map((e) => e.id),
            period: {
              startDate: weekStart,
              endDate: weekEnd,
            },
          });

          if (result?.data) {
            toast.success(`${result.data.entries} entrée(s) soumise(s) avec succès !`);
            loadData();
          } else {
            toast.error(result?.serverError || "Erreur lors de la soumission");
          }
        } catch (error: any) {
          toast.error(error.message || "Erreur lors de la soumission");
        }
      },
    });
  };

  const applyFilters = () => {
    loadHistoryData();
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      projectId: "all",
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Saisie des temps</h1>
        <p className="text-muted-foreground">Enregistrez vos heures de travail quotidiennes</p>
      </div>

      {/* Vue hebdomadaire */}
      <WeeklyTimesheet
        entries={entries}
        onDateSelect={handleDateSelect}
        onAddEntry={handleAddEntry}
        onSubmitWeek={handleSubmitWeek}
        selectedDate={selectedDate}
      />

      {/* Tabs pour Saisie et Historique */}
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="form">Nouvelle saisie</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Formulaire de saisie */}
        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle saisie</CardTitle>
              <CardDescription>Ajoutez vos heures travaillées</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(watch("date") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watch("date") ?? new Date()}
                        onSelect={(d: Date | undefined) => d && setValue("date", d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date && (
                    <p className="text-sm text-destructive">{errors.date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Projet *</Label>
                  <Select onValueChange={(value) => setValue("projectId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.projectId && (
                    <p className="text-sm text-destructive">{errors.projectId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Heure début</Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...register("startTime")}
                    onChange={(e) => {
                      setValue("startTime", e.target.value);
                      calculateDuration();
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Heure fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...register("endTime")}
                    onChange={(e) => {
                      setValue("endTime", e.target.value);
                      calculateDuration();
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (heures) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    {...register("duration", { valueAsNumber: true })}
                  />
                  {errors.duration && (
                    <p className="text-sm text-destructive">{errors.duration.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  onValueChange={(value: any) => setValue("type", value)}
                  defaultValue="NORMAL"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Heures normales</SelectItem>
                    <SelectItem value="OVERTIME">Heures supplémentaires</SelectItem>
                    <SelectItem value="NIGHT">Heures de nuit</SelectItem>
                    <SelectItem value="WEEKEND">Week-end</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Détails de l'activité..."
                  {...register("description")}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-rusty-red hover:bg-ou-crimson"
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isLoading ? "Ajout..." : "Ajouter"}
                </Button>
                <Button type="button" variant="outline" onClick={() => reset()}>
                  Réinitialiser
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Historique avec filtres */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historique</CardTitle>
                  <CardDescription>Consultez toutes vos saisies</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtres */}
              {showFilters && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters({ ...filters, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="DRAFT">Brouillon</SelectItem>
                          <SelectItem value="SUBMITTED">Soumis</SelectItem>
                          <SelectItem value="APPROVED">Approuvé</SelectItem>
                          <SelectItem value="REJECTED">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Projet</Label>
                      <Select
                        value={filters.projectId}
                        onValueChange={(value) => setFilters({ ...filters, projectId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date début</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(filters.startDate, "dd/MM/yyyy", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={filters.startDate}
                            onSelect={(d) => d && setFilters({ ...filters, startDate: d })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Date fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(filters.endDate, "dd/MM/yyyy", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={filters.endDate}
                            onSelect={(d) => d && setFilters({ ...filters, endDate: d })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={applyFilters} className="bg-rusty-red hover:bg-ou-crimson">
                      Appliquer
                    </Button>
                    <Button variant="outline" onClick={resetFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              )}

              {/* Tableau historique */}
              <div className="relative overflow-x-auto rounded-lg border">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Projet</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Durée</th>
                      <th className="px-6 py-3">Statut</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                          Aucune entrée trouvée
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 font-medium">
                            {format(new Date(entry.date), "dd/MM/yyyy", { locale: fr })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.project?.color || "#3b82f6" }}
                              />
                              {entry.project?.name || "Projet non assigné"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-rusty-red">{entry.duration}h</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(entry.status)}`}
                            >
                              {getStatusLabel(entry.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {entry.status === "DRAFT" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(entry.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ConfirmationDialog />
    </div>
  );
}
