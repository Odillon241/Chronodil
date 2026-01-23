'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useT } from '@/lib/translations'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { useConfirmationDialog } from '@/hooks/use-confirmation-dialog'
import { getProjects, archiveProject, cloneProject, deleteProject } from '@/actions/project.actions'
import { getDepartments } from '@/actions/settings.actions'
import { useSession } from '@/lib/auth-client'
import { useRealtimeProjects } from '@/hooks/use-realtime-projects'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

// Components
import { ProjectsHeader } from '@/components/projects/projects-header'
import { ProjectsToolbar } from '@/components/projects/projects-toolbar'
import { ProjectsList } from '@/components/projects/projects-list'
import { ProjectsGrid } from '@/components/projects/projects-grid'
import { ProjectEditDialog } from '@/components/projects/project-edit-dialog'
import { ProjectDetailsDialog } from '@/components/projects/project-details-dialog'
import { ProjectTeamDialog } from '@/components/features/project-team-dialog'

// Types
import type {
  Project,
  Department,
  ProjectViewMode,
  ProjectSortField,
  SortOrder,
} from '@/types/project.types'

export default function ProjectsPage() {
  const { data: session } = useSession()
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  const currentUser = session?.user
  const t = useT('projects')

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [teamDialogOpen, setTeamDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Data states
  const [projects, setProjects] = useState<Project[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // Filter and view states
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ProjectViewMode>('list')
  const [activeTab, setActiveTab] = useState('active')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>()
  const [sortField, setSortField] = useState<ProjectSortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Initial Data Load

  useEffect(() => {
    loadData()
  }, [])

  // Reload projects when filter status changes (activeTab)

  useEffect(() => {
    loadProjects()
  }, [activeTab])

  // Real-time updates
  useRealtimeProjects({
    onProjectChange: () => {
      loadProjects()
    },
    userId: currentUser?.id,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectsResult, deptResult] = await Promise.all([
        getProjects({
          isActive: activeTab === 'all' ? undefined : activeTab === 'active' ? true : false,
        }),
        getDepartments({}),
      ])

      if (projectsResult?.data) setProjects(projectsResult.data as any)
      if (deptResult?.data) setDepartments(deptResult.data as Department[])
    } catch (_error) {
      toast.error(t('messages.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const filterParam = activeTab === 'all' ? undefined : activeTab === 'active' ? true : false
      const result = await getProjects({ isActive: filterParam })
      if (result?.data) setProjects(result.data as any)
    } catch (_error) {
      toast.error(t('messages.loadProjectsError'))
    }
  }

  // Process data (filter & sort)
  const processedProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      // Search
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        project.name.toLowerCase().includes(searchLower) ||
        project.code.toLowerCase().includes(searchLower)

      // Date Range
      let matchesDateRange = true
      if (dateRange?.from && project.startDate) {
        matchesDateRange = matchesDateRange && new Date(project.startDate) >= dateRange.from
      }
      if (dateRange?.to && project.endDate) {
        matchesDateRange = matchesDateRange && new Date(project.endDate) <= dateRange.to
      }

      return matchesSearch && matchesDateRange
    })

    // Sort
    return filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'code':
          aValue = a.code.toLowerCase()
          bValue = b.code.toLowerCase()
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'budgetHours':
          aValue = a.budgetHours || 0
          bValue = b.budgetHours || 0
          break
        case 'progress':
          aValue = a.budgetHours ? ((a.usedHours || 0) / a.budgetHours) * 100 : 0
          bValue = b.budgetHours ? ((b.usedHours || 0) / b.budgetHours) * 100 : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [projects, searchQuery, dateRange, sortField, sortOrder])

  // Statistics
  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.isActive)
    return {
      total: projects.length,
      active: activeProjects.length,
      archived: projects.length - activeProjects.length,
    }
  }, [projects])

  // Action Handlers
  const handleSortChange = (field: ProjectSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleEdit = (project: Project) => {
    setSelectedProject(project)
    setEditDialogOpen(true)
  }

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project)
    setDetailsDialogOpen(true)
  }

  const handleManageTeam = (project: Project) => {
    setSelectedProject(project)
    setTeamDialogOpen(true)
  }

  const handleArchive = async (project: Project) => {
    showConfirmation({
      title: `${project.isActive ? t('archive') : t('reactivate')} le projet`,
      description: `Voulez-vous vraiment ${project.isActive ? 'archiver' : 'réactiver'} le projet "${project.name}" ?`,
      confirmText: project.isActive ? t('archive') : t('reactivate'),
      cancelText: t('messages.undo'),
      variant: project.isActive ? 'destructive' : 'default',
      onConfirm: async () => {
        try {
          const result = await archiveProject({ id: project.id })
          if (result?.data) {
            const wasActive = project.isActive
            toast.success(wasActive ? t('messages.archived') : t('messages.reactivated'))
            loadProjects()
          } else {
            toast.error(result?.serverError || t('messages.archiveError'))
          }
        } catch (_error) {
          toast.error(t('messages.archiveError'))
        }
      },
    })
  }

  const handleClone = async (project: Project) => {
    showConfirmation({
      title: 'Cloner le projet',
      description: `Voulez-vous vraiment cloner le projet "${project.name}" ?\n\nLe nouveau projet sera créé avec tous les membres de l'équipe.`,
      confirmText: t('clone'),
      cancelText: t('messages.undo'),
      onConfirm: async () => {
        try {
          const result = await cloneProject({ id: project.id })
          if (result?.data) {
            toast.success(t('messages.cloned'))
            loadProjects()
          } else {
            toast.error(result?.serverError || 'Erreur lors du clonage')
          }
        } catch (_error) {
          toast.error(t('messages.cloneError'))
        }
      },
    })
  }

  const canDeleteProject = useCallback(
    (project: Project) => {
      const userRole = (currentUser as any)?.role as string
      const isAdmin = userRole === 'ADMIN'
      const isCreator = project.createdBy === currentUser?.id
      return isAdmin || isCreator
    },
    [currentUser],
  )

  const handleDelete = async (project: Project) => {
    if (!canDeleteProject(project)) {
      toast.error(t('messages.noPermissionDelete'))
      return
    }

    showConfirmation({
      title: '⚠️ Supprimer définitivement le projet',
      description: `Voulez-vous vraiment supprimer définitivement le projet "${project.name}" ?\n\nCette action est irréversible et supprimera :\n- Le projet et toutes ses données\n- Tous les membres associés\n- Toutes les tâches du projet\n- Toutes les entrées de timesheet associées`,
      confirmText: t('delete'),
      cancelText: t('messages.undo'),
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const result = await deleteProject({ id: project.id })
          if (result?.data) {
            toast.success(`Projet "${result.data.projectName}" supprimé avec succès !`)
            loadProjects()
          } else {
            toast.error(result?.serverError || 'Erreur lors de la suppression')
          }
        } catch (_error) {
          toast.error(t('messages.deleteError'))
        }
      },
    })
  }

  return (
    <div className="flex-1 space-y-6">
      <ProjectsHeader
        action={
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Link>
          </Button>
        }
      />

      <ProjectsToolbar
        statusFilter={activeTab}
        onStatusChange={setActiveTab}
        viewMode={viewMode as 'grid' | 'list'}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        statusOptions={[
          { id: 'active', label: t('active'), count: stats.active },
          { id: 'inactive', label: t('archived'), count: stats.archived },
          { id: 'all', label: t('all'), count: stats.total },
        ]}
      />

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Spinner className="size-8" />
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <ProjectsList
              projects={processedProjects}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              onView={handleViewDetails}
              onEdit={handleEdit}
              onManageTeam={handleManageTeam}
              onArchive={handleArchive}
              onClone={handleClone}
              onDelete={handleDelete}
              canDelete={canDeleteProject}
              currentUser={currentUser}
            />
          ) : (
            <ProjectsGrid
              projects={processedProjects}
              onView={handleViewDetails}
              onEdit={handleEdit}
              onManageTeam={handleManageTeam}
              onArchive={handleArchive}
              onClone={handleClone}
              onDelete={handleDelete}
              canDelete={canDeleteProject}
              currentUser={currentUser}
            />
          )}
        </>
      )}

      {/* Dialogs */}
      <ProjectEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={selectedProject}
        departments={departments}
        onSuccess={loadProjects}
      />

      <ProjectDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        project={selectedProject}
        onEdit={handleEdit}
        onManageTeam={handleManageTeam}
      />

      <ProjectTeamDialog
        project={selectedProject as any /* Type compatibility shim if needed */}
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        onUpdate={loadProjects}
      />

      <ConfirmationDialog />
    </div>
  )
}
