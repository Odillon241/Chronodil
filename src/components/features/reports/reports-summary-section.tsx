import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, FileText, BarChart3 } from 'lucide-react';

type Period = 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface ReportsSummarySectionProps {
  summary: any;
  period: Period;
}

function getPeriodLabel(period: Period): string {
  switch (period) {
    case 'week':
      return 'Cette semaine';
    case 'month':
      return 'Ce mois';
    case 'quarter':
      return 'Ce trimestre';
    case 'year':
      return 'Cette année';
    default:
      return 'Période personnalisée';
  }
}

export function ReportsSummarySection({ summary, period }: ReportsSummarySectionProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Total heures</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-primary">
            {summary?.totalHours?.toFixed(1) || '0'}h
          </div>
          <p className="text-xs text-muted-foreground">{getPeriodLabel(period)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Heures facturables</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-primary">
            {summary?.billableHours?.toFixed(1) || '0'}h
          </div>
          <p className="text-xs text-muted-foreground">
            {summary?.totalHours > 0
              ? `${Math.round((summary.billableHours / summary.totalHours) * 100)}% du total`
              : 'Aucune donnée'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Projets actifs</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-primary">
            {summary?.activeProjects || 0}
          </div>
          <p className="text-xs text-muted-foreground">Projets en cours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Taux validation</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-primary">
            {summary?.validationRate || 0}%
          </div>
          <p className="text-xs text-muted-foreground">Heures approuvées</p>
        </CardContent>
      </Card>
    </div>
  );
}
