'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { consolidateMonthlyReport } from '@/actions/report-generation.actions'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { Calendar, FileText, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

  const { execute: executeConsolidate, isExecuting: isConsolidating } = useAction(
    consolidateMonthlyReport,
    {
      onSuccess: ({ data: _data }) => {
        toast.success('Rapport mensuel généré avec succès!')
        router.push('/dashboard/reports')
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Erreur lors de la consolidation')
      },
    },
  )

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()

    const monthName = MONTHS.find((m) => m.value === month)?.label || ''
    const defaultTitle = `Rapport Mensuel - ${monthName} ${year}`

    executeConsolidate({
      year,
      month,
      title: title.trim() || defaultTitle,
      format,
      includeSummary,
    })
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rapport Mensuel Consolidé</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Générez un rapport consolidé à partir de toutes vos feuilles de temps hebdomadaires
        </p>
      </div>

      {/* Formulaire de génération */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Générer un rapport mensuel
          </CardTitle>
          <CardDescription>
            Sélectionnez la période et le format pour générer votre rapport consolidé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Période */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Période *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="month" className="text-sm text-muted-foreground">
                      Mois
                    </Label>
                    <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
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

                  <div>
                    <Label htmlFor="year" className="text-sm text-muted-foreground">
                      Année
                    </Label>
                    <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
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

              {/* Titre */}
              <div className="grid gap-2">
                <Label htmlFor="title">Titre du rapport</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Ex: Rapport Mensuel - ${
                    MONTHS.find((m) => m.value === month)?.label || ''
                  } ${year}`}
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour utiliser le titre par défaut
                </p>
              </div>

              {/* Format */}
              <div className="grid gap-2">
                <Label htmlFor="format">Format d'export</Label>
                <Select
                  value={format}
                  onValueChange={(v: 'word' | 'pdf' | 'excel') => setFormat(v)}
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

              {/* Options */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                />
                <Label htmlFor="includeSummary" className="text-sm font-normal cursor-pointer">
                  Inclure un résumé automatique
                </Label>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Que contient le rapport mensuel ?
                </p>
              </div>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-6 list-disc">
                <li>Toutes les feuilles de temps hebdomadaires du mois sélectionné</li>
                <li>Statistiques globales (total des heures, nombre d'activités)</li>
                <li>Détail de toutes les activités réalisées</li>
                <li>Moyenne par semaine</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isConsolidating} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                {isConsolidating ? 'Génération en cours...' : 'Générer le rapport'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/reports')}
                disabled={isConsolidating}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Conseils */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Conseils</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Période manquante ?</strong> Si le rapport ne contient pas de données, vérifiez
            que vous avez bien créé des feuilles de temps hebdomadaires pour le mois sélectionné.
          </p>
          <p>
            <strong>Personnalisation :</strong> Vous pouvez créer des modèles de rapports
            personnalisés dans la section{' '}
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={() => router.push('/dashboard/reports/templates')}
            >
              Modèles de Rapports
            </Button>
            .
          </p>
          <p>
            <strong>Export multiple :</strong> Après génération, vous pourrez exporter le rapport
            dans différents formats depuis la liste des rapports.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
