import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createTask,
  updateTask,
  updateTaskStatus,
  updateTaskPriority,
  deleteTask,
} from "@/actions/task.actions";
import { QUERY_KEYS } from "@/providers/query-provider";

/**
 * Hook pour créer une tâche avec optimistic update
 *
 * ⚡ Fonctionnement :
 * 1. onMutate : Ajoute immédiatement la tâche au cache local (UI instantanée)
 * 2. API call : Envoie la requête au serveur en arrière-plan
 * 3. onSuccess : Confirme l'ajout et synchronise avec le serveur
 * 4. onError : Rollback automatique en cas d'échec
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,

    onMutate: async (variables) => {
      // Annuler les refetch en cours pour éviter qu'ils écrasent notre update
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.lists() });

      // Snapshot des données avant mutation (pour rollback)
      const previousTasks = queryClient.getQueryData(QUERY_KEYS.tasks.lists());

      // Créer une tâche temporaire avec ID optimiste
      const optimisticTask = {
        id: `temp-${Date.now()}`,
        ...variables,
        status: variables.status || "TODO",
        priority: variables.priority || "MEDIUM",
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      // Mise à jour optimiste du cache
      queryClient.setQueryData(QUERY_KEYS.tasks.lists(), (old: any) => {
        if (!old) return [optimisticTask];
        return [optimisticTask, ...old];
      });

      // Toast de feedback immédiat
      toast.loading("Création de la tâche...", { id: "create-task" });

      return { previousTasks, optimisticTask };
    },

    onSuccess: (data, variables, context) => {
      toast.success("Tâche créée avec succès", { id: "create-task" });

      // Remplacer la tâche optimiste par la vraie
      queryClient.setQueryData(QUERY_KEYS.tasks.lists(), (old: any) => {
        if (!old) return [data];
        return old.map((task: any) =>
          task.id === context.optimisticTask.id ? data : task
        );
      });

      // Invalidate pour synchroniser avec le serveur
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() });
    },

    onError: (error, variables, context) => {
      // Rollback vers l'état précédent
      if (context?.previousTasks) {
        queryClient.setQueryData(QUERY_KEYS.tasks.lists(), context.previousTasks);
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la création";
      toast.error(errorMessage, { id: "create-task" });
    },
  });
}

/**
 * Hook pour mettre à jour une tâche avec optimistic update
 *
 * ⚡ Fonctionnement :
 * 1. Met à jour immédiatement la tâche dans le cache
 * 2. Envoie la requête au serveur
 * 3. Rollback automatique si échec
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,

    onMutate: async ({ id, ...updates }) => {
      // Annuler les refetch en cours
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.lists() });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.detail(id) });

      // Snapshot pour rollback
      const previousLists = queryClient.getQueryData(QUERY_KEYS.tasks.lists());
      const previousDetail = queryClient.getQueryData(QUERY_KEYS.tasks.detail(id));

      // Mise à jour optimiste des listes
      queryClient.setQueryData(QUERY_KEYS.tasks.lists(), (old: any) => {
        if (!old) return old;
        return old.map((task: any) =>
          task.id === id
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        );
      });

      // Mise à jour optimiste du détail
      queryClient.setQueryData(QUERY_KEYS.tasks.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, ...updates, updatedAt: new Date() };
      });

      toast.loading("Mise à jour...", { id: `update-task-${id}` });

      return { previousLists, previousDetail, id };
    },

    onSuccess: (data, variables, context) => {
      toast.success("Tâche mise à jour", { id: `update-task-${context.id}` });

      // Synchroniser avec le serveur
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.detail(context.id) });
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousLists) {
        queryClient.setQueryData(QUERY_KEYS.tasks.lists(), context.previousLists);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.tasks.detail(context.id),
          context.previousDetail
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la mise à jour";
      toast.error(errorMessage, { id: `update-task-${context?.id}` });
    },
  });
}

/**
 * Hook pour changer le statut d'une tâche avec optimistic update
 *
 * ⚡ UI ultra-réactive - Changement instantané du statut
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTaskStatus,

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.lists() });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.detail(id) });

      const previousLists = queryClient.getQueryData(QUERY_KEYS.tasks.lists());
      const previousDetail = queryClient.getQueryData(QUERY_KEYS.tasks.detail(id));

      // Mise à jour optimiste
      const now = new Date();
      queryClient.setQueryData(QUERY_KEYS.tasks.lists(), (old: any) => {
        if (!old) return old;
        return old.map((task: any) =>
          task.id === id
            ? {
                ...task,
                status,
                completedAt: status === "DONE" ? now : task.completedAt,
                updatedAt: now,
              }
            : task
        );
      });

      queryClient.setQueryData(QUERY_KEYS.tasks.detail(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status,
          completedAt: status === "DONE" ? now : old.completedAt,
          updatedAt: now,
        };
      });

      toast.loading("Changement de statut...", { id: `status-${id}` });

      return { previousLists, previousDetail, id };
    },

    onSuccess: (data, variables, context) => {
      const statusLabels: Record<string, string> = {
        TODO: "À faire",
        IN_PROGRESS: "En cours",
        REVIEW: "En revue",
        DONE: "Terminé",
        BLOCKED: "Bloqué",
      };

      toast.success(`Statut: ${statusLabels[variables.status]}`, {
        id: `status-${context.id}`,
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.detail(context.id) });
    },

    onError: (error, variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(QUERY_KEYS.tasks.lists(), context.previousLists);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.tasks.detail(context.id),
          context.previousDetail
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors du changement";
      toast.error(errorMessage, { id: `status-${context?.id}` });
    },
  });
}

/**
 * Hook pour changer la priorité d'une tâche avec optimistic update
 *
 * ⚡ Changement instantané de la priorité
 */
