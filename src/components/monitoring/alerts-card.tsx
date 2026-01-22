'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bell, Plus, Settings, AlertTriangle, Trash2 } from 'lucide-react'
import type { AlertConfig, AlertTriggered } from '@/types/monitoring'
import { SEVERITY_CONFIG } from '@/types/monitoring'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface AlertsCardProps {
  alertConfigs: AlertConfig[]
  triggeredAlerts: AlertTriggered[]
  onSaveConfig: (config: Partial<AlertConfig>) => Promise<void>
  onDeleteConfig: (id: string) => Promise<void>
  onAcknowledgeAlert: (id: string) => Promise<void>
  isLoading?: boolean
}

const METRIC_OPTIONS = [
  { value: 'events_per_hour', label: 'Événements par heure' },
  { value: 'auth_failures', label: "Échecs d'authentification" },
  { value: 'rate_limit_hits', label: 'Hits rate limit' },
  { value: 'unauthorized_access', label: 'Accès non autorisés' },
  { value: 'users_online', label: 'Utilisateurs en ligne' },
]

function AlertConfigItem({
  config,
  onToggle,
  onDelete,
}: {
  config: AlertConfig
  onToggle: () => void
  onDelete: () => void
}) {
  const severityStyle = SEVERITY_CONFIG[config.severity]

  return (
    <div className="flex items-center justify-between py-2 px-1">
      <div className="flex items-center gap-3">
        <Switch checked={config.enabled} onCheckedChange={onToggle} className="scale-90" />
        <div>
          <p className="text-sm font-medium">{config.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {config.metric} {config.threshold ? `> ${config.threshold}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={cn('text-[10px]', severityStyle.bgColor, severityStyle.color)}>
          {severityStyle.label}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

function TriggeredAlertItem({
  alert,
  onAcknowledge,
}: {
  alert: AlertTriggered
  onAcknowledge: () => void
}) {
  const severityStyle = SEVERITY_CONFIG[alert.severity]

  return (
    <div className={cn('p-2 rounded-md', severityStyle.bgColor)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className={cn('h-4 w-4 mt-0.5', severityStyle.color)} />
          <div>
            <p className="text-sm font-medium">{alert.alertName}</p>
            <p className="text-[10px] text-muted-foreground">{alert.message}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(alert.triggeredAt), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
        </div>
        {!alert.acknowledged && (
          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={onAcknowledge}>
            OK
          </Button>
        )}
      </div>
    </div>
  )
}

export function AlertsCard({
  alertConfigs,
  triggeredAlerts,
  onSaveConfig,
  onDeleteConfig,
  onAcknowledgeAlert,
  isLoading: _isLoading,
}: AlertsCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAlert, setNewAlert] = useState<Partial<AlertConfig>>({
    name: '',
    type: 'threshold',
    metric: 'events_per_hour',
    threshold: 100,
    severity: 'medium',
    enabled: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!newAlert.name) {
      toast.error("Veuillez entrer un nom pour l'alerte")
      return
    }

    setIsSaving(true)
    try {
      await onSaveConfig(newAlert)
      setIsDialogOpen(false)
      setNewAlert({
        name: '',
        type: 'threshold',
        metric: 'events_per_hour',
        threshold: 100,
        severity: 'medium',
        enabled: true,
      })
      toast.success('Alerte configurée')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const activeTriggered = triggeredAlerts.filter((a) => !a.acknowledged)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertes
            {activeTriggered.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {activeTriggered.length}
              </Badge>
            )}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nouvelle alerte</DialogTitle>
                <DialogDescription>Configurez une nouvelle alerte de monitoring</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-name">Nom</Label>
                  <Input
                    id="alert-name"
                    value={newAlert.name}
                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                    placeholder="Ex: Pic d'activité"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-metric">Métrique</Label>
                  <Select
                    value={newAlert.metric}
                    onValueChange={(v) => setNewAlert({ ...newAlert, metric: v })}
                  >
                    <SelectTrigger id="alert-metric">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-threshold">Seuil</Label>
                  <Input
                    id="alert-threshold"
                    type="number"
                    value={newAlert.threshold || ''}
                    onChange={(e) =>
                      setNewAlert({ ...newAlert, threshold: parseInt(e.target.value) || 0 })
                    }
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-severity">Sévérité</Label>
                  <Select
                    value={newAlert.severity}
                    onValueChange={(v) =>
                      setNewAlert({
                        ...newAlert,
                        severity: v as 'low' | 'medium' | 'high' | 'critical',
                      })
                    }
                  >
                    <SelectTrigger id="alert-severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="high">Élevé</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Alertes déclenchées */}
        {activeTriggered.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alertes actives
            </h4>
            <div className="space-y-2">
              {activeTriggered.map((alert) => (
                <TriggeredAlertItem
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => onAcknowledgeAlert(alert.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Configurations */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Configurations ({alertConfigs.length})
          </h4>
          {alertConfigs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Aucune alerte configurée
            </p>
          ) : (
            <div className="divide-y">
              {alertConfigs.map((config) => (
                <AlertConfigItem
                  key={config.id}
                  config={config}
                  onToggle={() => onSaveConfig({ ...config, enabled: !config.enabled })}
                  onDelete={() => onDeleteConfig(config.id)}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
