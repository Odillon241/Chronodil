"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, XCircle, Edit, FileText, Download, Clock, User, Briefcase, MapPin, Activity, Calendar, CheckCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HRTimesheetActivitiesTable } from "@/components/hr-timesheet/hr-timesheet-activities-table";
import {
  getHRTimesheet,
  deleteHRActivity,
  submitHRTimesheet,
  managerApproveHRTimesheet,
  odillonApproveHRTimesheet,
} from "@/actions/hr-timesheet.actions";
import { exportHRTimesheetToExcel } from "@/actions/hr-timesheet-export.actions";
import { useRouter, useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/features/back-button";
import { useSession } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  User_HRTimesheet_userIdToUser?: {
    name: string;
    email: string;
  };
  User_HRTimesheet_managerSignedByIdToUser?: {
    name: string;
  } | null;
  User_HRTimesheet_odillonSignedByIdToUser?: {
    name: string;
  } | null;
  HRActivity: Activity[];
}

const validationSchema = z.object({
  comments: z.string().optional(),
});

type ValidationInput = z.infer<typeof validationSchema>;

export default function HRTimesheetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const timesheetId = params.id as string;
  const { data: session } = useSession() as any;
  const userRole = session?.user?.role;
  const canValidate = userRole === "MANAGER" || userRole === "DIRECTEUR" || userRole === "ADMIN";

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Supprimer cette activité ?")) return;

    try {
      const result = await deleteHRActivity({
        timesheetId,
        activityId,
      });

      if (result?.data) {
        toast.success("Activité supprimée");
        loadTimesheet();
      } else {
        toast.error(result?.serverError || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSubmitTimesheet = async () => {
    if (!confirm("Soumettre ce timesheet pour validation ?")) return;

    try {
      const result = await submitHRTimesheet({ timesheetId });
      if (result?.data) {
        toast.success("Timesheet soumis avec succès !");
        loadTimesheet();
      } else {
        toast.error(result?.serverError || "Erreur lors de la soumission");
      }
    } catch (error: any) {
      toast.error(error.message || String(error) || "Erreur lors de la soumission");
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      toast.info("Génération du fichier Excel en cours...");

      const result = await exportHRTimesheetToExcel({ timesheetId });

      if (result?.data) {
        // Convertir base64 en blob
        const byteCharacters = atob(result.data.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: result.data.mimeType });

        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Fichier Excel téléchargé avec succès !");
      } else {
        toast.error(result?.serverError || "Erreur lors de l'export");
      }
    } catch (error) {
      console.error("Erreur export:", error);
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setIsExporting(false);
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
        reset();
        loadTimesheet();
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
        reset();
        loadTimesheet();
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
      PENDING: { variant: "secondary", label: "En attente" },
      MANAGER_APPROVED: { variant: "default", label: "Validé Manager" },
      APPROVED: { variant: "default", label: "Approuvé" },
      REJECTED: { variant: "destructive", label: "Rejeté" },
    };

    const config = variants[status] || variants.DRAFT;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-6" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!timesheet) {
    return null;
  }

  const canValidateTimesheet = canValidate && (timesheet.status === "PENDING" || timesheet.status === "MANAGER_APPROVED");

  return (
    <div className="flex flex-col gap-6">
      {/* Bouton retour */}
      <BackButton />

      {/* Header amélioré */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Feuille de temps RH
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Semaine du {format(new Date(timesheet.weekStartDate), "dd/MM/yyyy", { locale: fr })}
                {" - "}
                {format(new Date(timesheet.weekEndDate), "dd/MM/yyyy", { locale: fr })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {getStatusBadge(timesheet.status)}
          {timesheet.status === "DRAFT" && (
            <>
              <Button
                onClick={handleSubmitTimesheet}
                className="bg-primary hover:bg-primary"
              >
                <FileText className="h-4 w-4 mr-2" />
                Soumettre pour validation
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push(`/dashboard/hr-timesheet/${timesheetId}/edit`)}
                title="Modifier"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </>
          )}
          {canValidateTimesheet && (
            <>
              <Button
                onClick={() => setShowApproveDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approuver
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleExportExcel}
            disabled={isExporting}
            title="Exporter Excel"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="w-[200px] font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Employé
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{timesheet.employeeName}</p>
                      {timesheet.User_HRTimesheet_userIdToUser && (
                        <p className="text-sm text-muted-foreground">{timesheet.User_HRTimesheet_userIdToUser.email}</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Poste
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold">{timesheet.position}</p>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Site
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold">{timesheet.site}</p>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      Nombre d'activités
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {timesheet.HRActivity.length} {timesheet.HRActivity.length === 1 ? "activité" : "activités"}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
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
        </CardContent>
      </Card>

      {timesheet.status === "REJECTED" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Timesheet rejeté</p>
                {(timesheet.managerComments || timesheet.odillonComments) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Raison: {timesheet.managerComments || timesheet.odillonComments}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des activités en tableau */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activités</CardTitle>
              <CardDescription>
                Détail des activités réalisées durant la semaine
              </CardDescription>
            </div>
            {timesheet.status === "DRAFT" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/hr-timesheet/${timesheetId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Gérer les activités
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <HRTimesheetActivitiesTable
            activities={timesheet.HRActivity}
            onDelete={timesheet.status === "DRAFT" ? handleDeleteActivity : undefined}
            showActions={timesheet.status === "DRAFT"}
          />
        </CardContent>
      </Card>

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
          <form onSubmit={handleSubmit(handleApprove)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approve-comments" className="text-sm font-medium">
                Commentaires (optionnel)
              </Label>
              <Textarea
                id="approve-comments"
                placeholder="Ajoutez vos remarques ou commentaires..."
                rows={4}
                className="resize-none"
                {...register("comments")}
              />
              {errors.comments && (
                <p className="text-xs sm:text-sm text-destructive mt-1">{errors.comments.message}</p>
              )}
            </div>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto m-0" onClick={() => reset()}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                type="submit"
                className="w-full sm:w-auto"
              >
                Confirmer l'approbation
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
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
          <form onSubmit={handleSubmit(handleReject)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-comments" className="text-sm font-medium">
                Commentaire de rejet *
              </Label>
              <Textarea
                id="reject-comments"
                placeholder="Expliquez pourquoi vous rejetez cette feuille de temps..."
                rows={4}
                className="resize-none"
                {...register("comments")}
              />
              {errors.comments && (
                <p className="text-xs sm:text-sm text-destructive mt-1">{errors.comments.message}</p>
              )}
            </div>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto m-0" onClick={() => reset()}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                type="submit"
                className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
              >
                Confirmer le rejet
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
