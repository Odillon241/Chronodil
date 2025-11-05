import { Suspense } from 'react';
import { ReportsServer } from '@/components/features/reports/reports-server';
import { ReportsClient } from '@/components/features/reports/reports-client';
import { ReportsSkeleton } from '@/components/features/reports/reports-skeleton';
import { getReports } from '@/actions/report.actions';
import { getAllUsers } from '@/actions/user.actions';

export const metadata = {
  title: 'Rapports | Chronodil',
  description: 'Analysez vos données de temps de travail et générez des rapports',
};

type Period = 'week' | 'month' | 'quarter' | 'year' | 'custom';
type ReportType = 'summary' | 'detailed' | 'by-project' | 'by-user';

interface PageProps {
  searchParams: Promise<{
    period?: Period;
    type?: ReportType;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = (params.period as Period) || 'month';
  const reportType = (params.type as ReportType) || 'summary';
  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(params.endDate) : undefined;

  // Charger les données initiales en parallèle
  const [reportsResult, usersResult] = await Promise.all([
    getReports(),
    getAllUsers({}),
  ]);

  const reports = reportsResult?.data || [];
  const users = usersResult?.data || [];

  return (
    <div className="space-y-6">
      {/* Composant Client pour les interactions (filtres, exports, dialogs) */}
      <ReportsClient
        initialPeriod={period}
        initialReportType={reportType}
        initialReports={reports}
        initialUsers={users}
      />

      {/* Composant Server pour le fetching et l'affichage des données */}
      <Suspense fallback={<ReportsSkeleton type="summary" />}>
        <ReportsServer
          period={period}
          reportType={reportType}
          startDate={startDate}
          endDate={endDate}
        />
      </Suspense>
    </div>
  );
}
