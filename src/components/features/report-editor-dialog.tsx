"use client";

import { useEffect, useState } from "react";
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
import { MinimalTiptap } from "@/components/ui/minimal-tiptap-dynamic";
import { createReport, updateReport } from "@/actions/report.actions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Save, FileText } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";

interface Report {
  id: string;
  title: string;
  content: string;
  format: string;
  period: string | null;
  includeSummary: boolean;
}

interface ReportEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report | null;
  onClose: () => void;
}

export function ReportEditorDialog({
  open,
  onOpenChange,
  report,
  onClose,
}: ReportEditorDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<"pdf" | "word" | "excel">("pdf");
  const [period, setPeriod] = useState("");
  const [includeSummary, setIncludeSummary] = useState(false);

  const isEditing = !!report;

  // Réinitialiser le formulaire quand le dialog s'ouvre/ferme
  useEffect(() => {
    if (open && report) {
      setTitle(report.title);
      setContent(report.content);
      setFormat(report.format as "pdf" | "word" | "excel");
      setPeriod(report.period || "");
      setIncludeSummary(report.includeSummary);
    } else if (open && !report) {
      setTitle("");
      setContent("");
      setFormat("pdf");
      setPeriod("");
      setIncludeSummary(false);
    }
  }, [open, report]);

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createReport, {
    onSuccess: () => {
      toast.success("Rapport créé avec succès");
      onClose();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de la création");
    },
  });

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateReport, {
    onSuccess: () => {
      toast.success("Rapport modifié avec succès");
      onClose();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de la modification");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    const data = {
      title: title.trim(),
      content,
      format,
      period: period.trim() || undefined,
      includeSummary,
    };

    if (isEditing) {
      executeUpdate({
        id: report.id,
        ...data,
      });
    } else {
      executeCreate(data);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? "Éditer le rapport" : "Nouveau rapport"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de votre rapport"
              : "Créez un nouveau rapport d'activité"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Métadonnées du rapport */}
          <div className="grid gap-4">
            {/* Titre */}
            <div className="grid gap-2">
              <Label htmlFor="title">Titre du rapport *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Rapport d'activité - Janvier 2025"
                required
              />
            </div>

            {/* Période et Format */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="period">Période</Label>
                <Input
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Ex: Janvier 2025"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="format">Format d'export</Label>
                <Select value={format} onValueChange={(v: "pdf" | "word" | "excel") => setFormat(v)}>
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="word">Word (.docx)</SelectItem>
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
              <Label
                htmlFor="includeSummary"
                className="text-sm font-normal cursor-pointer"
              >
                Inclure un résumé automatique
              </Label>
            </div>
          </div>

          {/* Éditeur de contenu */}
          <div className="grid gap-2">
            <Label>Contenu du rapport</Label>
            <div className="border rounded-md">
              <MinimalTiptap
                content={content}
                onChange={setContent}
                className="min-h-[400px]"
                placeholder="Rédigez le contenu de votre rapport ici..."
                editable={true}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Utilisez l'éditeur pour formater votre rapport. Vous pourrez insérer des tableaux,
              des listes et des images.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Enregistrement...
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Enregistrer les modifications" : "Créer le rapport"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
