import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { parseISO } from 'date-fns';
import { auth } from '@/lib/auth';
import { TimesheetServer } from '@/components/features/timesheet/timesheet-server';
import { TimesheetSkeleton } from '@/components/features/timesheet/timesheet-skeleton';

export const metadata = {
  title: 'Feuilles de temps | Chronodil',
  description: 'Gérez vos entrées de temps et feuilles de temps',
};

type ViewMode = 'week' | 'history';

interface PageProps {
  searchParams: Promise<{
    view?: ViewMode;
    date?: string;
    status?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function TimesheetPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const viewMode = (params.view as ViewMode) || 'week';
  const selectedDate = params.date ? parseISO(params.date) : new Date();

  // Préparer les filtres pour le mode history
  const filters = {
    status: params.status,
    projectId: params.projectId,
    startDate: params.startDate ? parseISO(params.startDate) : undefined,
    endDate: params.endDate ? parseISO(params.endDate) : undefined,
  };

  return (
    <div className="space-y-6">
      <Suspense fallback={<TimesheetSkeleton />}>
        <TimesheetServer
          viewMode={viewMode}
          selectedDate={selectedDate}
          filters={filters}
        />
      </Suspense>
    </div>
  );
}
