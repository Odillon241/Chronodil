'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Bell, Volume2, VolumeX, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Spinner } from '@/components/ui/spinner'
import { TaskComplexitySelector } from '@/components/features/task-complexity-selector'
import { createTask, updateTask } from '@/actions/task.actions'
import { getMyProjects } from '@/actions/project.actions'
import {
  getAvailableHRTimesheetsForTask,
  getActivityCatalog,
  getActivityCategories,
} from '@/actions/hr-timesheet.actions'
import { getAvailableUsersForSharing } from '@/actions/task.actions'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Lazy loading des composants d'onglets
const TaskComments = dynamic(
  () =>
    import('@/components/features/task-comments').then((mod) => ({ default: mod.TaskComments })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    ),
    ssr: false,
  },
)

const TaskActivityTimeline = dynamic(
  () =>
    import('@/components/features/task-activity-timeline').then((mod) => ({
      default: mod.TaskActivityTimeline,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    ),
    ssr: false,
  },
)

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTask?: any
  currentUserId?: string
  onSuccess: () => void
}

export function TaskDialog({
  open,
  onOpenChange,
  editingTask,
  currentUserId,
  onSuccess,
}: TaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [availableTimesheets, setAvailableTimesheets] = useState<any[]>([])
  const [catalog, setCatalog] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectId: 'no-project',
    estimatedHours: '',
    dueDate: '',
    reminderDate: '',
    reminderTime: '',
    soundEnabled: true,
    isShared: false,
    status: 'TODO',
    priority: 'MEDIUM',
    complexity: 'MOYEN',
    trainingLevel: undefined,
    masteryLevel: undefined,
    understandingLevel: undefined,
    hrTimesheetId: 'no-timesheet',
    activityType: 'OPERATIONAL',
    activityName: '',
    periodicity: 'WEEKLY',
  })

  // Charger les données initiales
  useEffect(() => {
    if (open) {
      loadInitialData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Initialiser le formulaire avec les données de la tâche à éditer
  useEffect(() => {
    if (editingTask) {
      setFormData({
        name: editingTask.name,
        description: editingTask.description || '',
        projectId: editingTask.projectId || 'no-project',
        estimatedHours: editingTask.estimatedHours?.toString() || '',
        dueDate: editingTask.dueDate
          ? new Date(editingTask.dueDate).toISOString().split('T')[0]
          : '',
        reminderDate: editingTask.reminderDate
          ? new Date(editingTask.reminderDate).toISOString().split('T')[0]
          : '',
        reminderTime: editingTask.reminderTime || '',
        soundEnabled: editingTask.soundEnabled !== undefined ? editingTask.soundEnabled : true,
        isShared: editingTask.isShared || false,
        status: editingTask.status || 'TODO',
        priority: editingTask.priority || 'MEDIUM',
        complexity: editingTask.complexity || 'MOYEN',
        trainingLevel: editingTask.trainingLevel || undefined,
        masteryLevel: editingTask.masteryLevel || undefined,
        understandingLevel: editingTask.understandingLevel || undefined,
        activityType: editingTask.activityType || 'OPERATIONAL',
        activityName: editingTask.activityName || '',
        periodicity: editingTask.periodicity || 'WEEKLY',
        hrTimesheetId: editingTask.hrTimesheetId || 'no-timesheet',
      })

      // Initialiser la catégorie et l'activité depuis le catalogue
      if (editingTask.activityName && catalog.length > 0) {
        const catalogItem = catalog.find((item: any) => item.name === editingTask.activityName)
        if (catalogItem) {
          setSelectedCategory(catalogItem.category)
          setSelectedCatalogId(catalogItem.id)
        }
      }
    } else {
      resetForm()
    }
  }, [editingTask, catalog])

  const loadInitialData = async () => {
    try {
      await Promise.allSettled([loadProjects(), loadAvailableTimesheets(), loadActivityCatalog()])
    } catch (error) {
      console.error('Erreur lors du chargement des données initiales:', error)
    }
  }

  const loadProjects = useCallback(async () => {
    try {
      const result = await getMyProjects({})
      if (result?.data) {
        setProjects(result.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error)
    }
  }, [])

  const loadAvailableTimesheets = useCallback(async () => {
    try {
      const result = await getAvailableHRTimesheetsForTask()
      if (result?.data) {
        setAvailableTimesheets(result.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des timesheets:', error)
    }
  }, [])

  const loadActivityCatalog = useCallback(async () => {
    try {
      const [catalogResult, categoriesResult] = await Promise.all([
        getActivityCatalog({}),
        getActivityCategories(),
      ])
      if (catalogResult?.data) {
        setCatalog(catalogResult.data)
      }
      if (categoriesResult?.data) {
        setCategories(categoriesResult.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement du catalogue d'activités:", error)
    }
  }, [])

  const loadAvailableUsers = useCallback(async (projectId?: string) => {
    try {
      const result = await getAvailableUsersForSharing({
        projectId: projectId === 'no-project' ? undefined : projectId,
      })
      if (result?.data) {
        setAvailableUsers(result.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    }
  }, [])

  const getTypeFromCategory = (category: string): 'OPERATIONAL' | 'REPORTING' => {
    return category === 'Reporting' ? 'REPORTING' : 'OPERATIONAL'
  }

  const filteredCatalogActivities = useMemo(() => {
    return selectedCategory ? catalog.filter((item: any) => item.category === selectedCategory) : []
  }, [selectedCategory, catalog])

  const handleCatalogItemSelect = (catalogId: string) => {
    setSelectedCatalogId(catalogId)
    const catalogItem = catalog.find((c: any) => c.id === catalogId)
    if (catalogItem) {
      setFormData({
        ...formData,
        activityName: catalogItem.name,
        activityType: getTypeFromCategory(catalogItem.category),
        periodicity: catalogItem.defaultPeriodicity || formData.periodicity,
      })
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingTask) {
        const result = await updateTask({
          id: editingTask.id,
          name: formData.name,
          description: formData.description,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          reminderDate: formData.reminderDate ? new Date(formData.reminderDate) : undefined,
          reminderTime: formData.reminderTime || undefined,
          soundEnabled: formData.soundEnabled,
        })

        if (result?.data) {
          toast.success('Tâche mise à jour !')
          onSuccess()
          onOpenChange(false)
        } else {
          toast.error(result?.serverError || 'Erreur')
        }
      } else {
        const result = await createTask({
          name: formData.name,
          description: formData.description,
          projectId:
            formData.projectId === 'no-project' ? undefined : formData.projectId || undefined,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          reminderDate: formData.reminderDate ? new Date(formData.reminderDate) : undefined,
          reminderTime: formData.reminderTime || undefined,
          soundEnabled: formData.soundEnabled,
          isShared: formData.isShared,
          sharedWith: formData.isShared ? selectedUsers : undefined,
          status: formData.status as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED',
          priority: formData.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
          complexity: formData.complexity as 'FAIBLE' | 'MOYEN' | 'ELEVE',
          trainingLevel: formData.trainingLevel,
          masteryLevel: formData.masteryLevel,
          understandingLevel: formData.understandingLevel,
          hrTimesheetId:
            formData.hrTimesheetId === 'no-timesheet'
              ? undefined
              : formData.hrTimesheetId || undefined,
          activityType: formData.activityType || undefined,
          activityName: formData.activityName || undefined,
          periodicity: formData.periodicity || undefined,
        })

        if (result?.data) {
          toast.success('Tâche créée !')
          if (formData.isShared && selectedUsers.length > 0) {
            toast.success(`Tâche partagée avec ${selectedUsers.length} utilisateur(s)`)
          }
          onSuccess()
          onOpenChange(false)
        } else {
          toast.error(result?.serverError || 'Erreur')
        }
      }
    } catch (_error) {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      projectId: 'no-project',
      estimatedHours: '',
      dueDate: '',
      reminderDate: '',
      reminderTime: '',
      soundEnabled: true,
      isShared: false,
      status: 'TODO',
      priority: 'MEDIUM',
      complexity: 'MOYEN',
      trainingLevel: undefined,
      masteryLevel: undefined,
      understandingLevel: undefined,
      hrTimesheetId: 'no-timesheet',
      activityType: 'OPERATIONAL',
      activityName: '',
      periodicity: 'WEEKLY',
    })
    setSelectedUsers([])
    setSelectedCategory('')
    setSelectedCatalogId('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {editingTask
              ? 'Modifiez les informations de la tâche'
              : 'Créez une nouvelle tâche pour votre projet'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="text-xs sm:text-sm">
              Détails
            </TabsTrigger>
            <TabsTrigger value="comments" disabled={!editingTask} className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Commentaires</span>
              <span className="sm:hidden">💬</span>
              {editingTask && editingTask._count?.TaskComment > 0 && (
                <span className="ml-1">({editingTask._count.TaskComment})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" disabled={!editingTask} className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Historique</span>
              <span className="sm:hidden">📜</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingTask && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="project">Projet</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, projectId: value })
                        loadAvailableUsers(value)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un projet (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-project">Aucun projet</SelectItem>
                        {projects
                          .filter((project) => project.id)
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hrTimesheet">Feuille de temps RH (optionnel)</Label>
                    <Select
                      value={formData.hrTimesheetId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, hrTimesheetId: value })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Lier à une feuille de temps..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-timesheet">Aucune feuille de temps</SelectItem>
                        {availableTimesheets
                          .filter((timesheet) => timesheet.id)
                          .map((timesheet) => (
                            <SelectItem key={timesheet.id} value={timesheet.id}>
                              📅 Semaine du{' '}
                              {new Date(timesheet.weekStartDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                              {' au '}
                              {new Date(timesheet.weekEndDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}{' '}
                              ({timesheet.status === 'DRAFT' ? 'Brouillon' : 'En attente'})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      💡 Liez cette tâche à une feuille de temps RH pour suivre votre activité
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nom de la tâche *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Développement API REST"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails de la tâche..."
                  rows={3}
                />
              </div>

              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Informations activité RH (optionnel)</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs sm:text-sm">
                      Catégorie
                    </Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => {
                        setSelectedCategory(value)
                        setSelectedCatalogId('')
                        const activityType = getTypeFromCategory(value)
                        setFormData({
                          ...formData,
                          activityType,
                          activityName: '',
                        })
                      }}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((category) => category)
                          .map((category, index) => (
                            <SelectItem key={`${category}-${index}`} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activityName" className="text-xs sm:text-sm">
                      Nom de l'activité
                    </Label>
                    <Select
                      value={selectedCatalogId}
                      onValueChange={handleCatalogItemSelect}
                      disabled={!selectedCategory}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue
                          placeholder={
                            selectedCategory
                              ? 'Sélectionner une activité'
                              : "Sélectionnez d'abord une catégorie"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {filteredCatalogActivities
                          .filter((item: any) => item.id)
                          .map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodicity" className="text-xs sm:text-sm">
                      Périodicité
                    </Label>
                    <Select
                      value={formData.periodicity}
                      onValueChange={(value) => setFormData({ ...formData, periodicity: value })}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Périodicité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Quotidien</SelectItem>
                        <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                        <SelectItem value="MONTHLY">Mensuel</SelectItem>
                        <SelectItem value="PUNCTUAL">Ponctuel</SelectItem>
                        <SelectItem value="WEEKLY_MONTHLY">Hebdo/Mensuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedCatalogId && (
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Type d'activité (auto)</Label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={formData.activityType === 'OPERATIONAL' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {formData.activityType === 'OPERATIONAL' ? 'Opérationnel' : 'Reporting'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Basé sur la catégorie sélectionnée
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs sm:text-sm">
                    Statut
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue placeholder="Sélectionnez le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">À faire</SelectItem>
                      <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                      <SelectItem value="REVIEW">Revue</SelectItem>
                      <SelectItem value="DONE">Terminé</SelectItem>
                      <SelectItem value="BLOCKED">Bloqué</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-xs sm:text-sm">
                    Priorité
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue placeholder="Sélectionnez la priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Basse</SelectItem>
                      <SelectItem value="MEDIUM">Moyenne</SelectItem>
                      <SelectItem value="HIGH">Haute</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours" className="text-xs sm:text-sm">
                    Estimation (heures)
                  </Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    placeholder="Ex: 40"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-xs sm:text-sm">
                    Date d'échéance
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderDate" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Date de rappel
                </Label>
                <Input
                  id="reminderDate"
                  type="date"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="reminderTime" className="text-xs sm:text-sm">
                    Heure du rappel
                  </Label>
                  <Input
                    id="reminderTime"
                    type="time"
                    value={formData.reminderTime}
                    onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                    required={!!formData.reminderDate}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="soundEnabled"
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    {formData.soundEnabled ? (
                      <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                    Notification sonore
                  </Label>
                  <div className="flex items-center h-10 px-3 border rounded-md">
                    <Checkbox
                      id="soundEnabled"
                      checked={formData.soundEnabled}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, soundEnabled: checked as boolean })
                      }
                    />
                    <label
                      htmlFor="soundEnabled"
                      className="ml-2 text-xs sm:text-sm cursor-pointer"
                    >
                      {formData.soundEnabled ? 'Activé' : 'Désactivé'}
                    </label>
                  </div>
                </div>
              </div>

              {formData.reminderDate && formData.reminderTime && (
                <p className="text-xs text-muted-foreground">
                  Vous serez notifié le{' '}
                  {new Date(formData.reminderDate).toLocaleDateString('fr-FR')} à{' '}
                  {formData.reminderTime}
                  {formData.soundEnabled && ' avec un son de notification'}
                </p>
              )}

              <div className="space-y-2 border-t pt-4">
                <TaskComplexitySelector
                  value={formData.complexity as any}
                  onValueChange={(value) => setFormData({ ...formData, complexity: value })}
                />
              </div>

              {!editingTask && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isShared"
                      checked={formData.isShared}
                      onCheckedChange={(checked) => {
                        const isChecked = checked as boolean
                        setFormData({ ...formData, isShared: isChecked })
                        if (isChecked && availableUsers.length === 0) {
                          loadAvailableUsers(
                            formData.projectId === 'no-project' ? undefined : formData.projectId,
                          )
                        } else if (!isChecked) {
                          setAvailableUsers([])
                          setSelectedUsers([])
                        }
                      }}
                    />
                    <Label htmlFor="isShared" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Partager cette tâche avec d'autres utilisateurs
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Partager avec :</Label>
                    <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                      {availableUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Aucun utilisateur disponible pour le partage
                        </p>
                      ) : (
                        availableUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent ${
                              selectedUsers.includes(user.id) ? 'bg-accent' : ''
                            }`}
                          >
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => toggleUserSelection(user.id)}
                            />
                            <UserAvatar
                              name={user.name}
                              avatar={user.image || user.avatar}
                              size="sm"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            <Badge variant="outline">{user.role}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                    {selectedUsers.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selectedUsers.length} utilisateur(s) sélectionné(s)
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      Enregistrement...
                    </span>
                  ) : editingTask ? (
                    'Mettre à jour'
                  ) : (
                    'Créer'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            {editingTask && currentUserId && (
              <TaskComments taskId={editingTask.id} currentUserId={currentUserId} />
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            {editingTask && <TaskActivityTimeline taskId={editingTask.id} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
