import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createHRTimesheet,
  updateHRTimesheet,
  deleteHRTimesheet,
  submitHRTimesheet,
  cancelHRTimesheetSubmission,
  managerApproveHRTimesheet,
  odillonApproveHRTimesheet,
  addHRActivity,
  updateHRActivity,
  deleteHRActivity,
} from "@/actions/hr-timesheet.actions";
import { QUERY_KEYS } from "@/providers/query-provider";

/**
 * ⚡ Phase 3 - Optimistic Updates pour HR Timesheet
 *
 * Hooks React Query avec optimistic updates pour UI instantanée:
 * 1. onMutate: Mise à jour immédiate du cache (UI instantanée)
 * 2. API call: Requête serveur en arrière-plan
 * 3. onSuccess: Confirmation et synchronisation
 * 4. onError: Rollback automatique
 *
 * Pattern identique à use-task-mutations.ts pour cohérence
 */

// ============================================
// CREATE TIMESHEET (Optimistic)
// ============================================

/**
 * Hook pour créer une feuille de temps RH avec optimistic update
 *
 * ⚡ UI instantanée - La feuille apparaît immédiatement dans la liste
 */
export function useCreateHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHRTimesheet,

    onMutate: async (variables) => {
      // Annuler les refetch en cours
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });

      // Snapshot pour rollback
      const previousTimesheets = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.lists());

      // Créer un timesheet temporaire avec ID optimiste
      const optimisticTimesheet = {
        id: `temp-${Date.now()}`,
        ...variables,
        status: "DRAFT",
        totalHours: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        HRActivity: [],
      };

      // Mise à jour optimiste du cache
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), (old: any) => {
        if (!old) return [optimisticTimesheet];
        return [optimisticTimesheet, ...old];
      });

      toast.loading("Création de la feuille de temps...", { id: "create-hr-timesheet" });

      return { previousTimesheets, optimisticTimesheet };
    },

    onSuccess: (data, variables, context) => {
      toast.success("Feuille de temps créée", { id: "create-hr-timesheet" });

      // Remplacer la feuille optimiste par la vraie
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), (old: any) => {
        if (!old) return [data];
        return old.map((ts: any) =>
          ts.id === context.optimisticTimesheet.id ? data : ts
        );
      });

      // Synchroniser avec le serveur
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousTimesheets) {
        queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), context.previousTimesheets);
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la création";
      toast.error(errorMessage, { id: "create-hr-timesheet" });
    },
  });
}

// ============================================
// UPDATE TIMESHEET (Optimistic)
// ============================================

/**
 * Hook pour mettre à jour une feuille de temps avec optimistic update
 *
 * ⚡ UI instantanée - Les changements apparaissent immédiatement
 */
export function useUpdateHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHRTimesheet,

    onMutate: async ({ id, data: updates }) => {
      // Annuler les refetch en cours
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(id) });

      // Snapshot pour rollback
      const previousLists = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.lists());
      const previousDetail = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.detail(id));

      // Mise à jour optimiste des listes
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), (old: any) => {
        if (!old) return old;
        return old.map((ts: any) =>
          ts.id === id
            ? { ...ts, ...updates, updatedAt: new Date() }
            : ts
        );
      });

      // Mise à jour optimiste du détail
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, ...updates, updatedAt: new Date() };
      });

      toast.loading("Mise à jour...", { id: `update-hr-timesheet-${id}` });

      return { previousLists, previousDetail, id };
    },

    onSuccess: (data, variables, context) => {
      toast.success("Feuille mise à jour", { id: `update-hr-timesheet-${context.id}` });

      // Synchroniser avec le serveur
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(context.id) });
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousLists) {
        queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), context.previousLists);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.hrTimesheets.detail(context.id),
          context.previousDetail
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la mise à jour";
      toast.error(errorMessage, { id: `update-hr-timesheet-${context?.id}` });
    },
  });
}

// ============================================
// DELETE TIMESHEET (Optimistic)
// ============================================

/**
 * Hook pour supprimer une feuille de temps avec optimistic update
 *
 * ⚡ UI instantanée - La feuille disparaît immédiatement de la liste
 */
