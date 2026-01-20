'use client'

import { useState, useMemo } from 'react'
import { Task, TaskOwner, STATUS_COLORS } from './task-types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Eye,
  Link2,
  Trash2,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface TaskTableProps {
  tasks: Task[]
  onEventClick: (task: Task) => void
  onEventDelete?: (taskId: string) => Promise<void>
  onEventToggle?: (task: Task) => Promise<void>
}

type SortField = 'name' | 'startAt' | 'endAt' | 'release' | 'status'
type SortDirection = 'asc' | 'desc' | null

export function TaskTable({ tasks, onEventClick, onEventDelete, onEventToggle }: TaskTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedTasks = useMemo(() => {
    if (!sortField || !sortDirection) return tasks

    return [...tasks].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'startAt':
          aValue = a.startAt ? new Date(a.startAt).getTime() : 0
          bValue = b.startAt ? new Date(b.startAt).getTime() : 0
          break
        case 'endAt':
          aValue = a.endAt ? new Date(a.endAt).getTime() : 0
          bValue = b.endAt ? new Date(b.endAt).getTime() : 0
          break
        case 'release':
          aValue = (a.release || '').toLowerCase()
          bValue = (b.release || '').toLowerCase()
          break
        case 'status':
          aValue = a.status.toLowerCase()
          bValue = b.status.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [tasks, sortField, sortDirection])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    return <ArrowDown className="ml-2 h-4 w-4" />
  }

  const formatDate = (date?: string | Date) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: fr })
    } catch {
      return '-'
    }
  }

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase()
    if (statusUpper in STATUS_COLORS) {
      return STATUS_COLORS[statusUpper as keyof typeof STATUS_COLORS]
    }
    return STATUS_COLORS.PENDING
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PLANNED: 'Planifié',
      IN_PROGRESS: 'En cours',
      DONE: 'Terminé',
      TODO: 'À faire',
      PENDING: 'En attente',
      COMPLETED: 'Complété',
    }
    return statusMap[status.toUpperCase()] || status
  }

  const handleCopyLink = async (taskId: string) => {
    const url = `${window.location.origin}/dashboard/tasks/${taskId}`
    await navigator.clipboard.writeText(url)
  }

  const _getInitials = (owner?: TaskOwner) => {
    if (!owner) return '?'
    return owner.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Statut</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={() => handleSort('name')}
              >
                Nom
                <SortIcon field="name" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={() => handleSort('startAt')}
              >
                Début
                <SortIcon field="startAt" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={() => handleSort('endAt')}
              >
                Fin
                <SortIcon field="endAt" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={() => handleSort('release')}
              >
                Release
                <SortIcon field="release" />
              </Button>
            </TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={() => handleSort('status')}
              >
                Statut
                <SortIcon field="status" />
              </Button>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                Aucune tâche trouvée
              </TableCell>
            </TableRow>
          ) : (
            sortedTasks.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onEventClick(task)}
              >
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventToggle?.(task)
                    }}
                  >
                    {task.status.toUpperCase() === 'DONE' ||
                    task.status.toUpperCase() === 'COMPLETED' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{task.name}</span>
                    {task.Project && (
                      <span className="text-xs text-muted-foreground">{task.Project.name}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDate(task.startAt)}</TableCell>
                <TableCell>{formatDate(task.endAt)}</TableCell>
                <TableCell>
                  {task.release ? (
                    <Badge variant="outline">{task.release}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.owner ? (
                    <div className="flex items-center gap-2">
                      <UserAvatar name={task.owner.name} avatar={task.owner.image} size="xs" />
                      <span className="text-sm">{task.owner.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${getStatusColor(task.status)}20`,
                      color: getStatusColor(task.status),
                      borderColor: getStatusColor(task.status),
                    }}
                    className="border"
                  >
                    {getStatusLabel(task.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(task)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir la tâche
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyLink(task.id)
                        }}
                      >
                        <Link2 className="mr-2 h-4 w-4" />
                        Copier le lien
                      </DropdownMenuItem>
                      {onEventDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEventDelete(task.id)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
