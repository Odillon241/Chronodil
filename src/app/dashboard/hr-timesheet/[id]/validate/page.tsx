"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock, User, Briefcase, MapPin, Mail } from "lucide-react";
import { BackButton } from "@/components/features/back-button";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getHRTimesheet,
  managerApproveHRTimesheet,
  odillonApproveHRTimesheet,
} from "@/actions/hr-timesheet.actions";
import { useRouter, useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HRTimesheetActivitiesTable } from "@/components/hr-timesheet/hr-timesheet-activities-table";

const validationSchema = z.object({
  comments: z.string().optional(),
});

type ValidationInput = z.infer<typeof validationSchema>;

interface Activity {
  id: string;
  activityType: string;
  activityName: string;
  description?: string;
  periodicity: string;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  status: string;
  ActivityCatalog?: {
    name: string;
    category: string;
  } | null;
}

interface Timesheet {
  id: string;
  weekStartDate: Date;
  weekEndDate: Date;
  employeeName: string;
  position: string;
  site: string;
  totalHours: number;
  status: string;
  employeeSignedAt?: Date | null;
  managerSignedAt?: Date | null;
  odillonSignedAt?: Date | null;
  employeeObservations?: string | null;
  managerComments?: string | null;
  odillonComments?: string | null;
  User?: {
    name: string;
    email: string;
  };
  ManagerSigner?: {
    name: string;
  } | null;
  OdillonSigner?: {
    name: string;
  } | null;
  HRActivity: Activity[];
}

