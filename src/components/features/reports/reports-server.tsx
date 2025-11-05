import { Suspense } from 'react';
import {
  getReportSummary,
  getDetailedReport,
  getProjectReport,
  getUserReport,
} from '@/actions/report.actions';
import { ReportsSummarySection } from './reports-summary-section';
import { ReportsDetailedSection } from './reports-detailed-section';
import { ReportsProjectSection } from './reports-project-section';
import { ReportsUserSection } from './reports-user-section';
import { ReportsSkeleton } from './reports-skeleton';

type Period = 'week' | 'month' | 'quarter' | 'year' | 'custom';
type ReportType = 'summary' | 'detailed' | 'by-project' | 'by-user';

interface ReportsServerProps {
  period: Period;
  reportType: ReportType;
  startDate?: Date;
  endDate?: Date;
}

export async function ReportsServer({
  period,
  reportType,
  startDate,
  endDate,
}: ReportsServerProps) {
  // Préparer les filtres pour les requêtes
  const filters = {
    period: period !== 'custom' ? period : undefined,
    startDate,
    endDate,
  };

  // Charger les données en parallèle selon le type de rapport
  const [summaryResult, detailedResult, projectResult, userResult] = await Promise.all([
    // Summary est toujours chargé pour les KPIs
    getReportSummary(filters),

    // Charger les autres données selon le type de rapport sélectionné
    reportType === 'detailed' ? getDetailedReport(filters) : Promise.resolve(null),
    reportType === 'by-project' ? getProjectReport(filters) : Promise.resolve(null),
    reportType === 'by-user' ? getUserReport(filters) : Promise.resolve(null),
  ]);

  const summary = summaryResult?.data || null;
  const detailedData = detailedResult?.data || [];
  const projectData = projectResult?.data || [];
  const userData = userResult?.data || [];

  return (
    <div className="space-y-6">
      {/* KPIs Section - Toujours affiché */}
      <Suspense fallback={<ReportsSkeleton type="summary" />}>
        <ReportsSummarySection summary={summary} period={period} />
      </Suspense>

      {/* Section détaillée selon le type de rapport */}
      {reportType === 'detailed' && detailedData.length > 0 && (
        <Suspense fallback={<ReportsSkeleton type="detailed" />}>
          <ReportsDetailedSection data={detailedData} />
        </Suspense>
      )}

      {reportType === 'by-project' && projectData.length > 0 && (
        <Suspense fallback={<ReportsSkeleton type="project" />}>
          <ReportsProjectSection data={projectData} />
        </Suspense>
      )}

      {reportType === 'by-user' && userData.length > 0 && (
        <Suspense fallback={<ReportsSkeleton type="user" />}>
          <ReportsUserSection data={userData} />
        </Suspense>
      )}
    </div>
  );
}
