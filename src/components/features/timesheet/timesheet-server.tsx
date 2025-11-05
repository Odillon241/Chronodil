import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { auth } from '@/lib/auth';
import { getMyTimesheetEntries } from '@/actions/timesheet.actions';
import { getMyProjects } from '@/actions/project.actions';
import { TimesheetClient } from './timesheet-client';
import { TimesheetSkeleton } from './timesheet-skeleton';

type ViewMode = 'week' | 'history';

interface TimesheetServerProps {
  viewMode?: ViewMode;
  selectedDate?: Date;
  filters?: {
    status?: string;
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
  };
}

export async function TimesheetServer({
  viewMode = 'week',
  selectedDate = new Date(),
  filters,
}: TimesheetServerProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Préparer les dates selon le mode
  let startDate: Date;
  let endDate: Date;

  if (viewMode === 'week') {
    startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
    endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
  } else {
    // Mode history - utiliser les filtres ou dates par défaut
    startDate = filters?.startDate || startOfMonth(new Date());
    endDate = filters?.endDate || endOfMonth(new Date());
  }

  // Fetch data en parallèle
  const [entriesResult, projectsResult] = await Promise.all([
    getMyTimesheetEntries({
      startDate,
      endDate,
      ...(filters?.status && filters.status !== 'all' && { status: filters.status as any }),
    }),
    getMyProjects({}),
  ]);

  let entries = entriesResult?.data || [];
  const projects = projectsResult?.data || [];

  // Filtrer par projet si nécessaire (côté serveur)
  if (filters?.projectId && filters.projectId !== 'all') {
    entries = entries.filter((e: any) => e.projectId === filters.projectId);
  }

  return (
    <Suspense fallback={<TimesheetSkeleton />}>
      <TimesheetClient
        initialEntries={entries}
        initialProjects={projects}
        initialViewMode={viewMode}
        initialSelectedDate={selectedDate}
        initialFilters={filters}
      />
    </Suspense>
  );
}
