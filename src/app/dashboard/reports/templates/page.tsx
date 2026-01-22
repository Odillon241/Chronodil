'use client'

import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, Edit, Trash2, Star, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { FilterButtonGroup } from '@/components/ui/filter-button-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  getReportTemplates,
  deleteReportTemplate,
  setDefaultReportTemplate,
} from '@/actions/report-template.actions'
import { useAction } from 'next-safe-action/hooks'
import type { ReportTemplate, ReportFrequency } from '@/types/report.types'

export default function ReportTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [frequencyFilter, setFrequencyFilter] = useState('all')

  // Actions
  const { execute: fetchTemplates } = useAction(getReportTemplates, {
    onSuccess: ({ data }) => {
      if (data) setTemplates(data as ReportTemplate[])
      setLoading(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors du chargement')
      setLoading(false)
    },
  })

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(deleteReportTemplate, {
    onSuccess: () => {
      toast.success('Modele supprime')
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
      fetchTemplates()
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la suppression')
    },
  })

  const { execute: executeSetDefault } = useAction(setDefaultReportTemplate, {
    onSuccess: () => {
      toast.success('Modele defini par defaut')
      fetchTemplates()
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur')
    },
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Type options with counts
  const frequencyOptions = useMemo(() => {
    const counts = {
      all: templates.length,
      WEEKLY: templates.filter((t) => t.frequency === 'WEEKLY').length,
      MONTHLY: templates.filter((t) => t.frequency === 'MONTHLY').length,
      INDIVIDUAL: templates.filter((t) => t.frequency === 'INDIVIDUAL').length,
    }
    return [
      { id: 'all', label: 'Tous', value: 'all', count: counts.all },
      { id: 'WEEKLY', label: 'Hebdo', value: 'WEEKLY', count: counts.WEEKLY },
      { id: 'MONTHLY', label: 'Mensuels', value: 'MONTHLY', count: counts.MONTHLY },
      { id: 'INDIVIDUAL', label: 'Individuels', value: 'INDIVIDUAL', count: counts.INDIVIDUAL },
    ]
  }, [templates])

  // Filter
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!t.name.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) {
          return false
        }
      }
      if (frequencyFilter !== 'all' && t.frequency !== frequencyFilter) {
        return false
      }
      return true
    })
  }, [templates, searchQuery, frequencyFilter])

  const getFrequencyBadge = (frequency: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> =
      {
        WEEKLY: { label: 'Hebdo', variant: 'default' },
        MONTHLY: { label: 'Mensuel', variant: 'secondary' },
        INDIVIDUAL: { label: 'Individuel', variant: 'outline' },
      }
    const c = config[frequency] || { label: frequency, variant: 'outline' }
    return <Badge variant={c.variant}>{c.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/reports')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Modeles</h2>
            <p className="text-muted-foreground">Gerez vos modeles de rapports.</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/reports/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau modele
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        {/* Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {frequencyOptions.map((option) => (
            <Button
              key={option.id}
              variant={frequencyFilter === option.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFrequencyFilter(option.value)}
              className={cn(
                'rounded-full h-8 px-3 text-xs font-medium transition-all',
                frequencyFilter === option.id
                  ? ''
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {option.label}
              {option.count !== undefined && (
                <span
                  className={cn(
                    'ml-2 py-0.5 px-1.5 rounded-full text-[10px]',
                    frequencyFilter === option.id
                      ? 'bg-primary-foreground/20'
                      : 'bg-muted-foreground/10',
                  )}
                >
                  {option.count}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Search */}
        <FilterButtonGroup
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Rechercher..."
        />
      </div>

      {/* Content */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {templates.length === 0 ? 'Aucun modele' : 'Aucun resultat'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {templates.length === 0
              ? 'Creez votre premier modele pour commencer'
              : 'Modifiez vos filtres de recherche'}
          </p>
          {templates.length === 0 && (
            <Button asChild>
              <Link href="/dashboard/reports/templates/new">
                <Plus className="h-4 w-4 mr-2" />
                Creer un modele
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Frequence</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Utilisations</TableHead>
                <TableHead>Modifie le</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {template.isDefault && (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      )}
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getFrequencyBadge(template.frequency)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase text-[10px]">
                      {template.format}
                    </Badge>
                  </TableCell>
                  <TableCell>{template._count.Report}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(template.updatedAt), 'd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/reports/templates/${template.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        {!template.isDefault && (
                          <DropdownMenuItem
                            onClick={() =>
                              executeSetDefault({
                                id: template.id,
                                frequency: template.frequency as ReportFrequency,
                              })
                            }
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Definir par defaut
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setTemplateToDelete(template.id)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce modele ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => templateToDelete && executeDelete({ id: templateToDelete })}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
