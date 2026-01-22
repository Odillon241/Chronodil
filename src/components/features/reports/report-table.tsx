'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  FileText,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Copy,
  MoreHorizontal,
  Link2,
  CalendarDays,
  FileSpreadsheet,
  File,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Report } from '@/types/report.types'
import { ReportExportMenu } from '../report-export-menu'

interface ReportTableProps {
  reports: Report[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onEdit: (report: Report) => void
  onDelete: (reportId: string) => void
  onPreview: (report: Report) => void
  onDuplicate: (report: Report) => void
}

const getTypeConfig = (type: string | null) => {
  const config: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof CalendarDays }
  > = {
    WEEKLY: { label: 'Hebdomadaire', variant: 'default', icon: CalendarDays },
    MONTHLY: { label: 'Mensuel', variant: 'secondary', icon: Calendar },
    INDIVIDUAL: { label: 'Individuel', variant: 'outline', icon: FileText },
  }
  return config[type || ''] || { label: 'Rapport', variant: 'outline', icon: FileText }
}

const getFormatConfig = (format: string) => {
  const config: Record<
    string,
    { variant: 'default' | 'secondary' | 'destructive'; icon: typeof File }
  > = {
    pdf: { variant: 'default', icon: File },
    word: { variant: 'secondary', icon: FileText },
    excel: { variant: 'destructive', icon: FileSpreadsheet },
  }
  return config[format] || { variant: 'default', icon: File }
}

export function ReportTable({
  reports,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onPreview,
  onDuplicate,
}: ReportTableProps) {
  const allSelected = reports.length > 0 && selectedIds.length === reports.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < reports.length

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(reports.map((r) => r.id))
    }
  }

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  if (reports.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      ;(el as HTMLInputElement).indeterminate = someSelected
                    }
                  }}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Modifié le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const typeConfig = getTypeConfig(report.reportType)
              const formatConfig = getFormatConfig(report.format)
              const TypeIcon = typeConfig.icon

              return (
                <TableRow key={report.id} className="group">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(report.id)}
                      onCheckedChange={() => toggleOne(report.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <button
                          onClick={() => onPreview(report)}
                          className="font-medium text-left hover:underline cursor-pointer"
                        >
                          {report.title}
                        </button>
                        {report.HRTimesheet && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            Lié à une feuille de temps
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={formatConfig.variant}>{report.format.toUpperCase()}</Badge>
                  </TableCell>
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
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onPreview(report)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Aperçu</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(report)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Modifier</TooltipContent>
                      </Tooltip>

                      <ReportExportMenu reportId={report.id} reportTitle={report.title} />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onDuplicate(report)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(report.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
