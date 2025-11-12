/**
 * Interface pour les données du rapport utilisée par tous les exports
 */
export interface ReportData {
  title: string;
  content: string;
  period?: string;
  author?: string;
  createdAt?: Date;
  metadata?: Record<string, any>;
  activities?: Array<{
    name: string;
    type: string;
    periodicity: string;
    hours: number;
    status: string;
  }>;
}