export default function ValidateHRTimesheetPage() {
  const router = useRouter();
  const params = useParams();
  const timesheetId = params.id as string;

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValidationInput>({
    resolver: zodResolver(validationSchema),
  });

  useEffect(() => {
    loadTimesheet();
  }, [timesheetId]);

  const loadTimesheet = async () => {
    try {
      setIsLoading(true);
      const result = await getHRTimesheet({ timesheetId });

      if (result?.data) {
        setTimesheet(result.data as Timesheet);
      } else {
        toast.error("Timesheet non trouvé");
        router.push("/dashboard/hr-timesheet");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement");
      router.push("/dashboard/hr-timesheet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (data: ValidationInput) => {
    try {
      let result;

      // Déterminer quelle action utiliser selon le statut
      if (timesheet?.status === "PENDING") {
        // Validation manager
        result = await managerApproveHRTimesheet({
          timesheetId,
          action: "approve",
          comments: data.comments,
        });
      } else if (timesheet?.status === "MANAGER_APPROVED") {
        // Validation Odillon/Admin
        result = await odillonApproveHRTimesheet({
          timesheetId,
          action: "approve",
          comments: data.comments,
        });
      }

      if (result?.data) {
        toast.success("Timesheet approuvé avec succès !");
        router.push("/dashboard/hr-timesheet");
      } else {
        toast.error(result?.serverError || "Erreur lors de l'approbation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleReject = async (data: ValidationInput) => {
    if (!data.comments || data.comments.trim() === "") {
      toast.error("Veuillez fournir un commentaire pour le rejet");
      return;
    }

    try {
      let result;

      // Déterminer quelle action utiliser selon le statut
      if (timesheet?.status === "PENDING") {
        // Rejet manager
        result = await managerApproveHRTimesheet({
          timesheetId,
          action: "reject",
          comments: data.comments,
        });
      } else if (timesheet?.status === "MANAGER_APPROVED") {
        // Rejet Odillon/Admin
        result = await odillonApproveHRTimesheet({
          timesheetId,
          action: "reject",
          comments: data.comments,
        });
      }

      if (result?.data) {
        toast.success("Timesheet rejeté");
        router.push("/dashboard/hr-timesheet");
      } else {
        toast.error(result?.serverError || "Erreur lors du rejet");
      }
    } catch (error) {
      toast.error("Erreur lors du rejet");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      DRAFT: { variant: "outline", label: "Brouillon" },
      PENDING: { variant: "secondary", label: "En attente validation manager" },
      MANAGER_APPROVED: { variant: "default", label: "En attente validation finale" },
      APPROVED: { variant: "default", label: "Approuvé" },
      REJECTED: { variant: "destructive", label: "Rejeté" },
    };

    const config = variants[status] || variants.DRAFT;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-6 w-6" />
          <p className="text-sm sm:text-base text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!timesheet) {
    return null;
  }

  // Vérifier si le timesheet peut être validé
  const canValidate = timesheet.status === "PENDING" || timesheet.status === "MANAGER_APPROVED";

  if (!canValidate) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Validation impossible</h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">Ce timesheet ne peut pas être validé</p>
                <div className="mt-2">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Statut actuel:</p>
                  {getStatusBadge(timesheet.status)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const validationLevel = timesheet.status === "PENDING" ? "Manager" : "Admin/Odillon";

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Bouton retour */}
      <BackButton />

      {/* Header avec boutons de validation */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Validation {validationLevel} - Feuille de temps RH
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Semaine du {format(new Date(timesheet.weekStartDate), "dd/MM/yyyy", { locale: fr })}
              {" - "}
              {format(new Date(timesheet.weekEndDate), "dd/MM/yyyy", { locale: fr })}
            </p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            {getStatusBadge(timesheet.status)}
          </div>
        </div>
        
        {/* Boutons de validation rapide */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 border-t">
          <Button
            type="button"
            onClick={() => setShowApproveDialog(true)}
            className="w-full sm:flex-1 shadow-sm"
            size="lg"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approuver
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
            className="w-full sm:flex-1 shadow-sm"
            size="lg"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter
          </Button>
        </div>
      </div>

      {/* Informations générales */}
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Informations de l'employé</h2>
          <Separator />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Employé</span>
            </div>
            <p className="text-sm sm:text-base font-semibold leading-tight">{timesheet.employeeName}</p>
            {timesheet.User && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{timesheet.User.email}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>Poste</span>
            </div>
            <p className="text-sm sm:text-base font-semibold leading-tight">{timesheet.position}</p>
          </div>
          <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Site</span>
            </div>
            <p className="text-sm sm:text-base font-semibold leading-tight">{timesheet.site}</p>
          </div>
          <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-lg border bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>Total heures</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary leading-tight">{timesheet.totalHours.toFixed(1)}h</p>
          </div>
        </div>

        {(timesheet.employeeObservations || (timesheet.managerComments && timesheet.status === "MANAGER_APPROVED")) && (
          <div className="mt-4 sm:mt-6 space-y-4">
            {timesheet.employeeObservations && (
              <div className="space-y-2 p-3 sm:p-4 rounded-lg border bg-muted/50">
                <p className="text-xs sm:text-sm font-semibold text-foreground">Observations de l'employé</p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {timesheet.employeeObservations}
                </p>
              </div>
            )}
            {timesheet.managerComments && timesheet.status === "MANAGER_APPROVED" && (
              <div className="space-y-2 p-3 sm:p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <p className="text-xs sm:text-sm font-semibold text-foreground">Commentaires du manager</p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {timesheet.managerComments}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Détail des activités */}
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Activités déclarées</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Vérifiez le détail des activités avant validation
            </p>
          </div>
          <Separator />
        </div>
        
        {timesheet.HRActivity.length === 0 ? (
          <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg bg-muted/30">
            <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-amber-600" />
            <p className="text-sm sm:text-base font-medium text-foreground">Aucune activité enregistrée</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Vous ne devriez peut-être pas valider un timesheet sans activités
            </p>
          </div>
        ) : (
          <>
            <HRTimesheetActivitiesTable
              activities={timesheet.HRActivity}
              showActions={false}
            />
            
            {/* Total des heures */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 rounded-md bg-primary/10">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total heures déclarées</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground mt-0.5">
                      {timesheet.totalHours.toFixed(1)}h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Formulaire de validation */}
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Décision de validation</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Approuvez ou rejetez ce timesheet avec un commentaire optionnel
            </p>
          </div>
          <Separator />
        </div>
        
        <form className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium">
              Commentaires
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Optionnel pour approbation, requis pour rejet
            </p>
            <Textarea
              id="comments"
              placeholder="Ajoutez vos remarques ou commentaires..."
              rows={4}
              className="resize-none"
              {...register("comments")}
            />
            {errors.comments && (
              <p className="text-xs sm:text-sm text-destructive mt-1">{errors.comments.message}</p>
            )}
          </div>
        </form>
      </div>

      {/* Dialog de confirmation d'approbation */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Confirmer l'approbation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Êtes-vous sûr de vouloir approuver ce timesheet ? Cette action notifiera l'employé
              {timesheet.status === "PENDING" && " et enverra le timesheet pour validation finale."}
              {timesheet.status === "MANAGER_APPROVED" && " et marquera le timesheet comme définitivement approuvé."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto m-0">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit(handleApprove)}
              className="w-full sm:w-auto"
            >
              Confirmer l'approbation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation de rejet */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Confirmer le rejet</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Êtes-vous sûr de vouloir rejeter ce timesheet ? L'employé devra le corriger et le soumettre à nouveau.
              Assurez-vous d'avoir fourni un commentaire expliquant la raison du rejet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto m-0">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit(handleReject)}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              Confirmer le rejet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
