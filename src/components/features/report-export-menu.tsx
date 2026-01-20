'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react'
import { exportReport } from '@/actions/report-export.actions'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

interface ReportExportMenuProps {
  reportId: string
  reportTitle: string
}

export function ReportExportMenu({ reportId, reportTitle: _reportTitle }: ReportExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)

  const { execute: executeExport } = useAction(exportReport, {
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

      toast.success(`Rapport exporté avec succès: ${data.filename}`)
      setIsExporting(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de l'export")
      setIsExporting(false)
    },
  })

  const handleExport = async (format: 'word' | 'excel' | 'pdf') => {
    setIsExporting(true)
    toast.loading(`Export en cours (${format.toUpperCase()})...`)

    executeExport({
      reportId,
      format,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isExporting} title="Exporter">
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('word')} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Exporter en Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exporter en Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isExporting}>
          <File className="h-4 w-4 mr-2" />
          Exporter en PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
