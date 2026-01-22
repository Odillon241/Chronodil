'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FilterButtonGroup } from '@/components/ui/filter-button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, FileSpreadsheet, ChevronDown, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// Components
import { MonitoringStatsCards } from './monitoring-stats-cards'
import { ActivityFeed } from './activity-feed'
import { DepartmentOverviewGrid } from './department-overview-grid'
import { SecurityMonitoringCard } from './security-monitoring-card'
import { SystemHealthCard } from './system-health-card'
import { AlertsCard } from './alerts-card'

// Hooks
import { useRealtimeAudit } from '@/hooks/use-realtime-audit'
import { useOnlineUsers } from '@/hooks/use-online-users'

// Actions
import {
  getMonitoringStats,
  getRecentActivity,
  getDepartmentActivityStats,
  getSecuritySummary,
  saveAlertConfig,
} from '@/actions/monitoring.actions'

// Types
import type {
  MonitoringStats,
  AuditLogWithUser,
  DepartmentStats,
  SecuritySummary,
  AlertConfig,
  AlertTriggered,
  MonitoringFilters,
} from '@/types/monitoring'

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
}

const ENTITY_LABELS: Record<string, string> = {
  User: 'Utilisateur',
  Project: 'Projet',
  Task: 'Tâche',
  HRTimesheet: 'Feuille de temps RH',
  Message: 'Message',
}

