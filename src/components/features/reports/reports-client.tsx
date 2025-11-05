'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FilePlus } from 'lucide-react';
import { SpinnerCustom } from '@/components/features/loading-spinner';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { exportTimesheetToExcel, exportTimesheetToPDF } from '@/actions/export.actions';
import { ReportsHistorySection } from './reports-history-section';
import { ReportsCustomDialog } from './reports-custom-dialog';

type Period = 'week' | 'month' | 'quarter' | 'year' | 'custom';
type ReportType = 'summary' | 'detailed' | 'by-project' | 'by-user';

interface ReportsClientProps {
  initialPeriod: Period;
  initialReportType: ReportType;
  initialReports: any[];
  initialUsers: any[];
}

function getPeriodDates(period: Period) {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay() + 1); // Lundi
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Dimanche
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      endDate = now;
  }

  return { startDate, endDate };
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

export function ReportsClient({
  initialPeriod,
  initialReportType,
  initialReports,
  initialUsers,
}: ReportsClientProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [reportType, setReportType] = useState<ReportType>(initialReportType);
  const [isLoading, setIsLoading] = useState(false);
  const [customReportDialogOpen, setCustomReportDialogOpen] = useState(false);

  const handlePeriodChange = (value: Period) => {
    setPeriod(value);
    // Mettre à jour l'URL pour déclencher un refresh côté serveur
    const searchParams = new URLSearchParams();
    searchParams.set('period', value);
    searchParams.set('type', reportType);
    router.push(`/dashboard/reports?${searchParams.toString()}`);
  };

  const handleReportTypeChange = (value: ReportType) => {
    setReportType(value);
    // Mettre à jour l'URL pour déclencher un refresh côté serveur
    const searchParams = new URLSearchParams();
    searchParams.set('period', period);
    searchParams.set('type', value);
    router.push(`/dashboard/reports?${searchParams.toString()}`);
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates(period);

      const result =
        format === 'excel'
          ? await exportTimesheetToExcel({ startDate, endDate })
          : await exportTimesheetToPDF({ startDate, endDate });

      if (result && 'data' in result && result.data) {
        // Create download link
        const blob = base64ToBlob(result.data.data, result.data.mimeType);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
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
      console.error('Export error:', error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec boutons d'action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Analysez vos données de temps et générez des rapports
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            className="bg-primary hover:bg-primary w-full sm:w-auto text-xs sm:text-sm"
            onClick={() => setCustomReportDialogOpen(true)}
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Nouveau rapport
          </Button>

          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={isLoading}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={isLoading}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filtres de période et type de rapport */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportType} onValueChange={handleReportTypeChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
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

      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <SpinnerCustom />
        </div>
      )}

      {/* Dialogue de rapport personnalisé */}
      <ReportsCustomDialog
        open={customReportDialogOpen}
        onOpenChange={setCustomReportDialogOpen}
        period={period}
        users={initialUsers}
        onSuccess={() => router.refresh()}
      />

      {/* Section historique des rapports */}
      <ReportsHistorySection reports={initialReports} onUpdate={() => router.refresh()} />
    </div>
  );
}
