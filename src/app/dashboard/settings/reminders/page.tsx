'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Bell,
  Clock,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  FileText,
  CheckSquare,
  ClipboardList,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import {
  getUserReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
  migrateOldReminders,
} from '@/actions/user-reminder.actions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Enum défini localement car Prisma n'est pas accessible dans les composants client
const ReminderActivityType = {
  TIMESHEET: 'TIMESHEET',
  HR_TIMESHEET: 'HR_TIMESHEET',
  TASK: 'TASK',
  CUSTOM: 'CUSTOM',
} as const
type ReminderActivityType = (typeof ReminderActivityType)[keyof typeof ReminderActivityType]

// =======================================
// Types et Schémas
// =======================================

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Lun' },
  { value: 'TUESDAY', label: 'Mar' },
  { value: 'WEDNESDAY', label: 'Mer' },
  { value: 'THURSDAY', label: 'Jeu' },
  { value: 'FRIDAY', label: 'Ven' },
  { value: 'SATURDAY', label: 'Sam' },
  { value: 'SUNDAY', label: 'Dim' },
] as const

const ACTIVITY_TYPES = [
  {
    value: ReminderActivityType.TIMESHEET,
    label: 'Feuille de temps',
    icon: FileText,
    description: 'Rappel pour saisir vos heures',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  },
  {
    value: ReminderActivityType.HR_TIMESHEET,
    label: 'Feuilles RH',
    icon: ClipboardList,
    description: 'Rappel pour valider les feuilles',
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  },
  {
    value: ReminderActivityType.TASK,
    label: 'Tâches',
    icon: CheckSquare,
    description: 'Rappel pour vos tâches',
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  },
  {
    value: ReminderActivityType.CUSTOM,
    label: 'Personnalisé',
    icon: Sparkles,
    description: 'Rappel personnalisé',
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  },
]

const reminderFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  activityType: z.nativeEnum(ReminderActivityType),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format invalide'),
  days: z.array(z.string()).min(1, 'Sélectionnez au moins un jour'),
})

type ReminderFormData = z.infer<typeof reminderFormSchema>

interface UserReminderData {
  id: string
  name: string
  activityType: ReminderActivityType
  time: string
  days: string[]
  isEnabled: boolean
  createdAt: Date
}

// =======================================
// Composant Principal
// =======================================

