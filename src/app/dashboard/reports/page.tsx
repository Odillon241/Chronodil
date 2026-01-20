'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Edit, Trash2, Calendar, Settings, BarChart3 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getUserReports, deleteReport } from '@/actions/report.actions'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
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
import { ReportEditorDialog } from '@/components/features/report-editor-dialog'
import { ReportExportMenu } from '@/components/features/report-export-menu'
import { useRouter } from 'next/navigation'

interface Report {
  id: string
  title: string
  content: string
  format: string
  period: string | null
  includeSummary: boolean
  fileSize: number
  createdAt: Date
  updatedAt: Date
  User: {
    id: string
    name: string | null
    email: string
  }
}

export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

  // Actions
  const { execute: fetchReports } = useAction(getUserReports, {
    onSuccess: ({ data }) => {
      if (data) {
        setReports(data as Report[])
      }
      setLoading(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors du chargement des rapports')
      setLoading(false)
    },
  })

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(deleteReport, {
    onSuccess: () => {
      toast.success('Rapport supprimé avec succès')
      setDeleteDialogOpen(false)
      setReportToDelete(null)
      fetchReports()
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la suppression')
    },
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const handleCreateNew = () => {
    setSelectedReport(null)
    setEditorOpen(true)
  }

  const handleEdit = (report: Report) => {
    setSelectedReport(report)
    setEditorOpen(true)
  }

  const handleDeleteClick = (reportId: string) => {
    setReportToDelete(reportId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (reportToDelete) {
      executeDelete({ id: reportToDelete })
    }
  }

  const handleEditorClose = () => {
    setEditorOpen(false)
    setSelectedReport(null)
    fetchReports()
  }

  const getFormatBadge = (format: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pdf: 'default',
      word: 'secondary',
      excel: 'destructive',
    }
    return <Badge variant={variants[format] || 'default'}>{format.toUpperCase()}</Badge>
  }

  const _formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 octets'
    const k = 1024
    const sizes = ['octets', 'Ko', 'Mo', 'Go']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Créez et gérez vos rapports d'activité
          </p>
        </div>
        <Separator orientation="vertical" className="h-14" />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/reports/templates')}>
            <Settings className="h-4 w-4 mr-2" />
            Modèles
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/reports/monthly')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Rapport Mensuel
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau rapport
          </Button>
        </div>
      </div>

      {/* Liste des rapports */}
      {reports.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun rapport</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez votre premier rapport pour commencer
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un rapport
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardDescription>{reports.length} rapport(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Modifié le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {report.title}
                        </div>
                      </TableCell>
                      <TableCell>{getFormatBadge(report.format)}</TableCell>
                      <TableCell>
                        {report.period ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {report.period}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(report.updatedAt), 'd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(report)}
                            title="Éditer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <ReportExportMenu reportId={report.id} reportTitle={report.title} />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(report.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog d'édition */}
      <ReportEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        report={selectedReport}
        onClose={handleEditorClose}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.
            </AlertDialogDescription>
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
