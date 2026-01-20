'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { exportBulkHRTimesheets } from '@/actions/hr-timesheet-export.actions'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

interface HRTimesheetExportMenuProps {
  searchQuery?: string
  dateFrom?: string
  dateTo?: string
}

type ExportStatus = 'PENDING' | 'MANAGER_APPROVED' | 'APPROVED' | 'REJECTED'

export function HRTimesheetExportMenu({
  searchQuery,
  dateFrom,
  dateTo,
}: HRTimesheetExportMenuProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<ExportStatus[]>(['PENDING'])
  const [isOpen, setIsOpen] = useState(false)

  const { execute, isPending } = useAction(exportBulkHRTimesheets, {
    onSuccess: ({ data }) => {
      if (!data) return

      // Convertir base64 en blob et télécharger
      const byteCharacters = atob(data.fileData)
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
      link.download = data.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Export réussi ! ${data.count} feuille(s) exportée(s)`)
      setIsOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de l'export")
    },
  })

  const toggleStatus = (status: ExportStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }

  const handleExport = () => {
    if (selectedStatuses.length === 0) {
      toast.warning('Veuillez sélectionner au moins un statut')
      return
    }

    execute({
      statuses: selectedStatuses,
      searchQuery: searchQuery || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
  }

  const statusOptions: { value: ExportStatus; label: string; description: string }[] = [
    {
      value: 'PENDING',
      label: 'À valider',
      description: 'En attente de validation manager',
    },
    {
      value: 'MANAGER_APPROVED',
      label: 'Validés Manager',
      description: 'Validés, en attente validation finale',
    },
    {
      value: 'APPROVED',
      label: 'Approuvés',
      description: 'Validation finale effectuée',
    },
    {
      value: 'REJECTED',
      label: 'Rejetés',
      description: 'Feuilles rejetées',
    },
  ]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 px-4 gap-2" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Exporter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          Export Excel
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Sélectionnez les statuts à inclure :
        </div>

        {statusOptions.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedStatuses.includes(option.value)}
            onCheckedChange={() => toggleStatus(option.value)}
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </div>
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />

        <div className="p-2">
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={handleExport}
            disabled={isPending || selectedStatuses.length === 0}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exporter ({selectedStatuses.length} statut
                {selectedStatuses.length > 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
