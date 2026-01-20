'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  User,
  Briefcase,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  getHRTimesheet,
  managerApproveHRTimesheet,
  odillonApproveHRTimesheet,
} from '@/actions/hr-timesheet.actions'
import { useRouter, useParams } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { HRTimesheetActivitiesTable } from '@/components/hr-timesheet/hr-timesheet-activities-table'

const validationSchema = z.object({
  comments: z.string().optional(),
})

type ValidationInput = z.infer<typeof validationSchema>

interface Activity {
  id: string
  activityType: string
  activityName: string
  description?: string
  periodicity: string
  startDate: Date
  endDate: Date
  totalHours: number
  status: string
  ActivityCatalog?: {
    name: string
    category: string
  } | null
}

interface Timesheet {
  id: string
  weekStartDate: Date
  weekEndDate: Date
  employeeName: string
  position: string
  site: string
  totalHours: number
  status: string
  employeeSignedAt?: Date | null
  managerSignedAt?: Date | null
  odillonSignedAt?: Date | null
  employeeObservations?: string | null
  managerComments?: string | null
  odillonComments?: string | null
  User?: {
    name: string
    email: string
  }
  ManagerSigner?: {
    name: string
  } | null
  OdillonSigner?: {
    name: string
  } | null
  HRActivity: Activity[]
}

