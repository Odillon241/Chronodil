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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileText, Calendar, MoreHorizontal, Edit, Trash2, Copy, Download, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Report } from '@/types/report.types'

interface ReportsListProps {
  reports: Report[]
  onEdit: (report: Report) => void
  onDelete: (reportId: string) => void
  onPreview: (report: Report) => void
  onDuplicate: (report: Report) => void
  onExport: (report: Report, format: 'word' | 'excel' | 'pdf') => void
}

const getTypeBadge = (type: string | null) => {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    WEEKLY: { label: 'Hebdo', variant: 'default' },
    MONTHLY: { label: 'Mensuel', variant: 'secondary' },
    INDIVIDUAL: { label: 'Individuel', variant: 'outline' },
  }
  const c = config[type || ''] || { label: 'Rapport', variant: 'outline' }
  return <Badge variant={c.variant}>{c.label}</Badge>
}

const getFormatBadge = (format: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
    pdf: 'default',
    word: 'secondary',
    excel: 'destructive',
  }
  return (
    <Badge variant={variants[format] || 'default'} className="uppercase text-[10px]">
      {format}
    </Badge>
  )
}

export function ReportsList({
  reports,
  onEdit,
  onDelete,
  onPreview,
  onDuplicate,
  onExport,
}: ReportsListProps) {
  if (reports.length === 0) {
    return null
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Période</TableHead>
            <TableHead>Modifié le</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id} className="group">
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <button
                    onClick={() => onPreview(report)}
                    className="font-medium text-left hover:underline cursor-pointer truncate max-w-[250px]"
                  >
                    {report.title}
                  </button>
                </div>
              </TableCell>
              <TableCell>{getTypeBadge(report.reportType)}</TableCell>
              <TableCell>{getFormatBadge(report.format)}</TableCell>
              <TableCell>
                {report.period ? (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {report.period}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(report.updatedAt), 'd MMM yyyy', { locale: fr })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onPreview(report)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Aperçu
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(report)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(report)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onExport(report, 'word')}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter Word
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(report, 'excel')}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(report, 'pdf')}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter PDF
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