export function useDeleteHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHRTimesheet,

    onMutate: async ({ timesheetId: id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });

      const previousLists = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.lists());

      // Suppression optimiste
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), (old: any) => {
        if (!old) return old;
        return old.filter((ts: any) => ts.id !== id);
      });

      // Supprimer du cache de détail
      queryClient.removeQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(id) });

      toast.loading("Suppression...", { id: `delete-hr-timesheet-${id}` });

      return { previousLists, id };
    },

    onSuccess: (data, variables, context) => {
      toast.success("Feuille supprimée", { id: `delete-hr-timesheet-${context.id}` });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousLists) {
        queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), context.previousLists);
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la suppression";
      toast.error(errorMessage, { id: `delete-hr-timesheet-${context?.id}` });
    },
  });
}

// ============================================
// SUBMIT TIMESHEET (Optimistic Status Change)
// ============================================

/**
 * Hook pour soumettre une feuille de temps avec optimistic update
 *
 * ⚡ UI instantanée - Le statut passe à PENDING immédiatement
 */
export function useSubmitHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitHRTimesheet,

    onMutate: async ({ timesheetId: id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(id) });

      const previousLists = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.lists());
      const previousDetail = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.detail(id));

      const now = new Date();

      // Mise à jour optimiste du statut
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), (old: any) => {
        if (!old) return old;
        return old.map((ts: any) =>
          ts.id === id
            ? {
                ...ts,
                status: "PENDING",
                employeeSignedAt: now,
                updatedAt: now,
              }
            : ts
        );
      });

      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.detail(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: "PENDING",
          employeeSignedAt: now,
          updatedAt: now,
        };
      });

      toast.loading("Soumission...", { id: `submit-hr-timesheet-${id}` });

      return { previousLists, previousDetail, id };
    },

    onSuccess: (data, variables, context) => {
      toast.success("Feuille soumise pour validation", { id: `submit-hr-timesheet-${context.id}` });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(context.id) });
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousLists) {
        queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), context.previousLists);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.hrTimesheets.detail(context.id),
          context.previousDetail
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la soumission";
      toast.error(errorMessage, { id: `submit-hr-timesheet-${context?.id}` });
    },
  });
}

// ============================================
// CANCEL SUBMISSION (Optimistic Status Change)
// ============================================

/**
 * Hook pour annuler la soumission avec optimistic update
 *
 * ⚡ UI instantanée - Le statut revient à DRAFT immédiatement
 */
export function useCancelHRTimesheetSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelHRTimesheetSubmission,

    onMutate: async ({ timesheetId: id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(id) });

      const previousLists = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.lists());
      const previousDetail = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.detail(id));

      // Mise à jour optimiste du statut
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), (old: any) => {
        if (!old) return old;
        return old.map((ts: any) =>
          ts.id === id
            ? {
                ...ts,
                status: "DRAFT",
                employeeSignedAt: null,
                updatedAt: new Date(),
              }
            : ts
        );
      });

      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.detail(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: "DRAFT",
          employeeSignedAt: null,
          updatedAt: new Date(),
        };
      });

      toast.loading("Annulation...", { id: `cancel-hr-timesheet-${id}` });

      return { previousLists, previousDetail, id };
    },

    onSuccess: (data, variables, context) => {
      toast.success("Soumission annulée", { id: `cancel-hr-timesheet-${context.id}` });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(context.id) });
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousLists) {
        queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), context.previousLists);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.hrTimesheets.detail(context.id),
          context.previousDetail
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de l'annulation";
      toast.error(errorMessage, { id: `cancel-hr-timesheet-${context?.id}` });
    },
  });
}

// ============================================
// ADD ACTIVITY (Optimistic)
// ============================================

/**
 * Hook pour ajouter une activité avec optimistic update
 *
 * ⚡ UI instantanée - L'activité apparaît immédiatement dans la liste
 */
