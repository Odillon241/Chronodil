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
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Building2, Settings as SettingsIcon, Bell, Volume2, Mail, Monitor } from "lucide-react";
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
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/actions/preferences.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import { useSession } from "@/lib/auth-client";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dialogs state
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isInitializingHolidays, setIsInitializingHolidays] = useState(false);

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

  // Notification preferences
  const { testSound } = useNotificationSound();
  const [preferences, setPreferences] = useState<any>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [holidaysResult, departmentsResult, settingsResult, preferencesResult] = await Promise.all([
        getHolidays({}),
        getDepartments({}),
        getSettings({}).catch(() => ({ data: [] })),
        getUserPreferences({}).catch(() => ({ data: null })),
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

      if (preferencesResult?.data) {
        setPreferences(preferencesResult.data);
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
    const confirmed = await showConfirmation({
      title: "Supprimer le jour férié",
      description: "Êtes-vous sûr de vouloir supprimer ce jour férié ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteHoliday({ id });
          if (result?.data) {
            toast.success("Jour férié supprimé");
            loadData();
          }
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        }
      },
    });
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
    const confirmed = await showConfirmation({
      title: "Supprimer le département",
      description: "Êtes-vous sûr de vouloir supprimer ce département ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteDepartment({ id });
          if (result?.data) {
            toast.success("Département supprimé");
            loadData();
          }
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  // Notification preferences handlers
  const handleUpdatePreference = async (key: string, value: any) => {
    setIsSavingPreferences(true);
    try {
      const result = await updateUserPreferences({ [key]: value });
      if (result?.data) {
        setPreferences(result.data);
        toast.success("Préférence enregistrée");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleResetPreferences = async () => {
    const confirmed = await showConfirmation({
      title: "Réinitialiser les préférences",
      description: "Êtes-vous sûr de vouloir réinitialiser toutes les préférences de notification ? Cette action est irréversible.",
      confirmText: "Réinitialiser",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        setIsSavingPreferences(true);
        try {
          // Reset to default values
          const result = await updateUserPreferences({
            enableTimesheetReminders: true,
            reminderTime: "17:00",
            reminderDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
          });
          if (result?.data) {
            setPreferences(result.data);
            toast.success("Préférences réinitialisées");
          }
        } catch (error) {
          toast.error("Erreur lors de la réinitialisation");
        } finally {
          setIsSavingPreferences(false);
        }
      },
    });
  };

  // Jours fériés du Gabon - Template (dates fixes et variables)
  const gabonHolidaysTemplate = [
    { name: "Jour de l'An", month: 1, day: 1, description: "Premier jour de l'année civile", fixed: true },
    { name: "Journée des droits de la femme", month: 4, day: 17, description: "Journée internationale des droits de la femme au Gabon", fixed: true },
    { name: "Fête du Travail", month: 5, day: 1, description: "Journée internationale des travailleurs", fixed: true },
    { name: "Assomption de Marie", month: 8, day: 15, description: "Fête de l'Assomption de la Vierge Marie", fixed: true },
    { name: "Jour de l'Indépendance", month: 8, day: 16, description: "Célébration de l'indépendance du Gabon (1960)", fixed: true },
    { name: "Jour de l'Indépendance (suite)", month: 8, day: 17, description: "Célébration de l'indépendance du Gabon - Jour 2", fixed: true },
    { name: "Toussaint", month: 11, day: 1, description: "Fête de tous les saints", fixed: true },
    { name: "Noël", month: 12, day: 25, description: "Célébration de la naissance de Jésus-Christ", fixed: true },
  ];

  // Dates variables pour 2025-2030 (Pâques, Ascension, Pentecôte, fêtes musulmanes)
  const variableHolidaysByYear: Record<number, Array<{name: string, month: number, day: number, description: string}>> = {
    2025: [
      { name: "Fête de fin du Ramadan (Aïd al-Fitr)", month: 3, day: 30, description: "Fête marquant la fin du mois de Ramadan" },
      { name: "Lundi de Pâques", month: 4, day: 21, description: "Lendemain du dimanche de Pâques" },
      { name: "Ascension", month: 5, day: 29, description: "Célébration de l'Ascension du Christ" },
      { name: "Fête du Sacrifice (Aïd al-Adha)", month: 6, day: 6, description: "Fête du sacrifice" },
      { name: "Lundi de Pentecôte", month: 6, day: 9, description: "Célébration de la Pentecôte" },
    ],
    2026: [
      { name: "Fête de fin du Ramadan (Aïd al-Fitr)", month: 3, day: 20, description: "Fête marquant la fin du mois de Ramadan" },
      { name: "Lundi de Pâques", month: 4, day: 6, description: "Lendemain du dimanche de Pâques" },
      { name: "Ascension", month: 5, day: 14, description: "Célébration de l'Ascension du Christ" },
      { name: "Fête du Sacrifice (Aïd al-Adha)", month: 5, day: 27, description: "Fête du sacrifice" },
      { name: "Lundi de Pentecôte", month: 5, day: 25, description: "Célébration de la Pentecôte" },
    ],
    2027: [
      { name: "Fête de fin du Ramadan (Aïd al-Fitr)", month: 3, day: 9, description: "Fête marquant la fin du mois de Ramadan" },
      { name: "Lundi de Pâques", month: 3, day: 29, description: "Lendemain du dimanche de Pâques" },
      { name: "Ascension", month: 5, day: 6, description: "Célébration de l'Ascension du Christ" },
      { name: "Fête du Sacrifice (Aïd al-Adha)", month: 5, day: 16, description: "Fête du sacrifice" },
      { name: "Lundi de Pentecôte", month: 5, day: 17, description: "Célébration de la Pentecôte" },
    ],
  };

  const handleInitializeGabonHolidays = async (year: number) => {
    const variableHolidays = variableHolidaysByYear[year] || [];
    const totalHolidays = gabonHolidaysTemplate.length + variableHolidays.length;
    
    const confirmed = await showConfirmation({
      title: `Ajouter les jours fériés du Gabon pour ${year}`,
      description: `Voulez-vous ajouter les ${totalHolidays} jours fériés du Gabon pour ${year} ?\n\nNote : Les dates variables (Pâques, fêtes musulmanes) ${variableHolidays.length === 0 ? 'ne sont pas disponibles pour cette année. Seules les dates fixes seront ajoutées.' : 'seront également ajoutées.'}`,
      confirmText: "Ajouter",
      cancelText: "Annuler",
      onConfirm: async () => {
        setIsInitializingHolidays(true);
        try {
          let added = 0;
          
          // Ajouter les jours fériés fixes
          for (const holiday of gabonHolidaysTemplate) {
            const result = await createHoliday({
              name: holiday.name,
              date: new Date(year, holiday.month - 1, holiday.day),
              description: holiday.description,
            });
            if (result?.data) {
              added++;
            }
          }
          
          // Ajouter les jours fériés variables si disponibles
          for (const holiday of variableHolidays) {
            const result = await createHoliday({
              name: holiday.name,
              date: new Date(year, holiday.month - 1, holiday.day),
              description: holiday.description,
            });
            if (result?.data) {
              added++;
            }
          }
          
          toast.success(`${added} jours fériés du Gabon ajoutés pour ${year} !`);
          loadData();
        } catch (error) {
          toast.error("Erreur lors de l'ajout des jours fériés");
        } finally {
          setIsInitializingHolidays(false);
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configuration de l'application et gestion des référentiels
        </p>
      </div>

      <Tabs defaultValue="holidays" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:flex md:w-auto gap-1">
          <TabsTrigger value="holidays" className="text-xs sm:text-sm">Jours fériés</TabsTrigger>
          <TabsTrigger value="departments" className="text-xs sm:text-sm">Départements</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="reminders" className="text-xs sm:text-sm">Rappels</TabsTrigger>
          {["ADMIN", "DIRECTEUR", "HR"].includes((session?.user as any)?.role) && (
            <TabsTrigger value="users" className="text-xs sm:text-sm">Utilisateurs</TabsTrigger>
          )}
          <TabsTrigger value="general" className="text-xs sm:text-sm">Général</TabsTrigger>
        </TabsList>

        {/* Jours fériés */}
        <TabsContent value="holidays" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Jours fériés</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Gérez les jours fériés pour le calcul des temps (Gabon)
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={isInitializingHolidays}
                        className="w-full sm:w-auto border-powder-blue text-powder-blue hover:bg-powder-blue hover:text-white text-xs sm:text-sm"
                      >
                        {isInitializingHolidays ? "Ajout en cours..." : "🇬🇦 Initialiser jours fériés"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="end">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Choisir l'année</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                            <Button
                              key={year}
                              variant="outline"
                              onClick={() => handleInitializeGabonHolidays(year)}
                              disabled={isInitializingHolidays}
                              className="w-full"
                            >
                              {year}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          8 dates fixes + 5 dates variables (selon l'année)
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                          💡 Astuce : Vous pouvez ajouter plusieurs années
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto bg-rusty-red hover:bg-ou-crimson text-xs sm:text-sm">
                        <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-md">
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

                      <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setIsHolidayDialogOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">
                          Annuler
                        </Button>
                        <Button type="submit" className="w-full sm:w-auto bg-rusty-red hover:bg-ou-crimson text-xs sm:text-sm">
                          Ajouter
                        </Button>
                      </div>
                    </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Aucun jour férié défini</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={isInitializingHolidays}
                        className="border-powder-blue text-powder-blue hover:bg-powder-blue hover:text-white"
                      >
                        🇬🇦 Initialiser avec les jours fériés du Gabon
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="center">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Choisir l'année</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                            <Button
                              key={year}
                              variant="outline"
                              onClick={() => handleInitializeGabonHolidays(year)}
                              disabled={isInitializingHolidays}
                              className="w-full"
                            >
                              {year}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          8 dates fixes + 5 dates variables (selon l'année)
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                          💡 Astuce : Vous pouvez ajouter plusieurs années
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <>
                  {/* Desktop table view */}
                  <div className="hidden md:block border rounded-lg overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium text-sm">Nom</th>
                          <th className="text-left p-3 font-medium text-sm">Date</th>
                          <th className="text-left p-3 font-medium text-sm">Description</th>
                          <th className="text-right p-3 font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holidays.map((holiday) => (
                          <tr key={holiday.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-3 font-medium text-sm">{holiday.name}</td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {format(new Date(holiday.date), "dd/MM/yyyy")}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {holiday.description || "-"}
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteHoliday(holiday.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card view */}
                  <div className="md:hidden space-y-2">
                    {holidays.map((holiday) => (
                      <div key={holiday.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{holiday.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(new Date(holiday.date), "dd/MM/yyyy")}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="text-red-600 hover:text-red-800 -mt-1 -mr-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {holiday.description && (
                          <div className="text-xs text-muted-foreground border-t pt-2">
                            {holiday.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Départements */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Départements</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Gérez les départements de votre organisation
                  </CardDescription>
                </div>
                <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto bg-rusty-red hover:bg-ou-crimson text-xs sm:text-sm">
                      <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md">
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

                      <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setIsDepartmentDialogOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">
                          Annuler
                        </Button>
                        <Button type="submit" className="w-full sm:w-auto bg-rusty-red hover:bg-ou-crimson text-xs sm:text-sm">
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
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg hover:bg-muted/50 gap-3"
                    >
                      <div className="flex items-start sm:items-center gap-3 flex-1">
                        <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base">{dept.name}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
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
                        className="self-end sm:self-center"
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

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Préférences de notification</CardTitle>
                  <CardDescription>
                    Gérez vos préférences de notification sonore et visuelle
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={handleResetPreferences}
                  disabled={isSavingPreferences || !preferences}
                >
                  Réinitialiser
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!preferences ? (
                <p className="text-center text-muted-foreground py-8">Chargement des préférences...</p>
              ) : (
                <>
                  {/* Sons de notification */}
                  <div className="space-y-4 border-b pb-6">
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">Sons de notification</h3>
                        <p className="text-sm text-muted-foreground">
                          Configurez les alertes sonores
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 ml-8">
                      {/* Activer/Désactiver le son */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="sound-enabled">Activer les sons</Label>
                          <p className="text-sm text-muted-foreground">
                            Jouer un son lors de la réception d'une notification
                          </p>
                        </div>
                        <Switch
                          id="sound-enabled"
                          checked={preferences.notificationSoundEnabled}
                          onCheckedChange={(checked) =>
                            handleUpdatePreference("notificationSoundEnabled", checked)
                          }
                          disabled={isSavingPreferences}
                        />
                      </div>

                      {/* Type de son */}
                      {preferences.notificationSoundEnabled && (
                        <>
                          <div className="space-y-3">
                            <Label>Type de son</Label>
                            <RadioGroup
                              value={preferences.notificationSoundType}
                              onValueChange={(value) =>
                                handleUpdatePreference("notificationSoundType", value)
                              }
                              disabled={isSavingPreferences}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="default" id="sound-default" />
                                <Label htmlFor="sound-default" className="font-normal cursor-pointer">
                                  Par défaut - Son classique de notification
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="soft" id="sound-soft" />
                                <Label htmlFor="sound-soft" className="font-normal cursor-pointer">
                                  Doux - Son subtil et discret
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="alert" id="sound-alert" />
                                <Label htmlFor="sound-alert" className="font-normal cursor-pointer">
                                  Alerte - Son plus urgent
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          {/* Volume */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="sound-volume">
                                Volume ({Math.round(preferences.notificationSoundVolume * 100)}%)
                              </Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testSound()}
                                disabled={isSavingPreferences}
                              >
                                Tester le son
                              </Button>
                            </div>
                            <Slider
                              id="sound-volume"
                              min={0}
                              max={100}
                              step={5}
                              value={[preferences.notificationSoundVolume * 100]}
                              onValueChange={([value]) =>
                                handleUpdatePreference("notificationSoundVolume", value / 100)
                              }
                              disabled={isSavingPreferences}
                              className="w-full"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notifications par email */}
                  <div className="space-y-4 border-b pb-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">Notifications par email</h3>
                        <p className="text-sm text-muted-foreground">
                          Recevez des notifications par email
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between ml-8">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-enabled">Activer les emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Recevoir des notifications importantes par email
                        </p>
                      </div>
                      <Switch
                        id="email-enabled"
                        checked={preferences.emailNotificationsEnabled}
                        onCheckedChange={(checked) =>
                          handleUpdatePreference("emailNotificationsEnabled", checked)
                        }
                        disabled={isSavingPreferences}
                      />
                    </div>
                  </div>

                  {/* Notifications bureau */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">Notifications bureau</h3>
                        <p className="text-sm text-muted-foreground">
                          Affichez des notifications sur votre bureau
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between ml-8">
                      <div className="space-y-0.5">
                        <Label htmlFor="desktop-enabled">Activer les notifications bureau</Label>
                        <p className="text-sm text-muted-foreground">
                          Afficher des notifications même quand l'application est en arrière-plan
                        </p>
                      </div>
                      <Switch
                        id="desktop-enabled"
                        checked={preferences.desktopNotificationsEnabled}
                        onCheckedChange={(checked) =>
                          handleUpdatePreference("desktopNotificationsEnabled", checked)
                        }
                        disabled={isSavingPreferences}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rappels */}
        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Préférences de rappel
              </CardTitle>
              <CardDescription>
                Configurez vos préférences pour recevoir des rappels de saisie de temps
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4 text-center">
                Gérez vos préférences de rappel pour la saisie de temps
              </p>
              <Button
                onClick={() => window.location.href = "/dashboard/settings/reminders"}
                className="bg-rusty-red hover:bg-ou-crimson"
              >
                <Bell className="mr-2 h-4 w-4" />
                Configurer les rappels
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilisateurs */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {(session?.user as any)?.role === "DIRECTEUR"
                  ? "Gestion de l'équipe"
                  : "Gestion des utilisateurs"}
              </CardTitle>
              <CardDescription>
                {(session?.user as any)?.role === "DIRECTEUR"
                  ? "Accédez à la gestion complète de votre équipe et assignez des managers"
                  : "Accédez à la page complète de gestion des utilisateurs"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4 text-center">
                {(session?.user as any)?.role === "DIRECTEUR"
                  ? "Gérez votre équipe : créez des utilisateurs, assignez des managers et organisez votre structure"
                  : "La gestion des utilisateurs dispose d'une interface dédiée avec des fonctionnalités avancées"}
              </p>
              <Button
                onClick={() => window.location.href = "/dashboard/settings/users"}
                className="bg-rusty-red hover:bg-ou-crimson"
              >
                {(session?.user as any)?.role === "DIRECTEUR"
                  ? "Gérer mon équipe"
                  : "Accéder à la gestion des utilisateurs"}
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
      <ConfirmationDialog />
    </div>
  );
}
