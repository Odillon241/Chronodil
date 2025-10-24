"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
  activities: Activity[];
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

  const getActivityTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "OPERATIONAL" ? "default" : "secondary"}>
        {type === "OPERATIONAL" ? "Opérationnel" : "Reporting"}
      </Badge>
    );
  };

  const getPeriodicityLabel = (periodicity: string) => {
    const labels: Record<string, string> = {
      DAILY: "Quotidien",
      WEEKLY: "Hebdomadaire",
      MONTHLY: "Mensuel",
      PUNCTUAL: "Ponctuel",
      WEEKLY_MONTHLY: "Hebdo/Mensuel",
    };
    return labels[periodicity] || periodicity;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Chargement...</p>
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
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Validation impossible</h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium">Ce timesheet ne peut pas être validé</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Statut actuel: {getStatusBadge(timesheet.status)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const validationLevel = timesheet.status === "PENDING" ? "Manager" : "Admin/Odillon";

  const groupedActivities = timesheet.activities.reduce((acc, activity) => {
    const category = activity.ActivityCatalog?.category || "Autres";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Validation {validationLevel} - Feuille de temps RH
          </h1>
          <p className="text-muted-foreground">
            Semaine du {format(new Date(timesheet.weekStartDate), "dd/MM/yyyy", { locale: fr })}
            {" - "}
            {format(new Date(timesheet.weekEndDate), "dd/MM/yyyy", { locale: fr })}
          </p>
        </div>
        {getStatusBadge(timesheet.status)}
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'employé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Employé</p>
              <p className="font-medium">{timesheet.employeeName}</p>
              {timesheet.User && (
                <p className="text-sm text-muted-foreground">{timesheet.User.email}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Poste</p>
              <p className="font-medium">{timesheet.position}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Site</p>
              <p className="font-medium">{timesheet.site}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total heures</p>
              <p className="text-2xl font-bold text-primary">{timesheet.totalHours.toFixed(1)}h</p>
            </div>
          </div>

          {timesheet.employeeObservations && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium mb-2">Observations de l'employé</p>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                  {timesheet.employeeObservations}
                </p>
              </div>
            </>
          )}

          {timesheet.managerComments && timesheet.status === "MANAGER_APPROVED" && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium mb-2">Commentaires du manager</p>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                  {timesheet.managerComments}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Détail des activités */}
      <Card>
        <CardHeader>
          <CardTitle>Activités ({timesheet.activities.length})</CardTitle>
          <CardDescription>
            Vérifiez le détail des activités avant validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timesheet.activities.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-600" />
              <p className="text-muted-foreground">Aucune activité enregistrée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Vous ne devriez peut-être pas valider un timesheet sans activités
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([category, activities]) => (
                <div key={category}>
                  <h3 className="font-semibold mb-3 text-primary">{category}</h3>
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          {getActivityTypeBadge(activity.activityType)}
                          <Badge variant="outline">
                            {getPeriodicityLabel(activity.periodicity)}
                          </Badge>
                          <Badge variant={activity.status === "COMPLETED" ? "default" : "secondary"}>
                            {activity.status === "COMPLETED" ? "Terminé" : "En cours"}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">{activity.activityName}</h4>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Période: </span>
                            <span>
                              {format(new Date(activity.startDate), "dd/MM/yyyy", { locale: fr })}
                              {" → "}
                              {format(new Date(activity.endDate), "dd/MM/yyyy", { locale: fr })}
                            </span>
                          </div>
                          <div className="font-bold text-primary text-lg">
                            {activity.totalHours}h
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Total */}
              <Card className="bg-primary/10 border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">Total heures déclarées</p>
                    <p className="text-3xl font-bold text-primary">
                      {timesheet.totalHours.toFixed(1)}h
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire de validation */}
      <Card>
        <CardHeader>
          <CardTitle>Décision de validation</CardTitle>
          <CardDescription>
            Approuvez ou rejetez ce timesheet avec un commentaire optionnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comments">Commentaires (optionnel pour approbation, requis pour rejet)</Label>
              <Textarea
                id="comments"
                placeholder="Ajoutez vos remarques ou commentaires..."
                rows={4}
                {...register("comments")}
              />
              {errors.comments && (
                <p className="text-sm text-destructive">{errors.comments.message}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setShowApproveDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approuver
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog de confirmation d'approbation */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'approbation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir approuver ce timesheet ? Cette action notifiera l'employé
              {timesheet.status === "PENDING" && " et enverra le timesheet pour validation finale."}
              {timesheet.status === "MANAGER_APPROVED" && " et marquera le timesheet comme définitivement approuvé."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit(handleApprove)}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmer l'approbation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation de rejet */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le rejet</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir rejeter ce timesheet ? L'employé devra le corriger et le soumettre à nouveau.
              Assurez-vous d'avoir fourni un commentaire expliquant la raison du rejet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit(handleReject)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirmer le rejet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
