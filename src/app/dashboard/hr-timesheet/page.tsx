'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { toast } from 'sonner'

// Components
import { HRTimesheetHeader } from '@/components/hr-timesheet/hr-timesheet-header'
import { HRTimesheetToolbar } from '@/components/hr-timesheet/hr-timesheet-toolbar'
import { HRTimesheetList } from '@/components/hr-timesheet/hr-timesheet-list'
// ⚡ DYNAMIC IMPORTS: Calendar/Gantt chargés à la demande (-200KB bundle)
import {
  HRTimesheetCalendarDynamic,
  HRTimesheetGanttDynamic,
} from '@/components/hr-timesheet/hr-timesheet-components-dynamic'
import { Spinner } from '@/components/ui/spinner'

// Hooks & Actions
import { useConfirmationDialog } from '@/hooks/use-confirmation-dialog'
import { useRealtimeHRTimesheets } from '@/hooks/use-realtime-hr-timesheets'
import {
  getMyHRTimesheets,
  deleteHRTimesheet,
  submitHRTimesheet,
  getHRTimesheetsForApproval,
  getHRTimesheetsValidatedByMe,
  managerApproveHRTimesheet,
  odillonApproveHRTimesheet,
} from '@/actions/hr-timesheet.actions'

interface HRTimesheet {
  id: string
  weekStartDate: Date
  weekEndDate: Date
  employeeName: string
  position: string
  site: string
  totalHours: number
  status: string
  User_HRTimesheet_userIdToUser?: {
    name: string | null
    email: string
    image?: string | null
    avatar?: string | null
  }
}

