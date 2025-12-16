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
import { Textarea } from "@/components/ui/textarea";
import { MinimalTiptap } from "@/components/ui/minimal-tiptap-dynamic";
import { createReportTemplate, updateReportTemplate } from "@/actions/report-template.actions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Save, FileText, Info } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  format: string;
  templateContent: string;
  variables: any;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface ReportTemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ReportTemplate | null;
  onClose: () => void;
}

// Variables disponibles par type de fréquence
const AVAILABLE_VARIABLES: Record<string, string[]> = {
  WEEKLY: [
    "employeeName",
    "position",
    "site",
    "weekStart",
    "weekEnd",
    "totalHours",
    "observations",
    "activities",
    "activityCount",
  ],
  MONTHLY: [
    "employeeName",
    "position",
    "month",
    "year",
    "totalHours",
    "weekCount",
    "totalActivities",
    "activities",
  ],
  INDIVIDUAL: [
    "employeeName",
    "position",
    "title",
    "date",
    "content",
  ],
};

export function ReportTemplateEditorDialog({
  open,
  onOpenChange,
  template,
  onClose,
}: ReportTemplateEditorDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"WEEKLY" | "MONTHLY" | "INDIVIDUAL">("WEEKLY");
  const [format, setFormat] = useState<"word" | "pdf" | "excel">("word");
  const [templateContent, setTemplateContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  const isEditing = !!template;

  // Réinitialiser le formulaire quand le dialog s'ouvre/ferme
  useEffect(() => {
    if (open && template) {
      setName(template.name);
      setDescription(template.description || "");
      setFrequency(template.frequency as any);
      setFormat(template.format as any);
      setTemplateContent(template.templateContent);
      setIsActive(template.isActive);
      setIsDefault(template.isDefault);
      setSortOrder(template.sortOrder);
    } else if (open && !template) {
      setName("");
      setDescription("");
      setFrequency("WEEKLY");
      setFormat("word");
      setTemplateContent("");
      setIsActive(true);
      setIsDefault(false);
      setSortOrder(0);
    }
  }, [open, template]);

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createReportTemplate, {
    onSuccess: () => {
      toast.success("Modèle créé avec succès");
      onClose();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de la création");
    },
  });

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateReportTemplate, {
    onSuccess: () => {
      toast.success("Modèle modifié avec succès");
      onClose();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de la modification");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    if (!templateContent.trim()) {
      toast.error("Le contenu du modèle est requis");
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      format,
      templateContent,
      variables: AVAILABLE_VARIABLES[frequency],
      isActive,
      isDefault,
      sortOrder,
    };

    if (isEditing) {
      executeUpdate({
        id: template.id,
        ...data,
      });
    } else {
      executeCreate(data);
    }
  };

  const insertVariable = (variable: string) => {
    setTemplateContent((prev) => prev + `{{${variable}}}`);
  };

  const isSaving = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? "Éditer le modèle" : "Nouveau modèle de rapport"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de votre modèle de rapport"
              : "Créez un nouveau modèle de rapport réutilisable"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Métadonnées du modèle */}
          <div className="grid gap-4">
            {/* Nom */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nom du modèle *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Modèle Hebdomadaire Standard"
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez brièvement ce modèle..."
                rows={2}
              />
            </div>

            {/* Fréquence et Format */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="frequency">Fréquence</Label>
                <Select
                  value={frequency}
                  onValueChange={(v: "WEEKLY" | "MONTHLY" | "INDIVIDUAL") => setFrequency(v)}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                    <SelectItem value="MONTHLY">Mensuel</SelectItem>
                    <SelectItem value="INDIVIDUAL">Individuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="format">Format par défaut</Label>
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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked as boolean)}
                />
                <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                  Actif
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                />
                <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
                  Modèle par défaut
                </Label>
              </div>
            </div>
          </div>

          {/* Variables disponibles */}
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label>Variables disponibles</Label>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
              {AVAILABLE_VARIABLES[frequency].map((variable) => (
                <Badge
                  key={variable}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => insertVariable(variable)}
                >
                  {`{{${variable}}}`}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Cliquez sur une variable pour l'insérer dans le contenu
            </p>
          </div>

          {/* Éditeur de contenu */}
          <div className="grid gap-2">
            <Label>Contenu du modèle *</Label>
            <div className="border rounded-md">
              <MinimalTiptap
                content={templateContent}
                onChange={setTemplateContent}
                className="min-h-[400px]"
                placeholder="Rédigez le contenu de votre modèle ici... Utilisez les variables ci-dessus pour insérer des données dynamiques."
                editable={true}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Utilisez les variables dynamiques (ex: {`{{employeeName}}`}) pour insérer des
              données qui seront remplacées lors de la génération du rapport.
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
                  {isEditing ? "Enregistrer les modifications" : "Créer le modèle"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
