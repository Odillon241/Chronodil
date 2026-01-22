'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Bell,
  Volume2,
  VolumeX,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
  ChevronDown,
  FileText,
  Calendar,
  Briefcase,
  Settings,
  ClipboardList,
  MessageSquare,
  History,
} from 'lucide-react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
import { cn } from '@/lib/utils'

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

// Types pour les etapes du wizard
type WizardStep = 'essential' | 'planning' | 'hr-activity' | 'options'

interface StepConfig {
  id: WizardStep
  title: string
  description: string
  icon: React.ReactNode
  required: boolean
}

const WIZARD_STEPS: StepConfig[] = [
  {
    id: 'essential',
    title: 'Essentiel',
    description: 'Informations de base',
    icon: <FileText className="h-4 w-4" />,
    required: true,
  },
  {
    id: 'planning',
    title: 'Planification',
    description: 'Dates et priorites',
    icon: <Calendar className="h-4 w-4" />,
    required: false,
  },
  {
    id: 'hr-activity',
    title: 'Activite RH',
    description: 'Categorisation RH',
    icon: <Briefcase className="h-4 w-4" />,
    required: false,
  },
  {
    id: 'options',
    title: 'Options',
    description: 'Parametres avances',
    icon: <Settings className="h-4 w-4" />,
    required: false,
  },
]

interface TaskDialogV2Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTask?: any
  currentUserId?: string
  onSuccess: () => void
}

