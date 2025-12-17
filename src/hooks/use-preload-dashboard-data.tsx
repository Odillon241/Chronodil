"use client";

// ============================================
// HOOK DE PRÉCHARGEMENT DES DONNÉES DASHBOARD
// ============================================
// Précharge les données critiques en arrière-plan
// pour un affichage instantané lors de la navigation

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import {
  getMyHRTimesheets,
  getHRTimesheetsForApproval,
  getHRTimesheetsValidatedByMe,
} from "@/actions/hr-timesheet.actions";
import { CACHE_TIMES } from "@/providers/query-provider";

/**
 * Hook qui précharge automatiquement les données les plus consultées
 * Appelé une seule fois au montage du layout dashboard
 */
export function usePreloadDashboardData() {
  const queryClient = useQueryClient();
  const { data: session } = useSession() as any;
  const userRole = session?.user?.role;
  const isValidator = userRole === "MANAGER" || userRole === "DIRECTEUR" || userRole === "ADMIN";

  useEffect(() => {
    // Ne précharger que si l'utilisateur est connecté
    if (!session?.user?.id) return;

    const preloadData = async () => {
      console.log("🚀 Préchargement des données dashboard...");

      try {
        // ⚡ PHASE 1: Données critiques (HR Timesheets de l'utilisateur)
        await queryClient.prefetchQuery({
          queryKey: ["hr-timesheets", "my", {}],
          queryFn: async () => {
            const result = await getMyHRTimesheets({});
            return result?.data || [];
          },
          staleTime: CACHE_TIMES.DYNAMIC.staleTime,
        });

        // ⚡ PHASE 2: Données pour les validateurs (en parallèle)
        if (isValidator) {
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: ["hr-timesheets", "for-approval"],
              queryFn: async () => {
                const result = await getHRTimesheetsForApproval({});
                return result?.data || [];
              },
              staleTime: CACHE_TIMES.DYNAMIC.staleTime,
            }),
            queryClient.prefetchQuery({
              queryKey: ["hr-timesheets", "validated-by-me", {}],
              queryFn: async () => {
                const result = await getHRTimesheetsValidatedByMe({});
                return result?.data || [];
              },
              staleTime: CACHE_TIMES.DYNAMIC.staleTime,
            }),
          ]);
        }

        // ⚡ PHASE 3: Timesheets rejetés
        await queryClient.prefetchQuery({
          queryKey: ["hr-timesheets", "my", { status: "REJECTED" }],
          queryFn: async () => {
            const result = await getMyHRTimesheets({ status: "REJECTED" as any });
            return result?.data || [];
          },
          staleTime: CACHE_TIMES.DYNAMIC.staleTime,
        });

        console.log("✅ Préchargement terminé avec succès");
      } catch (error) {
        console.error("❌ Erreur lors du préchargement:", error);
        // Ne pas bloquer l'application si le préchargement échoue
      }
    };

    // Démarrer le préchargement immédiatement
    preloadData();

    // Refresh automatique toutes les 5 minutes pour maintenir le cache à jour
    const refreshInterval = setInterval(() => {
      preloadData();
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [session?.user?.id, userRole, isValidator, queryClient]);
}

/**
 * Hook optimisé pour précharger uniquement les timesheets HR
 * Utilisable dans des composants spécifiques
 */
export function usePreloadHRTimesheets() {
  const queryClient = useQueryClient();
  const { data: session } = useSession() as any;
  const userRole = session?.user?.role;
  const isValidator = userRole === "MANAGER" || userRole === "DIRECTEUR" || userRole === "ADMIN";

  useEffect(() => {
    if (!session?.user?.id) return;

    const preloadTimesheets = async () => {
      const promises = [
        queryClient.prefetchQuery({
          queryKey: ["hr-timesheets", "my", {}],
          queryFn: async () => {
            const result = await getMyHRTimesheets({});
            return result?.data || [];
          },
          staleTime: CACHE_TIMES.DYNAMIC.staleTime,
        }),
        queryClient.prefetchQuery({
          queryKey: ["hr-timesheets", "my", { status: "REJECTED" }],
          queryFn: async () => {
            const result = await getMyHRTimesheets({ status: "REJECTED" as any });
            return result?.data || [];
          },
          staleTime: CACHE_TIMES.DYNAMIC.staleTime,
        }),
      ];

      if (isValidator) {
        promises.push(
          queryClient.prefetchQuery({
            queryKey: ["hr-timesheets", "for-approval"],
            queryFn: async () => {
              const result = await getHRTimesheetsForApproval({});
              return result?.data || [];
            },
            staleTime: CACHE_TIMES.DYNAMIC.staleTime,
          }),
          queryClient.prefetchQuery({
            queryKey: ["hr-timesheets", "validated-by-me", {}],
            queryFn: async () => {
              const result = await getHRTimesheetsValidatedByMe({});
              return result?.data || [];
            },
            staleTime: CACHE_TIMES.DYNAMIC.staleTime,
          })
        );
      }

      await Promise.all(promises);
    };

    preloadTimesheets();
  }, [session?.user?.id, userRole, isValidator, queryClient]);
}

// ============================================
// NOTES D'UTILISATION
// ============================================
// 1. Importer et utiliser dans le layout du dashboard:
//
//    import { usePreloadDashboardData } from "@/hooks/use-preload-dashboard-data";
//
//    export default function DashboardLayout({ children }) {
//      usePreloadDashboardData(); // ⚡ Précharge tout
//      return <div>{children}</div>;
//    }
//
// 2. Les données sont mises en cache avec React Query
// 3. Navigation instantanée vers les pages HR Timesheets
// 4. Refresh automatique toutes les 5 minutes en arrière-plan
// 5. Pas de blocage si le préchargement échoue
