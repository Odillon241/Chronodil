'use client'

// ============================================
// HOOKS REACT QUERY POUR LES TÂCHES
// ============================================
// Hooks optimisés avec React Query pour gérer le cache automatiquement

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/providers/query-provider'
import {
  getMyTasksOptimized,
  getAllTasksOptimized,
  getTaskByIdOptimized,
  getTasksByProjectIdOptimized,
} from '@/actions/task.actions.optimized'
import {
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskPriority,
} from '@/actions/task.actions'
import { toast } from 'sonner'

// ============================================
// TYPES
// ============================================
interface TaskFilters {
  projectId?: string
  searchQuery?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED'
  page?: number
  limit?: number
}

// ============================================
// QUERY: Récupérer mes tâches avec cache
// ============================================
export function useMyTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.myTasks(filters as Record<string, unknown>),
    queryFn: async () => {
      const result = await getMyTasksOptimized({
        projectId: filters.projectId,
        searchQuery: filters.searchQuery,
        page: filters.page || 1,
        limit: filters.limit || 50,
      })

      if (!result?.data) {
        throw new Error(result?.serverError || 'Erreur lors de la récupération des tâches')
      }

      return result.data
    },
    // ⚡ Stale time de 2 minutes pour cette requête spécifique
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================
// QUERY: Récupérer toutes les tâches avec cache
// ============================================
export function useAllTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const result = await getAllTasksOptimized({
        projectId: filters.projectId,
        searchQuery: filters.searchQuery,
        status: filters.status,
        page: filters.page || 1,
        limit: filters.limit || 50,
      })

      if (!result?.data) {
        throw new Error(result?.serverError || 'Erreur lors de la récupération des tâches')
      }

      return result.data
    },
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================
// QUERY: Récupérer une tâche par ID avec cache
// ============================================
export function useTask(taskId: string | undefined | null) {
  return useQuery({
    queryKey: taskId ? QUERY_KEYS.tasks.detail(taskId) : ['tasks', 'empty'],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID requis')

      const result = await getTaskByIdOptimized({ id: taskId })

      if (!result?.data) {
        throw new Error(result?.serverError || 'Tâche non trouvée')
      }

      return result.data
    },
    enabled: !!taskId, // Ne lance la requête que si taskId existe
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// ============================================
// QUERY: Récupérer les tâches d'un projet avec cache
// ============================================
export function useProjectTasks(
  projectId: string | undefined,
  filters: Omit<TaskFilters, 'projectId'> = {},
) {
  return useQuery({
    queryKey: projectId
      ? QUERY_KEYS.tasks.projectTasks(projectId, filters as Record<string, unknown>)
      : ['tasks', 'empty'],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID requis')

      const result = await getTasksByProjectIdOptimized({
        projectId,
        page: filters.page || 1,
        limit: filters.limit || 50,
      })

      if (!result?.data) {
        throw new Error(result?.serverError || 'Erreur lors de la récupération des tâches')
      }

      return result.data
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================
// MUTATION: Créer une tâche
// ============================================
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Parameters<typeof createTask>[0]) => {
      const result = await createTask(data)

      if (!result?.data) {
        throw new Error(result?.serverError || 'Erreur lors de la création')
      }

      return result.data
    },
    onSuccess: (_newTask) => {
      // ⚡ Invalider toutes les listes de tâches pour forcer un refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all })

      toast.success('Tâche créée avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création de la tâche')
    },
  })
}

// ============================================
// MUTATION: Mettre à jour une tâche
// ============================================
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Parameters<typeof updateTask>[0]) => {
      const result = await updateTask(data)

      if (!result?.data) {
        throw new Error(result?.serverError || 'Erreur lors de la mise à jour')
      }

      return result.data
    },
    onSuccess: (updatedTask) => {
      // ⚡ Mettre à jour le cache de la tâche spécifique
      queryClient.setQueryData(QUERY_KEYS.tasks.detail(updatedTask.id), updatedTask)

      // ⚡ Invalider les listes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() })

      toast.success('Tâche mise à jour')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour')
    },
  })
}

// ============================================
// MUTATION: Supprimer une tâche
// ============================================
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const result = await deleteTask({ id: taskId })

      if (!result?.data) {
        throw new Error(result?.serverError || 'Erreur lors de la suppression')
      }

      return result.data
    },
    onSuccess: (_, taskId) => {
      // ⚡ Supprimer la tâche du cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.tasks.detail(taskId) })

      // ⚡ Invalider les listes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all })

      toast.success('Tâche supprimée')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })
}

