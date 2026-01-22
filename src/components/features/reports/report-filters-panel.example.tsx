/**
 * Example usage of ReportFiltersPanel component
 *
 * This file demonstrates how to use the advanced filters panel
 * in the reports page with URL persistence and state management.
 */

'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ReportFiltersPanel } from './report-filters-panel'
import type { ReportFilters } from './report-filters-panel'
import type { ReportTemplate, ReportUser } from '@/types/report.types'

interface ExampleReportsPageProps {
  templates: ReportTemplate[]
  users: ReportUser[]
  isAdmin: boolean
}

export function ExampleReportsPage({ templates, users, isAdmin }: ExampleReportsPageProps) {
  const searchParams = useSearchParams()

  // Initialize filters from URL
  const [filters, setFilters] = useState<ReportFilters>(() => {
    const types = searchParams.get('types')?.split(',') || []
    const formats = searchParams.get('formats')?.split(',') || []
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    return {
      search: searchParams.get('search') || '',
      types: types.filter((t): t is 'WEEKLY' | 'MONTHLY' | 'INDIVIDUAL' =>
        ['WEEKLY', 'MONTHLY', 'INDIVIDUAL'].includes(t),
      ),
      formats: formats.filter((f): f is 'pdf' | 'word' | 'excel' =>
        ['pdf', 'word', 'excel'].includes(f),
      ),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      templateId: searchParams.get('templateId') || undefined,
      createdById: searchParams.get('createdById') || undefined,
    }
  })

  // Handle filter changes
  const handleFiltersChange = (newFilters: ReportFilters) => {
    setFilters(newFilters)
    // Trigger data refetch here (e.g., with React Query)
    // Example: queryClient.invalidateQueries(['reports']);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-muted-foreground">Gérez et téléchargez vos rapports</p>
        </div>
      </div>

      {/* Filters Panel */}
      <ReportFiltersPanel
        filters={filters}
        onChange={handleFiltersChange}
        templates={templates}
        users={users}
        isAdmin={isAdmin}
      />

      {/* Reports List/Table */}
      <div className="space-y-4">
        {/* Add your ReportTable or ReportList component here */}
        <p className="text-sm text-muted-foreground">
          Filtered by: {JSON.stringify(filters, null, 2)}
        </p>
      </div>
    </div>
  )
}

/**
 * Example with React Query for data fetching
 */

import { useQuery } from '@tanstack/react-query'

interface Report {
  id: string
  title: string
  // ... other fields
}

async function fetchReports(filters: ReportFilters): Promise<Report[]> {
  const params = new URLSearchParams()

  if (filters.search) params.set('search', filters.search)
  if (filters.types.length) params.set('types', filters.types.join(','))
  if (filters.formats.length) params.set('formats', filters.formats.join(','))
  if (filters.startDate) params.set('startDate', filters.startDate.toISOString())
  if (filters.endDate) params.set('endDate', filters.endDate.toISOString())
  if (filters.templateId) params.set('templateId', filters.templateId)
  if (filters.createdById) params.set('createdById', filters.createdById)

  const response = await fetch(`/api/reports?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch reports')
  return response.json()
}

export function ExampleWithReactQuery({ templates, users, isAdmin }: ExampleReportsPageProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    search: '',
    types: [],
    formats: [],
  })

  // Fetch reports based on filters
  const {
    data: reports,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => fetchReports(filters),
    staleTime: 30000, // 30 seconds
  })

  return (
    <div className="space-y-6">
      <ReportFiltersPanel
        filters={filters}
        onChange={setFilters}
        templates={templates}
        users={users}
        isAdmin={isAdmin}
      />

      {isLoading && <p>Chargement...</p>}
      {error && <p className="text-destructive">Erreur de chargement</p>}
      {reports && (
        <div>
          <p>{reports.length} rapports trouvés</p>
          {/* Render reports */}
        </div>
      )}
    </div>
  )
}

/**
 * Example with Server Actions
 */

import { useTransition } from 'react'

export function ExampleWithServerActions({
  templates,
  users,
  isAdmin,
  initialReports,
}: ExampleReportsPageProps & { initialReports: Report[] }) {
  const [filters, setFilters] = useState<ReportFilters>({
    search: '',
    types: [],
    formats: [],
  })
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [isPending, startTransition] = useTransition()

  const handleFiltersChange = (newFilters: ReportFilters) => {
    setFilters(newFilters)

    // Fetch with server action
    startTransition(async () => {
      // Import your server action
      // const { getReports } = await import("@/actions/report.actions");
      // const result = await getReports(newFilters);
      // if (result.data) setReports(result.data);
    })
  }

  return (
    <div className="space-y-6">
      <ReportFiltersPanel
        filters={filters}
        onChange={handleFiltersChange}
        templates={templates}
        users={users}
        isAdmin={isAdmin}
      />

      {isPending && <p>Mise à jour...</p>}
      <div>
        <p>{reports.length} rapports trouvés</p>
        {/* Render reports */}
      </div>
    </div>
  )
}
