'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Calendar, User, Clock, Link2, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Report } from '@/types/report.types'
import { ReportExportMenu } from '../report-export-menu'

interface ReportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: Report | null
  onEdit?: () => void
  onDuplicate?: () => void
}

const getTypeBadge = (type: string | null) => {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    WEEKLY: { label: 'Hebdomadaire', variant: 'default' },
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
  return <Badge variant={variants[format] || 'default'}>{format.toUpperCase()}</Badge>
}

export function ReportPreviewDialog({
  open,
  onOpenChange,
  report,
  onEdit,
  onDuplicate,
}: ReportPreviewDialogProps) {
  if (!report) return null

  const handleCopyContent = () => {
    // Convertir HTML en texte simple
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = report.content
    const textContent = tempDiv.textContent || tempDiv.innerText || ''
    navigator.clipboard.writeText(textContent)
    toast.success('Contenu copié dans le presse-papiers')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                {report.title}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2">
                {getTypeBadge(report.reportType)}
                {getFormatBadge(report.format)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Métadonnées */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Auteur:</span>
            <span className="font-medium">{report.User.name || report.User.email}</span>
          </div>
          {report.period && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Période:</span>
              <span className="font-medium">{report.period}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Modifié:</span>
            <span className="font-medium">
              {format(new Date(report.updatedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
            </span>
          </div>
          {report.HRTimesheet && (
            <div className="flex items-center gap-2 text-sm">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Lié à:</span>
              <span className="font-medium">Feuille de temps</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Contenu */}
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: report.content || '<p>Aucun contenu</p>' }}
          />
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button variant="outline" size="sm" onClick={handleCopyContent}>
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </Button>
            {onDuplicate && (
              <Button variant="outline" size="sm" onClick={onDuplicate}>
                <FileText className="h-4 w-4 mr-2" />
                Dupliquer
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="secondary" onClick={onEdit}>
                Modifier
              </Button>
            )}
            <div className="flex items-center gap-2">
              <ReportExportMenu reportId={report.id} reportTitle={report.title} />
              <span className="text-sm text-muted-foreground">Exporter</span>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