// Composant StepIndicator - Style Breadcrumb moderne
function StepIndicator({
  steps,
  currentStep,
  onStepClick,
  completedSteps,
}: {
  steps: StepConfig[]
  currentStep: WizardStep
  onStepClick: (step: WizardStep) => void
  completedSteps: Set<WizardStep>
}) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="w-full mb-6">
      {/* Desktop version - Breadcrumb style */}
      <nav aria-label="Étapes du formulaire" className="hidden sm:block">
        <ol className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border/50">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id)
            const isCurrent = step.id === currentStep
            const isPast = index < currentIndex

            return (
              <React.Fragment key={step.id}>
                <li className="flex-1">
                  <button
                    type="button"
                    onClick={() => onStepClick(step.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                      isCurrent && 'bg-primary text-primary-foreground shadow-sm',
                      isCompleted &&
                        !isCurrent &&
                        'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20',
                      !isCurrent &&
                        !isCompleted &&
                        'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    )}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {/* Indicateur numéro/check */}
                    <span
                      className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 transition-all',
                        isCurrent && 'bg-primary-foreground/20 text-primary-foreground',
                        isCompleted && !isCurrent && 'bg-green-500 text-white',
                        !isCurrent &&
                          !isCompleted &&
                          'bg-muted-foreground/20 text-muted-foreground',
                      )}
                    >
                      {isCompleted && !isCurrent ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    {/* Titre */}
                    <span className="text-sm font-medium truncate">{step.title}</span>
                    {/* Indicateur obligatoire */}
                    {step.required && !isCompleted && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                  </button>
                </li>
                {/* Chevron séparateur */}
                {index < steps.length - 1 && (
                  <li aria-hidden="true" className="shrink-0">
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-colors',
                        isPast || isCompleted ? 'text-green-500' : 'text-muted-foreground/40',
                      )}
                    />
                  </li>
                )}
              </React.Fragment>
            )
          })}
        </ol>
      </nav>

      {/* Mobile version - Pills compactes */}
      <div className="sm:hidden">
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id)
            const isCurrent = step.id === currentStep

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick(step.id)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  isCurrent && 'w-8 bg-primary',
                  isCompleted && !isCurrent && 'w-4 bg-green-500',
                  !isCurrent && !isCompleted && 'w-4 bg-muted-foreground/30',
                )}
                aria-label={`Étape ${index + 1}: ${step.title}`}
              />
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-2 text-center">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {currentIndex + 1}
          </span>
          <div>
            <p className="text-sm font-medium">{steps.find((s) => s.id === currentStep)?.title}</p>
            <p className="text-[10px] text-muted-foreground">
              Étape {currentIndex + 1} sur {steps.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant CollapsibleSection pour le mode edition
function CollapsibleSection({
  title,
  description,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string
  description?: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center justify-between w-full p-4 text-left transition-colors',
            'hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
            isOpen && 'border-b',
          )}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <h4 className="text-sm font-medium">{title}</h4>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
        <div className="p-4 space-y-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function TaskDialogV2({
  open,
  onOpenChange,
  editingTask,
  currentUserId,
  onSuccess,
}: TaskDialogV2Props) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('essential')
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())

  // Form state
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
    trainingLevel: undefined as string | undefined,
    masteryLevel: undefined as string | undefined,
    understandingLevel: undefined as string | undefined,
    hrTimesheetId: 'no-timesheet',
    activityType: 'OPERATIONAL',
    activityName: '',
    periodicity: 'WEEKLY',
  })

  // Determiner si on est en mode creation ou edition
  const isEditMode = !!editingTask

  // Charger les donnees initiales
  useEffect(() => {
    if (open) {
      loadInitialData()
      // Reset wizard au mode creation
      if (!editingTask) {
        setCurrentStep('essential')
        setCompletedSteps(new Set())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Initialiser le formulaire avec les donnees de la tache a editer
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

      // Initialiser la categorie et l'activite depuis le catalogue
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
      console.error('Erreur lors du chargement des donnees initiales:', error)
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
      console.error("Erreur lors du chargement du catalogue d'activites:", error)
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

  // Validation de l'etape essentielle
  const isEssentialStepValid = useMemo(() => {
    return formData.name.trim().length > 0
  }, [formData.name])

  // Navigation du wizard
  const goToNextStep = () => {
    const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep)
    if (currentIndex < WIZARD_STEPS.length - 1) {
      // Marquer l'etape actuelle comme complete
      setCompletedSteps((prev) => new Set([...prev, currentStep]))
      setCurrentStep(WIZARD_STEPS[currentIndex + 1].id)
    }
  }

  const goToPreviousStep = () => {
    const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentIndex - 1].id)
    }
  }

  const handleStepClick = (step: WizardStep) => {
    // Permettre la navigation libre entre les etapes
    setCurrentStep(step)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!isEssentialStepValid) {
      toast.error('Veuillez remplir le nom de la tache')
      setCurrentStep('essential')
      return
    }

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
          toast.success('Tache mise a jour !')
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
          trainingLevel: formData.trainingLevel as
            | 'NONE'
            | 'BASIC'
            | 'INTERMEDIATE'
            | 'ADVANCED'
            | 'EXPERT'
            | undefined,
          masteryLevel: formData.masteryLevel as
            | 'NOVICE'
            | 'BEGINNER'
            | 'INTERMEDIATE'
            | 'ADVANCED'
            | 'EXPERT'
            | undefined,
          understandingLevel: formData.understandingLevel as
            | 'NONE'
            | 'SUPERFICIAL'
            | 'WORKING'
            | 'COMPREHENSIVE'
            | 'EXPERT'
            | undefined,
          hrTimesheetId:
            formData.hrTimesheetId === 'no-timesheet'
              ? undefined
              : formData.hrTimesheetId || undefined,
          activityType: formData.activityType || undefined,
          activityName: formData.activityName || undefined,
          periodicity: formData.periodicity || undefined,
        })

        if (result?.data) {
          toast.success('Tache creee !')
          if (formData.isShared && selectedUsers.length > 0) {
            toast.success(`Tache partagee avec ${selectedUsers.length} utilisateur(s)`)
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
    setCurrentStep('essential')
    setCompletedSteps(new Set())
  }

  // Rendu de l'etape Essentiel
  const renderEssentialStep = () => (
    <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5 duration-300">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-1">
          Nom de la tache <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Developpement API REST"
          required
          autoFocus
          aria-required="true"
          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Details de la tache..."
          rows={3}
          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project">Projet</Label>
        <Select
          value={formData.projectId}
          onValueChange={(value) => {
            setFormData({ ...formData, projectId: value })
            loadAvailableUsers(value)
          }}
        >
          <SelectTrigger aria-label="Selectionner un projet">
            <SelectValue placeholder="Selectionnez un projet (optionnel)" />
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
    </div>
  )

  // Rendu de l'etape Planification
  const renderPlanningStep = () => (
    <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5 duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger aria-label="Selectionner le statut">
              <SelectValue placeholder="Selectionnez le statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">A faire</SelectItem>
              <SelectItem value="IN_PROGRESS">En cours</SelectItem>
              <SelectItem value="REVIEW">Revue</SelectItem>
              <SelectItem value="DONE">Termine</SelectItem>
              <SelectItem value="BLOCKED">Bloque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priorite</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger aria-label="Selectionner la priorite">
              <SelectValue placeholder="Selectionnez la priorite" />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimatedHours">Estimation (heures)</Label>
          <Input
            id="estimatedHours"
            type="number"
            step="0.5"
            min="0"
            value={formData.estimatedHours}
            onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
            placeholder="Ex: 40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Date d'echeance</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Rappels
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reminderDate">Date de rappel</Label>
            <Input
              id="reminderDate"
              type="date"
              value={formData.reminderDate}
              onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminderTime">Heure du rappel</Label>
            <Input
              id="reminderTime"
              type="time"
              value={formData.reminderTime}
              onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
              required={!!formData.reminderDate}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="soundEnabled"
            checked={formData.soundEnabled}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, soundEnabled: checked as boolean })
            }
          />
          <Label htmlFor="soundEnabled" className="flex items-center gap-2 cursor-pointer">
            {formData.soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            Notification sonore {formData.soundEnabled ? 'activee' : 'desactivee'}
          </Label>
        </div>

        {formData.reminderDate && formData.reminderTime && (
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
            Vous serez notifie le {new Date(formData.reminderDate).toLocaleDateString('fr-FR')} a{' '}
            {formData.reminderTime}
            {formData.soundEnabled && ' avec un son de notification'}
          </p>
        )}
      </div>
    </div>
  )

  // Rendu de l'etape Activite RH
  const renderHRActivityStep = () => (
    <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5 duration-300">
      <div className="space-y-2">
        <Label htmlFor="hrTimesheet">Feuille de temps RH</Label>
        <Select
          value={formData.hrTimesheetId}
          onValueChange={(value) => setFormData({ ...formData, hrTimesheetId: value })}
        >
          <SelectTrigger aria-label="Lier a une feuille de temps">
            <SelectValue placeholder="Lier a une feuille de temps..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-timesheet">Aucune feuille de temps</SelectItem>
            {availableTimesheets
              .filter((timesheet) => timesheet.id)
              .map((timesheet) => (
                <SelectItem key={timesheet.id} value={timesheet.id}>
                  Semaine du{' '}
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
          Liez cette tache a une feuille de temps RH pour suivre votre activite
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categorie</Label>
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
            <SelectTrigger aria-label="Selectionner une categorie">
              <SelectValue placeholder="Categorie" />
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
          <Label htmlFor="activityName">Nom de l'activite</Label>
          <Select
            value={selectedCatalogId}
            onValueChange={handleCatalogItemSelect}
            disabled={!selectedCategory}
          >
            <SelectTrigger aria-label="Selectionner une activite">
              <SelectValue
                placeholder={
                  selectedCategory
                    ? 'Selectionner une activite'
                    : "Selectionnez d'abord une categorie"
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
          <Label htmlFor="periodicity">Periodicite</Label>
          <Select
            value={formData.periodicity}
            onValueChange={(value) => setFormData({ ...formData, periodicity: value })}
          >
            <SelectTrigger aria-label="Selectionner la periodicite">
              <SelectValue placeholder="Periodicite" />
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
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Type d'activite:</span>
          <Badge variant={formData.activityType === 'OPERATIONAL' ? 'default' : 'secondary'}>
            {formData.activityType === 'OPERATIONAL' ? 'Operationnel' : 'Reporting'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            (base sur la categorie selectionnee)
          </span>
        </div>
      )}
    </div>
  )

  // Rendu de l'etape Options
  const renderOptionsStep = () => (
    <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-5 duration-300">
      <TaskComplexitySelector
        value={formData.complexity as any}
        onValueChange={(value) => setFormData({ ...formData, complexity: value })}
      />

      <Separator />

      <div className="space-y-4">
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
            Partager cette tache avec d'autres utilisateurs
          </Label>
        </div>

        {formData.isShared && (
          <Card className="animate-in fade-in-50 slide-in-from-top-2 duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Partager avec</CardTitle>
              <CardDescription className="text-xs">
                Selectionnez les utilisateurs avec qui partager cette tache
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {availableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Aucun utilisateur disponible pour le partage
                  </p>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                        'hover:bg-accent',
                        selectedUsers.includes(user.id) && 'bg-accent',
                      )}
                      onClick={() => toggleUserSelection(user.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleUserSelection(user.id)
                        }
                      }}
                      aria-pressed={selectedUsers.includes(user.id)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                        aria-label={`Partager avec ${user.name}`}
                      />
                      <UserAvatar name={user.name} avatar={user.image || user.avatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {user.role}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
              {selectedUsers.length > 0 && (
                <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                  {selectedUsers.length} utilisateur(s) selectionne(s)
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  // Rendu du contenu du wizard (mode creation)
  const renderWizardContent = () => {
    switch (currentStep) {
      case 'essential':
        return renderEssentialStep()
      case 'planning':
        return renderPlanningStep()
      case 'hr-activity':
        return renderHRActivityStep()
      case 'options':
        return renderOptionsStep()
      default:
        return null
    }
  }

  // Rendu du mode edition avec sections collapsibles
  const renderEditMode = () => (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details" className="text-xs sm:text-sm gap-1">
          <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Details</span>
        </TabsTrigger>
        <TabsTrigger value="comments" className="text-xs sm:text-sm gap-1">
          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Commentaires</span>
          {editingTask?._count?.TaskComment > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {editingTask._count.TaskComment}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="activity" className="text-xs sm:text-sm gap-1">
          <History className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Historique</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section Informations de base - toujours ouverte */}
          <CollapsibleSection
            title="Informations de base"
            description="Nom, description et projet"
            icon={<FileText className="h-4 w-4" />}
            defaultOpen={true}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="flex items-center gap-1">
                  Nom de la tache <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Developpement API REST"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details de la tache..."
                  rows={3}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Section Planification */}
          <CollapsibleSection
            title="Planification"
            description="Dates, estimation et rappels"
            icon={<Calendar className="h-4 w-4" />}
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-estimatedHours">Estimation (heures)</Label>
                  <Input
                    id="edit-estimatedHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    placeholder="Ex: 40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-dueDate">Date d'echeance</Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-reminderDate" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Date de rappel
                  </Label>
                  <Input
                    id="edit-reminderDate"
                    type="date"
                    value={formData.reminderDate}
                    onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-reminderTime">Heure du rappel</Label>
                  <Input
                    id="edit-reminderTime"
                    type="time"
                    value={formData.reminderTime}
                    onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                    required={!!formData.reminderDate}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-soundEnabled"
                  checked={formData.soundEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, soundEnabled: checked as boolean })
                  }
                />
                <Label
                  htmlFor="edit-soundEnabled"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {formData.soundEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  Notification sonore
                </Label>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section Activite RH */}
          <CollapsibleSection
            title="Activite RH"
            description="Categorisation et periodicite"
            icon={<Briefcase className="h-4 w-4" />}
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Categorie" />
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
                  <Label>Nom de l'activite</Label>
                  <Select
                    value={selectedCatalogId}
                    onValueChange={handleCatalogItemSelect}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={selectedCategory ? 'Activite' : 'Categorie requise'}
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
                  <Label>Periodicite</Label>
                  <Select
                    value={formData.periodicity}
                    onValueChange={(value) => setFormData({ ...formData, periodicity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Periodicite" />
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
            </div>
          </CollapsibleSection>

          {/* Section Options */}
          <CollapsibleSection
            title="Options avancees"
            description="Complexite et parametres"
            icon={<Settings className="h-4 w-4" />}
            defaultOpen={false}
          >
            <TaskComplexitySelector
              value={formData.complexity as any}
              onValueChange={(value) => setFormData({ ...formData, complexity: value })}
            />
          </CollapsibleSection>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Enregistrement...
                </span>
              ) : (
                'Mettre a jour'
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
  )

  // Rendu du mode creation (wizard)
  const renderCreateMode = () => {
    const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep)
    const isFirstStep = currentIndex === 0
    const isLastStep = currentIndex === WIZARD_STEPS.length - 1

    return (
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <StepIndicator
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          completedSteps={completedSteps}
        />

        <div className="min-h-[300px]">{renderWizardContent()}</div>

        {/* Navigation du wizard */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            {!isFirstStep && (
              <Button
                type="button"
                variant="ghost"
                onClick={goToPreviousStep}
                className="w-full sm:w-auto gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Precedent
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {!isLastStep ? (
              <Button
                type="button"
                onClick={goToNextStep}
                disabled={currentStep === 'essential' && !isEssentialStepValid}
                className="w-full sm:w-auto gap-1"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || !isEssentialStepValid}
                className="w-full sm:w-auto gap-1"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Creation...
                  </span>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Creer la tache
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Bouton de creation rapide (visible sauf sur la derniere etape) */}
        {!isLastStep && isEssentialStepValid && (
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {isSubmitting ? 'Creation en cours...' : 'Creer directement sans continuer'}
            </Button>
          </div>
        )}
      </form>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto',
          'animate-in fade-in-0 zoom-in-95 duration-200',
        )}
        aria-describedby="task-dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            {isEditMode ? (
              <>
                <ClipboardList className="h-5 w-5" />
                Modifier la tache
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                Nouvelle tache
              </>
            )}
          </DialogTitle>
          <DialogDescription id="task-dialog-description" className="text-xs sm:text-sm">
            {isEditMode
              ? 'Modifiez les informations de la tache'
              : 'Creez une nouvelle tache en suivant les etapes'}
          </DialogDescription>
        </DialogHeader>

        {isEditMode ? renderEditMode() : renderCreateMode()}
      </DialogContent>
    </Dialog>
  )
}
