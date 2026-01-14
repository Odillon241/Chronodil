"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { generateReportFromTimesheet } from "@/actions/report-generation.actions";
import { getReportTemplatesByFrequency } from "@/actions/report-template.actions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { FileText, Download } from "lucide-react";
import { useRouter } from "next/navigation";

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hrTimesheetId: string;
  timesheetInfo?: {
    employeeName: string;
    weekStart: string;
    weekEnd: string;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  format: string;
}

export function GenerateReportDialog({
  open,
  onOpenChange,
  hrTimesheetId,
  timesheetInfo,
}: GenerateReportDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<"word" | "pdf" | "excel">("word");
  const [templateId, setTemplateId] = useState<string>("");
  const [includeSummary, setIncludeSummary] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Charger les modèles hebdomadaires
  const { execute: fetchTemplates } = useAction(getReportTemplatesByFrequency, {
    onSuccess: ({ data }) => {
      if (data) {
        setTemplates(data as ReportTemplate[]);
        // Sélectionner le premier modèle par défaut
        if (data.length > 0 && !templateId) {
          setTemplateId(data[0].id);
        }
      }
      setLoadingTemplates(false);
    },
    onError: () => {
      setLoadingTemplates(false);
    },
  });

  useEffect(() => {
    if (open) {
      setLoadingTemplates(true);
      fetchTemplates({ frequency: "WEEKLY" });

      // Générer un titre par défaut
      if (timesheetInfo) {
        setTitle(
          `Rapport Hebdomadaire - ${timesheetInfo.employeeName} - ${timesheetInfo.weekStart}`
        );
      }
    }
  }, [open, timesheetInfo]);

  const { execute: executeGenerate, isExecuting: isGenerating } = useAction(
    generateReportFromTimesheet,
    {
      onSuccess: ({ data }) => {
        toast.success("Rapport généré avec succès!");
        onOpenChange(false);
        // Rediriger vers la page des rapports
        router.push("/dashboard/reports");
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erreur lors de la génération du rapport");
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    executeGenerate({
      hrTimesheetId,
      templateId: templateId || undefined,
      title: title.trim(),
      format,
      includeSummary,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générer un rapport
          </DialogTitle>
          <DialogDescription>
            Créez un rapport depuis cette feuille de temps hebdomadaire
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div className="grid gap-2">
            <Label htmlFor="title">Titre du rapport *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Rapport Hebdomadaire - Janvier 2025"
              required
            />
          </div>

          {/* Modèle et Format */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="template">Modèle</Label>
              <Select
                value={templateId}
                onValueChange={setTemplateId}
                disabled={loadingTemplates}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder={loadingTemplates ? "Chargement..." : "Modèle par défaut"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <SelectItem value="default">Modèle par défaut</SelectItem>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Utilisera le modèle par défaut si aucun n'est sélectionné
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="format">Format d'export</Label>
              <Select value={format} onValueChange={(v: "word" | "pdf" | "excel") => setFormat(v)}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="word">Word (.docx)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeSummary"
              checked={includeSummary}
              onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
            />
            <Label htmlFor="includeSummary" className="text-sm font-normal cursor-pointer">
              Inclure un résumé automatique
            </Label>
          </div>

          {/* Info */}
          {timesheetInfo && (
            <div className="bg-muted p-3 rounded-md text-sm space-y-1">
              <p>
                <strong>Employé:</strong> {timesheetInfo.employeeName}
              </p>
              <p>
                <strong>Période:</strong> {timesheetInfo.weekStart} - {timesheetInfo.weekEnd}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isGenerating}>
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Génération..." : "Générer le rapport"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