export function useAddHRActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addHRActivity,

    onMutate: async ({ timesheetId, activity }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(timesheetId) });

      const previousDetail = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.detail(timesheetId));

      // Créer une activité temporaire
      const optimisticActivity = {
        id: `temp-${Date.now()}`,
        ...activity,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mise à jour optimiste - ajouter l'activité au timesheet
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.detail(timesheetId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          HRActivity: [...(old.HRActivity || []), optimisticActivity],
          totalHours: old.totalHours + (activity.totalHours || 0),
          updatedAt: new Date(),
        };
      });

      toast.loading("Ajout de l'activité...", { id: `add-activity-${timesheetId}` });

      return { previousDetail, timesheetId, optimisticActivity };
    },

    onSuccess: (data, variables, context) => {
      toast.success("Activité ajoutée", { id: `add-activity-${context.timesheetId}` });

      // Remplacer l'activité optimiste par la vraie
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.detail(context.timesheetId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          HRActivity: old.HRActivity.map((a: any) =>
            a.id === context.optimisticActivity.id ? data : a
          ),
        };
      });

      // Synchroniser
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(context.timesheetId) });
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.hrTimesheets.detail(context.timesheetId),
          context.previousDetail
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de l'ajout";
      toast.error(errorMessage, { id: `add-activity-${context?.timesheetId}` });
    },
  });
}

// ============================================
// UPDATE ACTIVITY (Optimistic)
// ============================================

/**
 * Hook pour modifier une activité avec optimistic update
 *
 * ⚡ UI instantanée - Les changements apparaissent immédiatement
 */
export function useUpdateHRActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHRActivity,

    onMutate: async ({ id, data: updates, timesheetId }: any) => {
      if (!timesheetId) return {};

      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(timesheetId) });

      const previousDetail = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.detail(timesheetId));

      // Mise à jour optimiste de l'activité
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.detail(timesheetId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          HRActivity: old.HRActivity.map((a: any) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
          ),
          updatedAt: new Date(),
        };
      });

      toast.loading("Mise à jour de l'activité...", { id: `update-activity-${id}` });

      return { previousDetail, timesheetId, id };
    },

    onSuccess: (data, variables, context) => {
      toast.success("Activité mise à jour", { id: `update-activity-${context.id}` });

      if (context.timesheetId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(context.timesheetId) });
      }
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousDetail && context?.timesheetId) {
        queryClient.setQueryData(
          QUERY_KEYS.hrTimesheets.detail(context.timesheetId),
          context.previousDetail
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la mise à jour";
      toast.error(errorMessage, { id: `update-activity-${context?.id}` });
    },
  });
}

// ============================================
// DELETE ACTIVITY (Optimistic)
// ============================================

/**
 * Hook pour supprimer une activité avec optimistic update
 *
 * ⚡ UI instantanée - L'activité disparaît immédiatement
 */
export function useDeleteHRActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHRActivity,

    onMutate: async ({ timesheetId, activityId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(timesheetId) });

      const previousDetail = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.detail(timesheetId));

      // Suppression optimiste de l'activité
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.detail(timesheetId), (old: any) => {
        if (!old) return old;
        const removedActivity = old.HRActivity.find((a: any) => a.id === activityId);
        return {
          ...old,
          HRActivity: old.HRActivity.filter((a: any) => a.id !== activityId),
          totalHours: old.totalHours - (removedActivity?.totalHours || 0),
          updatedAt: new Date(),
        };
      });

      toast.loading("Suppression de l'activité...", { id: `delete-activity-${activityId}` });

      return { previousDetail, timesheetId, activityId };
    },

    onSuccess: (data, variables, context) => {
      toast.success("Activité supprimée", { id: `delete-activity-${context.activityId}` });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(context.timesheetId) });
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.hrTimesheets.detail(context.timesheetId),
          context.previousDetail
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la suppression";
      toast.error(errorMessage, { id: `delete-activity-${context?.activityId}` });
    },
  });
}

// ============================================
// MANAGER APPROVE (Optimistic Status Change)
// ============================================

/**
 * Hook pour validation manager avec optimistic update
 *
 * ⚡ UI instantanée - Le statut change immédiatement
 */