export default function ReminderPreferencesPage() {
  const [reminders, setReminders] = useState<UserReminderData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<UserReminderData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      name: '',
      activityType: 'TIMESHEET',
      time: '17:00',
      days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    },
  })

  const selectedDays = watch('days') || []
  const selectedActivityType = watch('activityType')

  // Charger les rappels
  const loadReminders = async () => {
    try {
      setIsLoading(true)
      const result = await getUserReminders({})
      if (result?.data) {
        setReminders(result.data as UserReminderData[])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rappels:', error)
      toast.error('Erreur lors du chargement des rappels')
    } finally {
      setIsLoading(false)
    }
  }

  // Migration des anciens rappels
  const handleMigration = async () => {
    try {
      const result = await migrateOldReminders({})
      if (result?.data?.migrated) {
        toast.success('Vos anciens rappels ont été migrés !')
        loadReminders()
      }
    } catch (error) {
      console.error('Erreur lors de la migration:', error)
    }
  }

  useEffect(() => {
    loadReminders()
    handleMigration()
  }, [])

  // Ouvrir le dialog pour créer
  const openCreateDialog = () => {
    setEditingReminder(null)
    reset({
      name: '',
      activityType: 'TIMESHEET',
      time: '17:00',
      days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    })
    setIsDialogOpen(true)
  }

  // Ouvrir le dialog pour éditer
  const openEditDialog = (reminder: UserReminderData) => {
    setEditingReminder(reminder)
    reset({
      name: reminder.name,
      activityType: reminder.activityType,
      time: reminder.time,
      days: reminder.days,
    })
    setIsDialogOpen(true)
  }

  // Soumettre le formulaire
  const onSubmit = async (data: ReminderFormData) => {
    setIsSaving(true)
    try {
      if (editingReminder) {
        const result = await updateReminder({
          id: editingReminder.id,
          ...data,
          days: data.days as (
            | 'MONDAY'
            | 'TUESDAY'
            | 'WEDNESDAY'
            | 'THURSDAY'
            | 'FRIDAY'
            | 'SATURDAY'
            | 'SUNDAY'
          )[],
        })
        if (result?.data?.success) {
          toast.success('Rappel modifié !')
          loadReminders()
          setIsDialogOpen(false)
        }
      } else {
        const result = await createReminder({
          ...data,
          days: data.days as (
            | 'MONDAY'
            | 'TUESDAY'
            | 'WEDNESDAY'
            | 'THURSDAY'
            | 'FRIDAY'
            | 'SATURDAY'
            | 'SUNDAY'
          )[],
        })
        if (result?.data?.success) {
          toast.success('Rappel créé !')
          loadReminders()
          setIsDialogOpen(false)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  // Supprimer un rappel
  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      const result = await deleteReminder({ id })
      if (result?.data?.success) {
        toast.success('Rappel supprimé')
        loadReminders()
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(null)
    }
  }

  // Toggle un rappel
  const handleToggle = async (id: string) => {
    try {
      const result = await toggleReminder({ id })
      if (result?.data?.success) {
        loadReminders()
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la modification')
    }
  }

  // Toggle un jour
  const handleDayToggle = (day: string, checked: boolean) => {
    const current = selectedDays
    if (checked) {
      setValue('days', [...current, day])
    } else {
      setValue(
        'days',
        current.filter((d) => d !== day),
      )
    }
  }

  // Obtenir les infos d'un type d'activité
  const getActivityInfo = (type: ReminderActivityType) => {
    return ACTIVITY_TYPES.find((t) => t.value === type) || ACTIVITY_TYPES[0]
  }

  // Formatage des jours
  const formatDays = (days: string[]) => {
    if (days.length === 7) return 'Tous les jours'
    if (days.length === 5 && !days.includes('SATURDAY') && !days.includes('SUNDAY')) {
      return 'Jours ouvrés'
    }
    return days.map((d) => DAYS_OF_WEEK.find((w) => w.value === d)?.label).join(', ')
  }

  // =======================================
  // Rendu
  // =======================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-6" />
          <p className="text-muted-foreground">Chargement des rappels...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mes Rappels</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configurez vos rappels pour différentes activités
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un rappel
        </Button>
      </div>

      {/* Information */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-sm font-semibold text-primary/90">
          Comment ça marche ?
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1">
          Les rappels vous envoient des notifications aux heures et jours configurés.
          <Link
            href="/dashboard/settings/notifications"
            className="inline-flex items-center gap-1 ml-1 text-primary hover:underline font-medium"
          >
            Configurer les notifications
            <ExternalLink className="h-3 w-3" />
          </Link>
        </AlertDescription>
      </Alert>

      {/* Liste des rappels */}
      {reminders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun rappel configuré</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Créez votre premier rappel pour ne jamais oublier de saisir vos heures ou de gérer vos
              tâches.
            </p>
            <Button onClick={openCreateDialog} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Créer un rappel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reminders.map((reminder) => {
            const activityInfo = getActivityInfo(reminder.activityType)
            const Icon = activityInfo.icon

            return (
              <Card
                key={reminder.id}
                className={cn('transition-all duration-200', !reminder.isEnabled && 'opacity-60')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', activityInfo.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-medium leading-tight">
                          {reminder.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {activityInfo.label}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={reminder.isEnabled}
                      onCheckedChange={() => handleToggle(reminder.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{reminder.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="truncate">{formatDays(reminder.days)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => openEditDialog(reminder)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(reminder.id)}
                      disabled={isDeleting === reminder.id}
                    >
                      {isDeleting === reminder.id ? (
                        <Spinner className="h-3.5 w-3.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de création/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingReminder ? 'Modifier le rappel' : 'Nouveau rappel'}</DialogTitle>
            <DialogDescription>
              {editingReminder
                ? 'Modifiez les paramètres de votre rappel'
                : 'Configurez un nouveau rappel personnalisé'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom du rappel</Label>
              <Input id="name" placeholder="Ex: Rappel feuille de temps" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* Type d'activité */}
            <div className="space-y-2">
              <Label>Type d'activité</Label>
              <Select
                value={selectedActivityType}
                onValueChange={(value) => setValue('activityType', value as ReminderActivityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Heure */}
            <div className="space-y-2">
              <Label>Heure du rappel</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={watch('time').split(':')[0]}
                  onValueChange={(hour) => {
                    const [_, min] = watch('time').split(':')
                    setValue('time', `${hour}:${min}`, { shouldDirty: true })
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[70px]">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0')
                      return (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground font-medium">:</span>
                <Select
                  value={watch('time').split(':')[1]}
                  onValueChange={(min) => {
                    const [hour, _] = watch('time').split(':')
                    setValue('time', `${hour}:${min}`, { shouldDirty: true })
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[70px]">
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(
                      (min) => (
                        <SelectItem key={min} value={min}>
                          {min}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <Clock className="h-4 w-4 text-muted-foreground ml-1" />
              </div>
              {errors.time && <p className="text-xs text-destructive">{errors.time.message}</p>}
            </div>

            {/* Jours */}
            <div className="space-y-2">
              <Label>Jours de rappel</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.value}
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer transition-all text-sm font-medium',
                      selectedDays.includes(day.value)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    <Checkbox
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={(checked) => handleDayToggle(day.value, !!checked)}
                      className="sr-only"
                    />
                    {day.label}
                  </label>
                ))}
              </div>
              {errors.days && <p className="text-xs text-destructive">{errors.days.message}</p>}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Spinner className="mr-2" />
                    Sauvegarde...
                  </>
                ) : editingReminder ? (
                  'Enregistrer'
                ) : (
                  'Créer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
