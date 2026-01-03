"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Plus, Trash2, Building2, Settings as SettingsIcon, Volume2, Mail, Monitor } from "lucide-react";
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
import {
  getGeneralSettings,
  updateGeneralSettings,
  resetGeneralSettings,
} from "@/actions/general-settings.actions";
import { AppearanceSection } from "@/components/features/general-settings/appearance-section";
import { LocalizationSection } from "@/components/features/general-settings/localization-section";
import { AccessibilitySection } from "@/components/features/general-settings/accessibility-section";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const searchParams = useSearchParams();
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  
  const [holidays, setHolidays] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
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

  // General settings preferences
  const [generalSettings, setGeneralSettings] = useState<any>(null);
  const [isSavingGeneralSettings, setIsSavingGeneralSettings] = useState(false);

  // Scroll to hash on mount
  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [hash]);

  // Fonction pour appliquer les paramètres visuellement
  const applySettingsToUI = (settings: any) => {
    if (!settings) return;

    document.documentElement.style.fontSize = `${settings.fontSize}px`;

    if (settings.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    if (settings.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }

    document.documentElement.setAttribute("data-density", settings.viewDensity);
    document.documentElement.setAttribute("data-accent", settings.accentColor);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [holidaysResult, departmentsResult, preferencesResult, generalSettingsResult] = await Promise.all([
        getHolidays({}),
        getDepartments({}),
        getUserPreferences({}).catch((e) => {
          console.error("Erreur getUserPreferences:", e);
          return { data: null };
        }),
        getGeneralSettings({}).catch((e) => {
          console.error("Erreur getGeneralSettings:", e);
          return { data: null };
        }),
      ]);

      if (holidaysResult?.data) {
        setHolidays(holidaysResult.data);
      }

      if (departmentsResult?.data) {
        setDepartments(departmentsResult.data);
      }

      if (preferencesResult?.data) {
        setPreferences(preferencesResult.data);
      }

      if (generalSettingsResult?.data) {
        setGeneralSettings(generalSettingsResult.data);
        applySettingsToUI(generalSettingsResult.data);
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

  // General Settings
  const handleUpdateGeneralSetting = async (key: string, value: any) => {
    setIsSavingGeneralSettings(true);
    try {
      const result = await updateGeneralSettings({ [key]: value });
      if (result?.data) {
        setGeneralSettings(result.data);
        applySettingsToUI(result.data);
        toast.success("Paramètre enregistré");
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSavingGeneralSettings(false);
    }
  };

  const handleResetGeneralSettings = async () => {
    const confirmed = await showConfirmation({
      title: "Réinitialiser les paramètres généraux",
      description: "Êtes-vous sûr de vouloir réinitialiser tous les paramètres généraux aux valeurs par défaut ?",
      confirmText: "Réinitialiser",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        setIsSavingGeneralSettings(true);
        try {
          const result = await resetGeneralSettings({});
          if (result?.data) {
            setGeneralSettings(result.data);
            applySettingsToUI(result.data);
            toast.success("Paramètres réinitialisés");
          } else if (result?.serverError) {
            toast.error(result.serverError);
          }
        } catch (error) {
          toast.error("Erreur lors de la réinitialisation");
        } finally {
          setIsSavingGeneralSettings(false);
        }
      },
    });
  };

  // Jours fériés du Gabon - Template
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
          let skipped = 0;
          
          for (const holiday of gabonHolidaysTemplate) {
            try {
              const result = await createHoliday({
                name: holiday.name,
                date: new Date(year, holiday.month - 1, holiday.day),
                description: holiday.description,
              });
              if (result?.data) {
                added++;
              }
            } catch (error: any) {
              const errorMessage = error?.message || error?.serverError || "";
              if (
                errorMessage.includes("Unique constraint") ||
                errorMessage.includes("déjà") ||
                errorMessage.includes("existe déjà")
              ) {
                skipped++;
              }
            }
          }
          
          for (const holiday of variableHolidays) {
            try {
              const result = await createHoliday({
                name: holiday.name,
                date: new Date(year, holiday.month - 1, holiday.day),
                description: holiday.description,
              });
              if (result?.data) {
                added++;
              }
            } catch (error: any) {
              const errorMessage = error?.message || error?.serverError || "";
              if (
                errorMessage.includes("Unique constraint") ||
                errorMessage.includes("déjà") ||
                errorMessage.includes("existe déjà")
              ) {
                skipped++;
              }
            }
          }
          
          if (added > 0) {
            toast.success(`${added} jour${added > 1 ? 's' : ''} férié${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''} pour ${year}${skipped > 0 ? ` (${skipped} déjà existant${skipped > 1 ? 's' : ''})` : ''} !`);
          } else if (skipped > 0) {
            toast.info(`Tous les jours fériés pour ${year} existent déjà.`);
          }
          loadData();
        } catch (error) {
          console.error("Erreur lors de l'ajout des jours fériés:", error);
          toast.error("Erreur lors de l'ajout des jours fériés");
        } finally {
          setIsInitializingHolidays(false);
        }
      },
    });
  };

  const userRole = (session?.user as any)?.role;
  const isAdmin = ["ADMIN", "DIRECTEUR", "HR"].includes(userRole || "");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres généraux</h1>
        <p className="text-base text-muted-foreground mt-1">
          Configuration de l'application et gestion des référentiels
        </p>
      </div>

      {/* Section Paramètres généraux */}
      <section id="general" className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Paramètres généraux</h2>
            <p className="text-muted-foreground mt-1">
              Personnalisez l'apparence, la langue et l'accessibilité
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleResetGeneralSettings}
            disabled={isSavingGeneralSettings || !generalSettings}
            className="text-destructive hover:text-destructive"
          >
            Réinitialiser
          </Button>
        </div>

        {!generalSettings ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Chargement des paramètres...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <AppearanceSection
              settings={generalSettings}
              onUpdate={handleUpdateGeneralSetting}
              isSaving={isSavingGeneralSettings}
            />

            <LocalizationSection
              settings={generalSettings}
              onUpdate={handleUpdateGeneralSetting}
              isSaving={isSavingGeneralSettings}
            />

            <AccessibilitySection
              settings={generalSettings}
              onUpdate={handleUpdateGeneralSetting}
              isSaving={isSavingGeneralSettings}
            />
          </div>
        )}
      </section>

      <Separator />

      {/* Section Notifications */}
      <section id="notifications" className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Préférences de notification</h2>
            <p className="text-muted-foreground mt-1">
              Gérez vos préférences de notification sonore et visuelle
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleResetPreferences}
            disabled={isSavingPreferences || !preferences}
          >
            Réinitialiser
          </Button>
        </div>

        {!preferences ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Chargement des préférences...</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Sons de notification */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Sons de notification</h3>
                  <p className="text-sm text-muted-foreground">
                    Configurez les alertes sonores
                  </p>
                </div>

                <div className="space-y-4">
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

              <Separator />

              {/* Notifications par email */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Notifications par email</h3>
                  <p className="text-sm text-muted-foreground">
                    Recevez des notifications par email
                  </p>
                </div>

                <div className="flex items-center justify-between">
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

              <Separator />

              {/* Notifications bureau */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Notifications bureau</h3>
                  <p className="text-sm text-muted-foreground">
                    Affichez des notifications sur votre bureau
                  </p>
                </div>

                <div className="flex items-center justify-between">
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
            </CardContent>
          </Card>
        )}
      </section>

      {/* Sections Admin uniquement */}
      {isAdmin && (
        <>
          <Separator />

          {/* Section Jours fériés */}
          <section id="holidays" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Jours fériés</h2>
              <p className="text-muted-foreground mt-1">
                Gérez les jours fériés pour le calcul des temps (Gabon)
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Jours fériés</CardTitle>
                    <CardDescription>
                      Liste des jours fériés configurés dans le système
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={isInitializingHolidays}
                          className="w-full sm:w-auto"
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
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
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
                            <Button type="submit">Ajouter</Button>
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
                        <Button variant="outline" disabled={isInitializingHolidays}>
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
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <>
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
                              className="text-red-600 hover:text-red-800"
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
          </section>

          <Separator />

          {/* Section Départements */}
          <section id="departments" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Départements</h2>
              <p className="text-muted-foreground mt-1">
                Gérez les départements de votre organisation
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Départements</CardTitle>
                    <CardDescription>
                      Liste des départements de l'organisation
                    </CardDescription>
                  </div>
                  <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
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
                          <Button type="submit">Créer</Button>
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
                          <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
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
          </section>
        </>
      )}

      <ConfirmationDialog />
    </div>
  );
}
