'use client';

import { useEffect, useState } from 'react';
import { Volume2, Volume, VolumeX, Bell, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useNotificationSound, type SoundFiles } from '@/hooks/use-notification-sound';

interface NotificationSoundSettingsProps {
  soundEnabled: boolean;
  onSoundEnabledChange: (enabled: boolean) => void;
  initialVolume?: number;
  onVolumeChange?: (volume: number) => void;
}

export function NotificationSoundSettings({
  soundEnabled,
  onSoundEnabledChange,
  initialVolume = 0.5,
  onVolumeChange,
}: NotificationSoundSettingsProps) {
  const [volume, setVolume] = useState(initialVolume);
  const [mounted, setMounted] = useState(false);

  const { playSound, hasPermission, requestPermission, soundTypes } = useNotificationSound({
    soundEnabled,
    volume,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    onVolumeChange?.(newVolume);
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const testSound = (soundType: keyof SoundFiles = 'notification') => {
    playSound(soundType);
  };

  if (!mounted) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          Sons de notification
        </CardTitle>
        <CardDescription>Gérez vos préférences de notification audio</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Toggle pour activer/désactiver les sons */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">Activer les sons</p>
            <p className="text-sm text-muted-foreground">
              Jouer un son lors des notifications
            </p>
          </div>
          <Switch checked={soundEnabled} onCheckedChange={onSoundEnabledChange} />
        </div>

        {soundEnabled && (
          <>
            {/* Notification Permission */}
            {!hasPermission && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                <p className="mb-3 text-sm text-amber-900 dark:text-amber-200">
                  Vous devez autoriser les notifications navigateur pour profiter de la
                  notification audio complète.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestPermission}
                  className="border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
                >
                  Autoriser les notifications
                </Button>
              </div>
            )}

            {/* Volume Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Volume</label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                ) : volume < 0.5 ? (
                  <Volume className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                )}
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Test Sounds */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Tester les sons</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {soundTypes.map((soundType) => (
                  <Button
                    key={soundType}
                    size="sm"
                    variant="outline"
                    onClick={() => testSound(soundType)}
                    className="text-xs"
                  >
                    {getSoundLabel(soundType)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground">
              Les sons de notification seront synchronisés entre les onglets ouverts pour
              éviter les doublons.
            </p>
          </>
        )}

        {!soundEnabled && (
          <p className="text-xs text-muted-foreground">
            Les sons de notification sont actuellement désactivés.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function getSoundLabel(soundType: SoundFiles[keyof SoundFiles] | string): string {
  const labels: Record<string, string> = {
    notification: 'Notification',
    taskAssigned: 'Tâche assignée',
    taskCompleted: 'Tâche complétée',
    taskUpdated: 'Tâche mise à jour',
    error: 'Erreur',
    success: 'Succès',
  };
  return labels[soundType] || soundType;
}
