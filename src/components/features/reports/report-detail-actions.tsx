'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import {
  Download,
  Edit,
  Copy,
  Trash2,
  Share2,
  Printer,
  MoreVertical,
  FileText,
  FileSpreadsheet,
  File,
} from 'lucide-react'
import { deleteReport, duplicateReport } from '@/actions/report.actions'
import { exportReport } from '@/actions/report-export.actions'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import type { ReportFormat } from '@/types/report.types'

interface ReportDetailActionsProps {
  reportId: string
  reportTitle: string
}

export function ReportDetailActions({ reportId, reportTitle }: ReportDetailActionsProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Delete action
  const { execute: executeDelete, isPending: isDeleting } = useAction(deleteReport, {
    onSuccess: () => {
      toast.success('Rapport supprimé avec succès')
      router.push('/dashboard/reports')
      router.refresh()
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la suppression')
    },
  })

  // Duplicate action
  const { execute: executeDuplicate, isPending: isDuplicating } = useAction(duplicateReport, {
    onSuccess: ({ data }) => {
      if (data) {
        toast.success('Rapport dupliqué avec succès')
        router.push(`/dashboard/reports/${data.id}`)
        router.refresh()
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la duplication')
    },
  })

  // Export action
  const { execute: executeExport } = useAction(exportReport, {
    onSuccess: ({ data }) => {
      if (!data) return

      // Convert base64 to blob and download
      const byteCharacters = atob(data.data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: data.mimeType })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Rapport exporté avec succès')
      setIsExporting(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de l'export")
      setIsExporting(false)
    },
  })

  const handleEdit = () => {
    router.push(`/dashboard/reports/${reportId}/edit`)
  }

  const handleDuplicate = () => {
    executeDuplicate({ id: reportId })
  }

  const handleDelete = () => {
    executeDelete({ id: reportId })
  }

  const handleExport = async (format: ReportFormat) => {
    setIsExporting(true)
    toast.loading(`Export en ${format.toUpperCase()}...`)
    executeExport({ reportId, format })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    toast.info('Fonctionnalité de partage à venir')
  }

  const isLoading = isDeleting || isDuplicating || isExporting

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Edit Button */}
        <Button onClick={handleEdit} disabled={isLoading} variant="default">
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('word')} disabled={isExporting}>
              <FileText className="h-4 w-4 mr-2" />
              Word (.docx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')} disabled={isExporting}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isExporting}>
              <File className="h-4 w-4 mr-2" />
              PDF (bientôt disponible)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isLoading}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Plus d'actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rapport</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{reportTitle}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
