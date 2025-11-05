'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from '@/components/ui/empty';
import { FileText, Edit, Mail, Download, Trash2, MoreHorizontal, FilePlus } from 'lucide-react';
import { SpinnerCustom } from '@/components/features/loading-spinner';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { deleteReport, downloadReport } from '@/actions/report.actions';

interface ReportsHistorySectionProps {
  reports: any[];
  onUpdate: () => void;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function base64ToBlob(base64: string, mimeType: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export function ReportsHistorySection({ reports, onUpdate }: ReportsHistorySectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [deleteMultipleConfirmDialogOpen, setDeleteMultipleConfirmDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

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
      setSelectedReportIds(selectedReportIds.filter((id) => id !== reportId));
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    setIsLoading(true);
    try {
      const result = await downloadReport(reportId);
      if (result && 'data' in result && result.data) {
        const blob = base64ToBlob(result.data.data, result.data.mimeType);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Rapport téléchargé avec succès !');
      } else {
        const errorMessage = result && 'serverError' in result ? result.serverError : 'Erreur lors du téléchargement du rapport';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Erreur lors du téléchargement du rapport');
    } finally {
      setIsLoading(false);
    }
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
      if (result && 'data' in result && result.data) {
        toast.success('Rapport supprimé avec succès');
        onUpdate();
      } else {
        const errorMessage = result && 'serverError' in result ? result.serverError : 'Erreur lors de la suppression du rapport';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Erreur lors de la suppression du rapport');
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
          if (result && 'data' in result && result.data) {
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
      onUpdate();
    } catch (error) {
      console.error('Error deleting reports:', error);
      toast.error('Erreur lors de la suppression des rapports');
    } finally {
      setIsLoading(false);
      setDeleteMultipleConfirmDialogOpen(false);
    }
  };

  return (
    <>
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
                <Button className="bg-primary hover:bg-primary">
                  <FilePlus className="mr-2 h-4 w-4" />
                  Créer un rapport
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="relative overflow-x-auto">
              {/* Desktop view */}
              <table className="w-full text-xs sm:text-sm text-left hidden md:table">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th className="px-6 py-3">
                      <Checkbox checked={isSelectAll} onCheckedChange={handleSelectAll} />
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
                        {format(new Date(report.createdAt), 'dd/MM/yyyy à HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={report.format === 'pdf' ? 'default' : 'secondary'}>
                          {report.format === 'pdf' ? 'PDF' : 'Word'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">{formatFileSize(report.fileSize)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{report._count.Recipients}</span>
                          <span className="text-muted-foreground">destinataire(s)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" disabled={isLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                        <Badge
                          variant={report.format === 'pdf' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {report.format === 'pdf' ? 'PDF' : 'Word'}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Créé par: </span>
                          <span className="font-medium">{report.CreatedBy.name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date: </span>
                          <span>{format(new Date(report.createdAt), 'dd/MM/yyyy à HH:mm')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Taille: </span>
                          <span>{formatFileSize(report.fileSize)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Destinataires: </span>
                          <span className="font-medium">{report._count.Recipients}</span>
                        </div>
                      </div>

                      <div className="flex justify-end mt-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" disabled={isLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
            <Button variant="destructive" onClick={confirmDeleteReport} disabled={isLoading}>
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
      <Dialog
        open={deleteMultipleConfirmDialogOpen}
        onOpenChange={setDeleteMultipleConfirmDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedReportIds.length} rapport(s) ? Cette
              action est irréversible.
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
    </>
  );
}
