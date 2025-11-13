"use client";

// ============================================
// HOOKS REACT QUERY POUR LES HR TIMESHEETS
// ============================================
// Hooks optimisés avec React Query pour gérer le cache automatiquement

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/providers/query-provider";
import {
  createHRTimesheet,
  getMyHRTimesheets,
  getHRTimesheetsForApproval,
  getHRTimesheet,
  updateHRTimesheet,
  deleteHRTimesheet,
  addHRActivity,
  updateHRActivity,
  deleteHRActivity,
  submitHRTimesheet,
  cancelHRTimesheetSubmission,
  managerApproveHRTimesheet,
  odillonApproveHRTimesheet,
  getActivityCatalog,
  getHRTimesheetStats,
  updateHRTimesheetStatus,
} from "@/actions/hr-timesheet.actions";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================
interface HRTimesheetFilters {
  status?: "DRAFT" | "PENDING" | "MANAGER_APPROVED" | "APPROVED" | "REJECTED";
  weekStartDate?: Date;
  weekEndDate?: Date;
}

// ============================================
// QUERY: Récupérer mes timesheets avec cache
// ============================================
export function useMyHRTimesheets(filters: HRTimesheetFilters = {}) {
  return useQuery({
    queryKey: ["hr-timesheets", "my", filters],
    queryFn: async () => {
      const result = await getMyHRTimesheets({
        status: filters.status,
        weekStartDate: filters.weekStartDate,
        weekEndDate: filters.weekEndDate,
      });

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la récupération des timesheets");
      }

      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================
// QUERY: Récupérer les timesheets à approuver
// ============================================
export function useHRTimesheetsForApproval() {
  return useQuery({
    queryKey: ["hr-timesheets", "for-approval"],
    queryFn: async () => {
      const result = await getHRTimesheetsForApproval({});

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la récupération des timesheets");
      }

      return result.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute (données plus critiques)
  });
}

// ============================================
// QUERY: Récupérer un timesheet par ID
// ============================================
export function useHRTimesheet(timesheetId: string | undefined | null) {
  return useQuery({
    queryKey: timesheetId ? ["hr-timesheets", "detail", timesheetId] : ["hr-timesheets", "empty"],
    queryFn: async () => {
      if (!timesheetId) throw new Error("Timesheet ID requis");

      const result = await getHRTimesheet({ timesheetId });

      if (!result?.data) {
        throw new Error(result?.serverError || "Timesheet non trouvé");
      }

      return result.data;
    },
    enabled: !!timesheetId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// QUERY: Récupérer les statistiques
// ============================================
export function useHRTimesheetStats(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ["hr-timesheets", "stats", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const result = await getHRTimesheetStats({ startDate, endDate });

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la récupération des statistiques");
      }

      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// QUERY: Récupérer le catalogue d'activités
// ============================================
export function useActivityCatalog(filters?: { category?: string }) {
  return useQuery({
    queryKey: ["activity-catalog", filters],
    queryFn: async () => {
      const result = await getActivityCatalog({
        category: filters?.category,
      });

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la récupération du catalogue");
      }

      return result.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (données quasi-statiques)
  });
}

// ============================================
// MUTATION: Créer un timesheet
// ============================================
export function useCreateHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof createHRTimesheet>[0]) => {
      const result = await createHRTimesheet(data);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la création");
      }

      return result.data;
    },
    onSuccess: () => {
      // ⚡ Invalider les listes de timesheets
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "my"] });
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "stats"] });

      toast.success("Feuille de temps créée avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });
}

// ============================================
// MUTATION: Mettre à jour un timesheet
// ============================================
export function useUpdateHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof updateHRTimesheet>[0]) => {
      const result = await updateHRTimesheet(data);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la mise à jour");
      }

      return result.data;
    },
    onSuccess: (updatedTimesheet) => {
      // ⚡ Mettre à jour le cache
      queryClient.setQueryData(["hr-timesheets", "detail", updatedTimesheet.id], updatedTimesheet);

      // ⚡ Invalider les listes
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "my"] });

      toast.success("Feuille de temps mise à jour");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });
}

// ============================================
// MUTATION: Supprimer un timesheet
// ============================================
export function useDeleteHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timesheetId: string) => {
      const result = await deleteHRTimesheet({ timesheetId });

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la suppression");
      }

      return result.data;
    },
    onSuccess: (_, timesheetId) => {
      // ⚡ Supprimer du cache
      queryClient.removeQueries({ queryKey: ["hr-timesheets", "detail", timesheetId] });

      // ⚡ Invalider les listes
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "my"] });
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "stats"] });

      toast.success("Feuille de temps supprimée");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });
}

// ============================================
// MUTATION: Ajouter une activité
// ============================================
export function useAddHRActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { timesheetId: string; activity: any }) => {
      const result = await addHRActivity(data);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de l'ajout de l'activité");
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      // ⚡ Invalider le cache du timesheet pour rafraîchir les activités
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "detail", variables.timesheetId] });

      toast.success("Activité ajoutée");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'ajout de l'activité");
    },
  });
}

// ============================================
// MUTATION: Mettre à jour une activité
// ============================================
export function useUpdateHRActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; data: any; timesheetId?: string }) => {
      const { timesheetId, ...apiData } = data;
      const result = await updateHRActivity(apiData);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la mise à jour de l'activité");
      }

      return { ...result.data, timesheetId };
    },
    onSuccess: (data) => {
      // ⚡ Invalider le cache du timesheet si on a l'ID
      if (data.timesheetId) {
        queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "detail", data.timesheetId] });
      }

      toast.success("Activité mise à jour");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la mise à jour de l'activité");
    },
  });
}

