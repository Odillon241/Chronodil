'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationSoundSettings } from './notification-sound-settings';
import { NotificationSoundTester } from './notification-sound-tester';
import { Bell, Volume2, Mail, Monitor } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface NotificationPreferences {
  notificationSoundEnabled: boolean;
  notificationSoundVolume: number;
  emailNotificationsEnabled: boolean;
  desktopNotificationsEnabled: boolean;
}

interface SettingsNotificationsSectionProps {
  preferences?: NotificationPreferences;
  isSaving?: boolean;
  onPreferenceChange?: (key: string, value: any) => void;
}

export function SettingsNotificationsSection({
  preferences,
  isSaving = false,
  onPreferenceChange,
}: SettingsNotificationsSectionProps) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (preferences) {
      setSoundEnabled(preferences.notificationSoundEnabled);
      setVolume(preferences.notificationSoundVolume ?? 0.5);
    }
  }, [preferences]);

  const handleSoundEnabledChange = (enabled: boolean) => {
    setSoundEnabled(enabled);
    onPreferenceChange?.('notificationSoundEnabled', enabled);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    onPreferenceChange?.('notificationSoundVolume', newVolume);
  };

  if (!mounted) {
    return <div className="p-4 text-sm text-muted-foreground">Chargement...</div>;
  }

  return (
    <Tabs defaultValue="sounds" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="sounds" className="flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          <span className="hidden sm:inline">Sons</span>
        </TabsTrigger>
        <TabsTrigger value="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">Email</span>
        </TabsTrigger>
        <TabsTrigger value="desktop" className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          <span className="hidden sm:inline">Bureau</span>
        </TabsTrigger>
      </TabsList>

      {/* Sons de notification */}
      <TabsContent value="sounds" className="space-y-4">
        <div className="space-y-4">
          {/* Composant principal de gestion des sons */}
          <NotificationSoundSettings
            soundEnabled={soundEnabled}
            onSoundEnabledChange={handleSoundEnabledChange}
            initialVolume={volume}
            onVolumeChange={handleVolumeChange}
          />

          {/* Tester les sons */}
          {soundEnabled && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Mode test</CardTitle>
                <CardDescription>
                  Testez les différents sons de notification pour vérifier les réglages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSoundTester />
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      {/* Notifications par email */}
      <TabsContent value="email">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notifications par email
            </CardTitle>
            <CardDescription>
              Contrôlez les notifications reçues par email
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Activer/Désactiver les emails */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition">
              <div className="space-y-1 flex-1">
                <Label className="text-base font-semibold">Activer les emails</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications importantes par email
                </p>
              </div>
              <Switch
                checked={preferences?.emailNotificationsEnabled ?? false}
                onCheckedChange={(checked) =>
                  onPreferenceChange?.('emailNotificationsEnabled', checked)
                }
                disabled={isSaving}
              />
            </div>

            {/* Information supplémentaire */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                💡 Les notifications par email sont envoyées pour les événements importants comme
                les approbations de feuilles de temps ou les assignations de tâches.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Notifications bureau */}
      <TabsContent value="desktop">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Notifications bureau
            </CardTitle>
            <CardDescription>
              Recevez des notifications même lorsque l'application est en arrière-plan
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Activer/Désactiver les notifications bureau */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition">
              <div className="space-y-1 flex-1">
                <Label className="text-base font-semibold">
                  Activer les notifications bureau
                </Label>
                <p className="text-sm text-muted-foreground">
                  Afficher des notifications même quand l'application est minimisée
                </p>
              </div>
              <Switch
                checked={preferences?.desktopNotificationsEnabled ?? false}
                onCheckedChange={(checked) =>
                  onPreferenceChange?.('desktopNotificationsEnabled', checked)
                }
                disabled={isSaving}
              />
            </div>

            {/* Information supplémentaire */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <p className="text-sm text-green-900 dark:text-green-200">
                ✓ Cette fonctionnalité utilise les notifications natives du navigateur et du
                système d'exploitation pour une meilleure visibilité.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