export default function ValidateHRTimesheetPage() {
  const router = useRouter()
  const params = useParams()
  const timesheetId = params.id as string

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidationInput>({
    resolver: zodResolver(validationSchema),
  })

  useEffect(() => {
    loadTimesheet()
  }, [timesheetId])

  const loadTimesheet = async () => {
    try {
      setIsLoading(true)
      const result = await getHRTimesheet({ timesheetId })

      if (result?.data) {
        setTimesheet(result.data as Timesheet)
      } else {
        toast.error('Timesheet non trouvé')
        router.push('/dashboard/hr-timesheet')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
      router.push('/dashboard/hr-timesheet')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (data: ValidationInput) => {
    try {
      let result

      // Déterminer quelle action utiliser selon le statut
      if (timesheet?.status === 'PENDING') {
        // Validation manager
        result = await managerApproveHRTimesheet({
          timesheetId,
          action: 'approve',
          comments: data.comments,
        })
      } else if (timesheet?.status === 'MANAGER_APPROVED') {
        // Validation Odillon/Admin
        result = await odillonApproveHRTimesheet({
          timesheetId,
          action: 'approve',
          comments: data.comments,
        })
      }

      if (result?.data) {
        toast.success('Timesheet approuvé avec succès !')
        router.push('/dashboard/hr-timesheet')
      } else {
        toast.error(result?.serverError || "Erreur lors de l'approbation")
      }
    } catch (_error) {
      toast.error("Erreur lors de l'approbation")
    }
  }

  const handleReject = async (data: ValidationInput) => {
    if (!data.comments || data.comments.trim() === '') {
      toast.error('Veuillez fournir un commentaire pour le rejet')
      return
    }

    try {
      let result

      // Déterminer quelle action utiliser selon le statut
      if (timesheet?.status === 'PENDING') {
        // Rejet manager
        result = await managerApproveHRTimesheet({
          timesheetId,
          action: 'reject',
          comments: data.comments,
        })
      } else if (timesheet?.status === 'MANAGER_APPROVED') {
        // Rejet Odillon/Admin
        result = await odillonApproveHRTimesheet({
          timesheetId,
          action: 'reject',
          comments: data.comments,
        })
      }

      if (result?.data) {
        toast.success('Timesheet rejeté')
        router.push('/dashboard/hr-timesheet')
      } else {
        toast.error(result?.serverError || 'Erreur lors du rejet')
      }
    } catch (_error) {
      toast.error('Erreur lors du rejet')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      DRAFT: { variant: 'outline', label: 'Brouillon' },
      PENDING: { variant: 'secondary', label: 'En attente validation manager' },
      MANAGER_APPROVED: { variant: 'default', label: 'En attente validation finale' },
      APPROVED: { variant: 'default', label: 'Approuvé' },
      REJECTED: { variant: 'destructive', label: 'Rejeté' },
    }

    const config = variants[status] || variants.DRAFT
    return (
      <Badge variant={config.variant} className="rounded-full px-3">
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-muted-foreground">Chargement des données de validation...</p>
        </div>
      </div>
    )
  }

  if (!timesheet) {
    return null
  }

  const canValidate = timesheet.status === 'PENDING' || timesheet.status === 'MANAGER_APPROVED'
  const validationLevel = timesheet.status === 'PENDING' ? 'Manager' : 'Finale (Admin)'

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/dashboard/hr-timesheet/${timesheetId}`)}
            className="h-9 w-9 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Validation {validationLevel}</h1>
              {getStatusBadge(timesheet.status)}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              Semaine du {format(new Date(timesheet.weekStartDate), 'dd MMMM', { locale: fr })} au{' '}
              {format(new Date(timesheet.weekEndDate), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>
        {/* Actions rapides en header (optionnel) ou statut */}
      </div>

      {!canValidate && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <div className="flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                Validation impossible
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Ce timesheet n'est pas en attente de votre validation (Statut : {timesheet.status})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Grid Info - 3 Colonnes comme le détail */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Carte Employé */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3 pt-5 border-b bg-muted/20">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4" /> Informations Employé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                {timesheet.employeeName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{timesheet.employeeName}</p>
                {timesheet.User && (
                  <p className="text-xs text-muted-foreground truncate">{timesheet.User.email}</p>
                )}
              </div>
            </div>
            <div className="space-y-3 pt-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" /> Poste
                </span>
                <span className="font-medium">{timesheet.position}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> Site
                </span>
                <span className="font-medium">{timesheet.site}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte Résumé Heures et Activités */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3 pt-5 border-b bg-muted/20">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4" /> Résumé Période
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center justify-center h-48 space-y-4">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold tracking-tighter text-foreground">
                {timesheet.totalHours}h
              </span>
              <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                Total Heures
              </span>
            </div>
            <Separator className="w-1/3" />
            <div className="flex items-center gap-4 text-sm">
              <div className="flex flex-col items-center">
                <span className="font-bold">
                  {timesheet.HRActivity.filter((a) => a.activityType === 'OPERATIONAL').length}
                </span>
                <span className="text-muted-foreground text-xs">Opérationnelles</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex flex-col items-center">
                <span className="font-bold">
                  {timesheet.HRActivity.filter((a) => a.activityType === 'REPORTING').length}
                </span>
                <span className="text-muted-foreground text-xs">Reporting</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte Observations Employé */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3 pt-5 border-b bg-muted/20">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Observations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 h-48 overflow-y-auto">
            {timesheet.employeeObservations ? (
              <div className="bg-muted/30 p-3 rounded-md border border-border/50 text-sm leading-relaxed text-muted-foreground italic">
                "{timesheet.employeeObservations}"
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic text-center py-10">
                Aucune observation de l'employé.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Activities Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Détail des activités</h2>
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <HRTimesheetActivitiesTable activities={timesheet.HRActivity} showActions={false} />
          </CardContent>
        </Card>
      </div>

      {/* Zone de Validation (Si applicable) */}
      {canValidate && (
        <Card className="border-primary/20 shadow-md bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <CardTitle className="text-lg">Décision de validation</CardTitle>
            <CardDescription>
              Veuillez examiner les informations ci-dessus avant de prendre une décision.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            {/* Section Commentaire */}
            <div className="space-y-3">
              <Label htmlFor="comments" className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Vos commentaires
              </Label>
              <Textarea
                id="comments"
                {...register('comments')}
                placeholder="Ajoutez un commentaire (obligatoire en cas de rejet)..."
                className="min-h-[120px] resize-none"
              />
              {errors.comments && (
                <p className="text-sm text-destructive">{errors.comments.message}</p>
              )}
            </div>

            {/* Section Actions */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                <h4 className="font-medium mb-1 text-sm">Validation du Timesheet</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  En validant, vous confirmez l'exactitude des heures et activités déclarées. En cas
                  de rejet, le timesheet sera renvoyé à l'employé pour correction.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all group"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <ThumbsDown className="h-6 w-6 text-muted-foreground group-hover:text-destructive transition-colors" />
                    <span className="font-semibold">Rejeter</span>
                  </Button>
                  <Button
                    className="h-auto py-4 flex flex-col gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-900/20 transition-all group"
                    onClick={() => setShowApproveDialog(true)}
                  >
                    <ThumbsUp className="h-6 w-6" />
                    <span className="font-semibold">Approuver</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs de Confirmation */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'approbation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir approuver ce timesheet ? Cette action est irréversible et
              notifiera l'employé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit(handleApprove)}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le rejet</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir rejeter ce timesheet ? L'employé devra effectuer des
              corrections.
              <br />
              <br />
              <span className="font-medium text-destructive">
                Un commentaire expliquant le motif est requis.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit(handleReject)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Rejeter le timesheet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