// ============================================
// MUTATION: Supprimer une activité
// ============================================
export function useDeleteHRActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { timesheetId: string; activityId: string }) => {
      const result = await deleteHRActivity(data);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la suppression de l'activité");
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      // ⚡ Invalider le cache du timesheet
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "detail", variables.timesheetId] });

      toast.success("Activité supprimée");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la suppression de l'activité");
    },
  });
}

// ============================================
// MUTATION: Soumettre un timesheet
// ============================================
export function useSubmitHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timesheetId: string) => {
      const result = await submitHRTimesheet({ timesheetId });

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la soumission");
      }

      return result.data;
    },
    onSuccess: (updatedTimesheet) => {
      // ⚡ Mettre à jour le cache
      queryClient.setQueryData(["hr-timesheets", "detail", updatedTimesheet.id], updatedTimesheet);

      // ⚡ Invalider les listes
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "my"] });
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "for-approval"] });

      toast.success("Feuille de temps soumise pour approbation");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la soumission");
    },
  });
}

// ============================================
// MUTATION: Annuler la soumission
// ============================================
export function useCancelHRTimesheetSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timesheetId: string) => {
      const result = await cancelHRTimesheetSubmission({ timesheetId });

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de l'annulation");
      }

      return result.data;
    },
    onSuccess: (updatedTimesheet) => {
      // ⚡ Mettre à jour le cache
      queryClient.setQueryData(["hr-timesheets", "detail", updatedTimesheet.id], updatedTimesheet);

      // ⚡ Invalider les listes
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "my"] });

      toast.success("Soumission annulée");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'annulation");
    },
  });
}

// ============================================
// MUTATION: Approbation manager
// ============================================
export function useManagerApproveHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { timesheetId: string; action: "approve" | "reject"; comments?: string }) => {
      const result = await managerApproveHRTimesheet(data);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de l'approbation");
      }

      return result.data;
    },
    onSuccess: (updatedTimesheet) => {
      // ⚡ Mettre à jour le cache
      queryClient.setQueryData(["hr-timesheets", "detail", updatedTimesheet.id], updatedTimesheet);

      // ⚡ Invalider les listes
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "for-approval"] });

      toast.success("Feuille de temps approuvée");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'approbation");
    },
  });
}

// ============================================
// MUTATION: Approbation Odillon
// ============================================
export function useOdillonApproveHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { timesheetId: string; action: "approve" | "reject"; comments?: string }) => {
      const result = await odillonApproveHRTimesheet(data);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de l'approbation");
      }

      return result.data;
    },
    onSuccess: (updatedTimesheet) => {
      // ⚡ Mettre à jour le cache
      queryClient.setQueryData(["hr-timesheets", "detail", updatedTimesheet.id], updatedTimesheet);

      // ⚡ Invalider les listes
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "for-approval"] });

      toast.success("Feuille de temps approuvée par Odillon");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'approbation");
    },
  });
}

// ============================================
// MUTATION: Changer le statut
// ============================================
export function useUpdateHRTimesheetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      timesheetId: string;
      status: "DRAFT" | "PENDING" | "MANAGER_APPROVED" | "APPROVED" | "REJECTED";
    }) => {
      const result = await updateHRTimesheetStatus(data);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors du changement de statut");
      }

      return result.data;
    },
    onMutate: async ({ timesheetId, status }) => {
      // ⚡ OPTIMISTIC UPDATE
      await queryClient.cancelQueries({ queryKey: ["hr-timesheets", "detail", timesheetId] });

      const previousTimesheet = queryClient.getQueryData(["hr-timesheets", "detail", timesheetId]);

      queryClient.setQueryData(["hr-timesheets", "detail", timesheetId], (old: any) => {
        if (!old) return old;
        return { ...old, status };
      });

      return { previousTimesheet };
    },
    onError: (error: Error, variables, context) => {
      // ⚡ ROLLBACK en cas d'erreur
      if (context?.previousTimesheet) {
        queryClient.setQueryData(["hr-timesheets", "detail", variables.timesheetId], context.previousTimesheet);
      }
      toast.error(error.message || "Erreur lors du changement de statut");
    },
    onSuccess: (updatedTimesheet) => {
      // ⚡ Confirmer le cache
      queryClient.setQueryData(["hr-timesheets", "detail", updatedTimesheet.id], updatedTimesheet);
      queryClient.invalidateQueries({ queryKey: ["hr-timesheets", "my"] });
    },
  });
}

// ============================================
// NOTES D'UTILISATION
// ============================================
// 1. Ces hooks gèrent automatiquement:
//    - Le cache (2-30 minutes selon le type de données)
//    - Le loading state
//    - Les erreurs
//    - Les invalidations de cache après mutations
//    - Les optimistic updates pour le statut
//    - Le retry automatique en cas d'échec
//
// 2. Exemple d'utilisation:
//
//    function TimesheetList() {
//      const { data: timesheets, isLoading } = useMyHRTimesheets({ status: "DRAFT" });
//      const submitTimesheet = useSubmitHRTimesheet();
//
//      return (
//        <div>
//          {timesheets?.map(timesheet => (
//            <TimesheetCard
//              key={timesheet.id}
//              timesheet={timesheet}
//              onSubmit={() => submitTimesheet.mutate(timesheet.id)}
//            />
//          ))}
//        </div>
//      );
//    }
