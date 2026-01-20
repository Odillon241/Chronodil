'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { FilterButtonGroup } from '@/components/ui/filter-button-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Shield,
  Activity,
  Database,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Globe,
  FileCode,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getAuditLogs, getAuditStats } from '@/actions/audit.actions'
import { cn } from '@/lib/utils'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

interface AuditLog {
  id: string
  userId: string | null
  action: string
  entity: string
  entityId: string
  changes: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  User: { name: string; email: string } | null
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  CREATE: { label: 'Création', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  UPDATE: { label: 'Modification', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  DELETE: { label: 'Suppression', color: 'text-red-700', bgColor: 'bg-red-100' },
}

const ENTITY_CONFIG: Record<string, string> = {
  User: 'Utilisateur',
  Project: 'Projet',
  Task: 'Tâche',
  HRTimesheet: 'Feuille de temps RH',
  Message: 'Message',
  Settings: 'Paramètres',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  CREATE_USER: 'Création utilisateur',
  UPDATE_USER: 'Modification utilisateur',
  DELETE_USER: 'Suppression utilisateur',
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [totalLogs, setTotalLogs] = useState(0)
  const [filters, setFilters] = useState({
    entity: 'all',
    action: 'all',
    search: '',
    startDate: '',
    endDate: '',
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData()
  }, [filters.entity, filters.action, filters.startDate, filters.endDate, currentPage])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const offset = (currentPage - 1) * itemsPerPage
      const [logsResult, statsResult] = await Promise.all([
        getAuditLogs({
          entity: filters.entity === 'all' ? undefined : filters.entity,
          action: filters.action === 'all' ? undefined : filters.action,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          limit: itemsPerPage,
          offset,
        }),
        getAuditStats({}),
      ])
      if (logsResult?.data) {
        setLogs(logsResult.data)
        setTotalLogs(statsResult?.data?.total || logsResult.data.length)
      }
      if (statsResult?.data) setStats(statsResult.data)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const getActionStyle = (action: string) => {
    const key = action.toUpperCase().replace(/_.*/g, '')
    return ACTION_CONFIG[key] || { label: action, color: 'text-gray-700', bgColor: 'bg-gray-100' }
  }

  const filteredLogs = logs.filter((log) => {
    if (!filters.search) return true
    const s = filters.search.toLowerCase()
    return (
      log.action.toLowerCase().includes(s) ||
      log.entity.toLowerCase().includes(s) ||
      log.User?.name?.toLowerCase().includes(s) ||
      log.User?.email?.toLowerCase().includes(s)
    )
  })

  // Export CSV
  const exportToCSV = () => {
    try {
      const headers = [
        'Date',
        'Heure',
        'Utilisateur',
        'Email',
        'Action',
        'Entité',
        'ID',
        'Adresse IP',
      ]
      const csv = [
        headers.join(','),
        ...filteredLogs.map((l) =>
          [
            format(new Date(l.createdAt), 'dd/MM/yyyy'),
            format(new Date(l.createdAt), 'HH:mm:ss'),
            l.User?.name || 'Système',
            l.User?.email || '',
            ACTION_LABELS[l.action] || l.action,
            ENTITY_CONFIG[l.entity] || l.entity,
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
      link.download = `rapport-audit-${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()
      toast.success('Export CSV réussi')
    } catch {
      toast.error("Erreur lors de l'export")
    }
  }

  // Export Excel avec formatage professionnel (ExcelJS)
  const exportToExcel = async () => {
    try {
      // Créer le workbook et la feuille
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Chronodil App'
      workbook.created = new Date()

      // --- FEUILLE 1 : Journal des actions ---
      const sheet = workbook.addWorksheet('Journal des actions', {
        views: [{ state: 'frozen', ySplit: 1 }],
      })

      // Définir les colonnes
      sheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Heure', key: 'time', width: 10 },
        { header: 'Utilisateur', key: 'user', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Action', key: 'action', width: 20 },
        { header: 'Entité', key: 'entity', width: 20 },
        { header: 'Identifiant', key: 'id', width: 36 },
        { header: 'IP', key: 'ip', width: 15 },
        { header: 'Navigateur', key: 'ua', width: 15 },
      ]

      // Ajouter les données
      filteredLogs.forEach((log) => {
        const row = sheet.addRow({
          date: format(new Date(log.createdAt), 'dd/MM/yyyy'),
          time: format(new Date(log.createdAt), 'HH:mm:ss'),
          user: log.User?.name || 'Système',
          email: log.User?.email || '-',
          action: ACTION_LABELS[log.action] || log.action,
          entity: ENTITY_CONFIG[log.entity] || log.entity,
          id: log.entityId,
          ip: log.ipAddress || '-',
          ua: log.userAgent
            ? log.userAgent.includes('Chrome')
              ? 'Chrome'
              : log.userAgent.includes('Firefox')
                ? 'Firefox'
                : log.userAgent.includes('Safari')
                  ? 'Safari'
                  : 'Autre'
            : '-',
        })

        // Style conditionnel pour la colonne Action
        const actionCell = row.getCell('action')
        if (log.action.includes('CREATE')) actionCell.font = { color: { argb: 'FF15803D' } } // Green
        if (log.action.includes('UPDATE')) actionCell.font = { color: { argb: 'FF1D4ED8' } } // Blue
        if (log.action.includes('DELETE')) actionCell.font = { color: { argb: 'FFB91C1C' } } // Red
      })

      // Styliser l'en-tête
      const headerRow = sheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }, // Slate 900
      }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
      headerRow.height = 30

      // Bordures et centrage pour tout le tableau
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          }
          if (rowNumber > 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false }
            // Centrer certaines colonnes
            if ([1, 2, 8, 9].includes(Number(cell.col))) {
              cell.alignment = { ...cell.alignment, horizontal: 'center' }
            }
          }
        })
      })

      // --- FEUILLE 2 : Statistiques (Résumé) ---
      const statsSheet = workbook.addWorksheet('Statistiques', {
        views: [{ showGridLines: false }],
      })

      // Titre
      statsSheet.mergeCells('A1:C1')
      const titleCell = statsSheet.getCell('A1')
      titleCell.value = "Rapport d'Audit - Résumé Statistiques"
      titleCell.font = { bold: true, size: 16, color: { argb: 'FF0F172A' } }
      titleCell.alignment = { horizontal: 'center' }

      // Helper pour tableau de stats
      const addStatsTable = (startRow: number, title: string, headers: string[], data: any[]) => {
        const titleRow = statsSheet.getRow(startRow)
        titleRow.getCell(1).value = title
        titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF0F172A' } }

        const headerRowIdx = startRow + 1
        const headerRow = statsSheet.getRow(headerRowIdx)
        headers.forEach((h, i) => {
          const cell = headerRow.getCell(i + 1)
          cell.value = h
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } } // Slate 600
          cell.alignment = { horizontal: 'center' }
          cell.border = { bottom: { style: 'medium' } }
        })

        data.forEach((item, i) => {
          const row = statsSheet.getRow(headerRowIdx + 1 + i)
          Object.values(item).forEach((val, colIdx) => {
            const cell = row.getCell(colIdx + 1)
            cell.value = val as string | number | boolean
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } }
            if (colIdx > 0) cell.alignment = { horizontal: 'center' } // Stats numériques centrées
          })
        })

        return headerRowIdx + data.length + 3 // Retourne la prochaine ligne de départ
      }

      // Stats Actions
      const actionStats = Object.entries(
        filteredLogs.reduce(
          (acc, l) => {
            const action = ACTION_LABELS[l.action] || l.action
            acc[action] = (acc[action] || 0) + 1
            return acc as Record<string, number>
          },
          {} as Record<string, number>,
        ),
      ).map(([action, count]) => ({
        action,
        count,
        pct: (((count as number) / filteredLogs.length) * 100).toFixed(1) + '%',
      }))

      let nextRow = addStatsTable(3, "Par Type d'Action", ['Action', 'Nombre', '%'], actionStats)

      // Stats Entités
      const entityStats = Object.entries(
        filteredLogs.reduce(
          (acc, l) => {
            const entity = ENTITY_CONFIG[l.entity] || l.entity
            acc[entity] = (acc[entity] || 0) + 1
            return acc as Record<string, number>
          },
          {} as Record<string, number>,
        ),
      ).map(([entity, count]) => ({
        entity,
        count,
        pct: (((count as number) / filteredLogs.length) * 100).toFixed(1) + '%',
      }))

      nextRow = addStatsTable(nextRow, 'Par Entité', ['Entité', 'Nombre', '%'], entityStats)

      // Stats Utilisateurs
      const userStats = Object.entries(
        filteredLogs.reduce(
          (acc, l) => {
            const user = l.User?.name || 'Système'
            acc[user] = (acc[user] || 0) + 1
            return acc as Record<string, number>
          },
          {} as Record<string, number>,
        ),
      )
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 10) // Top 10
        .map(([user, count]) => ({ user, count }))

      addStatsTable(nextRow, 'Top 10 Utilisateurs Actifs', ['Utilisateur', 'Actions'], userStats)

      statsSheet.getColumn(1).width = 30
      statsSheet.getColumn(2).width = 15
      statsSheet.getColumn(3).width = 15

      // Générer le blob
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      saveAs(blob, `rapport-audit-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)

      toast.success('Rapport Excel stylisé généré !')
    } catch (error) {
      console.error('Erreur export Excel:', error)
      toast.error("Erreur lors de l'export Excel")
    }
  }

  const totalPages = Math.ceil(totalLogs / itemsPerPage)

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Audit des actions</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Historique complet de toutes les actions
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4" />
              Export CSV (simple)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
              <FileSpreadsheet className="h-4 w-4" />
              Rapport Excel (complet)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-2 border-transparent hover:border-primary/20 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Actions totales</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-primary/20 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold truncate">{stats.byAction[0]?.action || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.byAction[0]?.count || 0}× Action principale
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-transparent hover:border-primary/20 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold truncate">
                  {ENTITY_CONFIG[stats.byEntity[0]?.entity] || stats.byEntity[0]?.entity || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.byEntity[0]?.count || 0}× Entité principale
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters with Button Group */}
      <FilterButtonGroup
        searchValue={filters.search}
        onSearchChange={(v) => setFilters({ ...filters, search: v })}
        filterOptions={[
          { id: 'all', label: 'Toutes entités', value: 'all' },
          { id: 'User', label: 'Utilisateur', value: 'User' },
          { id: 'Project', label: 'Projet', value: 'Project' },
          { id: 'Task', label: 'Tâche', value: 'Task' },
          { id: 'HRTimesheet', label: 'Feuille RH', value: 'HRTimesheet' },
          { id: 'Message', label: 'Message', value: 'Message' },
        ]}
        selectedFilter={filters.entity}
        onFilterChange={(v) => {
          setFilters({ ...filters, entity: v })
          setCurrentPage(1)
        }}
        secondFilterOptions={[
          { id: 'all', label: 'Toutes actions', value: 'all' },
          { id: 'CREATE', label: 'Création', value: 'CREATE' },
          { id: 'UPDATE', label: 'Modification', value: 'UPDATE' },
          { id: 'DELETE', label: 'Suppression', value: 'DELETE' },
        ]}
        selectedSecondFilter={filters.action}
        onSecondFilterChange={(v) => {
          setFilters({ ...filters, action: v })
          setCurrentPage(1)
        }}
        startDate={filters.startDate}
        endDate={filters.endDate}
        onDateChange={(start, end) => {
          setFilters((prev) => ({ ...prev, startDate: start, endDate: end }))
          setCurrentPage(1)
        }}
        firstFilterLabel="Entité"
        secondFilterLabel="Action"
        placeholder="Rechercher..."
      />

      {/* List */}
      <Card className="overflow-hidden border shadow-none bg-muted/20">
        <CardHeader className="py-4 border-b bg-background/50">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-bold">Historique</CardTitle>
            <Badge variant="secondary">{filteredLogs.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-background/30">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Spinner className="size-6 mb-4" />
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Aucun log trouvé</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/50">
                {filteredLogs.map((log) => {
                  const actionStyle = getActionStyle(log.action)
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group"
                    >
                      <div
                        className={cn(
                          'hidden sm:flex h-10 w-10 items-center justify-center rounded-full shrink-0',
                          actionStyle.bgColor,
                        )}
                      >
                        <Activity className={cn('h-5 w-5', actionStyle.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn('text-xs', actionStyle.bgColor, actionStyle.color)}>
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                          <span className="font-medium">
                            {ENTITY_CONFIG[log.entity] || log.entity}
                          </span>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded hidden lg:inline">
                            {log.entityId.slice(0, 8)}...
                          </code>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.User?.name || 'Système'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(log.createdAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                          {log.ipAddress && (
                            <span className="hidden md:flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {log.ipAddress}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setSelectedLog(log)
                          setDetailsOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage}/{totalPages} • {totalLogs} logs
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileCode className="h-5 w-5 text-primary" />
              </div>
              Détails de l'action
            </DialogTitle>
            <DialogDescription>Informations complètes sur cette action audit</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    label: 'Date',
                    value: format(new Date(selectedLog.createdAt), 'dd/MM/yyyy HH:mm:ss', {
                      locale: fr,
                    }),
                    icon: Clock,
                  },
                  {
                    label: 'Action',
                    value: (
                      <Badge
                        className={cn(
                          getActionStyle(selectedLog.action).bgColor,
                          getActionStyle(selectedLog.action).color,
                        )}
                      >
                        {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                      </Badge>
                    ),
                    icon: Activity,
                  },
                  {
                    label: 'Entité',
                    value: ENTITY_CONFIG[selectedLog.entity] || selectedLog.entity,
                    icon: Database,
                  },
                  {
                    label: 'Utilisateur',
                    value: selectedLog.User?.name || 'Système',
                    sub: selectedLog.User?.email,
                    icon: User,
                  },
                  { label: 'Adresse IP', value: selectedLog.ipAddress || 'N/A', icon: Globe },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </Label>
                    <div className="font-medium text-sm">{item.value}</div>
                    {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
                  </div>
                ))}
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">ID Entité</Label>
                  <code className="block text-xs bg-muted p-2 rounded break-all">
                    {selectedLog.entityId}
                  </code>
                </div>
              </div>
              {selectedLog.userAgent && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">User Agent</Label>
                  <code className="block text-xs bg-muted p-2 rounded break-all">
                    {selectedLog.userAgent}
                  </code>
                </div>
              )}
              {selectedLog.changes && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Changements</Label>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-[200px]">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