export function useManagerApproveHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: managerApproveHRTimesheet,

    onMutate: async ({ timesheetId, action, comments }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(timesheetId) });

      const previousLists = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.lists());
      const previousDetail = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.detail(timesheetId));

      const newStatus = action === "approve" ? "MANAGER_APPROVED" : "REJECTED";
      const now = new Date();

      // Mise à jour optimiste
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), (old: any) => {
        if (!old) return old;
        return old.map((ts: any) =>
          ts.id === timesheetId
            ? {
                ...ts,
                status: newStatus,
                managerSignedAt: now,
                managerComments: comments,
                updatedAt: now,
              }
            : ts
        );
      });

      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.detail(timesheetId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: newStatus,
          managerSignedAt: now,
          managerComments: comments,
          updatedAt: now,
        };
      });

      toast.loading(
        action === "approve" ? "Approbation..." : "Rejet...",
        { id: `manager-approve-${timesheetId}` }
      );

      return { previousLists, previousDetail, timesheetId, action };
    },

    onSuccess: (data, variables, context) => {
      toast.success(
        context.action === "approve" ? "Feuille approuvée" : "Feuille rejetée",
        { id: `manager-approve-${context.timesheetId}` }
      );

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(context.timesheetId) });
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousLists) {
        queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), context.previousLists);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.hrTimesheets.detail(context.timesheetId),
          context.previousDetail
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la validation";
      toast.error(errorMessage, { id: `manager-approve-${context?.timesheetId}` });
    },
  });
}

// ============================================
// ODILLON APPROVE (Optimistic Status Change)
// ============================================

/**
 * Hook pour validation Odillon/Admin avec optimistic update
 *
 * ⚡ UI instantanée - Le statut change immédiatement
 */
export function useOdillonApproveHRTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: odillonApproveHRTimesheet,

    onMutate: async ({ timesheetId, action, comments }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(timesheetId) });

      const previousLists = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.lists());
      const previousDetail = queryClient.getQueryData(QUERY_KEYS.hrTimesheets.detail(timesheetId));

      const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
      const now = new Date();

      // Mise à jour optimiste
      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), (old: any) => {
        if (!old) return old;
        return old.map((ts: any) =>
          ts.id === timesheetId
            ? {
                ...ts,
                status: newStatus,
                odillonSignedAt: now,
                odillonComments: comments,
                updatedAt: now,
              }
            : ts
        );
      });

      queryClient.setQueryData(QUERY_KEYS.hrTimesheets.detail(timesheetId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: newStatus,
          odillonSignedAt: now,
          odillonComments: comments,
          updatedAt: now,
        };
      });

      toast.loading(
        action === "approve" ? "Validation finale..." : "Rejet...",
        { id: `odillon-approve-${timesheetId}` }
      );

      return { previousLists, previousDetail, timesheetId, action };
    },

    onSuccess: (data, variables, context) => {
      toast.success(
        context.action === "approve" ? "Feuille validée définitivement" : "Feuille rejetée",
        { id: `odillon-approve-${context.timesheetId}` }
      );

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hrTimesheets.detail(context.timesheetId) });
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousLists) {
        queryClient.setQueryData(QUERY_KEYS.hrTimesheets.lists(), context.previousLists);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.hrTimesheets.detail(context.timesheetId),
          context.previousDetail
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la validation";
      toast.error(errorMessage, { id: `odillon-approve-${context?.timesheetId}` });
    },
  });
}

// ============================================
// NOTES D'UTILISATION
// ============================================
/**
 * ⚡ OPTIMISTIC UPDATES - AVANTAGES:
 *
 * 1. UI Instantanée (0ms de latence perçue)
 *    - Les changements apparaissent immédiatement
 *    - Pas d'attente de la réponse serveur
 *    - Meilleure expérience utilisateur
 *
 * 2. Rollback Automatique
 *    - Si l'API échoue, l'UI revient à l'état précédent
 *    - Pas de données incohérentes
 *    - Toast d'erreur automatique
 *
 * 3. Synchronisation Serveur
 *    - Après succès, invalidation du cache
 *    - React Query refetch pour garantir cohérence
 *    - Données serveur toujours en source de vérité
 *
 * 4. Exemples d'utilisation:
 *
 *    function TimesheetCard({ timesheet }) {
 *      const submitTimesheet = useSubmitHRTimesheet();
 *
 *      return (
 *        <Card>
 *          <p>Statut: {timesheet.status}</p>
 *          <Button
 *            onClick={() => submitTimesheet.mutate({ timesheetId: timesheet.id })}
 *            disabled={submitTimesheet.isPending}
 *          >
 *            Soumettre
 *          </Button>
 *        </Card>
 *      );
 *    }
 *
 *    // Le statut passe immédiatement à PENDING dans l'UI,
 *    // même avant que le serveur réponde !
 *
 * 5. Combiné avec Realtime:
 *    - Optimistic update pour vos propres actions
 *    - Realtime pour les actions des autres utilisateurs
 *    - Système ultra-réactif à 360°
 */
