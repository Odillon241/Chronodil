'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  FileText,
  Plus,
  LayoutList,
  Calendar as CalendarIcon,
  Settings,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

// New optimized components
import {
  ReportStatsCards,
  ReportStatsCardsSkeleton,
  type ReportStats,
} from '@/components/features/reports/report-stats-cards'
import {
  ReportFiltersPanel,
  type ReportFilters,
} from '@/components/features/reports/report-filters-panel'
import { ReportCalendar } from '@/components/features/reports/report-calendar'
import { ReportEditorDialog } from '@/components/features/report-editor-dialog'
import { ReportsList, type ReportViewMode } from '@/components/reports'

import {
  getUserReports,
  getReportStats,
  deleteReport,
  duplicateReport,
} from '@/actions/report.actions'
import { getReportTemplates } from '@/actions/report-template.actions'
import { exportReport } from '@/actions/report-export.actions'
import { useAction } from 'next-safe-action/hooks'
import type { Report, ReportTemplate, ReportType, ReportFormat } from '@/types/report.types'

// Initial empty filters
const initialFilters: ReportFilters = {
  search: '',
  types: [],
  formats: [],
  startDate: undefined,
  endDate: undefined,
  templateId: undefined,
  createdById: undefined,
}

export default function ReportsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Data
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)

  // Dialogs
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

  // Filters & View
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const [viewMode, setViewMode] = useState<ReportViewMode>('list')

  // Parse URL params for edit mode
  const editReportId = searchParams.get('edit')

  // Actions
  const { execute: fetchReports } = useAction(getUserReports, {
    onSuccess: ({ data }) => {
      if (data) setReports(data as Report[])
      setLoading(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors du chargement')
      setLoading(false)
    },
  })

  const { execute: fetchStats } = useAction(getReportStats, {
    onSuccess: ({ data }) => {
      if (data) setStats(data as ReportStats)
      setLoadingStats(false)
    },
    onError: () => {
      setLoadingStats(false)
    },
  })

  const { execute: fetchTemplates } = useAction(getReportTemplates, {
    onSuccess: ({ data }) => {
      if (data) setTemplates(data as ReportTemplate[])
    },
  })

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(deleteReport, {
    onSuccess: () => {
      toast.success('Rapport supprimé')
      setDeleteDialogOpen(false)
      setReportToDelete(null)
      fetchReports()
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la suppression')
    },
  })

  const { execute: executeDuplicate } = useAction(duplicateReport, {
    onSuccess: ({ data }) => {
      toast.success(`Rapport dupliqué: ${data?.title}`)
      fetchReports()
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la duplication')
    },
  })

  const { execute: executeExport } = useAction(exportReport, {
    onSuccess: ({ data }) => {
      if (!data) return
      const byteCharacters = atob(data.data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: data.mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Export terminé')
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de l'export")
    },
  })

  // Load all data on mount
  useEffect(() => {
    fetchReports()
    fetchStats()
    fetchTemplates()
  }, [])

  // Handle edit mode from URL
  useEffect(() => {
    if (editReportId && reports.length > 0) {
      const reportToEdit = reports.find((r) => r.id === editReportId)
      if (reportToEdit) {
        setSelectedReport(reportToEdit)
        setEditorOpen(true)
        // Clear the URL param after opening
        router.replace('/dashboard/reports', { scroll: false })
      }
    }
  }, [editReportId, reports, router])

  // Filter reports using the new ReportFilters
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Search filter
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const matchTitle = report.title.toLowerCase().includes(q)
        const matchPeriod = report.period?.toLowerCase().includes(q)
        const matchContent = report.content?.toLowerCase().includes(q)
        if (!matchTitle && !matchPeriod && !matchContent) return false
      }

      // Type filter
      if (filters.types.length > 0) {
        const reportType = report.reportType || 'INDIVIDUAL'
        if (!filters.types.includes(reportType as ReportType)) return false
      }

      // Format filter
      if (filters.formats.length > 0) {
        if (!filters.formats.includes(report.format as ReportFormat)) return false
      }

      // Date range filter
      if (filters.startDate) {
        const reportDate = new Date(report.createdAt)
        if (reportDate < filters.startDate) return false
      }
      if (filters.endDate) {
        const reportDate = new Date(report.createdAt)
        if (reportDate > filters.endDate) return false
      }

      // Template filter
      if (filters.templateId && report.templateId !== filters.templateId) {
        return false
      }

      return true
    })
  }, [reports, filters])

  // Handlers
  const handleNewReport = useCallback(() => {
    // Navigate to the new report page instead of opening modal
    router.push('/dashboard/reports/new')
  }, [router])

  const handleEdit = useCallback((report: Report) => {
    setSelectedReport(report)
    setEditorOpen(true)
  }, [])

  const handleDelete = useCallback((reportId: string) => {
    setReportToDelete(reportId)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (reportToDelete) executeDelete({ id: reportToDelete })
  }, [reportToDelete, executeDelete])

  const handlePreview = useCallback(
    (report: Report) => {
      // Navigate to the report detail page
      router.push(`/dashboard/reports/${report.id}`)
    },
    [router],
  )

  const handleDuplicate = useCallback(
    (report: Report) => {
      executeDuplicate({ id: report.id })
    },
    [executeDuplicate],
  )

  const handleExport = useCallback(
    (report: Report, format: 'word' | 'excel' | 'pdf') => {
      executeExport({ reportId: report.id, format })
    },
    [executeExport],
  )

  const handleEditorClose = useCallback(() => {
    setEditorOpen(false)
    setSelectedReport(null)
    fetchReports()
    fetchStats()
  }, [fetchReports, fetchStats])

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports</h1>
          <p className="text-muted-foreground">Créez et gérez vos rapports d'activité</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/reports/templates">
              <Settings className="h-4 w-4 mr-2" />
              Modèles
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/reports/monthly">
              <TrendingUp className="h-4 w-4 mr-2" />
              Mensuel
            </Link>
          </Button>
          <Button onClick={handleNewReport}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau rapport
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loadingStats ? (
        <ReportStatsCardsSkeleton />
      ) : stats ? (
        <ReportStatsCards stats={stats} />
      ) : null}

      {/* Filters + View Mode */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ReportFiltersPanel filters={filters} onChange={setFilters} templates={templates} />

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ReportViewMode)}>
          <TabsList className="h-9">
            <TabsTrigger value="list" className="px-2.5">
              <LayoutList className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="calendar" className="px-2.5">
              <CalendarIcon className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {reports.length === 0 ? 'Aucun rapport' : 'Aucun résultat'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {reports.length === 0
              ? 'Créez votre premier rapport pour commencer'
              : 'Modifiez vos filtres pour voir plus de résultats'}
          </p>
          {reports.length === 0 && (
            <Button onClick={handleNewReport}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un rapport
            </Button>
          )}
          {reports.length > 0 && filters.search && (
            <Button variant="outline" onClick={() => setFilters(initialFilters)}>
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredReports.length} rapport{filteredReports.length > 1 ? 's' : ''}{' '}
              {filteredReports.length !== reports.length && `sur ${reports.length}`}
            </span>
          </div>
          {viewMode === 'calendar' ? (
            <ReportCalendar reports={filteredReports} onReportClick={handlePreview} />
          ) : (
            <ReportsList
              reports={filteredReports}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPreview={handlePreview}
              onDuplicate={handleDuplicate}
              onExport={handleExport}
            />
          )}
        </>
      )}

      {/* Editor Dialog */}
      <ReportEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        report={selectedReport}
        onClose={handleEditorClose}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce rapport ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