// ============================================
// MUTATION: Changer le statut d'une tâche
// ============================================
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED'
    }) => {
      const result = await updateTaskStatus({ id, status })

      if (!result?.data) {
        throw new Error(result?.serverError || 'Erreur lors de la mise à jour du statut')
      }

      return result.data
    },
    onMutate: async ({ id, status }) => {
      // ⚡ OPTIMISTIC UPDATE: Mettre à jour le cache immédiatement
      // Annuler les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.detail(id) })

      // Sauvegarder l'état précédent pour rollback en cas d'erreur
      const previousTask = queryClient.getQueryData(QUERY_KEYS.tasks.detail(id))

      // Mettre à jour optimistiquement
      queryClient.setQueryData(QUERY_KEYS.tasks.detail(id), (old: any) => {
        if (!old) return old
        return { ...old, status }
      })

      return { previousTask }
    },
    onError: (error: Error, variables, context) => {
      // ⚡ ROLLBACK en cas d'erreur
      if (context?.previousTask) {
        queryClient.setQueryData(QUERY_KEYS.tasks.detail(variables.id), context.previousTask)
      }
      toast.error(error.message || 'Erreur lors de la mise à jour du statut')
    },
    onSuccess: (updatedTask) => {
      // ⚡ Confirmer le cache
      queryClient.setQueryData(QUERY_KEYS.tasks.detail(updatedTask.id), updatedTask)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() })
    },
  })
}

// ============================================
// MUTATION: Changer la priorité d'une tâche
// ============================================
export function useUpdateTaskPriority() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      priority,
    }: {
      id: string
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    }) => {
      const result = await updateTaskPriority({ id, priority })

      if (!result?.data) {
        throw new Error(result?.serverError || 'Erreur lors de la mise à jour de la priorité')
      }

      return result.data
    },
    onMutate: async ({ id, priority }) => {
      // ⚡ OPTIMISTIC UPDATE
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tasks.detail(id) })
      const previousTask = queryClient.getQueryData(QUERY_KEYS.tasks.detail(id))

      queryClient.setQueryData(QUERY_KEYS.tasks.detail(id), (old: any) => {
        if (!old) return old
        return { ...old, priority }
      })

      return { previousTask }
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(QUERY_KEYS.tasks.detail(variables.id), context.previousTask)
      }
      toast.error(error.message || 'Erreur lors de la mise à jour de la priorité')
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(QUERY_KEYS.tasks.detail(updatedTask.id), updatedTask)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.lists() })
    },
  })
}

// ============================================
// PREFETCH: Précharger des tâches en arrière-plan
// ============================================
export function usePrefetchTask() {
  const queryClient = useQueryClient()

  return (taskId: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.tasks.detail(taskId),
      queryFn: async () => {
        const result = await getTaskByIdOptimized({ id: taskId })
        if (!result?.data) throw new Error('Task not found')
        return result.data
      },
      staleTime: 5 * 60 * 1000,
    })
  }
}

// ============================================
// NOTES D'UTILISATION
// ============================================
// 1. Ces hooks gèrent automatiquement:
//    - Le cache (données stockées 2-5 minutes)
//    - Le loading state
//    - Les erreurs
//    - Les invalidations de cache après mutations
//    - Les optimistic updates (changements instantanés avant confirmation serveur)
//    - Le retry automatique en cas d'échec
//
// 2. Exemple d'utilisation:
//
//    function TaskList() {
//      const { data, isLoading, error } = useMyTasks({ projectId: "123" });
//      const updateStatus = useUpdateTaskStatus();
//
//      if (isLoading) return <Spinner />;
//      if (error) return <Error />;
//
//      return (
//        <div>
//          {data.tasks.map(task => (
//            <Task
//              key={task.id}
//              task={task}
//              onStatusChange={(status) => updateStatus.mutate({ id: task.id, status })}
//            />
//          ))}
//        </div>
//      );
//    }
//
// 3. Les données sont mises en cache automatiquement:
//    - Pas besoin de useState/useEffect
//    - Pas de re-fetch inutiles
//    - Partage du cache entre composants
//    - Synchronisation automatique après mutations
