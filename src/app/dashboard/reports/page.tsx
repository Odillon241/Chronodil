"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Calendar, TrendingUp, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getReportSummary,
  getWeeklyActivity,
  getProjectDistribution,
  getDetailedReport,
  getProjectReport,
  getUserReport,
} from "@/actions/report.actions";
import { exportTimesheetToExcel, exportTimesheetToPDF } from "@/actions/export.actions";

type Period = "week" | "month" | "quarter" | "year" | "custom";
type ReportType = "summary" | "detailed" | "by-project" | "by-user";

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [reportType, setReportType] = useState<ReportType>("summary");
  const [isLoading, setIsLoading] = useState(false);

  // État pour les données
  const [summary, setSummary] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [projectData, setProjectData] = useState<any[]>([]);
  const [detailedData, setDetailedData] = useState<any[]>([]);
  const [projectReport, setProjectReport] = useState<any[]>([]);
  const [userReport, setUserReport] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [period, reportType]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const filters = { period };

      // Charger le résumé
      const summaryResult = await getReportSummary(filters);
      if (summaryResult?.data) {
        setSummary(summaryResult.data);
      }

      // Charger l'activité hebdomadaire
      const weeklyResult = await getWeeklyActivity(filters);
      if (weeklyResult?.data) {
        setWeeklyData(weeklyResult.data);
      }

      // Charger la distribution par projet
      const projectDistResult = await getProjectDistribution(filters);
      if (projectDistResult?.data) {
        setProjectData(projectDistResult.data);
      }

      // Charger les données selon le type de rapport
      if (reportType === "detailed") {
        const detailedResult = await getDetailedReport(filters);
        if (detailedResult?.data) {
          setDetailedData(detailedResult.data);
        }
      } else if (reportType === "by-project") {
        const projectReportResult = await getProjectReport(filters);
        if (projectReportResult?.data) {
          setProjectReport(projectReportResult.data);
        }
      } else if (reportType === "by-user") {
        const userReportResult = await getUserReport(filters);
        if (userReportResult?.data) {
          setUserReport(userReportResult.data);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodDates = () => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + 1); // Lundi
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Dimanche
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        endDate = now;
    }

    return { startDate, endDate };
  };

  const handleExport = async (format: "excel" | "pdf") => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates();

      const result = format === "excel"
        ? await exportTimesheetToExcel({ startDate, endDate })
        : await exportTimesheetToPDF({ startDate, endDate });

      if (result?.data) {
        // Create download link
        const blob = base64ToBlob(result.data.data, result.data.mimeType);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(`Export ${format.toUpperCase()} généré avec succès !`);
      } else {
        toast.error("Erreur lors de l'export");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsLoading(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const maxHours = projectData.length > 0 ? Math.max(...projectData.map(p => p.hours)) : 0;

  const getPeriodLabel = () => {
    switch (period) {
      case "week": return "Cette semaine";
      case "month": return "Ce mois";
      case "quarter": return "Ce trimestre";
      case "year": return "Cette année";
      default: return "Période personnalisée";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-muted-foreground">
            Analysez vos données de temps et générez des rapports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("excel")}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={period} onValueChange={(val) => setPeriod(val as Period)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="quarter">Ce trimestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>

        <Select value={reportType} onValueChange={(val) => setReportType(val as ReportType)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="summary">Vue d'ensemble</SelectItem>
            <SelectItem value="detailed">Détaillé</SelectItem>
            <SelectItem value="by-project">Par projet</SelectItem>
            <SelectItem value="by-user">Par utilisateur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rusty-red"></div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total heures</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rusty-red">
                  {summary?.totalHours?.toFixed(1) || "0"}h
                </div>
                <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Heures facturables</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rusty-red">
                  {summary?.billableHours?.toFixed(1) || "0"}h
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary?.totalHours > 0
                    ? `${Math.round((summary.billableHours / summary.totalHours) * 100)}% du total`
                    : "Aucune donnée"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rusty-red">
                  {summary?.activeProjects || 0}
                </div>
                <p className="text-xs text-muted-foreground">Projets en cours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux validation</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rusty-red">
                  {summary?.validationRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Heures approuvées</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activité hebdomadaire</CardTitle>
                <CardDescription>
                  Heures saisies par jour
                </CardDescription>
              </CardHeader>
              <CardContent>
                {weeklyData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune donnée disponible</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {weeklyData.map((day, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{day.day}</span>
                            <span className="text-muted-foreground">{day.hours.toFixed(1)}h</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rusty-red"
                              style={{ width: `${Math.min((day.hours / 12) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-2xl font-bold text-rusty-red">
                          {weeklyData.reduce((acc, day) => acc + day.hours, 0).toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par projet</CardTitle>
                <CardDescription>
                  Heures par projet {getPeriodLabel().toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projectData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune donnée disponible</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {projectData.map((project, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                              <span className="font-medium">{project.name}</span>
                            </div>
                            <span className="text-muted-foreground">{project.hours.toFixed(1)}h</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full"
                              style={{
                                backgroundColor: project.color,
                                width: `${(project.hours / maxHours) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-2xl font-bold text-rusty-red">
                          {projectData.reduce((acc, project) => acc + project.hours, 0).toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Vue détaillée selon le type de rapport */}
          {reportType === "detailed" && detailedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rapport détaillé</CardTitle>
                <CardDescription>Toutes les saisies pour la période</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Utilisateur</th>
                        <th className="px-6 py-3">Projet</th>
                        <th className="px-6 py-3">Tâche</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Durée</th>
                        <th className="px-6 py-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedData.map((entry: any) => (
                        <tr key={entry.id} className="border-b hover:bg-muted/50">
                          <td className="px-6 py-4">{format(new Date(entry.date), "dd/MM/yyyy")}</td>
                          <td className="px-6 py-4">{entry.user.name}</td>
                          <td className="px-6 py-4">{entry.project.name}</td>
                          <td className="px-6 py-4">{entry.task?.name || "-"}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">{entry.duration}h</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              entry.status === "APPROVED" ? "bg-green-100 text-green-800" :
                              entry.status === "SUBMITTED" ? "bg-amber-100 text-amber-800" :
                              entry.status === "REJECTED" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === "by-project" && projectReport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rapport par projet</CardTitle>
                <CardDescription>Statistiques détaillées par projet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted">
                      <tr>
                        <th className="px-6 py-3">Projet</th>
                        <th className="px-6 py-3">Budget</th>
                        <th className="px-6 py-3">Total heures</th>
                        <th className="px-6 py-3">Heures normales</th>
                        <th className="px-6 py-3">Heures sup.</th>
                        <th className="px-6 py-3">Approuvé</th>
                        <th className="px-6 py-3">Membres</th>
                        <th className="px-6 py-3">Progression</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectReport.map((project: any) => (
                        <tr key={project.id} className="border-b hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                              <span className="font-medium">{project.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{project.budgetHours ? `${project.budgetHours}h` : "-"}</td>
                          <td className="px-6 py-4 font-bold">{project.totalHours.toFixed(1)}h</td>
                          <td className="px-6 py-4">{project.normalHours.toFixed(1)}h</td>
                          <td className="px-6 py-4">{project.overtimeHours.toFixed(1)}h</td>
                          <td className="px-6 py-4">{project.approvedHours.toFixed(1)}h</td>
                          <td className="px-6 py-4">{project.members}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-rusty-red"
                                  style={{ width: `${Math.min(project.progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{project.progress.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === "by-user" && userReport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rapport par utilisateur</CardTitle>
                <CardDescription>Statistiques détaillées par utilisateur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted">
                      <tr>
                        <th className="px-6 py-3">Utilisateur</th>
                        <th className="px-6 py-3">Département</th>
                        <th className="px-6 py-3">Rôle</th>
                        <th className="px-6 py-3">Total heures</th>
                        <th className="px-6 py-3">Approuvé</th>
                        <th className="px-6 py-3">En attente</th>
                        <th className="px-6 py-3">Taux validation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userReport.map((user: any) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{user.department}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold">{user.totalHours.toFixed(1)}h</td>
                          <td className="px-6 py-4 text-green-600">{user.approvedHours.toFixed(1)}h</td>
                          <td className="px-6 py-4 text-amber-600">{user.pendingHours.toFixed(1)}h</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${user.validationRate}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{user.validationRate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
