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
import { Plus, Save, Trash2, Edit, Eye } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { createTimesheetEntry, getMyTimesheetEntries, deleteTimesheetEntry, submitTimesheetEntries, updateTimesheetEntry } from "@/actions/timesheet.actions";
import { getMyProjects } from "@/actions/project.actions";
import { WeeklyTimesheet } from "@/components/features/weekly-timesheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TimesheetPage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [entries, setEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "history">("week");
  const [showFilters, setShowFilters] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState<any | null>(null);
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
      let result;
      
      if (editingEntryId) {
        // Mode modification
        result = await updateTimesheetEntry({
          id: editingEntryId,
          data: {
            ...data,
            projectId: data.projectId || undefined,
          },
        });
      } else {
        // Mode création
        result = await createTimesheetEntry(data);
      }

      if (result?.data) {
        toast.success(editingEntryId ? "Temps modifié !" : "Temps enregistré !");
        reset();
        setEditingEntryId(null);
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

  const handleEdit = (entry: any) => {
    // Définir l'ID de l'entrée en cours de modification
    setEditingEntryId(entry.id);
    
    // Pré-remplir le formulaire avec les données de l'entrée
    setValue("date", new Date(entry.date));
    setValue("projectId", entry.projectId || "none");
    setValue("startTime", entry.startTime ? format(new Date(entry.startTime), "HH:mm") : "");
    setValue("endTime", entry.endTime ? format(new Date(entry.endTime), "HH:mm") : "");
    setValue("duration", entry.duration);
    setValue("type", entry.type);
    setValue("description", entry.description || "");
    
    // Passer à l'onglet de saisie
    setViewMode("week");
    
    // Scroll vers le formulaire
    setTimeout(() => {
      const formElement = document.querySelector('[data-tab="form"]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    
    toast.info("Entrée chargée pour modification. N'oubliez pas de sauvegarder !");
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
      
      // Arrondir à l'incrément de 0.25 le plus proche (15 minutes)
      const roundedDuration = Math.round(duration * 4) / 4;
      
      setValue("duration", duration > 0 ? roundedDuration : 0);
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
    setSelectedDate(date);
    setValue("date", date);
    // Passer automatiquement à l'onglet "Nouvelle saisie"
    setViewMode("week");
    // Scroll vers le formulaire pour une meilleure UX
    setTimeout(() => {
      const formElement = document.querySelector('[data-tab="form"]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
      <Tabs value={viewMode === "week" ? "form" : "history"} onValueChange={(value) => setViewMode(value === "form" ? "week" : "history")} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="form">Nouvelle saisie</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Formulaire de saisie */}
        <TabsContent value="form" className="space-y-4" data-tab="form">
          <Card>
            <CardHeader>
              <CardTitle>{editingEntryId ? "Modifier la saisie" : "Nouvelle saisie"}</CardTitle>
              <CardDescription>
                {editingEntryId ? "Modifiez vos heures travaillées" : "Ajoutez vos heures travaillées"}
              </CardDescription>
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
                  <Label htmlFor="project">Projet</Label>
                  <Select onValueChange={(value) => setValue("projectId", value === "none" ? undefined : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un projet (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun projet</SelectItem>
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
                    {...register("duration", { 
                      valueAsNumber: true,
                      onChange: (e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          // Arrondir automatiquement à l'incrément de 0.25
                          const rounded = Math.round(value * 4) / 4;
                          setValue("duration", rounded);
                        }
                      }
                    })}
                  />
                  {errors.duration && (
                    <p className="text-sm text-destructive">{errors.duration.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Incréments de 15 minutes (0,25h, 0,5h, 0,75h, 1h, etc.)
                  </p>
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
                  {isLoading 
                    ? (editingEntryId ? "Modification..." : "Ajout...") 
                    : (editingEntryId ? "Modifier" : "Ajouter")
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    reset();
                    setEditingEntryId(null);
                  }}
                >
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
                              {entry.project ? (
                                <>
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.project.color || "#3b82f6" }}
                                  />
                                  {entry.project.name}
                                </>
                              ) : (
                                <span className="text-muted-foreground italic">Aucun projet</span>
                              )}
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
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedEntryForDetails(entry)}
                                className="text-green-600 hover:text-green-800"
                                title="Voir les détails de cette entrée"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {entry.status === "DRAFT" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(entry)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Modifier cette entrée"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(entry.id)}
                                    className="text-destructive hover:text-destructive"
                                    title="Supprimer cette entrée"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
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
      
      {/* Modal de détails d'une entrée */}
      <Dialog open={!!selectedEntryForDetails} onOpenChange={() => setSelectedEntryForDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la saisie de temps</DialogTitle>
            <DialogDescription>
              Informations complètes de cette entrée de timesheet
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntryForDetails && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p className="text-sm">
                    {format(new Date(selectedEntryForDetails.date), "dd/MM/yyyy", { locale: fr })}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Durée</Label>
                  <p className="text-sm font-bold text-rusty-red">{selectedEntryForDetails.duration}h</p>
                </div>
              </div>

              {/* Projet et tâche */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Projet</Label>
                  <div className="flex items-center gap-2">
                    {selectedEntryForDetails.project ? (
                      <>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedEntryForDetails.project.color || "#3b82f6" }}
                        />
                        <span className="text-sm">{selectedEntryForDetails.project.name}</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Aucun projet</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Tâche</Label>
                  <p className="text-sm">
                    {selectedEntryForDetails.task?.name || "Aucune tâche"}
                  </p>
                </div>
              </div>

              {/* Horaires */}
              {(selectedEntryForDetails.startTime || selectedEntryForDetails.endTime) && (
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-muted-foreground">Horaires</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedEntryForDetails.startTime && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Heure de début</Label>
                        <p className="text-sm">
                          {format(new Date(selectedEntryForDetails.startTime), "HH:mm")}
                        </p>
                      </div>
                    )}
                    
                    {selectedEntryForDetails.endTime && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Heure de fin</Label>
                        <p className="text-sm">
                          {format(new Date(selectedEntryForDetails.endTime), "HH:mm")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Type et statut */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {selectedEntryForDetails.type}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusBadge(selectedEntryForDetails.status)}`}
                  >
                    {getStatusLabel(selectedEntryForDetails.status)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedEntryForDetails.description && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {selectedEntryForDetails.description}
                  </p>
                </div>
              )}

              {/* Informations système */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-medium text-muted-foreground">Informations système</Label>
                <div className="grid gap-4 md:grid-cols-2 text-xs text-muted-foreground">
                  <div>
                    <Label className="text-xs font-medium">Créé le</Label>
                    <p>{format(new Date(selectedEntryForDetails.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Modifié le</Label>
                    <p>{format(new Date(selectedEntryForDetails.updatedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
                  </div>
                </div>
              </div>

              {/* Actions selon le statut */}
              {selectedEntryForDetails.status === "DRAFT" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setSelectedEntryForDetails(null);
                      handleEdit(selectedEntryForDetails);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedEntryForDetails(null)}
                  >
                    Fermer
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <ConfirmationDialog />
    </div>
  );
}
