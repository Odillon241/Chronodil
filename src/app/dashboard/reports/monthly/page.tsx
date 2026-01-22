'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, AlertCircle, Calendar, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { consolidateMonthlyReport } from '@/actions/report-generation.actions'
import { useAction } from 'next-safe-action/hooks'

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

export default function MonthlyReportPage() {
  const router = useRouter()
  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [format, setFormat] = useState<'word' | 'pdf' | 'excel'>('word')
  const [title, setTitle] = useState('')
  const [includeSummary, setIncludeSummary] = useState(true)

  const monthName = MONTHS.find((m) => m.value === month)?.label || ''
  const isCurrentMonth = year === CURRENT_YEAR && month === new Date().getMonth() + 1

  const { execute: executeConsolidate, isExecuting } = useAction(consolidateMonthlyReport, {
    onSuccess: ({ data }) => {
      toast.success('Rapport mensuel généré', {
        description: data?.title,
      })
      router.push('/dashboard/reports')
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la génération')
    },
  })

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    executeConsolidate({
      year,
      month,
      title: title.trim() || `Rapport Mensuel - ${monthName} ${year}`,
      format,
      includeSummary,
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-hidden -m-3 sm:-m-4 lg:-m-6">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background shrink-0">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/reports')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Rapport Mensuel</h1>
              <p className="text-sm text-muted-foreground">Consolidez vos feuilles de temps</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Contenu du rapport</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Feuilles de temps du mois</li>
                  <li>• Total des heures travaillées</li>
                  <li>• Moyenne hebdomadaire</li>
                  <li>• Détail des activités</li>
                  <li>• Statistiques (si activé)</li>
                </ul>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/reports')}
            disabled={isExecuting}
          >
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={isExecuting}>
            {isExecuting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Génération...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Générer
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Content - Centered form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto p-6 space-y-6">
          {/* Période */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Période</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="month" className="text-xs text-muted-foreground">
                  Mois
                </Label>
                <Select
                  value={month.toString()}
                  onValueChange={(v) => setMonth(parseInt(v))}
                  disabled={isExecuting}
                >
                  <SelectTrigger id="month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year" className="text-xs text-muted-foreground">
                  Année
                </Label>
                <Select
                  value={year.toString()}
                  onValueChange={(v) => setYear(parseInt(v))}
                  disabled={isExecuting}
                >
                  <SelectTrigger id="year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titre
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Rapport Mensuel - ${monthName} ${year}`}
              disabled={isExecuting}
            />
            <p className="text-xs text-muted-foreground">Laissez vide pour le titre par défaut</p>
          </div>

          <Separator />

          {/* Format */}
          <div className="space-y-2">
            <Label htmlFor="format" className="text-sm font-medium">
              Format d'export
            </Label>
            <Select
              value={format}
              onValueChange={(v: 'word' | 'pdf' | 'excel') => setFormat(v)}
              disabled={isExecuting}
            >
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="word">Word (.docx)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeSummary"
                checked={includeSummary}
                onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                disabled={isExecuting}
              />
              <Label htmlFor="includeSummary" className="text-sm font-normal cursor-pointer">
                Inclure un résumé avec statistiques
              </Label>
            </div>
          </div>

          {/* Warning */}
          {isCurrentMonth && (
            <>
              <Separator />
              <Alert className="border-amber-500 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-foreground">
                  Le mois n'est pas encore terminé. Le rapport ne contiendra que les données
                  actuelles.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
