"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/actions/preferences.actions";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";

export default function NotificationsPage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const { testSound } = useNotificationSound();
  const [preferences, setPreferences] = useState<any>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const result = await getUserPreferences({});
      if (result?.data) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
  };

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

  if (!preferences) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement des préférences...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Préférences de notification</h1>
        <p className="text-base text-muted-foreground mt-1">
          Gérez vos préférences de notification sonore et visuelle
        </p>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="outline"
            onClick={handleResetPreferences}
            disabled={isSavingPreferences}
          >
            Réinitialiser
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Sons de notification */}
        <Card>
          <CardHeader>
            <CardTitle>Sons de notification</CardTitle>
            <CardDescription>
              Configurez les alertes sonores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
          </CardContent>
        </Card>

        {/* Notifications par email */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications par email</CardTitle>
            <CardDescription>
              Recevez des notifications par email
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Notifications bureau */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications bureau</CardTitle>
            <CardDescription>
              Affichez des notifications sur votre bureau
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog />
    </div>
  );
}

