'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { downloadDashboardReport } from '@/actions/dashboard-report.actions'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

interface DashboardReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ReportPeriod = 'MONTH' | 'QUARTER' | 'SEMESTER' | 'YEAR' | 'CUSTOM'
type ReportFormat = 'word' | 'excel'

const periodOptions: { value: ReportPeriod; label: string; description: string }[] = [
  { value: 'MONTH', label: 'Mois en cours', description: 'Rapport du mois actuel' },
  { value: 'QUARTER', label: 'Trimestre', description: 'Rapport du trimestre en cours' },
  { value: 'SEMESTER', label: 'Semestre', description: 'Rapport du semestre en cours' },
  { value: 'YEAR', label: 'Année', description: "Rapport de l'année en cours" },
  { value: 'CUSTOM', label: 'Personnalisée', description: 'Choisissez vos dates' },
]

const formatOptions: {
  value: ReportFormat
  label: string
  icon: typeof FileText
  description: string
}[] = [
  {
    value: 'word',
    label: 'Word (.docx)',
    icon: FileText,
    description: 'Document professionnel avec mise en forme',
  },
  {
    value: 'excel',
    label: 'Excel (.xlsx)',
    icon: FileSpreadsheet,
    description: 'Classeur avec tableaux et données',
  },
]

export function DashboardReportDialog({ open, onOpenChange }: DashboardReportDialogProps) {
  const [period, setPeriod] = useState<ReportPeriod>('MONTH')
  const [reportFormat, setReportFormat] = useState<ReportFormat>('word')
  const [includeComparison, setIncludeComparison] = useState(true)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const { execute: executeDownload, isExecuting } = useAction(downloadDashboardReport, {
    onSuccess: ({ data }) => {
      if (!data) return

      // Convertir base64 en blob et télécharger
      const byteCharacters = atob(data.data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: data.mimeType })

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Rapport téléchargé : ${data.filename}`)
      onOpenChange(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la génération du rapport')
    },
  })

  const handleDownload = () => {
    const payload: {
      period: ReportPeriod
      format: ReportFormat
      includeComparison: boolean
      startDate?: string
      endDate?: string
    } = {
      period,
      format: reportFormat,
      includeComparison,
    }

    if (period === 'CUSTOM') {
      if (!startDate || !endDate) {
        toast.error('Veuillez sélectionner les dates de début et de fin')
        return
      }
      payload.startDate = startDate.toISOString()
      payload.endDate = endDate.toISOString()
    }

    toast.loading('Génération du rapport en cours...')
    executeDownload(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Télécharger le rapport
          </DialogTitle>
          <DialogDescription>
            Générez un rapport d'activité complet avec analyses, graphiques et comparaisons.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Sélection de la période */}
          <div className="grid gap-2">
            <Label htmlFor="period">Période du rapport</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
              <SelectTrigger id="period">
                <SelectValue placeholder="Choisir une période" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates personnalisées */}
          {period === 'CUSTOM' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'd MMM yyyy', { locale: fr }) : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'd MMM yyyy', { locale: fr }) : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => (startDate ? date < startDate : false)}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Format de sortie */}
          <div className="grid gap-2">
            <Label>Format de sortie</Label>
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setReportFormat(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                    reportFormat === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50',
                  )}
                >
                  <option.icon
                    className={cn(
                      'h-8 w-8',
                      reportFormat === option.value ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      reportFormat === option.value ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Option de comparaison */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="comparison">Inclure la comparaison</Label>
              <p className="text-sm text-muted-foreground">
                Comparer avec la période précédente et afficher l'évolution
              </p>
            </div>
            <Switch
              id="comparison"
              checked={includeComparison}
              onCheckedChange={setIncludeComparison}
            />
          </div>

          {/* Informations sur le rapport */}
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="font-medium text-sm mb-2">Le rapport contiendra :</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Synthèse exécutive avec indicateurs clés</li>
              <li>• Analyses commentées de la performance</li>
              <li>• Graphiques d'activité mensuelle</li>
              <li>• Performance par projet et par équipe</li>
              <li>• Distribution des tâches (statut et priorité)</li>
              {includeComparison && <li>• Comparaison avec la période précédente</li>}
              <li>• Recommandations et conclusion</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExecuting}>
            Annuler
          </Button>
          <Button onClick={handleDownload} disabled={isExecuting}>
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