export function useUpdateTaskPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTaskPriority,

    onMutate: async ({ id, priority }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.lists() });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.detail(id) });

      const previousLists = queryClient.getQueryData(QUERY_KEYS.tasks.lists());
      const previousDetail = queryClient.getQueryData(QUERY_KEYS.tasks.detail(id));

      // Mise à jour optimiste
      queryClient.setQueryData(QUERY_KEYS.tasks.lists(), (old: any) => {
        if (!old) return old;
        return old.map((task: any) =>
          task.id === id ? { ...task, priority, updatedAt: new Date() } : task
        );
      });

      queryClient.setQueryData(QUERY_KEYS.tasks.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, priority, updatedAt: new Date() };
      });

      toast.loading("Changement de priorité...", { id: `priority-${id}` });

      return { previousLists, previousDetail, id };
    },

    onSuccess: (data, variables, context) => {
      const priorityLabels: Record<string, string> = {
        LOW: "Basse",
        MEDIUM: "Moyenne",
        HIGH: "Haute",
        URGENT: "Urgente",
      };

      toast.success(`Priorité: ${priorityLabels[variables.priority]}`, {
        id: `priority-${context.id}`,
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.detail(context.id) });
    },

    onError: (error, variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(QUERY_KEYS.tasks.lists(), context.previousLists);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.tasks.detail(context.id),
          context.previousDetail
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors du changement";
      toast.error(errorMessage, { id: `priority-${context?.id}` });
    },
  });
}

/**
 * Hook pour supprimer une tâche avec optimistic update
 *
 * ⚡ Suppression instantanée de la liste
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,

    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.lists() });

      const previousLists = queryClient.getQueryData(QUERY_KEYS.tasks.lists());

      // Suppression optimiste
      queryClient.setQueryData(QUERY_KEYS.tasks.lists(), (old: any) => {
        if (!old) return old;
        return old.filter((task: any) => task.id !== id);
      });

      // Supprimer du cache de détail
      queryClient.removeQueries({ queryKey: QUERY_KEYS.tasks.detail(id) });

      toast.loading("Suppression...", { id: `delete-${id}` });

      return { previousLists, id };
    },

    onSuccess: (data, variables, context) => {
      toast.success("Tâche supprimée", { id: `delete-${context.id}` });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() });
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousLists) {
        queryClient.setQueryData(QUERY_KEYS.tasks.lists(), context.previousLists);
      }

      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la suppression";
      toast.error(errorMessage, { id: `delete-${context?.id}` });
    },
  });
}
