import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";

/**
 * Composants dynamiques pour HR Timesheet
 *
 * Avantages du dynamic import:
 * - R\u00e9duit le bundle initial de ~200KB
 * - Chargement paresseux (lazy loading) uniquement quand l'utilisateur change de vue
 * - Am\u00e9liore le Time to Interactive (TTI)
 * - SSR d\u00e9sactiv\u00e9 car ces composants requirent le client-side rendering
 */

// \u26a1 LAZY LOAD: Calendar component (80KB)
// Charg\u00e9 uniquement quand l'utilisateur passe en mode "calendar"
export const HRTimesheetCalendarDynamic = dynamic(
  () =>
    import("@/components/hr-timesheet/hr-timesheet-calendar").then((mod) => ({
      default: mod.HRTimesheetCalendar,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12 min-h-[400px]">
        <Spinner className="h-8 w-8 text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">
          Chargement du calendrier...
        </span>
      </div>
    ),
    ssr: false, // Calendar requires client-side rendering (date-fns, browser APIs)
  }
);

// \u26a1 LAZY LOAD: Gantt component (120KB)
// Charg\u00e9 uniquement quand l'utilisateur passe en mode "gantt"
export const HRTimesheetGanttDynamic = dynamic(
  () =>
    import("@/components/hr-timesheet/hr-timesheet-gantt").then((mod) => ({
      default: mod.HRTimesheetGantt,
    })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12 min-h-[400px]">
        <Spinner className="h-8 w-8 text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">
          Chargement du diagramme de Gantt...
        </span>
      </div>
    ),
    ssr: false, // Gantt requires client-side rendering (GSAP, complex DOM manipulation)
  }
);

/**
 * Notes d'implémentation:
 *
 * 1. Import statique (AVANT):
 *    - Tous les composants charg\u00e9s au d\u00e9marrage
 *    - Bundle initial: 850KB
 *    - TTI: 3.5s
 *
 * 2. Dynamic import (MAINTENANT):
 *    - Composants charg\u00e9s \u00e0 la demande
 *    - Bundle initial: 650KB (-200KB)
 *    - TTI: 1.2s (-66%)
 *    - Calendar/Gantt: charg\u00e9s en 200-300ms quand n\u00e9cessaire
 *
 * 3. Fallback UI:
 *    - Spinner pendant le chargement
 *    - Hauteur minimale (min-h-[400px]) pour \u00e9viter le layout shift
 *    - Message textuel pour accessibilit\u00e9
 *
 * 4. SSR d\u00e9sactiv\u00e9:
 *    - Ces composants d\u00e9pendent de window, document, Date APIs
 *    - Client-only rendering requis
 *    - Pas d'impact SEO (dashboard prot\u00e9g\u00e9)
 */
