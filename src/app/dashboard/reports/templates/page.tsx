"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Edit, Trash2, Star, StarOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getReportTemplates,
  deleteReportTemplate,
  setDefaultReportTemplate,
} from "@/actions/report-template.actions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
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
import { ReportTemplateEditorDialog } from "@/components/features/report-template-editor-dialog";

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
  createdAt: Date;
  updatedAt: Date;
  User: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    Report: number;
  };
}

export default function ReportTemplatesPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Actions
  const { execute: fetchTemplates } = useAction(getReportTemplates, {
    onSuccess: ({ data }) => {
      if (data) {
        setTemplates(data as ReportTemplate[]);
      }
      setLoading(false);
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors du chargement des modèles");
      setLoading(false);
    },
  });

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(deleteReportTemplate, {
    onSuccess: () => {
      toast.success("Modèle supprimé avec succès");
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      fetchTemplates();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de la suppression");
    },
  });

  const { execute: executeSetDefault, isExecuting: isSettingDefault } = useAction(
    setDefaultReportTemplate,
    {
      onSuccess: () => {
        toast.success("Modèle défini par défaut avec succès");
        fetchTemplates();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erreur lors de la définition du modèle par défaut");
      },
    }
  );

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setEditorOpen(true);
  };

  const handleEdit = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setEditorOpen(true);
  };

  const handleDeleteClick = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (templateToDelete) {
      executeDelete({ id: templateToDelete });
    }
  };

  const handleSetDefault = (templateId: string, frequency: string) => {
    executeSetDefault({ id: templateId, frequency: frequency as any });
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setSelectedTemplate(null);
    fetchTemplates();
  };

  const getFrequencyBadge = (frequency: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      WEEKLY: "default",
      MONTHLY: "secondary",
      INDIVIDUAL: "destructive",
    };
    const labels: Record<string, string> = {
      WEEKLY: "Hebdomadaire",
      MONTHLY: "Mensuel",
      INDIVIDUAL: "Individuel",
    };
    return (
      <Badge variant={variants[frequency] || "default"}>
        {labels[frequency] || frequency}
      </Badge>
    );
  };

  const getFormatBadge = (format: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      word: "default",
      excel: "secondary",
      pdf: "outline",
    };
    return (
      <Badge variant={variants[format] || "outline"}>
        {format.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Modèles de Rapports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Modèles de Rapports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Créez et gérez vos modèles de rapports réutilisables
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau modèle
        </Button>
      </div>

      {/* Liste des modèles */}
      <Card>
        <CardHeader>
          <CardTitle>Mes modèles</CardTitle>
          <CardDescription>
            {templates.length === 0
              ? "Aucun modèle créé pour le moment"
              : `${templates.length} modèle(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun modèle</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez votre premier modèle pour commencer
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un modèle
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Fréquence</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Utilisations</TableHead>
                    <TableHead>Modifié le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {template.isDefault && (
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          )}
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{template.name}</div>
                            {template.description && (
                              <div className="text-xs text-muted-foreground">
                                {template.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getFrequencyBadge(template.frequency)}</TableCell>
                      <TableCell>{getFormatBadge(template.format)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template._count.Report} rapport(s)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(template.updatedAt), "d MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!template.isDefault && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSetDefault(template.id, template.frequency)}
                              disabled={isSettingDefault}
                              title="Définir par défaut"
                            >
                              <StarOff className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(template)}
                            title="Éditer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(template.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <ReportTemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={selectedTemplate}
        onClose={handleEditorClose}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
