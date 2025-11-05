'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MinimalTiptap } from '@/components/ui/minimal-tiptap-dynamic';
import { FileText, Mail, FileDown, Download } from 'lucide-react';
import { SpinnerCustom } from '@/components/features/loading-spinner';
import { toast } from 'sonner';
import { generateCustomReport, sendReportByEmail } from '@/actions/report.actions';

type Period = 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface ReportsCustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: Period;
  users: any[];
  onSuccess: () => void;
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

export function ReportsCustomDialog({
  open,
  onOpenChange,
  period,
  users,
  onSuccess,
}: ReportsCustomDialogProps) {
  const [customReportData, setCustomReportData] = useState({
    title: '',
    content: '',
    includeSummary: false,
    recipientEmail: '',
    recipientName: '',
    attachPdf: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [sendToUsers, setSendToUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const resetForm = () => {
    setCustomReportData({
      title: '',
      content: '',
      includeSummary: false,
      recipientEmail: '',
      recipientName: '',
      attachPdf: true,
    });
    setSelectedUserIds([]);
    setSendToUsers(false);
  };

  const handleGenerateCustomReport = async (format: 'pdf' | 'word' = 'pdf') => {
    if (!customReportData.title || !customReportData.content) {
      toast.error('Veuillez remplir le titre et le contenu du rapport');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCustomReport({
        title: customReportData.title,
        content: customReportData.content,
        includeSummary: customReportData.includeSummary,
        period: period === 'custom' ? undefined : period,
        format: format,
        saveToDatabase: true,
      });

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

        toast.success(`Rapport ${format === 'word' ? 'Word' : 'PDF'} généré avec succès !`);
        onOpenChange(false);
        resetForm();
        onSuccess();
      } else {
        const errorMessage = result && 'serverError' in result ? result.serverError : 'Erreur lors de la génération du rapport';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = async () => {
    if (!customReportData.title || !customReportData.content) {
      toast.error('Veuillez remplir le titre et le contenu du rapport');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCustomReport({
        title: customReportData.title,
        content: customReportData.content,
        includeSummary: customReportData.includeSummary,
        period: period === 'custom' ? undefined : period,
        format: 'pdf',
        saveToDatabase: true,
      });

      if (result && 'data' in result && result.data) {
        toast.success('Rapport enregistré avec succès !');
        onOpenChange(false);
        resetForm();
        onSuccess();
      } else {
        const errorMessage = result && 'serverError' in result ? result.serverError : "Erreur lors de l'enregistrement du rapport";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error("Erreur lors de l'enregistrement du rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReport = async () => {
    if (!customReportData.title || !customReportData.content) {
      toast.error('Veuillez remplir le titre et le contenu du rapport');
      return;
    }

    if (sendToUsers) {
      if (selectedUserIds.length === 0) {
        toast.error('Veuillez sélectionner au moins un utilisateur');
        return;
      }
    } else {
      if (!customReportData.recipientEmail) {
        toast.error('Veuillez remplir l\'adresse email du destinataire');
        return;
      }
    }

    setIsGenerating(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      if (sendToUsers) {
        const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
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
              period: period === 'custom' ? undefined : period,
              reportId: sharedReportId,
            });

            if (result && 'data' in result && result.data) {
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
        const result = await sendReportByEmail({
          title: customReportData.title,
          content: customReportData.content,
          recipientEmail: customReportData.recipientEmail,
          recipientName: customReportData.recipientName,
          attachPdf: customReportData.attachPdf,
          period: period === 'custom' ? undefined : period,
        });

        if (result && 'data' in result && result.data) {
          toast.success(result.data.message || 'Rapport envoyé avec succès !');
          successCount = 1;
        } else {
          const errorMessage = result && 'serverError' in result ? result.serverError : "Erreur lors de l'envoi du rapport";
          toast.error(errorMessage);
          errorCount = 1;
        }
      }

      if (successCount > 0) {
        setSendEmailDialogOpen(false);
        onOpenChange(false);
        resetForm();
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending report:', error);
      toast.error("Erreur lors de l'envoi du rapport");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Dialogue principal - Création du rapport */}
      <Dialog open={open} onOpenChange={onOpenChange}>
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
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={isGenerating}
              className="sm:mr-auto w-full sm:w-auto text-xs sm:text-sm"
            >
              Annuler
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveReport}
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
                    toast.error('Veuillez remplir le titre et le contenu du rapport');
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
                onClick={() => handleGenerateCustomReport('word')}
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
                onClick={() => handleGenerateCustomReport('pdf')}
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
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <Checkbox
                id="send-to-users"
                checked={sendToUsers}
                onCheckedChange={(checked) => {
                  setSendToUsers(checked as boolean);
                  if (checked) {
                    setCustomReportData({ ...customReportData, recipientEmail: '', recipientName: '' });
                  } else {
                    setSelectedUserIds([]);
                  }
                }}
              />
              <Label htmlFor="send-to-users" className="cursor-pointer font-medium">
                Envoyer aux utilisateurs sélectionnés
              </Label>
            </div>

            {sendToUsers ? (
              <div className="space-y-2">
                <Label>Sélectionner les utilisateurs *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Choisissez les utilisateurs qui recevront le rapport
                </p>
                <ScrollArea className="h-[300px] border rounded-md p-4 bg-background">
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
              <>
                <div className="space-y-2">
                  <Label htmlFor="recipient-name">Nom du destinataire</Label>
                  <Input
                    id="recipient-name"
                    placeholder="Ex: Jean Dupont"
                    value={customReportData.recipientName}
                    onChange={(e) =>
                      setCustomReportData({ ...customReportData, recipientName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient-email">Email du destinataire *</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={customReportData.recipientEmail}
                    onChange={(e) =>
                      setCustomReportData({ ...customReportData, recipientEmail: e.target.value })
                    }
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
    </>
  );
}
