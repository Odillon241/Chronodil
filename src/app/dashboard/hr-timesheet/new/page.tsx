"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hrTimesheetSchema, hrActivitySchema, type HRTimesheetInput, type HRActivityInput } from "@/lib/validations/hr-timesheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Plus, Trash2, Save, ArrowLeft, Library } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  createHRTimesheet,
  addHRActivity,
  getActivityCatalog,
} from "@/actions/hr-timesheet.actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Activity {
  activityType: "OPERATIONAL" | "REPORTING";
  activityName: string;
  description?: string;
  periodicity: "DAILY" | "WEEKLY" | "MONTHLY" | "PUNCTUAL" | "WEEKLY_MONTHLY";
  weeklyQuantity?: number;
  startDate: Date;
  endDate: Date;
  status: "IN_PROGRESS" | "COMPLETED";
  catalogId?: string;
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  type: string;
  defaultPeriodicity?: string | null;
  description?: string | null;
}

export default function NewHRTimesheetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [createdTimesheetId, setCreatedTimesheetId] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState({ category: "all", type: "all" });

  const {
    register: registerTimesheet,
    handleSubmit: handleSubmitTimesheet,
    setValue: setTimesheetValue,
    watch: watchTimesheet,
    formState: { errors: timesheetErrors },
  } = useForm<HRTimesheetInput>({
    resolver: zodResolver(hrTimesheetSchema),
    defaultValues: {
      weekStartDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
      weekEndDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
      employeeName: "",
      position: "",
      site: "",
      employeeObservations: "",
    },
  });

  const {
    register: registerActivity,
    handleSubmit: handleSubmitActivity,
    setValue: setActivityValue,
    watch: watchActivity,
    reset: resetActivity,
    formState: { errors: activityErrors },
  } = useForm<HRActivityInput>({
    resolver: zodResolver(hrActivitySchema),
    defaultValues: {
      activityType: "OPERATIONAL",
      activityName: "",
      description: "",
      periodicity: "DAILY",
      startDate: new Date(),
      endDate: new Date(),
      status: "IN_PROGRESS",
    },
  });

  // Charger le catalogue d'activités
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const result = await getActivityCatalog({});
        if (result?.data) {
          setCatalog(result.data);
        }
      } catch (error) {
        console.error("Erreur chargement catalogue:", error);
      }
    };
    loadCatalog();
  }, []);

  const onSubmitTimesheet = async (data: HRTimesheetInput) => {
    setIsLoading(true);
    try {
      const result = await createHRTimesheet(data);

      if (result?.data) {
        toast.success("Timesheet créé avec succès !");
        setCreatedTimesheetId(result.data.id);
      } else {
        toast.error(result?.serverError || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitActivity = async (data: HRActivityInput) => {
    if (!createdTimesheetId) {
      toast.error("Veuillez d'abord créer le timesheet");
      return;
    }

    setIsLoading(true);
    try {
      const result = await addHRActivity({
        timesheetId: createdTimesheetId,
        activity: data,
      });

      if (result?.data) {
        toast.success("Activité ajoutée !");
        setActivities([...activities, data]);
        resetActivity();
        setShowActivityForm(false);
      } else {
        toast.error(result?.serverError || "Erreur lors de l'ajout");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFromCatalog = (item: CatalogItem) => {
    setActivityValue("activityType", item.type as any);
    setActivityValue("activityName", item.name);
    setActivityValue("catalogId", item.id);
    if (item.defaultPeriodicity) {
      setActivityValue("periodicity", item.defaultPeriodicity as any);
    }
    setShowCatalog(false);
    setShowActivityForm(true);
  };

  const calculateActivityDuration = (start: Date, end: Date): number => {
    const days = differenceInDays(end, start);
    return days * 24;
  };

  const totalActivitiesHours = activities.reduce((sum, activity) => {
    return sum + calculateActivityDuration(activity.startDate, activity.endDate);
  }, 0);

  const categories = Array.from(new Set(catalog.map(item => item.category))).sort();
  const filteredCatalog = catalog.filter(item => {
    if (catalogFilter.category && catalogFilter.category !== "all" && item.category !== catalogFilter.category) return false;
    if (catalogFilter.type && catalogFilter.type !== "all" && item.type !== catalogFilter.type) return false;
    return true;
  });

  const groupedCatalog = filteredCatalog.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CatalogItem[]>);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle feuille de temps RH</h1>
          <p className="text-muted-foreground">Créez un nouveau timesheet hebdomadaire</p>
        </div>
      </div>

      {/* Étape 1: Informations générales du timesheet */}
      <Card>
        <CardHeader>
          <CardTitle>1. Informations générales</CardTitle>
          <CardDescription>
            Renseignez les informations de base de votre feuille de temps hebdomadaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitTimesheet(onSubmitTimesheet)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="weekStartDate">Date début semaine *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(watchTimesheet("weekStartDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchTimesheet("weekStartDate") ?? new Date()}
                      onSelect={(d: Date | undefined) => {
                        if (d) {
                          const weekStart = startOfWeek(d, { weekStartsOn: 1 });
                          const weekEnd = endOfWeek(d, { weekStartsOn: 1 });
                          setTimesheetValue("weekStartDate", weekStart);
                          setTimesheetValue("weekEndDate", weekEnd);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {timesheetErrors.weekStartDate && (
                  <p className="text-sm text-destructive">{timesheetErrors.weekStartDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weekEndDate">Date fin semaine *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(watchTimesheet("weekEndDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchTimesheet("weekEndDate") ?? new Date()}
                      onSelect={(d: Date | undefined) => d && setTimesheetValue("weekEndDate", d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {timesheetErrors.weekEndDate && (
                  <p className="text-sm text-destructive">{timesheetErrors.weekEndDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Nom de l'employé *</Label>
                <Input
                  id="employeeName"
                  placeholder="Nom complet"
                  {...registerTimesheet("employeeName")}
                />
                {timesheetErrors.employeeName && (
                  <p className="text-sm text-destructive">{timesheetErrors.employeeName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Poste *</Label>
                <Input
                  id="position"
                  placeholder="Titre du poste"
                  {...registerTimesheet("position")}
                />
                {timesheetErrors.position && (
                  <p className="text-sm text-destructive">{timesheetErrors.position.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="site">Site *</Label>
                <Input
                  id="site"
                  placeholder="Lieu de travail"
                  {...registerTimesheet("site")}
                />
                {timesheetErrors.site && (
                  <p className="text-sm text-destructive">{timesheetErrors.site.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeObservations">Observations (optionnel)</Label>
              <Textarea
                id="employeeObservations"
                placeholder="Remarques ou observations particulières..."
                rows={3}
                {...registerTimesheet("employeeObservations")}
              />
            </div>

            <Button
              type="submit"
              className="bg-rusty-red hover:bg-ou-crimson"
              disabled={isLoading || createdTimesheetId !== null}
            >
              <Save className="mr-2 h-4 w-4" />
              {createdTimesheetId ? "Timesheet créé ✓" : "Créer le timesheet"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Étape 2: Ajout d'activités (disponible après création du timesheet) */}
      {createdTimesheetId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>2. Activités de la semaine</CardTitle>
                <CardDescription>
                  Ajoutez les activités réalisées durant cette semaine
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={showCatalog} onOpenChange={setShowCatalog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Library className="h-4 w-4 mr-2" />
                      Catalogue
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Catalogue d'activités RH</DialogTitle>
                      <DialogDescription>
                        Sélectionnez une activité prédéfinie du catalogue
                      </DialogDescription>
                    </DialogHeader>

                    {/* Filtres catalogue */}
                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      <div className="space-y-2">
                        <Label>Catégorie</Label>
                        <Select
                          value={catalogFilter.category}
                          onValueChange={(value) => setCatalogFilter({ ...catalogFilter, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Toutes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={catalogFilter.type}
                          onValueChange={(value) => setCatalogFilter({ ...catalogFilter, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tous" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="OPERATIONAL">Opérationnel</SelectItem>
                            <SelectItem value="REPORTING">Reporting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Liste des activités par catégorie */}
                    <div className="space-y-6">
                      {Object.entries(groupedCatalog).map(([category, items]) => (
                        <div key={category}>
                          <h3 className="font-semibold mb-2 text-rusty-red">{category}</h3>
                          <div className="grid gap-2">
                            {items.map(item => (
                              <Button
                                key={item.id}
                                variant="outline"
                                className="justify-start h-auto py-2"
                                onClick={() => handleAddFromCatalog(item)}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <Badge variant={item.type === "OPERATIONAL" ? "default" : "secondary"}>
                                    {item.type === "OPERATIONAL" ? "OP" : "RP"}
                                  </Badge>
                                  <span className="flex-1 text-left">{item.name}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  className="bg-rusty-red hover:bg-ou-crimson"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle activité
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formulaire d'ajout d'activité */}
            {showActivityForm && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <form onSubmit={handleSubmitActivity(onSubmitActivity)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="activityType">Type d'activité *</Label>
                      <Select
                        value={watchActivity("activityType")}
                        onValueChange={(value: any) => setActivityValue("activityType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPERATIONAL">Opérationnelle</SelectItem>
                          <SelectItem value="REPORTING">Reporting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activityName">Nom de l'activité *</Label>
                      <Input
                        id="activityName"
                        placeholder="Description de l'activité"
                        {...registerActivity("activityName")}
                      />
                      {activityErrors.activityName && (
                        <p className="text-sm text-destructive">{activityErrors.activityName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      placeholder="Détails supplémentaires..."
                      rows={2}
                      {...registerActivity("description")}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="periodicity">Périodicité *</Label>
                      <Select
                        value={watchActivity("periodicity")}
                        onValueChange={(value: any) => setActivityValue("periodicity", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Quotidien</SelectItem>
                          <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                          <SelectItem value="MONTHLY">Mensuel</SelectItem>
                          <SelectItem value="PUNCTUAL">Ponctuel</SelectItem>
                          <SelectItem value="WEEKLY_MONTHLY">Hebdo/Mensuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Statut *</Label>
                      <Select
                        value={watchActivity("status")}
                        onValueChange={(value: any) => setActivityValue("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                          <SelectItem value="COMPLETED">Terminé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Date début *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(watchActivity("startDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={watchActivity("startDate") ?? new Date()}
                            onSelect={(d) => d && setActivityValue("startDate", d)}
                          />
                        </PopoverContent>
                      </Popover>
                      {activityErrors.startDate && (
                        <p className="text-sm text-destructive">{activityErrors.startDate.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">Date fin *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(watchActivity("endDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={watchActivity("endDate") ?? new Date()}
                            onSelect={(d) => d && setActivityValue("endDate", d)}
                          />
                        </PopoverContent>
                      </Popover>
                      {activityErrors.endDate && (
                        <p className="text-sm text-destructive">{activityErrors.endDate.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-rusty-red hover:bg-ou-crimson"
                      disabled={isLoading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter l'activité
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetActivity();
                        setShowActivityForm(false);
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Liste des activités ajoutées */}
            {activities.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Aucune activité ajoutée</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Cliquez sur "Nouvelle activité" ou "Catalogue" pour commencer
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity, index) => (
                  <div key={index} className="p-4 border rounded-lg flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={activity.activityType === "OPERATIONAL" ? "default" : "secondary"}>
                          {activity.activityType === "OPERATIONAL" ? "Opérationnel" : "Reporting"}
                        </Badge>
                        <Badge variant="outline">{activity.periodicity}</Badge>
                        <Badge variant={activity.status === "COMPLETED" ? "default" : "secondary"}>
                          {activity.status === "COMPLETED" ? "Terminé" : "En cours"}
                        </Badge>
                      </div>
                      <h4 className="font-semibold">{activity.activityName}</h4>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                      )}
                      <div className="text-sm mt-2">
                        <span className="text-muted-foreground">Période: </span>
                        <span>
                          {format(activity.startDate, "dd/MM/yyyy", { locale: fr })}
                          {" → "}
                          {format(activity.endDate, "dd/MM/yyyy", { locale: fr })}
                        </span>
                        <span className="ml-4 font-semibold text-rusty-red">
                          {calculateActivityDuration(activity.startDate, activity.endDate)}h
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <Card className="bg-rusty-red/10 border-rusty-red">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Total heures des activités</p>
                      <p className="text-2xl font-bold text-rusty-red">{totalActivitiesHours}h</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bouton pour terminer */}
            {activities.length > 0 && (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => router.push("/dashboard/hr-timesheet")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer et terminer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/hr-timesheet/${createdTimesheetId}`)}
                >
                  Voir le timesheet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
