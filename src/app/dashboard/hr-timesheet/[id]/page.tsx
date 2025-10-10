"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Edit, FileText, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
    } catch (error) {
      toast.error("Erreur lors de la soumission");
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
            Feuille de temps RH - Semaine du{" "}
            {format(new Date(timesheet.weekStartDate), "dd/MM/yyyy", { locale: fr })}
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(timesheet.weekStartDate), "dd/MM/yyyy", { locale: fr })}
            {" - "}
            {format(new Date(timesheet.weekEndDate), "dd/MM/yyyy", { locale: fr })}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportExcel}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Export en cours..." : "Exporter Excel"}
        </Button>
        {getStatusBadge(timesheet.status)}
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
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
              <p className="text-2xl font-bold text-rusty-red">{timesheet.totalHours.toFixed(1)}h</p>
            </div>
          </div>

          {timesheet.employeeObservations && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium mb-2">Observations de l'employé</p>
                <p className="text-sm text-muted-foreground">{timesheet.employeeObservations}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Signatures et validation */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow de validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Signature employé */}
            <div className="flex items-start gap-4">
              <div className={`mt-1 ${timesheet.employeeSignedAt ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">1. Signature employé</p>
                {timesheet.employeeSignedAt ? (
                  <p className="text-sm text-muted-foreground">
                    Signé le {format(new Date(timesheet.employeeSignedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">En attente de signature</p>
                )}
              </div>
            </div>

            {/* Validation manager */}
            <div className="flex items-start gap-4">
              <div className={`mt-1 ${timesheet.managerSignedAt ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">2. Validation manager</p>
                {timesheet.managerSignedAt ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Validé le {format(new Date(timesheet.managerSignedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                      {timesheet.ManagerSigner && ` par ${timesheet.ManagerSigner.name}`}
                    </p>
                    {timesheet.managerComments && (
                      <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                        Commentaires: {timesheet.managerComments}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">En attente de validation</p>
                )}
              </div>
            </div>

            {/* Validation Odillon/Admin */}
            <div className="flex items-start gap-4">
              <div className={`mt-1 ${timesheet.odillonSignedAt ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">3. Approbation finale (Odillon/Admin)</p>
                {timesheet.odillonSignedAt ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Approuvé le {format(new Date(timesheet.odillonSignedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                      {timesheet.OdillonSigner && ` par ${timesheet.OdillonSigner.name}`}
                    </p>
                    {timesheet.odillonComments && (
                      <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                        Commentaires: {timesheet.odillonComments}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">En attente d'approbation</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions selon le statut */}
          {timesheet.status === "DRAFT" && (
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleSubmit}
                className="bg-rusty-red hover:bg-ou-crimson"
              >
                <FileText className="h-4 w-4 mr-2" />
                Soumettre pour validation
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/hr-timesheet/${timesheetId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          )}

          {timesheet.status === "REJECTED" && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des activités */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activités ({timesheet.activities.length})</CardTitle>
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
          {timesheet.activities.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Aucune activité enregistrée</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([category, activities]) => (
                <div key={category}>
                  <h3 className="font-semibold mb-3 text-rusty-red">{category}</h3>
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
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
                              <div className="font-semibold text-rusty-red">
                                {activity.totalHours}h
                              </div>
                            </div>
                          </div>
                          {timesheet.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteActivity(activity.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Total */}
              <Card className="bg-rusty-red/10 border-rusty-red">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-lg">Total heures</p>
                    <p className="text-3xl font-bold text-rusty-red">
                      {timesheet.totalHours.toFixed(1)}h
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
