import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getReportById } from '@/actions/report.actions'
import { ReportDetailActions } from '@/components/features/reports/report-detail-actions'
import { ReportDetailSkeleton } from '@/components/features/reports/report-detail-skeleton'
import { ReportContentViewer } from '@/components/reports/report-content-viewer'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, User, FileType, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Metadata } from 'next'

interface ReportDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: ReportDetailPageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const result = await getReportById({ id })
    const report = result?.data

    if (!report) {
      return {
        title: 'Rapport non trouvé',
      }
    }

    return {
      title: `${report.title} | Rapports`,
      description: report.period
        ? `Rapport ${report.reportType || ''} pour la période ${report.period}`
        : `Rapport créé le ${new Date(report.createdAt).toLocaleDateString('fr-FR')}`,
    }
  } catch {
    return {
      title: 'Rapport non trouvé',
    }
  }
}

async function ReportDetailContent({ id }: { id: string }) {
  const result = await getReportById({ id })
  const report = result?.data

  if (!report) {
    notFound()
  }

  // Format badges
  const getTypeBadgeVariant = (type: string | null) => {
    switch (type) {
      case 'WEEKLY':
        return 'default'
      case 'MONTHLY':
        return 'secondary'
      case 'INDIVIDUAL':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getTypeLabel = (type: string | null) => {
    switch (type) {
      case 'WEEKLY':
        return 'Hebdomadaire'
      case 'MONTHLY':
        return 'Mensuel'
      case 'INDIVIDUAL':
        return 'Individuel'
      default:
        return 'Général'
    }
  }

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'PDF'
      case 'word':
        return 'Word'
      case 'excel':
        return 'Excel'
      default:
        return format.toUpperCase()
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{report.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getTypeBadgeVariant(report.reportType)}>
              {getTypeLabel(report.reportType)}
            </Badge>
            <Badge variant="outline">{getFormatLabel(report.format)}</Badge>
            {report.period && (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                {report.period}
              </Badge>
            )}
          </div>
        </div>
        <ReportDetailActions reportId={report.id} reportTitle={report.title} />
      </div>

      <Separator />

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">Créé par</p>
            <p className="text-sm font-medium">{report.User.name || report.User.email}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">Date de création</p>
            <p className="text-sm font-medium">{formatDate(report.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">Dernière modification</p>
            <p className="text-sm font-medium">
              {formatDistanceToNow(new Date(report.updatedAt), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Template info if exists */}
      {report.ReportTemplate && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileType className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Basé sur le modèle</p>
                <p className="text-sm font-medium">{report.ReportTemplate.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HRTimesheet info if exists */}
      {report.HRTimesheet && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Feuille de temps RH</p>
                <p className="text-sm font-medium">
                  {report.HRTimesheet.employeeName} - {formatDate(report.HRTimesheet.weekStartDate)}{' '}
                  au {formatDate(report.HRTimesheet.weekEndDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Report Content */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <ReportContentViewer content={report.content} />
        </CardContent>
      </Card>

      {/* Print-friendly footer */}
      <div className="print:block hidden text-center text-sm text-muted-foreground pt-8 border-t">
        <p>
          Document généré par Chronodil - {formatDate(new Date())} - {report.User.name}
        </p>
      </div>
    </div>
  )
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Suspense fallback={<ReportDetailSkeleton />}>
        <ReportDetailContent id={id} />
      </Suspense>
    </div>
  )
}
