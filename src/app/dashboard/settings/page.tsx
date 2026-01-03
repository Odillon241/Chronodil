"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getGeneralSettings,
  updateGeneralSettings,
  resetGeneralSettings,
} from "@/actions/general-settings.actions";
import { AppearanceSection } from "@/components/features/general-settings/appearance-section";
import { LocalizationSection } from "@/components/features/general-settings/localization-section";
import { AccessibilitySection } from "@/components/features/general-settings/accessibility-section";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import { Separator } from "@/components/ui/separator";

export default function GeneralSettingsPage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [generalSettings, setGeneralSettings] = useState<any>(null);
  const [isSavingGeneralSettings, setIsSavingGeneralSettings] = useState(false);

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
    document.documentElement.setAttribute("data-density", settings.viewDensity);

    // Appliquer la couleur d'accentuation
    document.documentElement.setAttribute("data-accent", settings.accentColor);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getGeneralSettings({});
      if (result?.data) {
        setGeneralSettings(result.data);
        applySettingsToUI(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
  };

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
      console.error("Erreur lors de la mise à jour:", error);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres généraux</h1>
        <p className="text-base text-muted-foreground mt-1">
          Personnalisez l'apparence, la langue et l'accessibilité de l'application
        </p>
      </div>

      {!generalSettings ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Chargement des paramètres...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Apparence */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Apparence</CardTitle>
                  <CardDescription>
                    Personnalisez l'apparence de l'interface
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AppearanceSection
                settings={generalSettings}
                onUpdate={handleUpdateGeneralSetting}
                isSaving={isSavingGeneralSettings}
              />
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Localisation</CardTitle>
                  <CardDescription>
                    Configurez la langue, les formats de date et l'heure
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LocalizationSection
                settings={generalSettings}
                onUpdate={handleUpdateGeneralSetting}
                isSaving={isSavingGeneralSettings}
              />
            </CardContent>
          </Card>

          {/* Accessibilité */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Accessibilité</CardTitle>
                  <CardDescription>
                    Options d'accessibilité pour améliorer votre expérience
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AccessibilitySection
                settings={generalSettings}
                onUpdate={handleUpdateGeneralSetting}
                isSaving={isSavingGeneralSettings}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Réinitialiser tous les paramètres aux valeurs par défaut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleResetGeneralSettings}
                disabled={isSavingGeneralSettings}
              >
                Réinitialiser tous les paramètres
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmationDialog />
    </div>
  );
}
