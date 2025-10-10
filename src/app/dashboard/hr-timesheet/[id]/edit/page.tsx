"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hrActivitySchema, type HRActivityInput } from "@/lib/validations/hr-timesheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, ArrowLeft, Plus, Trash2, Save, Library, Edit2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getHRTimesheet,
  addHRActivity,
  deleteHRActivity,
  getActivityCatalog,
} from "@/actions/hr-timesheet.actions";
import { useRouter, useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Activity {
  id: string;
  activityType: string;
  activityName: string;
  description?: string;
  periodicity: string;
  weeklyQuantity?: number;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  status: string;
  ActivityCatalog?: {
    name: string;
    category: string;
  } | null;
}

interface Timesheet {
  id: string;
  weekStartDate: Date;
  weekEndDate: Date;
  employeeName: string;
  position: string;
  site: string;
  totalHours: number;
  status: string;
  employeeObservations?: string | null;
  activities: Activity[];
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  type: string;
  defaultPeriodicity?: string | null;
  description?: string | null;
}

export default function EditHRTimesheetPage() {
  const router = useRouter();
  const params = useParams();
  const timesheetId = params.id as string;

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState({ category: "all", type: "all" });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
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

  useEffect(() => {
    loadTimesheet();
    loadCatalog();
  }, [timesheetId]);

  const loadTimesheet = async () => {
    try {
      setIsLoading(true);
      const result = await getHRTimesheet({ timesheetId });

      if (result?.data) {
        const ts = result.data as Timesheet;

        if (ts.status !== "DRAFT") {
          toast.error("Ce timesheet ne peut pas être modifié (statut: " + ts.status + ")");
          router.push(`/dashboard/hr-timesheet/${timesheetId}`);
          return;
        }

        setTimesheet(ts);
      } else {
        toast.error("Timesheet non trouvé");
        router.push("/dashboard/hr-timesheet");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement");
      router.push("/dashboard/hr-timesheet");
    } finally {
      setIsLoading(false);
    }
  };

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

  const onSubmitActivity = async (data: HRActivityInput) => {
    if (!timesheet) return;

    setIsSaving(true);
    try {
      const result = await addHRActivity({
        timesheetId: timesheet.id,
        activity: data,
      });

      if (result?.data) {
        toast.success("Activité ajoutée !");
        reset();
        setShowActivityForm(false);
        loadTimesheet(); // Recharger pour voir la nouvelle activité
      } else {
        toast.error(result?.serverError || "Erreur lors de l'ajout");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Supprimer cette activité ?")) return;

    try {
      const result = await deleteHRActivity({
        timesheetId,
        activityId,
      });

      if (result?.data) {
        toast.success("Activité supprimée");
        loadTimesheet();
      } else {
        toast.error(result?.serverError || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleAddFromCatalog = (item: CatalogItem) => {
    setValue("activityType", item.type as any);
    setValue("activityName", item.name);
    setValue("catalogId", item.id);
    if (item.defaultPeriodicity) {
      setValue("periodicity", item.defaultPeriodicity as any);
    }
    setShowCatalog(false);
    setShowActivityForm(true);
  };

  const calculateActivityDuration = (start: Date, end: Date): number => {
    const days = differenceInDays(end, start);
    return days * 24;
  };

  const getPeriodicityLabel = (periodicity: string) => {
    const labels: Record<string, string> = {
      DAILY: "Quotidien",
      WEEKLY: "Hebdomadaire",
      MONTHLY: "Mensuel",
      PUNCTUAL: "Ponctuel",
      WEEKLY_MONTHLY: "Hebdo/Mensuel",
    };
    return labels[periodicity] || periodicity;
  };

  const getActivityTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "OPERATIONAL" ? "default" : "secondary"}>
        {type === "OPERATIONAL" ? "Opérationnel" : "Reporting"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!timesheet) {
    return null;
  }

  const categories = Array.from(new Set(catalog.map(item => item.category))).sort();
  const filteredCatalog = catalog.filter(item => {
    if (catalogFilter.category && catalogFilter.category !== 'all' && item.category !== catalogFilter.category) return false;
    if (catalogFilter.type && catalogFilter.type !== 'all' && item.type !== catalogFilter.type) return false;
    return true;
  });

  const groupedCatalog = filteredCatalog.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CatalogItem[]>);

  const groupedActivities = timesheet.activities.reduce((acc, activity) => {
    const category = activity.ActivityCatalog?.category || "Autres";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Édition - Semaine du {format(new Date(timesheet.weekStartDate), "dd/MM/yyyy", { locale: fr })}
          </h1>
          <p className="text-muted-foreground">
            Modifiez les activités de votre timesheet hebdomadaire
          </p>
        </div>
        <Badge variant="outline">Brouillon</Badge>
      </div>

      {/* Informations du timesheet */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Employé</p>
              <p className="font-medium">{timesheet.employeeName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Poste</p>
              <p className="font-medium">{timesheet.position}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Site</p>
              <p className="font-medium">{timesheet.site}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total heures</p>
              <p className="text-2xl font-bold text-rusty-red">{timesheet.totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestion des activités */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activités ({timesheet.activities.length})</CardTitle>
              <CardDescription>
                Ajoutez ou supprimez des activités pour cette semaine
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
              <form onSubmit={handleSubmit(onSubmitActivity)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="activityType">Type d'activité *</Label>
                    <Select
                      value={watch("activityType")}
                      onValueChange={(value: any) => setValue("activityType", value)}
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
                      {...register("activityName")}
                    />
                    {errors.activityName && (
                      <p className="text-sm text-destructive">{errors.activityName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    placeholder="Détails supplémentaires..."
                    rows={2}
                    {...register("description")}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="periodicity">Périodicité *</Label>
                    <Select
                      value={watch("periodicity")}
                      onValueChange={(value: any) => setValue("periodicity", value)}
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
                      value={watch("status")}
                      onValueChange={(value: any) => setValue("status", value)}
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
                          {format(watch("startDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={watch("startDate") ?? new Date()}
                          onSelect={(d) => d && setValue("startDate", d)}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.startDate && (
                      <p className="text-sm text-destructive">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Date fin *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(watch("endDate") ?? new Date(), "dd/MM/yyyy", { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={watch("endDate") ?? new Date()}
                          onSelect={(d) => d && setValue("endDate", d)}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.endDate && (
                      <p className="text-sm text-destructive">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-rusty-red hover:bg-ou-crimson"
                    disabled={isSaving}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isSaving ? "Ajout..." : "Ajouter l'activité"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      reset();
                      setShowActivityForm(false);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des activités */}
          {timesheet.activities.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Aucune activité ajoutée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Cliquez sur "Nouvelle activité" ou "Catalogue" pour commencer
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([category, activities]) => (
                <div key={category}>
                  <h3 className="font-semibold mb-3 text-rusty-red">{category}</h3>
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getActivityTypeBadge(activity.activityType)}
                              <Badge variant="outline">
                                {getPeriodicityLabel(activity.periodicity)}
                              </Badge>
                              <Badge variant={activity.status === "COMPLETED" ? "default" : "secondary"}>
                                {activity.status === "COMPLETED" ? "Terminé" : "En cours"}
                              </Badge>
                            </div>
                            <h4 className="font-semibold">{activity.activityName}</h4>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Période: </span>
                                <span>
                                  {format(new Date(activity.startDate), "dd/MM/yyyy", { locale: fr })}
                                  {" → "}
                                  {format(new Date(activity.endDate), "dd/MM/yyyy", { locale: fr })}
                                </span>
                              </div>
                              <div className="font-semibold text-rusty-red text-lg">
                                {activity.totalHours}h
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Total */}
              <Card className="bg-rusty-red/10 border-rusty-red">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">Total heures des activités</p>
                    <p className="text-3xl font-bold text-rusty-red">
                      {timesheet.totalHours.toFixed(1)}h
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Boutons de navigation */}
          {timesheet.activities.length > 0 && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => router.push(`/dashboard/hr-timesheet/${timesheetId}`)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Terminer l'édition
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/hr-timesheet")}
              >
                Retour à la liste
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
