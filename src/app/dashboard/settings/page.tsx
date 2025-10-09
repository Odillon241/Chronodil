"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Building2, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getHolidays,
  createHoliday,
  deleteHoliday,
  getDepartments,
  createDepartment,
  deleteDepartment,
  getSettings,
  updateSetting,
} from "@/actions/settings.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dialogs state
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);

  // Form states
  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: new Date(),
    description: "",
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [holidaysResult, departmentsResult, settingsResult] = await Promise.all([
        getHolidays({}),
        getDepartments({}),
        getSettings({}).catch(() => ({ data: [] })),
      ]);

      if (holidaysResult?.data) {
        setHolidays(holidaysResult.data);
      }

      if (departmentsResult?.data) {
        setDepartments(departmentsResult.data);
      }

      if (settingsResult?.data) {
        setSettings(settingsResult.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Holidays
  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createHoliday(holidayForm);
      if (result?.data) {
        toast.success("Jour férié ajouté !");
        setIsHolidayDialogOpen(false);
        setHolidayForm({ name: "", date: new Date(), description: "" });
        loadData();
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("Supprimer ce jour férié ?")) return;
    try {
      const result = await deleteHoliday({ id });
      if (result?.data) {
        toast.success("Jour férié supprimé");
        loadData();
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  // Departments
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createDepartment(departmentForm);
      if (result?.data) {
        toast.success("Département créé !");
        setIsDepartmentDialogOpen(false);
        setDepartmentForm({ name: "", code: "", description: "" });
        loadData();
      }
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Supprimer ce département ?")) return;
    try {
      const result = await deleteDepartment({ id });
      if (result?.data) {
        toast.success("Département supprimé");
        loadData();
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Configuration de l'application et gestion des référentiels
        </p>
      </div>

      <Tabs defaultValue="holidays" className="space-y-4">
        <TabsList>
          <TabsTrigger value="holidays">Jours fériés</TabsTrigger>
          <TabsTrigger value="departments">Départements</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="general">Général</TabsTrigger>
        </TabsList>

        {/* Jours fériés */}
        <TabsContent value="holidays" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Jours fériés</CardTitle>
                  <CardDescription>
                    Gérez les jours fériés pour le calcul des temps
                  </CardDescription>
                </div>
                <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-rusty-red hover:bg-ou-crimson">
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouveau jour férié</DialogTitle>
                      <DialogDescription>
                        Ajoutez un jour férié au calendrier
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateHoliday} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom *</Label>
                        <Input
                          id="name"
                          value={holidayForm.name}
                          onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                          placeholder="Ex: Noël"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(holidayForm.date, "dd/MM/yyyy", { locale: fr })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={holidayForm.date}
                              onSelect={(d: Date | undefined) => d && setHolidayForm({ ...holidayForm, date: d })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={holidayForm.description}
                          onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                          placeholder="Description optionnelle..."
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setIsHolidayDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" className="bg-rusty-red hover:bg-ou-crimson">
                          Ajouter
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun jour férié défini</p>
              ) : (
                <div className="space-y-2">
                  {holidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{holiday.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(holiday.date), "dd MMMM yyyy", { locale: fr })}
                        </div>
                        {holiday.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {holiday.description}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteHoliday(holiday.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Départements */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Départements</CardTitle>
                  <CardDescription>
                    Gérez les départements de votre organisation
                  </CardDescription>
                </div>
                <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-rusty-red hover:bg-ou-crimson">
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouveau département</DialogTitle>
                      <DialogDescription>
                        Créez un nouveau département
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateDepartment} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dept-name">Nom *</Label>
                        <Input
                          id="dept-name"
                          value={departmentForm.name}
                          onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                          placeholder="Ex: Développement"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dept-code">Code *</Label>
                        <Input
                          id="dept-code"
                          value={departmentForm.code}
                          onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value.toUpperCase() })}
                          placeholder="Ex: DEV"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dept-description">Description</Label>
                        <Textarea
                          id="dept-description"
                          value={departmentForm.description}
                          onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                          placeholder="Description optionnelle..."
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setIsDepartmentDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" className="bg-rusty-red hover:bg-ou-crimson">
                          Créer
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun département défini</p>
              ) : (
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{dept.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Code: {dept.code} • {dept._count.User} utilisateur(s) • {dept._count.Project} projet(s)
                          </div>
                          {dept.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {dept.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDepartment(dept.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilisateurs */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>
                Accédez à la page complète de gestion des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4 text-center">
                La gestion des utilisateurs dispose d'une interface dédiée avec des fonctionnalités avancées
              </p>
              <Button
                onClick={() => window.location.href = "/dashboard/settings/users"}
                className="bg-rusty-red hover:bg-ou-crimson"
              >
                Accéder à la gestion des utilisateurs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Général */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Configuration globale de l'application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center text-muted-foreground py-8">
                  <SettingsIcon className="h-8 w-8 mr-2" />
                  <span>Paramètres généraux à configurer</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
