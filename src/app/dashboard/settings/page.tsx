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
import { Calendar as CalendarIcon, Plus, Trash2, Building2, Bell, Volume2, Mail, Monitor, Settings2, RotateCcw, CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { format, isSameDay, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { useNotificationSound, useAvailableSounds, CATEGORY_LABELS, NOTIFICATION_SOUNDS, type SoundCategory } from "@/hooks/use-notification-sound";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { sendTestPushNotification } from "@/actions/push-subscription.actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "@/lib/auth-client";
import {
  getGeneralSettings,
  updateGeneralSettings,
  resetGeneralSettings,
} from "@/actions/general-settings.actions";
import { AppearanceSection } from "@/components/features/general-settings/appearance-section";
import { LocalizationSection } from "@/components/features/general-settings/localization-section";
import { AccessibilitySection } from "@/components/features/general-settings/accessibility-section";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "notifications";
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
  
  // Calendar state for holidays
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());

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
  const [preferences, setPreferences] = useState<any>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  
  // État local pour le slider de volume (pour interaction fluide)
  const [localVolume, setLocalVolume] = useState<number>(50);
  const [isTestingSound, setIsTestingSound] = useState(false);

  // Push notifications
  const pushSubscription = usePushSubscription({
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    autoSubscribe: false,
  });
  
  // Hook de notification avec les préférences actuelles
  // Pour le test, on force toujours l'activation du son
  const {
    testSound: testSoundFromHook,
    playSoundById,
    requestPermission,
    showNotification,
    permission,
    hasPermission
  } = useNotificationSound({
    soundEnabled: true, // Toujours activé pour permettre les tests
    volume: localVolume / 100, // Utiliser le volume local pour le test
  });

  // Charger les sons disponibles depuis Supabase Storage
  const { availableSounds, soundsByCategory, isLoading: isLoadingSounds } = useAvailableSounds();

  // Mapping des anciennes valeurs de son vers les nouvelles (migration)
  const LEGACY_SOUND_MAPPING: Record<string, string> = {
    'default': 'new-notification-3-398649',
    'soft': 'notification-reussie',
    'alert': 'notification',
  };

  // Fonction de test améliorée qui utilise le son sélectionné avec le volume actuel
  const testSound = async (soundType?: string) => {
    if (isTestingSound) return; // Éviter les tests multiples simultanés
    
    setIsTestingSound(true);
    let typeToTest = soundType || preferences?.notificationSoundType || 'new-notification-3-398649';
    
    // Migration des anciennes valeurs vers les nouvelles
    if (LEGACY_SOUND_MAPPING[typeToTest]) {
      typeToTest = LEGACY_SOUND_MAPPING[typeToTest];
    }
    
    const currentVolume = localVolume / 100;

    console.log('[SettingsPage] Test du son:', typeToTest, {
      preferences: preferences?.notificationSoundType,
      localVolume,
      currentVolume,
    });

    try {
      // Chercher d'abord dans les sons disponibles, puis dans tous les sons comme fallback
      let sound = availableSounds.find(s => s.id === typeToTest);
      
      if (!sound) {
        sound = NOTIFICATION_SOUNDS.find(s => s.id === typeToTest);
      }

      if (!sound) {
        toast.error('Son introuvable');
        console.error('[SettingsPage] Son introuvable:', typeToTest);
        return;
      }

      // Créer un élément audio temporaire avec le volume actuel
      const audio = new Audio();
      audio.volume = currentVolume;
      audio.preload = 'auto';

      // Promise pour gérer les événements audio
      const playPromise = new Promise<void>((resolve, reject) => {
        let hasResolved = false;

        const cleanup = () => {
          audio.removeEventListener('canplaythrough', onCanPlay);
          audio.removeEventListener('error', onError);
          audio.removeEventListener('ended', onEnded);
        };

        const onCanPlay = () => {
          if (!hasResolved) {
            console.log('[SettingsPage] Son prêt à être joué:', typeToTest);
          }
        };

        const onError = (e: Event) => {
          if (!hasResolved) {
            hasResolved = true;
            cleanup();
            const errorMsg = audio.error 
              ? `Erreur ${audio.error.code}: ${audio.error.message}` 
              : 'Erreur de chargement';
            reject(new Error(errorMsg));
          }
        };

        const onEnded = () => {
          if (!hasResolved) {
            hasResolved = true;
            cleanup();
            resolve();
          }
        };

        audio.addEventListener('canplaythrough', onCanPlay);
        audio.addEventListener('error', onError);
        audio.addEventListener('ended', onEnded);

        // Définir la source et jouer
        audio.src = sound!.file;
        audio.play()
          .then(() => {
            console.log('[SettingsPage] Lecture du son lancée:', typeToTest);
            // Si la lecture démarre, on considère que c'est un succès
            if (!hasResolved) {
              hasResolved = true;
              toast.success('Test du son', {
                description: `🔊 ${sound!.name}`,
                duration: 2000,
              });
              // On laisse l'événement 'ended' gérer le cleanup
            }
          })
          .catch((error) => {
            if (!hasResolved) {
              hasResolved = true;
              cleanup();
              reject(error);
            }
          });
      });

      await playPromise;
      console.log('[SettingsPage] Son joué avec succès:', typeToTest);

    } catch (error: any) {
      console.error('[SettingsPage] Erreur lors du test du son:', {
        soundId: typeToTest,
        error: error.message,
        errorName: error.name,
      });
      
      // Messages d'erreur plus explicites
      if (error.name === 'NotAllowedError') {
        toast.error('Permission audio requise', {
          description: 'Cliquez à nouveau pour autoriser la lecture audio',
          duration: 3000,
        });
      } else if (error.name === 'NotSupportedError') {
        toast.error('Format audio non supporté', {
          description: 'Votre navigateur ne peut pas lire ce fichier',
          duration: 3000,
        });
      } else {
        toast.error('Erreur de lecture', {
          description: error.message || 'Impossible de lire le son',
          duration: 3000,
        });
      }
    } finally {
      setIsTestingSound(false);
    }
  };
  
  // Mettre à jour l'état local quand les préférences changent
  useEffect(() => {
    if (preferences?.notificationSoundVolume !== undefined) {
      setLocalVolume(preferences.notificationSoundVolume * 100);
    }
  }, [preferences?.notificationSoundVolume]);

  // Synchroniser les préférences de notification vers localStorage pour le hook useNotificationWithSound
  useEffect(() => {
    if (typeof window !== 'undefined' && preferences) {
      // Synchroniser le son activé
      if (preferences.notificationSoundEnabled !== undefined) {
        localStorage.setItem('notification-sounds-enabled', preferences.notificationSoundEnabled.toString());
      }
      // Synchroniser le volume
      if (preferences.notificationSoundVolume !== undefined) {
        localStorage.setItem('notification-sounds-volume', preferences.notificationSoundVolume.toString());
      }
      // Synchroniser le son par défaut
      if (preferences.notificationSoundType) {
        localStorage.setItem('notification-sounds-default', preferences.notificationSoundType);
      }
    }
  }, [preferences?.notificationSoundEnabled, preferences?.notificationSoundVolume, preferences?.notificationSoundType]);

  // Debounce de la valeur pour sauvegarder après un délai
  const debouncedVolume = useDebounce(localVolume, 500);

  // Sauvegarder la valeur débouncée (seulement si elle a changé)
  useEffect(() => {
    if (preferences && debouncedVolume !== undefined) {
      const volumeValue = debouncedVolume / 100;
      const currentValue = preferences.notificationSoundVolume || 0;
      // Ne sauvegarder que si la valeur a vraiment changé (seuil de 1%)
      if (Math.abs(volumeValue - currentValue) > 0.01) {
        handleUpdatePreference("notificationSoundVolume", volumeValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedVolume]);

  // General settings preferences (Phase 1)
  const [generalSettings, setGeneralSettings] = useState<any>(null);
  const [isSavingGeneralSettings, setIsSavingGeneralSettings] = useState(false);


  // Mapping pour migrer les anciennes couleurs vers les nouvelles
  const colorMigrationMap: Record<string, string> = {
    "rusty-red": "green-anis",
    "ou-crimson": "green-teal",
    "powder-blue": "green-anis",
    "golden-orange": "yellow-vibrant",
    "green": "green-anis",
    "dark-green": "green-teal",
    "light-green": "green-anis",
    "forest-green": "green-teal",
    "sage-green": "green-anis",
  };

  const validAccentColors = ["yellow-vibrant", "green-anis", "green-teal", "dark"];

  // Fonction pour normaliser la couleur d'accentuation
  const normalizeAccentColor = (accentColor: string | null | undefined): string => {
    if (!accentColor) return "green-anis";
    if (validAccentColors.includes(accentColor)) return accentColor;
    return colorMigrationMap[accentColor] || "green-anis";
  };

  // Fonction pour appliquer les paramètres visuellement
  const applySettingsToUI = (settings: any) => {
    if (!settings) return;

    // Appliquer la taille de police
    document.documentElement.style.fontSize = `${settings.fontSize}px`;

    // Appliquer le contraste élevé
    if (settings.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    // Appliquer la réduction des animations
    if (settings.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }

    // Appliquer la densité d'affichage
    if (settings.viewDensity) {
      document.documentElement.setAttribute("data-density", settings.viewDensity);
    } else {
      document.documentElement.setAttribute("data-density", "normal");
    }

    // Appliquer la couleur d'accentuation (normalisée) - TOUJOURS appliquer une valeur
    const normalizedColor = normalizeAccentColor(settings.accentColor);
    document.documentElement.setAttribute("data-accent", normalizedColor);
    // Note: La migration automatique sera gérée par AppearanceSection via useEffect
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [holidaysResult, departmentsResult, settingsResult, preferencesResult, generalSettingsResult] = await Promise.all([
        getHolidays({}),
        getDepartments({}),
        getSettings({}).catch((e) => {
          console.error("Erreur getSettings:", e);
          return { data: [] };
        }),
        getUserPreferences({}).catch((e) => {
          console.error("Erreur getUserPreferences:", e);
          return { data: null };
        }),
        getGeneralSettings({}).catch((e) => {
          console.error("Erreur getGeneralSettings:", e);
          return { data: null };
        }),
      ]);

      console.log("🔍 Résultats chargés:", {
        holidays: holidaysResult,
        departments: departmentsResult,
        settings: settingsResult,
        preferences: preferencesResult,
        generalSettings: generalSettingsResult,
      });

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
        // Migration des anciennes valeurs de son vers les nouvelles
        const legacySoundMapping: Record<string, string> = {
          'default': 'new-notification-3-398649',
          'soft': 'notification-reussie', 
          'alert': 'notification',
        };
        
        const prefs = { ...preferencesResult.data };
        if (prefs.notificationSoundType && legacySoundMapping[prefs.notificationSoundType]) {
          const newSoundType = legacySoundMapping[prefs.notificationSoundType];
          console.log('[Settings] Migration du son:', prefs.notificationSoundType, '->', newSoundType);
          prefs.notificationSoundType = newSoundType;
          // Sauvegarder la migration en BD (en background)
          updateUserPreferences({ notificationSoundType: newSoundType }).catch(console.error);
        }
        
        setPreferences(prefs);
      }

      if (generalSettingsResult?.data) {
        console.log("✅ Paramètres généraux chargés:", generalSettingsResult.data);
        setGeneralSettings(generalSettingsResult.data);
        applySettingsToUI(generalSettingsResult.data);
      } else {
        console.warn("⚠️ Pas de paramètres généraux:", generalSettingsResult);
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
      // Si on active les notifications de bureau, demander la permission
      if (key === "desktopNotificationsEnabled" && value === true) {
        console.log('[Desktop Notifications] Activating desktop notifications...');
        
        if (!('Notification' in window)) {
          console.error('[Desktop Notifications] Notifications API not supported');
          toast.error("Les notifications ne sont pas supportées par ce navigateur");
          setIsSavingPreferences(false);
          return;
        }

        const currentPermission = Notification.permission;
        console.log('[Desktop Notifications] Current permission:', currentPermission);

        if (currentPermission === 'default') {
          console.log('[Desktop Notifications] Requesting permission...');
          const permissionResult = await requestPermission();
          console.log('[Desktop Notifications] Permission result:', permissionResult);
          
          if (permissionResult !== 'granted') {
            toast.error("Permission refusée. Les notifications de bureau ne peuvent pas être activées.");
            setIsSavingPreferences(false);
            return;
          }
        } else if (currentPermission === 'denied') {
          console.warn('[Desktop Notifications] Permission denied by user');
          toast.error("Les notifications sont bloquées. Veuillez les autoriser dans les paramètres du navigateur.");
          setIsSavingPreferences(false);
          return;
        } else if (currentPermission === 'granted') {
          console.log('[Desktop Notifications] Permission already granted');
        }
      }

      const result = await updateUserPreferences({ [key]: value });
      if (result?.data) {
        setPreferences(result.data);
        // Ne pas afficher de toast pour le volume (trop fréquent)
        if (key !== "notificationSoundVolume") {
          toast.success("Préférence enregistrée");
        }
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Handler pour le changement immédiat du volume (affichage)
  const handleVolumeChange = (value: number) => {
    setLocalVolume(value);
  };

  // Handler pour le commit du volume (quand l'utilisateur relâche)
  const handleVolumeCommit = (value: number) => {
    const volumeValue = value / 100;
    // Sauvegarder immédiatement quand l'utilisateur relâche
    handleUpdatePreference("notificationSoundVolume", volumeValue);
  };

  // Composant réutilisable pour les cartes de sons en liste
  function SoundOptionCard({ 
    sound, 
    isSelected, 
    onTest, 
    disabled 
  }: { 
    sound: typeof NOTIFICATION_SOUNDS[0];
    isSelected: boolean;
    onTest: () => void;
    disabled: boolean;
  }) {
    return (
      <div
        className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-sm'
            : 'border-border hover:bg-muted/50 hover:border-blue-300 dark:hover:border-blue-700'
        }`}
      >
        <RadioGroupItem
          value={sound.id}
          id={`sound-${sound.id}`}
          className="flex-shrink-0"
          disabled={disabled}
        />
        <Label
          htmlFor={`sound-${sound.id}`}
          className="flex-1 min-w-0 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold">
                {sound.name}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {sound.description}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isSelected && (
                <Badge variant="default" className="text-xs">
                  Par défaut
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {CATEGORY_LABELS[sound.category]}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onTest();
                }}
                disabled={disabled}
                className="h-8 px-3 text-xs"
              >
                <Volume2 className="h-3.5 w-3.5 mr-1.5" />
                Tester
              </Button>
            </div>
          </div>
        </Label>
      </div>
    );
  }

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

  // General Settings (Phase 1)
  const handleUpdateGeneralSetting = async (key: string, value: any) => {
    console.log("📝 Mise à jour du paramètre:", { key, value });
    setIsSavingGeneralSettings(true);
    try {
      const result = await updateGeneralSettings({ [key]: value });
      console.log("📋 Résultat de updateGeneralSettings:", result);
      if (result?.data) {
        console.log("✅ Mise à jour réussie:", result.data);
        setGeneralSettings(result.data);
        applySettingsToUI(result.data);
        // Déclencher un événement pour que SettingsProvider réapplique les paramètres
        window.dispatchEvent(new CustomEvent("settings-updated"));
        toast.success("Paramètre enregistré");
      } else if (result?.serverError) {
        console.error("❌ Erreur serveur:", result.serverError);
        toast.error(result.serverError);
      } else {
        console.warn("⚠️ Résultat inattendu:", result);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour:", error);
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
            // Déclencher un événement pour que SettingsProvider réapplique les paramètres
            window.dispatchEvent(new CustomEvent("settings-updated"));
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
          let skipped = 0;
          
          // Ajouter les jours fériés fixes
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
              // Si le jour férié existe déjà (contrainte unique), on le passe
              const errorMessage = error?.message || error?.serverError || "";
              if (
                errorMessage.includes("Unique constraint") ||
                errorMessage.includes("déjà") ||
                errorMessage.includes("existe déjà")
              ) {
                skipped++;
              } else {
                console.error("Erreur lors de l'ajout du jour férié:", error);
              }
            }
          }
          
          // Ajouter les jours fériés variables si disponibles
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
              // Si le jour férié existe déjà (contrainte unique), on le passe
              const errorMessage = error?.message || error?.serverError || "";
              if (
                errorMessage.includes("Unique constraint") ||
                errorMessage.includes("déjà") ||
                errorMessage.includes("existe déjà")
              ) {
                skipped++;
              } else {
                console.error("Erreur lors de l'ajout du jour férié:", error);
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

  // Rendu conditionnel selon l'onglet
  const renderContent = () => {
    switch (tab) {
      case "holidays":
        return renderHolidaysSection();
      case "departments":
        return renderDepartmentsSection();
      case "general":
        return renderGeneralSection();
      case "notifications":
      default:
        return renderNotificationsSection();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {tab === "holidays" && "Jours fériés"}
          {tab === "departments" && "Départements"}
          {tab === "general" && "Paramètres généraux"}
          {tab === "notifications" && "Notifications"}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {tab === "holidays" && "Gérez les jours fériés pour le calcul des temps (Gabon)"}
          {tab === "departments" && "Gérez les départements de votre organisation"}
          {tab === "general" && "Personnalisez l'apparence, la langue et l'accessibilité"}
          {tab === "notifications" && "Gérez vos préférences de notification sonore et visuelle"}
        </p>
      </div>

      <Separator />

      {renderContent()}
      <ConfirmationDialog />
    </div>
  );

  // Section Notifications
  function renderNotificationsSection() {
    return (
      <div className="space-y-8">
        {/* Header avec gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/50 p-3 md:p-4">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Bell className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
                  Configurez vos notifications sonores, emails, bureau et push
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleResetPreferences}
              disabled={isSavingPreferences || !preferences}
              size="sm"
              className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-blue-200 dark:border-blue-800 hover:bg-white dark:hover:bg-gray-900 h-8 text-xs md:text-sm"
            >
              <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
              Réinitialiser
            </Button>
          </div>
        </div>

        {!preferences ? (
          <Card className="border-dashed">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 rounded-full bg-muted animate-pulse">
                  <Settings2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Spinner className="size-6" />
                  <p className="text-center text-muted-foreground">Chargement des préférences...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Grille des options principales */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Carte Sons */}
              <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                      <Volume2 className="h-6 w-6 text-white" />
                    </div>
                    <Switch
                      checked={preferences.notificationSoundEnabled}
                      onCheckedChange={(checked) =>
                        handleUpdatePreference("notificationSoundEnabled", checked)
                      }
                      disabled={isSavingPreferences}
                      className="relative z-10"
                    />
                  </div>
                  <CardTitle className="text-lg font-semibold">Sons de notification</CardTitle>
                  <CardDescription className="text-sm">
                    Alertes sonores personnalisables
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  {preferences.notificationSoundEnabled ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1.5" />
                          Activé
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {Math.round(localVolume)}%
                          </span>
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testSound(preferences.notificationSoundType || 'new-notification-3-398649')}
                          disabled={isSavingPreferences || !preferences.notificationSoundEnabled || isTestingSound}
                          className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        >
                          {isTestingSound ? (
                            <>
                              <Spinner className="h-4 w-4 mr-2" />
                              Lecture...
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4 mr-2" />
                              Tester le son
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Badge variant="outline" className="bg-muted/50">
                      Désactivé
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Carte Email */}
              <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-300 dark:hover:border-amber-700 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <Switch
                      checked={preferences.emailNotificationsEnabled}
                      onCheckedChange={(checked) =>
                        handleUpdatePreference("emailNotificationsEnabled", checked)
                      }
                      disabled={isSavingPreferences}
                      className="relative z-10"
                    />
                  </div>
                  <CardTitle className="text-lg font-semibold">Notifications email</CardTitle>
                  <CardDescription className="text-sm">
                    Recevez des alertes par email
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  {preferences.emailNotificationsEnabled ? (
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1.5" />
                      Activé
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted/50">
                      Désactivé
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Carte Bureau */}
              <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 hover:border-green-300 dark:hover:border-green-700 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25">
                      <Monitor className="h-6 w-6 text-white" />
                    </div>
                    <Switch
                      checked={preferences.desktopNotificationsEnabled}
                      onCheckedChange={(checked) =>
                        handleUpdatePreference("desktopNotificationsEnabled", checked)
                      }
                      disabled={isSavingPreferences}
                      className="relative z-10"
                    />
                  </div>
                  <CardTitle className="text-lg font-semibold">Notifications bureau</CardTitle>
                  <CardDescription className="text-sm">
                    Alertes système natives
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    {preferences.desktopNotificationsEnabled ? (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1.5" />
                        Activé
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted/50">
                        Désactivé
                      </Badge>
                    )}
                    {preferences.desktopNotificationsEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          console.log('[Desktop Notifications] Test button clicked', {
                            hasPermission,
                            permission,
                            notificationSupported: 'Notification' in window,
                          });

                          // Vérifier le support
                          if (!('Notification' in window)) {
                            toast.error("Les notifications ne sont pas supportées par ce navigateur");
                            return;
                          }

                          // Vérifier et demander la permission si nécessaire
                          let currentPermission = Notification.permission;
                          console.log('[Desktop Notifications] Current permission:', currentPermission);

                          if (currentPermission === 'default') {
                            const result = await requestPermission();
                            console.log('[Desktop Notifications] Permission request result:', result);
                            if (result !== 'granted') {
                              toast.error("Permission refusée");
                              return;
                            }
                            currentPermission = 'granted';
                          } else if (currentPermission === 'denied') {
                            toast.error("Les notifications sont bloquées. Veuillez les autoriser dans les paramètres du navigateur.");
                            return;
                          }

                          // Afficher la notification directement (pas via le hook pour éviter les problèmes de mounted)
                          if (currentPermission === 'granted') {
                            try {
                              console.log('[Desktop Notifications] Creating notification...');
                              
                              // Utiliser une icône qui existe vraiment
                              const iconUrl = "/assets/media/icône du logoicône logo de chronodil.svg";
                              
                              const notification = new Notification("🔔 Test de notification", {
                                body: "Ceci est une notification de test depuis Chronodil. Si vous voyez ce message, les notifications fonctionnent correctement !",
                                icon: iconUrl,
                                badge: iconUrl,
                                tag: "test-notification-" + Date.now(), // Tag unique pour éviter les remplacements
                                requireInteraction: false, // La notification se ferme automatiquement
                                silent: false, // Permettre le son système si activé
                              } as any);
                              
                              console.log('[Desktop Notifications] Notification created:', {
                                title: notification.title,
                                body: notification.body,
                                icon: iconUrl,
                              });
                              
                              // Gérer les événements de la notification
                              notification.onclick = () => {
                                console.log('[Desktop Notifications] Notification clicked');
                                window.focus(); // Focus sur la fenêtre
                                notification.close();
                              };
                              
                              notification.onshow = () => {
                                console.log('[Desktop Notifications] Notification displayed');
                                toast.success("Notification de test envoyée et affichée !");
                              };
                              
                              notification.onerror = (error) => {
                                console.error('[Desktop Notifications] Notification error:', error);
                                toast.error("Erreur lors de l'affichage de la notification");
                              };
                              
                              notification.onclose = () => {
                                console.log('[Desktop Notifications] Notification closed');
                              };
                              
                              // Fermer automatiquement après 10 secondes
                              setTimeout(() => {
                                if (notification) {
                                  notification.close();
                                }
                              }, 10000);
                              
                            } catch (error) {
                              console.error('[Desktop Notifications] Error creating notification:', error);
                              toast.error(`Erreur lors de l'envoi de la notification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
                            }
                          } else {
                            toast.error("Permission non accordée");
                          }
                        }}
                        disabled={isSavingPreferences}
                        className="gap-2"
                      >
                        <Monitor className="h-4 w-4" />
                        Tester
                      </Button>
                    )}
                  </div>
                  {preferences.desktopNotificationsEnabled && (
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        // Utiliser la permission réelle du navigateur pour l'affichage
                        const browserPermission = typeof window !== 'undefined' && 'Notification' in window 
                          ? Notification.permission 
                          : permission;
                        
                        return browserPermission === 'granted' ? (
                          <span className="text-green-600 dark:text-green-400">✓ Permission accordée</span>
                        ) : browserPermission === 'denied' ? (
                          <span className="text-red-600 dark:text-red-400">✗ Permission refusée - Activez dans les paramètres du navigateur</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">⚠ Permission en attente - Cliquez sur "Tester" pour demander</span>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Carte Push Notifications */}
              <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-300 dark:hover:border-purple-700 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                    <Switch
                      checked={pushSubscription.isSubscribed}
                      onCheckedChange={async (checked) => {
                        if (checked) {
                          const success = await pushSubscription.subscribe();
                          if (success) {
                            toast.success('Notifications push activées');
                          } else {
                            toast.error(pushSubscription.error || 'Erreur lors de l\'activation');
                          }
                        } else {
                          const success = await pushSubscription.unsubscribe();
                          if (success) {
                            toast.success('Notifications push désactivées');
                          } else {
                            toast.error('Erreur lors de la désactivation');
                          }
                        }
                      }}
                      disabled={pushSubscription.isLoading || !pushSubscription.isSupported}
                      className="relative z-10"
                    />
                  </div>
                  <CardTitle className="text-lg font-semibold">Notifications push</CardTitle>
                  <CardDescription className="text-sm">
                    Recevez des alertes même si l'application est fermée
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    {pushSubscription.isSubscribed ? (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1.5" />
                        Abonné
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted/50">
                        Non abonné
                      </Badge>
                    )}
                    {pushSubscription.isSubscribed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const result = await sendTestPushNotification({});
                            if (result?.data?.success) {
                              toast.success(result.data.message || 'Notification de test envoyée !');
                            } else {
                              toast.error(result?.data?.message || result?.serverError || 'Erreur lors de l\'envoi');
                            }
                          } catch (error) {
                            console.error('[Push Test] Erreur:', error);
                            toast.error('Erreur lors de l\'envoi de la notification');
                          }
                        }}
                        disabled={pushSubscription.isLoading || !session?.user?.id}
                        className="gap-2"
                      >
                        <Bell className="h-4 w-4" />
                        Tester
                      </Button>
                    )}
                  </div>
                  {!pushSubscription.isSupported && (
                    <div className="text-xs text-muted-foreground">
                      <span className="text-amber-600 dark:text-amber-400">
                        {pushSubscription.error?.includes('VAPID') 
                          ? '⚠ Configuration serveur requise (clés VAPID)'
                          : '⚠ Non supporté par ce navigateur'
                        }
                      </span>
                    </div>
                  )}
                  {pushSubscription.isSupported && pushSubscription.permission === 'denied' && (
                    <div className="text-xs text-muted-foreground">
                      <span className="text-red-600 dark:text-red-400">
                        ✗ Permission refusée - Activez dans les paramètres du navigateur
                      </span>
                    </div>
                  )}
                  {pushSubscription.isSupported && pushSubscription.permission === 'default' && !pushSubscription.isSubscribed && (
                    <div className="text-xs text-muted-foreground">
                      <span className="text-amber-600 dark:text-amber-400">
                        ⚠ Activez pour recevoir des notifications même si l'application est fermée
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Section détaillée des sons (si activé) */}
            {preferences.notificationSoundEnabled && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Configuration des sons
                  </CardTitle>
                  <CardDescription>
                    Personnalisez le type de son et le volume
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Type de son avec catégories */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Son par défaut</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sélectionnez le son de notification que vous souhaitez utiliser par défaut
                        </p>
                      </div>
                    </div>
                    
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="all" className="text-xs sm:text-sm">
                          Tous
                        </TabsTrigger>
                        <TabsTrigger value="classic" className="text-xs sm:text-sm">
                          Classique
                        </TabsTrigger>
                        <TabsTrigger value="success" className="text-xs sm:text-sm">
                          Succès
                        </TabsTrigger>
                        <TabsTrigger value="error" className="text-xs sm:text-sm">
                          Alerte
                        </TabsTrigger>
                      </TabsList>
                      
                      {/* Onglet : Tous les sons */}
                      <TabsContent value="all" className="space-y-2">
                        <RadioGroup
                          value={preferences?.notificationSoundType ?? 'new-notification-3-398649'}
                          onValueChange={(value) => {
                            // Mise à jour optimiste du localStorage pour une réactivité immédiate
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('notification-sounds-default', value);
                            }
                            handleUpdatePreference("notificationSoundType", value);
                            toast.success("Son par défaut mis à jour");
                          }}
                          disabled={isSavingPreferences}
                          className="space-y-2"
                        >
                          {isLoadingSounds ? (
                            <div className="flex flex-col items-center gap-4 p-4">
                              <Spinner className="size-5" />
                              <p className="text-sm text-muted-foreground">Chargement des sons...</p>
                            </div>
                          ) : (
                            availableSounds.map((sound) => {
                              const currentValue = preferences?.notificationSoundType ?? 'new-notification-3-398649';
                              const isSelected = currentValue === sound.id;
                              return (
                                <SoundOptionCard
                                  key={sound.id}
                                  sound={sound}
                                  isSelected={isSelected}
                                  onTest={() => testSound(sound.id)}
                                  disabled={isSavingPreferences || !preferences?.notificationSoundEnabled}
                                />
                              );
                            })
                          )}
                        </RadioGroup>
                      </TabsContent>
                      
                      {/* Onglets par catégorie */}
                      {(['classic', 'success', 'error'] as SoundCategory[]).map((category) => {
                        const soundsInCategory = soundsByCategory[category];
                        if (soundsInCategory.length === 0) return null;
                        
                        return (
                          <TabsContent key={category} value={category} className="space-y-2">
                            <RadioGroup
                              value={preferences?.notificationSoundType ?? 'new-notification-3-398649'}
                              onValueChange={(value) => {
                                // Mise à jour optimiste du localStorage pour une réactivité immédiate
                                if (typeof window !== 'undefined') {
                                  localStorage.setItem('notification-sounds-default', value);
                                }
                                handleUpdatePreference("notificationSoundType", value);
                                toast.success("Son par défaut mis à jour");
                              }}
                              disabled={isSavingPreferences}
                              className="space-y-2"
                            >
                              {soundsInCategory.map((sound) => {
                                const currentValue = preferences?.notificationSoundType ?? 'new-notification-3-398649';
                                const isSelected = currentValue === sound.id;
                                return (
                                  <SoundOptionCard
                                    key={sound.id}
                                    sound={sound}
                                    isSelected={isSelected}
                                    onTest={() => testSound(sound.id)}
                                    disabled={isSavingPreferences || !preferences?.notificationSoundEnabled}
                                  />
                                );
                              })}
                            </RadioGroup>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </div>

                  <Separator />

                  {/* Volume avec slider amélioré */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sound-volume" className="text-base font-semibold">
                          Volume
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ajustez l'intensité sonore
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 min-w-[60px] text-right">
                          {Math.round(localVolume)}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testSound(preferences.notificationSoundType || 'new-notification-3-398649')}
                          disabled={isSavingPreferences || !preferences.notificationSoundEnabled || isTestingSound}
                          className="gap-2"
                        >
                          {isTestingSound ? (
                            <>
                              <Spinner className="h-4 w-4" />
                              Test...
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4" />
                              Tester
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <Slider
                      id="sound-volume"
                      min={0}
                      max={100}
                      step={5}
                      value={[localVolume]}
                      onValueChange={([value]) => handleVolumeChange(value)}
                      onValueCommit={([value]) => handleVolumeCommit(value)}
                      disabled={isSavingPreferences}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Silencieux</span>
                      <span>Maximum</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  // Section Jours fériés
  function renderHolidaysSection() {
    // Convertir les jours fériés en dates pour le calendrier
    const holidayDates = holidays.map((holiday) => startOfDay(new Date(holiday.date)));
    
    // Fonction pour vérifier si une date est un jour férié
    const isHoliday = (date: Date) => {
      return holidayDates.some((holidayDate) => isSameDay(date, holidayDate));
    };
    
    // Obtenir le nom du jour férié pour une date donnée
    const getHolidayName = (date: Date) => {
      const holiday = holidays.find((h) => isSameDay(new Date(h.date), date));
      return holiday?.name || null;
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={isInitializingHolidays}
                        className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-white text-xs sm:text-sm"
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
                      <Button className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm">
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
                        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm">
                          Ajouter
                        </Button>
                      </div>
                    </form>
                    </DialogContent>
                  </Dialog>
          </div>
        </div>
        <div>
              {holidays.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Aucun jour férié défini</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={isInitializingHolidays}
                        className="border-primary text-primary hover:bg-primary hover:text-white"
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
                <div className="space-y-6">
                  {/* Calendrier avec jours fériés marqués */}
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-auto">
                      <div className="flex flex-col items-center lg:items-start">
                        <h3 className="text-sm font-medium mb-3">Calendrier des jours fériés</h3>
                        <Calendar
                          mode="single"
                          selected={selectedCalendarDate}
                          onSelect={setSelectedCalendarDate}
                          locale={fr}
                          modifiers={{
                            holiday: (date) => isHoliday(date),
                          }}
                          modifiersClassNames={{
                            holiday: "!bg-amber-100 dark:!bg-amber-900/30 !text-amber-900 dark:!text-amber-100 font-semibold border border-amber-300 dark:border-amber-700",
                          }}
                          className="rounded-md border"
                        />
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="h-3 w-3 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700"></div>
                          <span>Jour férié</span>
                        </div>
                        {selectedCalendarDate && isHoliday(selectedCalendarDate) && (
                          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                              {getHolidayName(selectedCalendarDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Liste des jours fériés */}
                    <div className="flex-1">
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
                    </div>
                  </div>
                </div>
              )}
        </div>
      </div>
    );
  }

    // Section Départements
    function renderDepartmentsSection() {
      return (
        <div className="space-y-6">
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
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm">
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
                        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm">
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
        </div>
      );
    }

  // Section Général
  function renderGeneralSection() {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-end gap-4">
          <Button
            variant="outline"
            onClick={handleResetGeneralSettings}
            disabled={isSavingGeneralSettings || !generalSettings}
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            Réinitialiser
          </Button>
        </div>

          {!generalSettings ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-4">
                  <Spinner className="size-6" />
                  <p className="text-center text-muted-foreground">Chargement des paramètres...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Appearance Section */}
              <AppearanceSection
                settings={generalSettings}
                onUpdate={handleUpdateGeneralSetting}
                isSaving={isSavingGeneralSettings}
              />

              {/* Localization Section */}
              <LocalizationSection
                settings={generalSettings}
                onUpdate={handleUpdateGeneralSetting}
                isSaving={isSavingGeneralSettings}
              />

              {/* Accessibility Section */}
              <AccessibilitySection
                settings={generalSettings}
                onUpdate={handleUpdateGeneralSetting}
                isSaving={isSavingGeneralSettings}
              />
            </div>
          )}
        </div>
      );
    }
}
