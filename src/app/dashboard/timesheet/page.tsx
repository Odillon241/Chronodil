"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { timesheetEntrySchema, type TimesheetEntryInput } from "@/lib/validations/timesheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { format, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { createTimesheetEntry, getMyTimesheetEntries, deleteTimesheetEntry, submitTimesheetEntries } from "@/actions/timesheet.actions";
import { getMyProjects } from "@/actions/project.actions";

export default function TimesheetPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    if (!confirm("Supprimer cette entrée ?")) return;

    try {
      const result = await deleteTimesheetEntry({ id });
      if (result?.data) {
        toast.success("Entrée supprimée");
        loadData();
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Saisie des temps</h1>
        <p className="text-muted-foreground">Enregistrez vos heures de travail quotidiennes</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Nouvelle saisie</CardTitle>
            <CardDescription>Ajoutez vos heures travaillées</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    defaultValue={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setValue("date", new Date(e.target.value))}
                  />
                  {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
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

        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
            <CardDescription>
              {format(selectedDate, "d MMMM yyyy", { locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold text-rusty-red">{todayTotal.toFixed(2)}h</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Entrées</h3>
                {todayEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune entrée
                  </p>
                ) : (
                  <div className="space-y-2">
                    {todayEntries.map((entry) => (
                      <div key={entry.id} className="p-3 border rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{entry.project.name}</span>
                          <span className="text-sm font-bold text-rusty-red">
                            {entry.duration}h
                          </span>
                        </div>
                        {entry.description && (
                          <p className="text-xs text-muted-foreground">{entry.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(entry.status)}`}>
                            {getStatusLabel(entry.status)}
                          </span>
                          {entry.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-ou-crimson hover:bg-ou-crimson-700"
                onClick={handleSubmitDay}
                disabled={todayEntries.filter((e) => e.status === "DRAFT").length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                Soumettre
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>Vos saisies récentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
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
                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                      Aucune entrée
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-4">
                        {format(new Date(entry.date), "dd/MM/yyyy")}
                      </td>
                      <td className="px-6 py-4">{entry.project.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{entry.duration}h</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(entry.status)}`}>
                          {getStatusLabel(entry.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {entry.status === "DRAFT" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
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
    </div>
  );
}
