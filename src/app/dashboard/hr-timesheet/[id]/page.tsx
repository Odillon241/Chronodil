"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, XCircle, Edit, FileText, Download, Clock, User, Briefcase, MapPin, Activity, Calendar } from "lucide-react";
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
} from "@/actions/hr-timesheet.actions";
import { exportHRTimesheetToExcel } from "@/actions/hr-timesheet-export.actions";
import { useRouter, useParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";

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

export default function HRTimesheetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const timesheetId = params.id as string;

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleSubmit = async () => {
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

      if (result?.data?.data) {
        // Convertir base64 en blob
        const byteCharacters = atob(result.data.data.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: result.data.data.mimeType });

        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.data.fileName;
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
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!timesheet) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header amélioré */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
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
                onClick={handleSubmit}
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
                      {timesheet.User && (
                        <p className="text-sm text-muted-foreground">{timesheet.User.email}</p>
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
                        {timesheet.activities.length} {timesheet.activities.length === 1 ? "activité" : "activités"}
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
            activities={timesheet.activities}
            onDelete={timesheet.status === "DRAFT" ? handleDeleteActivity : undefined}
            showActions={timesheet.status === "DRAFT"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