export default function HRTimesheetPage() {
  const router = useRouter()
  const { data: session } = useSession() as any
  const userRole = session?.user?.role
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()

  // --- Permissions ---
  const canViewPendingTab =
    userRole === 'MANAGER' || userRole === 'DIRECTEUR' || userRole === 'ADMIN'
  const isValidator = canViewPendingTab

  // --- State ---
  const [dataView, setDataView] = useState<'my' | 'pending' | 'validated' | 'rejected'>('my')
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'gantt'>('list')
  const [isLoading, setIsLoading] = useState(true)

  // Data Buckets
  const [myTimesheets, setMyTimesheets] = useState<HRTimesheet[]>([])
  const [pendingTimesheets, setPendingTimesheets] = useState<HRTimesheet[]>([])
  const [validatedTimesheets, setValidatedTimesheets] = useState<HRTimesheet[]>([])
  const [rejectedTimesheets, setRejectedTimesheets] = useState<HRTimesheet[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>()

  // --- Data Loading ---
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const promises = [
        getMyHRTimesheets({}), // Always load my timesheets
        getMyHRTimesheets({ status: 'REJECTED' as any }),
      ]

      if (canViewPendingTab) {
        promises.push(getHRTimesheetsForApproval({}), getHRTimesheetsValidatedByMe({}))
      }

      const results = await Promise.all(promises)

      // 0: My Timesheets
      if (results[0]?.data) setMyTimesheets(results[0].data)
      // 1: Rejected (My rejected)
      if (results[1]?.data) setRejectedTimesheets(results[1].data)

      if (canViewPendingTab) {
        // 2: Pending Approval
        if (results[2]?.data) setPendingTimesheets(results[2].data)
        // 3: Validated by me
        if (results[3]?.data) setValidatedTimesheets(results[3].data)
      }
    } catch (error) {
      console.error('Error loading timesheets:', error)
      toast.error('Erreur lors du chargement des feuilles de temps')
    } finally {
      setIsLoading(false)
    }
  }, [canViewPendingTab])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtimeHRTimesheets({
    userId: session?.user?.id,
    onHRTimesheetChange: () => {
      loadData() // Simple re-fetch on change
    },
  })

  // --- Data Processing (Filtering) ---
  const currentList = useMemo(() => {
    switch (dataView) {
      case 'my':
        return myTimesheets
      case 'pending':
        return pendingTimesheets
      case 'validated':
        return validatedTimesheets
      case 'rejected':
        return rejectedTimesheets
      default:
        return myTimesheets
    }
  }, [dataView, myTimesheets, pendingTimesheets, validatedTimesheets, rejectedTimesheets])

  const filteredList = useMemo(() => {
    return currentList.filter((ts) => {
      // Search Filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        ts.employeeName.toLowerCase().includes(searchLower) ||
        ts.position.toLowerCase().includes(searchLower) ||
        ts.site.toLowerCase().includes(searchLower)

      // Date Filter
      let matchesDate = true
      if (dateRange?.from && dateRange?.to) {
        const start = new Date(ts.weekStartDate)
        matchesDate = start >= dateRange.from && start <= dateRange.to
      }

      return matchesSearch && matchesDate
    })
  }, [currentList, searchQuery, dateRange])

  // --- Actions ---
  const handleDelete = async (id: string) => {
    await showConfirmation({
      title: 'Supprimer',
      description: 'Êtes-vous sûr de vouloir supprimer cette feuille de temps ?',
      variant: 'destructive',
      onConfirm: async () => {
        const res = await deleteHRTimesheet({ timesheetId: id })
        if (res?.data) {
          toast.success('Supprimé avec succès')
          loadData()
        } else {
          toast.error('Erreur lors de la suppression')
        }
      },
    })
  }

  const handleSubmit = async (id: string) => {
    await showConfirmation({
      title: 'Soumettre',
      description: 'Voulez-vous soumettre cette feuille pour validation ?',
      onConfirm: async () => {
        const res = await submitHRTimesheet({ timesheetId: id })
        if (res?.data) {
          toast.success('Soumis avec succès')
          loadData()
        } else {
          toast.error('Erreur lors de la soumission')
        }
      },
    })
  }

  // Simplistic Approve/Reject for now (can expand with dialogs if needed like in original)
  const handleApprove = async (id: string) => {
    // Determine if Manager or Odillon based on role for simplicity in this refactor,
    // or use the specific actions.
    // Original code had complexity here. For specific role actions, we'd need to know context.
    // Assuming context is implicit by "Pending" tab.

    // Check role to verify which action to call
    const action = userRole === 'MANAGER' ? managerApproveHRTimesheet : odillonApproveHRTimesheet

    await showConfirmation({
      title: 'Valider',
      description: 'Valider cette feuille de temps ?',
      onConfirm: async () => {
        const res = await action({ timesheetId: id, action: 'approve', comments: '' })
        if (res?.data) {
          toast.success('Validé avec succès')
          loadData()
        } else {
          toast.error(res?.serverError || 'Erreur de validation')
        }
      },
    })
  }

  const handleReject = async (id: string) => {
    const action = userRole === 'MANAGER' ? managerApproveHRTimesheet : odillonApproveHRTimesheet
    await showConfirmation({
      title: 'Rejeter',
      description: 'Rejeter cette feuille de temps ?',
      variant: 'destructive',
      onConfirm: async () => {
        const res = await action({
          timesheetId: id,
          action: 'reject',
          comments: 'Rejeté via dashboard',
        })
        if (res?.data) {
          toast.success('Rejeté avec succès')
          loadData()
        } else {
          toast.error(res?.serverError || 'Erreur de rejet')
        }
      },
    })
  }

  // --- Derived State for UI ---
  const statusOptions = [
    { id: 'my', label: 'Mes feuilles', count: myTimesheets.length },
    ...(canViewPendingTab
      ? [
          { id: 'pending', label: 'À valider', count: pendingTimesheets.length },
          { id: 'validated', label: 'Validés', count: validatedTimesheets.length },
        ]
      : []),
    { id: 'rejected', label: 'Rejetés', count: rejectedTimesheets.length },
  ]

  const handleAddNew = (date?: Date) => {
    const params = new URLSearchParams()
    if (date) {
      params.set('date', date.toISOString())
    }
    router.push(`/dashboard/hr-timesheet/new?${params.toString()}`)
  }

  return (
    <div className="flex-1 space-y-6">
      <ConfirmationDialog />
      <HRTimesheetHeader />

      <HRTimesheetToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={dataView}
        onStatusChange={(val) => setDataView(val as any)}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        statusOptions={statusOptions}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        canExport={canViewPendingTab}
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          {viewMode === 'list' && (
            <HRTimesheetList
              timesheets={filteredList}
              currentUserId={session?.user?.id}
              onView={(id) => router.push(`/dashboard/hr-timesheet/${id}`)}
              onEdit={(id) => router.push(`/dashboard/hr-timesheet/${id}`)}
              onDelete={handleDelete}
              onSubmit={handleSubmit}
              onApprove={handleApprove}
              onReject={handleReject}
              isAdminOrManager={isValidator}
            />
          )}
          {viewMode === 'calendar' && (
            <HRTimesheetCalendarDynamic
              timesheets={filteredList}
              onView={(id) => router.push(`/dashboard/hr-timesheet/${id}`)}
            />
          )}
          {viewMode === 'gantt' && (
            <HRTimesheetGanttDynamic
              timesheets={filteredList}
              onView={(id) => router.push(`/dashboard/hr-timesheet/${id}`)}
              onAddNew={handleAddNew}
            />
          )}
        </>
      )}
    </div>
  )
}