export function MonitoringDashboard() {
  // State
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [events, setEvents] = useState<AuditLogWithUser[]>([])
  const [departments, setDepartments] = useState<DepartmentStats[]>([])
  const [security, setSecurity] = useState<SecuritySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [newEventsBuffer, setNewEventsBuffer] = useState<AuditLogWithUser[]>([])
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([])
  const [triggeredAlerts, setTriggeredAlerts] = useState<AlertTriggered[]>([])
  const [lastDataFetch, setLastDataFetch] = useState<Date | null>(null)
  const [filters, setFilters] = useState<MonitoringFilters>({
    entity: 'all',
    action: 'all',
    search: '',
    startDate: '',
    endDate: '',
  })

  // Refs
  const eventsRef = useRef(events)
  eventsRef.current = events

  // Hooks
  const { count: onlineUsersCount } = useOnlineUsers({ enabled: true })

  // Realtime handler
  const handleNewAuditEvent = useCallback(
    (event: AuditLogWithUser) => {
      if (isPaused) {
        // Buffer events when paused
        setNewEventsBuffer((prev) => [event, ...prev].slice(0, 100))
      } else {
        // Add to top of events list
        setEvents((prev) => [event, ...prev].slice(0, 500))
        // Update stats
        setStats((prev) =>
          prev
            ? {
                ...prev,
                eventsLast24h: prev.eventsLast24h + 1,
                eventsLastHour: prev.eventsLastHour + 1,
              }
            : prev,
        )
      }
    },
    [isPaused],
  )

  const { connectionStatus } = useRealtimeAudit({
    onNewEvent: handleNewAuditEvent,
    enabled: true,
  })

  // Load initial data
  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const [statsResult, eventsResult, deptResult, securityResult] = await Promise.all([
        getMonitoringStats({}),
        getRecentActivity({ limit: 100 }),
        getDepartmentActivityStats({}),
        getSecuritySummary({}),
      ])

      if (statsResult?.data) setStats(statsResult.data)
      if (eventsResult?.data) setEvents(eventsResult.data)
      if (deptResult?.data) setDepartments(deptResult.data)
      if (securityResult?.data) setSecurity(securityResult.data)

      setLastDataFetch(new Date())
    } catch (error) {
      console.error('Error loading monitoring data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Refresh with filters
  const loadFilteredEvents = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const result = await getRecentActivity({
        limit: 100,
        entity: filters.entity === 'all' ? undefined : filters.entity,
        action: filters.action === 'all' ? undefined : filters.action,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      })

      if (result?.data) setEvents(result.data)
    } catch (error) {
      console.error('Error loading filtered events:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [filters])

  // Apply filters
  useEffect(() => {
    if (!isLoading) {
      loadFilteredEvents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.entity, filters.action, filters.startDate, filters.endDate])

  // Show buffered events when unpausing
  const handleShowNewEvents = useCallback(() => {
    setEvents((prev) => [...newEventsBuffer, ...prev].slice(0, 500))
    setNewEventsBuffer([])
    setIsPaused(false)
  }, [newEventsBuffer])

  // Filter events by search
  const filteredEvents = events.filter((event) => {
    if (!filters.search) return true
    const s = filters.search.toLowerCase()
    return (
      event.action.toLowerCase().includes(s) ||
      event.entity.toLowerCase().includes(s) ||
      event.User?.name?.toLowerCase().includes(s) ||
      event.User?.email?.toLowerCase().includes(s)
    )
  })

  // Alert handlers
  const handleSaveAlertConfig = async (config: Partial<AlertConfig>) => {
    const result = await saveAlertConfig({
      name: config.name || '',
      type: config.type || 'threshold',
      enabled: config.enabled ?? true,
      threshold: config.threshold,
      metric: config.metric || 'events_per_hour',
      severity: config.severity || 'medium',
    })

    if (result?.data) {
      setAlertConfigs((prev) => {
        const existing = prev.findIndex((c) => c.id === result.data?.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = result.data!
          return updated
        }
        return [...prev, result.data!]
      })
    }
  }

  const handleDeleteAlertConfig = async (id: string) => {
    setAlertConfigs((prev) => prev.filter((c) => c.id !== id))
  }

  const handleAcknowledgeAlert = async (id: string) => {
    setTriggeredAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true, acknowledgedAt: new Date() } : a)),
    )
  }

  // Export CSV
  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Heure', 'Utilisateur', 'Email', 'Action', 'Entité', 'ID', 'IP']
      const csv = [
        headers.join(','),
        ...filteredEvents.map((l) =>
          [
            format(new Date(l.createdAt), 'dd/MM/yyyy'),
            format(new Date(l.createdAt), 'HH:mm:ss'),
            l.User?.name || 'Système',
            l.User?.email || '',
            ACTION_LABELS[l.action] || l.action,
            ENTITY_LABELS[l.entity] || l.entity,
            l.entityId,
            l.ipAddress || '',
          ]
            .map((f) => `"${String(f).replace(/"/g, '""')}"`)
            .join(','),
        ),
      ].join('\n')

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `monitoring-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
      link.click()
      toast.success('Export CSV réussi')
    } catch {
      toast.error("Erreur lors de l'export")
    }
  }

  // Export Excel
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Chronodil Monitoring'
      workbook.created = new Date()

      // Feuille activités
      const sheet = workbook.addWorksheet('Activités', {
        views: [{ state: 'frozen', ySplit: 1 }],
      })

      sheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Heure', key: 'time', width: 10 },
        { header: 'Utilisateur', key: 'user', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Action', key: 'action', width: 20 },
        { header: 'Entité', key: 'entity', width: 20 },
        { header: 'ID', key: 'id', width: 36 },
        { header: 'IP', key: 'ip', width: 15 },
      ]

      filteredEvents.forEach((log) => {
        const row = sheet.addRow({
          date: format(new Date(log.createdAt), 'dd/MM/yyyy'),
          time: format(new Date(log.createdAt), 'HH:mm:ss'),
          user: log.User?.name || 'Système',
          email: log.User?.email || '-',
          action: ACTION_LABELS[log.action] || log.action,
          entity: ENTITY_LABELS[log.entity] || log.entity,
          id: log.entityId,
          ip: log.ipAddress || '-',
        })

        // Style conditionnel
        const actionCell = row.getCell('action')
        if (log.action.includes('CREATE')) actionCell.font = { color: { argb: 'FF15803D' } }
        if (log.action.includes('UPDATE')) actionCell.font = { color: { argb: 'FF1D4ED8' } }
        if (log.action.includes('DELETE')) actionCell.font = { color: { argb: 'FFB91C1C' } }
      })

      // Header style
      const headerRow = sheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' },
      }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
      headerRow.height = 30

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      saveAs(blob, `monitoring-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`)

      toast.success('Export Excel généré')
    } catch (error) {
      console.error('Export error:', error)
      toast.error("Erreur lors de l'export Excel")
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Monitoring temps réel</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Surveillance des activités et alertes en temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exporter</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <MonitoringStatsCards stats={stats} isLoading={isLoading} />

      {/* Filters */}
      <FilterButtonGroup
        searchValue={filters.search || ''}
        onSearchChange={(v) => setFilters({ ...filters, search: v })}
        filterOptions={[
          { id: 'all', label: 'Toutes entités', value: 'all' },
          { id: 'User', label: 'Utilisateur', value: 'User' },
          { id: 'Project', label: 'Projet', value: 'Project' },
          { id: 'Task', label: 'Tâche', value: 'Task' },
          { id: 'HRTimesheet', label: 'Feuille RH', value: 'HRTimesheet' },
          { id: 'Message', label: 'Message', value: 'Message' },
        ]}
        selectedFilter={filters.entity || 'all'}
        onFilterChange={(v) => setFilters({ ...filters, entity: v })}
        secondFilterOptions={[
          { id: 'all', label: 'Toutes actions', value: 'all' },
          { id: 'CREATE', label: 'Création', value: 'CREATE' },
          { id: 'UPDATE', label: 'Modification', value: 'UPDATE' },
          { id: 'DELETE', label: 'Suppression', value: 'DELETE' },
        ]}
        selectedSecondFilter={filters.action || 'all'}
        onSecondFilterChange={(v) => setFilters({ ...filters, action: v })}
        startDate={filters.startDate}
        endDate={filters.endDate}
        onDateChange={(start, end) => setFilters({ ...filters, startDate: start, endDate: end })}
        firstFilterLabel="Entité"
        secondFilterLabel="Action"
        placeholder="Rechercher utilisateur, action..."
      />

      {/* Main Grid: 2/3 Activity Feed + 1/3 Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed (2/3) */}
        <div className="lg:col-span-2 min-h-[500px]">
          <ActivityFeed
            events={filteredEvents}
            isLoading={isLoading}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(!isPaused)}
            connectionStatus={connectionStatus}
            newEventsCount={newEventsBuffer.length}
            onShowNewEvents={handleShowNewEvents}
          />
        </div>

        {/* Side Panel (1/3) */}
        <div className="space-y-4">
          <SystemHealthCard
            connectionStatus={connectionStatus}
            onlineUsersCount={onlineUsersCount}
            lastDataFetch={lastDataFetch}
            isLoading={isLoading}
          />
          <SecurityMonitoringCard security={security} isLoading={isLoading} />
          <AlertsCard
            alertConfigs={alertConfigs}
            triggeredAlerts={triggeredAlerts}
            onSaveConfig={handleSaveAlertConfig}
            onDeleteConfig={handleDeleteAlertConfig}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Department Overview (full width) */}
      <DepartmentOverviewGrid departments={departments} isLoading={isLoading} />
    </div>
  )
}
