"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, XCircle, Edit, FileText, Download, Clock, User, Briefcase, MapPin, Activity, Calendar, CheckCircle, Info, History } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
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
        const byteCharacters = atob(result.data.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: result.data.mimeType });

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
      if (timesheet?.status === "PENDING") {
        result = await managerApproveHRTimesheet({
          timesheetId,
          action: "approve",
          comments: data.comments,
        });
      } else if (timesheet?.status === "MANAGER_APPROVED") {
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
      if (timesheet?.status === "PENDING") {
        result = await managerApproveHRTimesheet({
          timesheetId,
          action: "reject",
          comments: data.comments,
        });
      } else if (timesheet?.status === "MANAGER_APPROVED") {
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
      <div className="flex items-center justify-center p-20">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!timesheet) return null;

  const canValidateTimesheet = canValidate && (timesheet.status === "PENDING" || timesheet.status === "MANAGER_APPROVED");

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Button variant="ghost" size="sm" className="-ml-3 h-8 text-muted-foreground" onClick={() => router.push('/dashboard/hr-timesheet')}>
              <ArrowLeft className="mr-2 h-3 w-3" />
              Retour
            </Button>
            <span>/</span>
            <span>Détails</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="bg-primary/10 p-2 rounded-lg"><Calendar className="h-6 w-6 text-primary" /></span>
            Feuille du {format(new Date(timesheet.weekStartDate), "dd MMM", { locale: fr })}
            <span className="text-muted-foreground mx-1">-</span>
            {format(new Date(timesheet.weekEndDate), "dd MMM yyyy", { locale: fr })}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge(timesheet.status)}
            <span className="text-sm text-muted-foreground ml-2 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Mis à jour il y a quelques instants
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Actions Toolbar */}
          {timesheet.status === "DRAFT" && (
            <>
              <Button onClick={handleSubmitTimesheet} className="shadow-sm">
                <FileText className="h-4 w-4 mr-2" />
                Soumettre
              </Button>
              <Button variant="outline" size="icon" onClick={() => router.push(`/dashboard/hr-timesheet/${timesheetId}/edit`)}>
                <Edit className="h-4 w-4" />
              </Button>
            </>
          )}
          {canValidateTimesheet && (
            <div className="flex gap-2 bg-muted/40 p-1 rounded-md border">
              <Button size="sm" onClick={() => setShowApproveDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-none h-8">
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Approuver
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowRejectDialog(true)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8">
                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Rejeter
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting} className="h-9">
            {isExporting ? <Spinner className="h-3 w-3 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Export
          </Button>
        </div>
      </div>

      {/* Top Info Section in a Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Employee Card */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4" /> Informations Employé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-dashed">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {timesheet.employeeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{timesheet.employeeName}</div>
                <div className="text-xs text-muted-foreground">{timesheet.User_HRTimesheet_userIdToUser?.email || "Email non disponible"}</div>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Poste</span>
                <span className="text-sm font-medium text-right ml-4">{timesheet.position}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Site</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{timesheet.site}</span>
                </div>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Total Heures</span>
                <Badge variant="default" className="text-sm font-mono">{timesheet.totalHours} h</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observations Card */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Info className="h-4 w-4" /> Observations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timesheet.employeeObservations ? (
              <p className="text-sm text-foreground/80 italic bg-muted/30 p-3 rounded-md border min-h-[80px]">
                "{timesheet.employeeObservations}"
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center h-[100px] text-muted-foreground text-sm italic border border-dashed rounded-md bg-muted/10">
                Aucune observation saisie.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation History / Timeline */}
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4" /> Historique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative border-l border-muted pl-4 ml-1 space-y-4">
              {timesheet.odillonSignedAt && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-background" />
                  <div className="text-sm font-medium">Validation Finale</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(timesheet.odillonSignedAt), "d MMM yyyy", { locale: fr })}
                  </div>
                  <div className="text-xs text-muted-foreground">{timesheet.User_HRTimesheet_odillonSignedByIdToUser?.name || "Admin"}</div>
                </div>
              )}

              {timesheet.managerSignedAt && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-background" />
                  <div className="text-sm font-medium">Validation Manager</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(timesheet.managerSignedAt), "d MMM yyyy", { locale: fr })}
                  </div>
                  <div className="text-xs text-muted-foreground">{timesheet.User_HRTimesheet_managerSignedByIdToUser?.name || "Manager"}</div>
                </div>
              )}

              {timesheet.employeeSignedAt && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400 ring-4 ring-background" />
                  <div className="text-sm font-medium">Soumission</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(timesheet.employeeSignedAt), "d MMM yyyy", { locale: fr })}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-muted border border-border ring-4 ring-background" />
                <div className="text-sm font-medium text-muted-foreground">Création</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Activities Section - Full Width */}
      <div className="space-y-6">
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Activités Réalisées</CardTitle>
              </div>
              <Badge variant="secondary" className="font-normal">
                {timesheet.HRActivity.length} entrées
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <HRTimesheetActivitiesTable
              activities={timesheet.HRActivity}
              onDelete={timesheet.status === "DRAFT" ? handleDeleteActivity : undefined}
              showActions={timesheet.status === "DRAFT"}
            />
          </CardContent>
        </Card>

        {/* Rejection Info Block */}
        {timesheet.status === "REJECTED" && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-md p-4 flex gap-4">
            <XCircle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <h3 className="font-medium text-destructive">Feuille de temps rejetée</h3>
              <p className="text-sm text-destructive/80 mt-1">
                {(timesheet.managerComments || timesheet.odillonComments) || "Aucun motif spécifié."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'approbation</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action validera la feuille de temps et la transmettra à l'étape suivante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleSubmit(handleApprove)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="approve-comments">Commentaire (Facultatif)</Label>
              <Textarea
                id="approve-comments"
                placeholder="Ex: RAS, validé..."
                className="resize-none"
                {...register("comments")}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button" onClick={() => reset()}>Annuler</AlertDialogCancel>
              <AlertDialogAction type="submit" className="bg-emerald-600 hover:bg-emerald-700">Approuver</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter la feuille de temps</AlertDialogTitle>
            <AlertDialogDescription>
              La feuille sera renvoyée à l'employé pour correction. Un motif est obligatoire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleSubmit(handleReject)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reject-comments">Motif du rejet <span className="text-destructive">*</span></Label>
              <Textarea
                id="reject-comments"
                placeholder="Ex: Heures incorrectes le mardi..."
                className="resize-none"
                {...register("comments")}
              />
              {errors.comments && <p className="text-xs text-destructive">{errors.comments.message}</p>}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button" onClick={() => reset()}>Annuler</AlertDialogCancel>
              <AlertDialogAction type="submit" className="bg-destructive hover:bg-destructive/90">Rejeter</AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
