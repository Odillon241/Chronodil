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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MinimalTiptap } from "@/components/ui/minimal-tiptap-dynamic";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent } from "@/components/ui/empty";
import { FilterButtonGroup } from "@/components/ui/filter-button-group";
import { StatusTabs } from "@/components/ui/status-menubar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Calendar, TrendingUp, BarChart3, Clock, Plus, Mail, FilePlus, FileDown, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { SpinnerCustom } from "@/components/features/loading-spinner";
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
  generateCustomReport,
  sendReportByEmail,
  getReports,
  downloadReport,
  deleteReport,
} from "@/actions/report.actions";
import { exportTimesheetToExcel, exportTimesheetToPDF } from "@/actions/export.actions";
import { getAllUsers } from "@/actions/user.actions";

type Period = "week" | "month" | "quarter" | "year" | "custom";
type ReportType = "summary" | "detailed" | "by-project" | "by-user";

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [reportType, setReportType] = useState<ReportType>("summary");
  const [isLoading, setIsLoading] = useState(false);
  
  // États pour les nouveaux composants de filtre
  const [searchValue, setSearchValue] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // États pour le dialogue de rapport personnalisé
  const [customReportDialogOpen, setCustomReportDialogOpen] = useState(false);
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [customReportData, setCustomReportData] = useState({
    title: "",
    content: "",
    includeSummary: false,
    recipientEmail: "",
    recipientName: "",
    attachPdf: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  
  // États pour la sélection des utilisateurs
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sendToUsers, setSendToUsers] = useState(false);
  
  // États pour la sélection des rapports
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  
  // États pour le dialogue de confirmation
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [deleteMultipleConfirmDialogOpen, setDeleteMultipleConfirmDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  // État pour les données
  const [summary, setSummary] = useState<any>(null);
  const [detailedData, setDetailedData] = useState<any[]>([]);
  const [projectReport, setProjectReport] = useState<any[]>([]);
  const [userReport, setUserReport] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadUsers();
    loadReports();
  }, [period, reportType]);

  const loadUsers = async () => {
    try {
      const result = await getAllUsers({});
      if (result?.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    }
  };

  const loadReports = async () => {
    try {
      const result = await getReports();
      if (result?.data) {
        setReports(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des rapports:", error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const filters = { period };

      // Charger le résumé
      const summaryResult = await getReportSummary(filters);
      if (summaryResult?.data) {
        setSummary(summaryResult.data);
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

  const handleGenerateCustomReport = async (format: "pdf" | "word" = "pdf") => {
    if (!customReportData.title || !customReportData.content) {
      toast.error("Veuillez remplir le titre et le contenu du rapport");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCustomReport({
        title: customReportData.title,
        content: customReportData.content,
        includeSummary: customReportData.includeSummary,
        period: period === "custom" ? undefined : period,
        format: format,
        saveToDatabase: true, // Enregistrer en base de données
      });

      if (result?.data) {
        // Télécharger le fichier
        const blob = base64ToBlob(result.data.data, result.data.mimeType);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(`Rapport ${format === "word" ? "Word" : "PDF"} généré avec succès !`);
        setCustomReportDialogOpen(false);
        
        // Réinitialiser le formulaire
        setCustomReportData({
          title: "",
          content: "",
          includeSummary: false,
          recipientEmail: "",
          recipientName: "",
          attachPdf: true,
        });
        
        // Recharger la liste des rapports
        loadReports();
      } else {
        toast.error(result?.serverError || "Erreur lors de la génération du rapport");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erreur lors de la génération du rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReport = async () => {
    if (!customReportData.title || !customReportData.content) {
      toast.error("Veuillez remplir le titre et le contenu du rapport");
      return;
    }

    // Validation selon le mode d'envoi
    if (sendToUsers) {
      if (selectedUserIds.length === 0) {
        toast.error("Veuillez sélectionner au moins un utilisateur");
        return;
      }
    } else {
      if (!customReportData.recipientEmail) {
        toast.error("Veuillez remplir l'adresse email du destinataire");
        return;
      }
    }

    setIsGenerating(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      if (sendToUsers) {
        // Envoyer aux utilisateurs sélectionnés
        const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
        let sharedReportId: string | undefined;
        
        for (const user of selectedUsers) {
          try {
            const result = await sendReportByEmail({
              title: customReportData.title,
              content: customReportData.content,
              recipientEmail: user.email,
              recipientName: user.name,
              recipientUserId: user.id,
              attachPdf: customReportData.attachPdf,
              period: period === "custom" ? undefined : period,
              reportId: sharedReportId, // Partager le même rapport entre tous les destinataires
            });

            if (result?.data) {
              if (!sharedReportId) {
                sharedReportId = result.data.reportId;
              }
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
            console.error(`Erreur envoi à ${user.email}:`, error);
          }
        }

        if (successCount > 0) {
          toast.success(`Rapport envoyé avec succès à ${successCount} utilisateur(s) !`);
        }
        if (errorCount > 0) {
          toast.error(`Échec de l'envoi à ${errorCount} utilisateur(s)`);
        }
      } else {
        // Envoyer à une adresse email manuelle
        const result = await sendReportByEmail({
          title: customReportData.title,
          content: customReportData.content,
          recipientEmail: customReportData.recipientEmail,
          recipientName: customReportData.recipientName,
          attachPdf: customReportData.attachPdf,
          period: period === "custom" ? undefined : period,
        });

        if (result?.data) {
          toast.success(result.data.message || "Rapport envoyé avec succès !");
          successCount = 1;
        } else {
          toast.error(result?.serverError || "Erreur lors de l'envoi du rapport");
          errorCount = 1;
        }
      }

      if (successCount > 0) {
        setSendEmailDialogOpen(false);
        setCustomReportDialogOpen(false);
        
        // Réinitialiser le formulaire
        setCustomReportData({
          title: "",
          content: "",
          includeSummary: false,
          recipientEmail: "",
          recipientName: "",
          attachPdf: true,
        });
        setSelectedUserIds([]);
        setSendToUsers(false);
        
        // Recharger la liste des rapports
        loadReports();
      }
    } catch (error) {
      console.error("Error sending report:", error);
      toast.error("Erreur lors de l'envoi du rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    setIsLoading(true);
    try {
      const result = await downloadReport(reportId);
      if (result?.data) {
        // Télécharger le fichier
        const blob = base64ToBlob(result.data.data, result.data.mimeType);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Rapport téléchargé avec succès !");
      } else {
        toast.error(result?.serverError || "Erreur lors du téléchargement du rapport");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Erreur lors du téléchargement du rapport");
    } finally {
      setIsLoading(false);
    }
  };


  const getPeriodLabel = () => {
    switch (period) {
      case "week": return "Cette semaine";
      case "month": return "Ce mois";
      case "quarter": return "Ce trimestre";
      case "year": return "Cette année";
      default: return "Période personnalisée";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Fonctions de gestion des sélections
  const handleSelectAll = (checked: boolean) => {
    setIsSelectAll(checked);
    if (checked) {
      setSelectedReportIds(reports.map((report: any) => report.id));
    } else {
      setSelectedReportIds([]);
    }
  };

  const handleSelectReport = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReportIds([...selectedReportIds, reportId]);
    } else {
      setSelectedReportIds(selectedReportIds.filter(id => id !== reportId));
    }
  };

  // Nouvelles actions pour les rapports
  const handleEditReport = (report: any) => {
    // Pré-remplir le formulaire avec les données du rapport
    setCustomReportData({
      title: report.title,
      content: report.content,
      includeSummary: report.includeSummary,
      recipientEmail: "",
      recipientName: "",
      attachPdf: true,
    });
    setCustomReportDialogOpen(true);
  };

  const handleSendExistingReport = (report: any) => {
    // Pré-remplir le formulaire avec les données du rapport pour l'envoi
    setCustomReportData({
      title: report.title,
      content: report.content,
      includeSummary: report.includeSummary,
      recipientEmail: "",
      recipientName: "",
      attachPdf: true,
    });
    setSendEmailDialogOpen(true);
  };

  const handleDeleteReport = (reportId: string) => {
    setReportToDelete(reportId);
    setDeleteConfirmDialogOpen(true);
  };

  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;

    setIsLoading(true);
    try {
      const result = await deleteReport(reportToDelete);
      if (result?.data) {
        toast.success("Rapport supprimé avec succès");
        loadReports();
      } else {
        toast.error(result?.serverError || "Erreur lors de la suppression du rapport");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Erreur lors de la suppression du rapport");
    } finally {
      setIsLoading(false);
      setDeleteConfirmDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleDeleteSelectedReports = () => {
    if (selectedReportIds.length === 0) return;
    setDeleteMultipleConfirmDialogOpen(true);
  };

  const confirmDeleteSelectedReports = async () => {
    setIsLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const reportId of selectedReportIds) {
        try {
          const result = await deleteReport(reportId);
          if (result?.data) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Error deleting report ${reportId}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} rapport(s) supprimé(s) avec succès`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} rapport(s) n'ont pas pu être supprimés`);
      }

      setSelectedReportIds([]);
      setIsSelectAll(false);
      loadReports();
    } catch (error) {
      console.error("Error deleting reports:", error);
      toast.error("Erreur lors de la suppression des rapports");
    } finally {
      setIsLoading(false);
      setDeleteMultipleConfirmDialogOpen(false);
    }
  };

  const handleSaveReport = async () => {
    if (!customReportData.title || !customReportData.content) {
      toast.error("Veuillez remplir le titre et le contenu du rapport");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCustomReport({
        title: customReportData.title,
        content: customReportData.content,
        includeSummary: customReportData.includeSummary,
        period: period === "custom" ? undefined : period,
        format: "pdf",
        saveToDatabase: true, // Enregistrer en base de données
      });

      if (result?.data) {
        toast.success("Rapport enregistré avec succès !");
        setCustomReportDialogOpen(false);
        
        // Réinitialiser le formulaire
        setCustomReportData({
          title: "",
          content: "",
          includeSummary: false,
          recipientEmail: "",
          recipientName: "",
          attachPdf: true,
        });
        
        // Recharger la liste des rapports
        loadReports();
      } else {
        toast.error(result?.serverError || "Erreur lors de l'enregistrement du rapport");
      }
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Erreur lors de l'enregistrement du rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Analysez vos données de temps et générez des rapports
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={customReportDialogOpen} onOpenChange={setCustomReportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary w-full sm:w-auto text-xs sm:text-sm">
                <FilePlus className="mr-2 h-4 w-4" />
                Nouveau rapport
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un rapport personnalisé</DialogTitle>
                <DialogDescription>
                  Rédigez votre rapport et téléchargez-le ou envoyez-le par email
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="report-title">Titre du rapport *</Label>
                  <Input
                    id="report-title"
                    placeholder="Ex: Rapport d'activité mensuel"
                    value={customReportData.title}
                    onChange={(e) => setCustomReportData({ ...customReportData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-content">Contenu du rapport *</Label>
                  <MinimalTiptap
                    content={customReportData.content}
                    onChange={(content) => setCustomReportData({ ...customReportData, content })}
                    placeholder="Rédigez le contenu de votre rapport..."
                    className="min-h-[300px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {customReportData.content.length} caractères
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-summary"
                    checked={customReportData.includeSummary}
                    onCheckedChange={(checked) => 
                      setCustomReportData({ ...customReportData, includeSummary: checked as boolean })
                    }
                  />
                  <Label htmlFor="include-summary" className="cursor-pointer">
                    Inclure les statistiques de la période sélectionnée
                  </Label>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCustomReportDialogOpen(false)}
                  disabled={isGenerating}
                  className="sm:mr-auto w-full sm:w-auto text-xs sm:text-sm"
                >
                  Annuler
                </Button>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSaveReport()}
                    disabled={isGenerating}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    {isGenerating ? (
                      <>
                        <SpinnerCustom />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!customReportData.title || !customReportData.content) {
                        toast.error("Veuillez remplir le titre et le contenu du rapport");
                        return;
                      }
                      setSendEmailDialogOpen(true);
                    }}
                    disabled={isGenerating}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Envoyer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleGenerateCustomReport("word")}
                    disabled={isGenerating}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    {isGenerating ? (
                      <>
                        <SpinnerCustom />
                        Génération...
                      </>
                    ) : (
                      <>
                        <FileDown className="mr-2 h-4 w-4" />
                        Word
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleGenerateCustomReport("pdf")}
                    className="bg-primary hover:bg-primary w-full sm:w-auto text-xs sm:text-sm"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <SpinnerCustom />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => handleExport("excel")} disabled={isLoading} className="w-full sm:w-auto text-xs sm:text-sm">
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")} disabled={isLoading} className="w-full sm:w-auto text-xs sm:text-sm">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Dialogue d'envoi par email */}
      <Dialog open={sendEmailDialogOpen} onOpenChange={setSendEmailDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Envoyer le rapport par email</DialogTitle>
            <DialogDescription>
              Sélectionnez les destinataires ou entrez une adresse email
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Sélection du mode d'envoi */}
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <Checkbox
                id="send-to-users"
                checked={sendToUsers}
                onCheckedChange={(checked) => {
                  setSendToUsers(checked as boolean);
                  if (checked) {
                    // Réinitialiser l'email manuel
                    setCustomReportData({ ...customReportData, recipientEmail: "", recipientName: "" });
                  } else {
                    // Réinitialiser la sélection d'utilisateurs
                    setSelectedUserIds([]);
                  }
                }}
              />
              <Label htmlFor="send-to-users" className="cursor-pointer font-medium">
                Envoyer aux utilisateurs sélectionnés
              </Label>
            </div>

            {sendToUsers ? (
              // Sélection des utilisateurs
              <div className="space-y-2">
                <Label>Sélectionner les utilisateurs *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Choisissez les utilisateurs qui recevront le rapport
                </p>
                <ScrollArea className="h-[300px] border rounded-md p-4">
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun utilisateur disponible
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                          <Checkbox
                            id={`user-email-${user.id}`}
                            checked={selectedUserIds.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUserIds([...selectedUserIds, user.id]);
                              } else {
                                setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`user-email-${user.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div>{user.name}</div>
                                <div className="text-muted-foreground text-xs">{user.email}</div>
                              </div>
                              {user.Department && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {user.Department.name}
                                </Badge>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {selectedUserIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedUserIds.length} utilisateur(s) sélectionné(s)
                  </p>
                )}
              </div>
            ) : (
              // Saisie manuelle de l'email
              <>
                <div className="space-y-2">
                  <Label htmlFor="recipient-name">Nom du destinataire</Label>
                  <Input
                    id="recipient-name"
                    placeholder="Ex: Jean Dupont"
                    value={customReportData.recipientName}
                    onChange={(e) => setCustomReportData({ ...customReportData, recipientName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient-email">Email du destinataire *</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={customReportData.recipientEmail}
                    onChange={(e) => setCustomReportData({ ...customReportData, recipientEmail: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="attach-pdf"
                checked={customReportData.attachPdf}
                onCheckedChange={(checked) => 
                  setCustomReportData({ ...customReportData, attachPdf: checked as boolean })
                }
              />
              <Label htmlFor="attach-pdf" className="cursor-pointer">
                Joindre le rapport en PDF
              </Label>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSendEmailDialogOpen(false);
                setSendToUsers(false);
                setSelectedUserIds([]);
              }}
              disabled={isGenerating}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSendReport}
              className="bg-primary hover:bg-primary w-full sm:w-auto text-xs sm:text-sm"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <SpinnerCustom />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nouveaux composants de filtre */}
      <div className="space-y-4">
        {/* Filtres de recherche et période */}
        <FilterButtonGroup
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filterOptions={[
            { id: 'period', label: 'Période', value: 'period' },
            { id: 'type', label: 'Type de rapport', value: 'type' },
            { id: 'status', label: 'Statut', value: 'status' },
          ]}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          placeholder="Rechercher un rapport..."
        />

        {/* Onglets de statut */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <StatusTabs
            options={[
              { id: 'active', label: 'Actifs', value: 'active', count: 12 },
              { id: 'archived', label: 'Archivés', value: 'archived', count: 3 },
              { id: 'all', label: 'Tous', value: 'all', count: 15 },
            ]}
            selectedValue={statusFilter}
            onValueChange={setStatusFilter}
          />

          {/* Filtres de période et type de rapport */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type de rapport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Vue d'ensemble</SelectItem>
                <SelectItem value="detailed">Détaillé</SelectItem>
                <SelectItem value="by-project">Par projet</SelectItem>
                <SelectItem value="by-user">Par utilisateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <SpinnerCustom />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total heures</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {summary?.totalHours?.toFixed(1) || "0"}h
                </div>
                <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Heures facturables</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-primary">
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
                <CardTitle className="text-xs sm:text-sm font-medium">Projets actifs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {summary?.activeProjects || 0}
                </div>
                <p className="text-xs text-muted-foreground">Projets en cours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Taux validation</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {summary?.validationRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Heures approuvées</p>
              </CardContent>
            </Card>
          </div>


          {/* Liste des rapports générés */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Historique des rapports</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Liste de tous les rapports générés et envoyés
                </p>
              </div>
              {reports.length > 0 && selectedReportIds.length > 0 && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteSelectedReports}
                    disabled={isLoading}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Supprimer ({selectedReportIds.length})
                  </Button>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              {reports.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileText className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>Aucun rapport généré</EmptyTitle>
                    <EmptyDescription>
                      Commencez par créer votre premier rapport personnalisé
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Dialog open={customReportDialogOpen} onOpenChange={setCustomReportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary">
                          <FilePlus className="mr-2 h-4 w-4" />
                          Créer un rapport
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left hidden md:table">
                    <thead className="text-xs uppercase bg-muted">
                      <tr>
                        <th className="px-6 py-3">
                          <Checkbox
                            checked={isSelectAll}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-6 py-3">Titre</th>
                        <th className="px-6 py-3">Créé par</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Format</th>
                        <th className="px-6 py-3">Taille</th>
                        <th className="px-6 py-3">Destinataires</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report: any) => (
                        <tr key={report.id} className="border-b hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <Checkbox
                              checked={selectedReportIds.includes(report.id)}
                              onCheckedChange={(checked) => 
                                handleSelectReport(report.id, checked as boolean)
                              }
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{report.title}</div>
                            {report.period && (
                              <div className="text-xs text-muted-foreground">
                                Période: {report.period}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div>{report.CreatedBy.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {report.CreatedBy.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {format(new Date(report.createdAt), "dd/MM/yyyy à HH:mm")}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={report.format === "pdf" ? "default" : "secondary"}>
                              {report.format === "pdf" ? "PDF" : "Word"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {formatFileSize(report.fileSize)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{report._count.Recipients}</span>
                              <span className="text-muted-foreground">
                                destinataire(s)
                              </span>
                            </div>
                            {report.Recipients.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {report.Recipients.slice(0, 2).map((recipient: any, idx: number) => (
                                  <div key={recipient.id}>
                                    {recipient.User ? recipient.User.name : recipient.email}
                                  </div>
                                ))}
                                {report.Recipients.length > 2 && (
                                  <div>+{report.Recipients.length - 2} autre(s)</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isLoading}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditReport(report)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendExistingReport(report)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Envoyer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadReport(report.id)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Télécharger
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteReport(report.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile view */}
                  <div className="md:hidden space-y-4">
                    {reports.map((report: any) => (
                      <Card key={report.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-2 flex-1">
                              <Checkbox
                                checked={selectedReportIds.includes(report.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectReport(report.id, checked as boolean)
                                }
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{report.title}</div>
                                {report.period && (
                                  <div className="text-xs text-muted-foreground">
                                    Période: {report.period}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant={report.format === "pdf" ? "default" : "secondary"} className="text-xs">
                              {report.format === "pdf" ? "PDF" : "Word"}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Créé par: </span>
                              <span className="font-medium">{report.CreatedBy.name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email: </span>
                              <span>{report.CreatedBy.email}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Date: </span>
                              <span>{format(new Date(report.createdAt), "dd/MM/yyyy à HH:mm")}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Taille: </span>
                              <span>{formatFileSize(report.fileSize)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Destinataires: </span>
                              <span className="font-medium">{report._count.Recipients}</span>
                              {report.Recipients.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1 ml-2">
                                  {report.Recipients.slice(0, 2).map((recipient: any, idx: number) => (
                                    <div key={recipient.id}>
                                      {recipient.User ? recipient.User.name : recipient.email}
                                    </div>
                                  ))}
                                  {report.Recipients.length > 2 && (
                                    <div>+{report.Recipients.length - 2} autre(s)</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end mt-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isLoading}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditReport(report)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendExistingReport(report)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Envoyer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadReport(report.id)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Télécharger
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteReport(report.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vue détaillée selon le type de rapport */}
          {reportType === "detailed" && detailedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Rapport détaillé</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Toutes les saisies pour la période</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left hidden md:table">
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
                          <td className="px-6 py-4">{entry.User.name}</td>
                          <td className="px-6 py-4">{entry.Project?.name || "Projet non assigné"}</td>
                          <td className="px-6 py-4">{entry.Task?.name || "-"}</td>
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

                  {/* Mobile view for detailed report */}
                  <div className="md:hidden space-y-3">
                    {detailedData.map((entry: any) => (
                      <Card key={entry.id}>
                        <CardContent className="p-4">
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Date: </span>
                              <span className="font-medium">{format(new Date(entry.date), "dd/MM/yyyy")}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Utilisateur: </span>
                              <span>{entry.User.name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Projet: </span>
                              <span>{entry.Project?.name || "Projet non assigné"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tâche: </span>
                              <span>{entry.Task?.name || "-"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Type: </span>
                              <Badge variant="secondary" className="text-xs">{entry.type}</Badge>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Durée: </span>
                              <span className="font-bold">{entry.duration}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Statut: </span>
                              <Badge variant={
                                entry.status === "APPROVED" ? "default" :
                                entry.status === "SUBMITTED" ? "secondary" :
                                "destructive"
                              } className="text-xs">
                                {entry.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === "by-project" && projectReport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Rapport par projet</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Statistiques détaillées par projet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left hidden md:table">
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
                                  className="h-full bg-primary"
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

                  {/* Mobile view for project report */}
                  <div className="md:hidden space-y-3">
                    {projectReport.map((project: any) => (
                      <Card key={project.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            <span className="font-medium text-sm">{project.name}</span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Budget: </span>
                              <span>{project.budgetHours ? `${project.budgetHours}h` : "-"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total heures: </span>
                              <span className="font-bold">{project.totalHours.toFixed(1)}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Heures normales: </span>
                              <span>{project.normalHours.toFixed(1)}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Heures sup.: </span>
                              <span>{project.overtimeHours.toFixed(1)}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Approuvé: </span>
                              <span>{project.approvedHours.toFixed(1)}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Membres: </span>
                              <span>{project.members}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Progression: </span>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${Math.min(project.progress, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{project.progress.toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === "by-user" && userReport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Rapport par utilisateur</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Statistiques détaillées par utilisateur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left hidden md:table">
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

                  {/* Mobile view for user report */}
                  <div className="md:hidden space-y-3">
                    {userReport.map((user: any) => (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="mb-3">
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Département: </span>
                              <span>{user.department}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rôle: </span>
                              <Badge variant="secondary" className="text-xs">{user.role}</Badge>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total heures: </span>
                              <span className="font-bold">{user.totalHours.toFixed(1)}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Approuvé: </span>
                              <span className="text-green-600 font-medium">{user.approvedHours.toFixed(1)}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">En attente: </span>
                              <span className="text-amber-600 font-medium">{user.pendingHours.toFixed(1)}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Taux validation: </span>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500"
                                    style={{ width: `${user.validationRate}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{user.validationRate}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialogue de confirmation pour suppression d'un rapport */}
      <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDialogOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteReport}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <SpinnerCustom />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation pour suppression multiple */}
      <Dialog open={deleteMultipleConfirmDialogOpen} onOpenChange={setDeleteMultipleConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedReportIds.length} rapport(s) ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteMultipleConfirmDialogOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSelectedReports}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <SpinnerCustom />
                  Suppression...
                </>
              ) : (
                `Supprimer ${selectedReportIds.length} rapport(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
