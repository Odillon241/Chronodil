"use client";

// ============================================
// HOOKS REACT QUERY POUR LES PROJETS
// ============================================
// Hooks optimisés avec React Query pour gérer le cache automatiquement

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/providers/query-provider";
import {
  getProjects,
  getProjectById,
  getMyProjects,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from "@/actions/project.actions";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================
interface ProjectFilters {
  isActive?: boolean;
  departmentId?: string;
}

// ============================================
// QUERY: Récupérer tous les projets avec cache
// ============================================
export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.projects.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const result = await getProjects({
        isActive: filters.isActive,
        departmentId: filters.departmentId,
      });

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la récupération des projets");
      }

      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// QUERY: Récupérer mes projets avec cache
// ============================================
export function useMyProjects() {
  return useQuery({
    queryKey: [...QUERY_KEYS.projects.lists(), "my"],
    queryFn: async () => {
      const result = await getMyProjects({});

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la récupération de vos projets");
      }

      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// QUERY: Récupérer un projet par ID avec cache
// ============================================
export function useProject(projectId: string | undefined | null) {
  return useQuery({
    queryKey: projectId ? QUERY_KEYS.projects.detail(projectId) : ["projects", "empty"],
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID requis");

      const result = await getProjectById({ id: projectId });

      if (!result?.data) {
        throw new Error(result?.serverError || "Projet non trouvé");
      }

      return result.data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// MUTATION: Créer un projet
// ============================================
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof createProject>[0]) => {
      const result = await createProject(data);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la création");
      }

      return result.data;
    },
    onSuccess: () => {
      // ⚡ Invalider toutes les listes de projets pour forcer un refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });

      toast.success("Projet créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la création du projet");
    },
  });
}

// ============================================
// MUTATION: Mettre à jour un projet
// ============================================
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof updateProject>[0]) => {
      const result = await updateProject(data);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la mise à jour");
      }

      return result.data;
    },
    onSuccess: (updatedProject) => {
      // ⚡ Mettre à jour le cache du projet spécifique
      queryClient.setQueryData(QUERY_KEYS.projects.detail(updatedProject.id), updatedProject);

      // ⚡ Invalider les listes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.lists() });

      toast.success("Projet mis à jour");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });
}

// ============================================
// MUTATION: Supprimer un projet
// ============================================
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const result = await deleteProject({ id: projectId });

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de la suppression");
      }

      return result.data;
    },
    onSuccess: (_, projectId) => {
      // ⚡ Supprimer le projet du cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.projects.detail(projectId) });

      // ⚡ Invalider les listes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });

      toast.success("Projet supprimé");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });
}

// ============================================
// MUTATION: Ajouter un membre au projet
// ============================================
export function useAddProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof addProjectMember>[0]) => {
      const result = await addProjectMember(data);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors de l'ajout du membre");
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      // ⚡ Invalider le cache du projet pour rafraîchir la liste des membres
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.detail(variables.projectId) });

      toast.success("Membre ajouté au projet");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'ajout du membre");
    },
  });
}

// ============================================
// MUTATION: Retirer un membre du projet
// ============================================
export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; projectId?: string }) => {
      const { projectId, ...apiData } = data;
      const result = await removeProjectMember(apiData);

      if (!result?.data) {
        throw new Error(result?.serverError || "Erreur lors du retrait du membre");
      }

      return { ...result.data, projectId };
    },
    onSuccess: (data) => {
      // ⚡ Invalider le cache du projet si on a l'ID
      if (data.projectId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.detail(data.projectId) });
      }
      // Invalider aussi toutes les listes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.lists() });

      toast.success("Membre retiré du projet");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors du retrait du membre");
    },
  });
}

// ============================================
// PREFETCH: Précharger un projet en arrière-plan
// ============================================
export function usePrefetchProject() {
  const queryClient = useQueryClient();

  return (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.projects.detail(projectId),
      queryFn: async () => {
        const result = await getProjectById({ id: projectId });
        if (!result?.data) throw new Error("Project not found");
        return result.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}

// ============================================
// NOTES D'UTILISATION
// ============================================
// 1. Ces hooks gèrent automatiquement:
//    - Le cache (données stockées 5 minutes)
//    - Le loading state
//    - Les erreurs
//    - Les invalidations de cache après mutations
//    - Le retry automatique en cas d'échec
//
// 2. Exemple d'utilisation:
//
//    function ProjectList() {
//      const { data: projects, isLoading, error } = useMyProjects();
//      const createProject = useCreateProject();
//
//      if (isLoading) return <Spinner />;
//      if (error) return <Error />;
//
//      return (
//        <div>
//          <Button onClick={() => createProject.mutate({ name: "New Project", code: "NP" })}>
//            Créer un projet
//          </Button>
//          {projects?.map(project => (
//            <ProjectCard key={project.id} project={project} />
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
