"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Filter, X, Plus, Eye, Edit, FileText, CheckCircle, XCircle, Clock, GanttChartSquareIcon, KanbanSquareIcon, ListIcon, TableIcon, LayoutGridIcon, Trash2, Send } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import {
  getMyHRTimesheets,
  deleteHRTimesheet,
  submitHRTimesheet,
  cancelHRTimesheetSubmission,
  getHRTimesheetsForApproval,
  updateHRTimesheetStatus,
} from "@/actions/hr-timesheet.actions";
import { useRouter } from "next/navigation";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { HRTimesheetStatsChart } from "@/components/features/hr-timesheet-stats-chart";
import {
  CalendarBody,
  CalendarDate,
  CalendarDatePagination,
  CalendarDatePicker,
  CalendarHeader,
  CalendarItem,
  CalendarMonthPicker,
  CalendarProvider,
  CalendarYearPicker,
} from '@/components/ui/shadcn-io/calendar';
import {
  GanttCreateMarkerTrigger,
  GanttFeatureItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttHeader,
  GanttMarker,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
} from '@/components/ui/shadcn-io/gantt';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';
import {
  type DragEndEvent,
  ListGroup,
  ListHeader,
  ListItem,
  ListItems,
  ListProvider,
} from '@/components/ui/shadcn-io/list';
import type { ColumnDef } from '@/components/ui/shadcn-io/table';
import {
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHead,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
} from '@/components/ui/shadcn-io/table';
import groupBy from 'lodash.groupby';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface HRTimesheet {
  id: string;
  weekStartDate: Date;
  weekEndDate: Date;
  employeeName: string;
  position: string;
  site: string;
  totalHours: number;
  status: string;
  employeeSignedAt?: Date | null;
  managerSignedAt?: Date | null;
  odillonSignedAt?: Date | null;
  employeeObservations?: string | null;
  managerComments?: string | null;
  odillonComments?: string | null;
  User?: {
    name: string;
    email: string;
  };
  ManagerSigner?: {
    name: string;
  } | null;
  OdillonSigner?: {
    name: string;
  } | null;
  _count?: {
    activities: number;
  };
}

// Conversion des statuts en format compatible avec les vues roadmap
const STATUS_CONFIG = {
  DRAFT: { name: 'Brouillon', color: '#94A3B8', icon: Edit },
  PENDING: { name: 'En attente', color: '#F59E0B', icon: Clock },
  MANAGER_APPROVED: { name: 'Validé Manager', color: '#3B82F6', icon: CheckCircle },
  APPROVED: { name: 'Approuvé', color: '#10B981', icon: CheckCircle },
  REJECTED: { name: 'Rejeté', color: '#EF4444', icon: XCircle },
};

export default function HRTimesheetPage() {
  const router = useRouter();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [myTimesheets, setMyTimesheets] = useState<HRTimesheet[]>([]);
  const [pendingTimesheets, setPendingTimesheets] = useState<HRTimesheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState<string>("cards");
  const [dataView, setDataView] = useState<"my" | "pending">("my");

  const [filters, setFilters] = useState({
    status: "all",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  const loadMyTimesheets = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getMyHRTimesheets({
        ...(filters.status && filters.status !== "all" && { status: filters.status as any }),
        ...(filters.startDate && { weekStartDate: filters.startDate }),
        ...(filters.endDate && { weekEndDate: filters.endDate }),
      });

      if (result?.data) {
        setMyTimesheets(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des timesheets");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadPendingTimesheets = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getHRTimesheetsForApproval({});

      if (result?.data) {
        setPendingTimesheets(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des validations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dataView === "my") {
      loadMyTimesheets();
    } else {
      loadPendingTimesheets();
    }
  }, [dataView, loadMyTimesheets, loadPendingTimesheets]);

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmation({
      title: "Supprimer le timesheet RH",
      description: "Êtes-vous sûr de vouloir supprimer ce timesheet RH ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteHRTimesheet({ timesheetId: id });
          if (result?.data) {
            toast.success("Timesheet supprimé");
            loadMyTimesheets();
          } else {
            toast.error(result?.serverError || "Erreur lors de la suppression");
          }
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const handleSubmit = async (id: string) => {
    const confirmed = await showConfirmation({
      title: "Soumettre le timesheet",
      description: "Voulez-vous soumettre ce timesheet pour validation ? Une fois soumis, vous ne pourrez plus le modifier.",
      confirmText: "Soumettre",
      cancelText: "Annuler",
      onConfirm: async () => {
        try {
          const result = await submitHRTimesheet({ timesheetId: id });
          if (result?.data) {
            const weekStartDate = format(new Date(result.data.weekStartDate), "dd/MM/yyyy", { locale: fr });

            toast.success("Timesheet soumis", {
              description: `Votre feuille de temps du ${weekStartDate} a été soumise pour validation`,
              action: {
                label: "Annuler",
                onClick: async () => {
                  try {
                    const undoResult = await cancelHRTimesheetSubmission({ timesheetId: id });
                    if (undoResult?.data) {
                      toast.success("Soumission annulée", {
                        description: "Votre timesheet est de nouveau en brouillon",
                      });
                      loadMyTimesheets();
                    } else {
                      toast.error(undoResult?.serverError || "Erreur lors de l'annulation");
                    }
                  } catch (error: any) {
                    toast.error(error.message || String(error) || "Erreur lors de l'annulation");
                  }
                },
              },
            });
            loadMyTimesheets();
          } else {
            toast.error(result?.serverError || "Erreur lors de la soumission");
          }
        } catch (error: any) {
          toast.error(error.message || String(error) || "Erreur lors de la soumission");
        }
      },
    });
  };

  const applyFilters = () => {
    loadMyTimesheets();
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      startDate: undefined,
      endDate: undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
    const Icon = config.icon;

    const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "outline",
      PENDING: "secondary",
      MANAGER_APPROVED: "default",
      APPROVED: "default",
      REJECTED: "destructive",
    };

    return (
      <Badge variant={variantMap[status] || "outline"} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.name}
      </Badge>
    );
  };

  // Conversion des timesheets en features pour les vues roadmap
  const currentTimesheets = dataView === "my" ? myTimesheets : pendingTimesheets;

  const timesheetsAsFeatures = useMemo(() =>
    currentTimesheets.map((ts) => ({
      id: ts.id,
      name: `${ts.employeeName} - ${ts.position}`,
      startAt: new Date(ts.weekStartDate),
      endAt: new Date(ts.weekEndDate),
      status: {
        id: ts.status,
        name: STATUS_CONFIG[ts.status as keyof typeof STATUS_CONFIG]?.name || ts.status,
        color: STATUS_CONFIG[ts.status as keyof typeof STATUS_CONFIG]?.color || '#94A3B8',
      },
      owner: ts.User ? {
        id: ts.User.email,
        name: ts.User.name,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(ts.User.name)}`,
      } : {
        id: ts.employeeName,
        name: ts.employeeName,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(ts.employeeName)}`,
      },
      group: { id: ts.site, name: ts.site },
      product: { id: ts.position, name: ts.position },
      totalHours: ts.totalHours,
      column: ts.status,
      originalData: ts,
    })),
    [currentTimesheets]
  );

  const statusColumns = useMemo(() =>
    Object.entries(STATUS_CONFIG).map(([key, value]) => ({
      id: key,
      name: value.name,
      color: value.color,
    })),
    []
  );

  const earliestYear = useMemo(() =>
    timesheetsAsFeatures.length > 0
      ? Math.min(...timesheetsAsFeatures.map(f => f.startAt.getFullYear()))
      : new Date().getFullYear() - 1,
    [timesheetsAsFeatures]
  );

  const latestYear = useMemo(() =>
    timesheetsAsFeatures.length > 0
      ? Math.max(...timesheetsAsFeatures.map(f => f.endAt.getFullYear()))
      : new Date().getFullYear() + 1,
    [timesheetsAsFeatures]
  );

  const TimesheetCard = ({ timesheet, isPending = false }: { timesheet: HRTimesheet, isPending?: boolean }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card className="hover:shadow-md transition-shadow cursor-context-menu">
        <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              Semaine du {format(new Date(timesheet.weekStartDate), "dd/MM/yyyy", { locale: fr })}
              {" "}-{" "}
              {format(new Date(timesheet.weekEndDate), "dd/MM/yyyy", { locale: fr })}
            </CardTitle>
            {isPending && timesheet.User && (
              <CardDescription className="mt-1">
                {timesheet.User.name} - {timesheet.User.email}
              </CardDescription>
            )}
          </div>
          {getStatusBadge(timesheet.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Employé</p>
            <p className="font-medium">{timesheet.employeeName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Poste</p>
            <p className="font-medium">{timesheet.position}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Site</p>
            <p className="font-medium">{timesheet.site}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total heures</p>
            <p className="font-bold text-primary text-lg">{timesheet.totalHours.toFixed(1)}h</p>
          </div>
        </div>

        {timesheet._count && (
          <div className="text-sm">
            <p className="text-muted-foreground">Activités enregistrées</p>
            <p className="font-medium">{timesheet._count.activities} activité(s)</p>
          </div>
        )}

        {/* Signatures */}
        <div className="space-y-1 text-xs border-t pt-3">
          {timesheet.employeeSignedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Signé employé le {format(new Date(timesheet.employeeSignedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
            </div>
          )}
          {timesheet.managerSignedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Validé manager le {format(new Date(timesheet.managerSignedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
              {timesheet.ManagerSigner && ` par ${timesheet.ManagerSigner.name}`}
            </div>
          )}
          {timesheet.odillonSignedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Approuvé final le {format(new Date(timesheet.odillonSignedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
              {timesheet.OdillonSigner && ` par ${timesheet.OdillonSigner.name}`}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/hr-timesheet/${timesheet.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Voir détails
          </Button>

          {!isPending && timesheet.status === "DRAFT" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/hr-timesheet/${timesheet.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary"
                onClick={() => handleSubmit(timesheet.id)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Soumettre
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(timesheet.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}

          {isPending && (timesheet.status === "PENDING" || timesheet.status === "MANAGER_APPROVED") && (
            <Button
              variant="default"
              size="sm"
              className="bg-primary hover:bg-primary"
              onClick={() => router.push(`/dashboard/hr-timesheet/${timesheet.id}/validate`)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Valider
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => router.push(`/dashboard/hr-timesheet/${timesheet.id}`)} className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Voir détails
        </ContextMenuItem>
        {timesheet.status === 'DRAFT' && (
          <>
            <ContextMenuItem onClick={() => router.push(`/dashboard/hr-timesheet/${timesheet.id}/edit`)} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleSubmit(timesheet.id)} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Soumettre
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleDelete(timesheet.id)} className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Supprimer
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );

  // Vues roadmap
  const GanttView = () => {
    const ganttRef = useRef<HTMLDivElement>(null);
    const [features, setFeatures] = useState(timesheetsAsFeatures);
    const [ganttZoom, setGanttZoom] = useState(100);
    const [ganttRange, setGanttRange] = useState<'daily' | 'monthly' | 'quarterly'>('monthly');
    const [markers, setMarkers] = useState<Array<{ id: string; date: Date; label: string; className?: string }>>([
      {
        id: 'marker-today',
        date: new Date(),
        label: 'Aujourd\'hui',
        className: 'bg-blue-100 text-blue-900',
      },
    ]);
    const groupedFeatures = groupBy(features, 'group.name');
    const sortedGroupedFeatures = Object.fromEntries(
      Object.entries(groupedFeatures).sort(([nameA], [nameB]) =>
        nameA.localeCompare(nameB)
      )
    );

    // Scroller vers la dernière feuille de temps enregistrée
    const lastTimesheet = useMemo(() => {
      if (currentTimesheets.length === 0) return null;
      return currentTimesheets.reduce((latest, current) =>
        new Date(current.weekStartDate) > new Date(latest.weekStartDate) ? current : latest
      );
    }, [currentTimesheets]);

    const lastFeature = useMemo(() => {
      if (!lastTimesheet) return null;
      return features.find(f => f.id === lastTimesheet.id);
    }, [lastTimesheet, features]);

    // Scroller le Gantt vers la dernière feuille
    useEffect(() => {
      if (lastFeature && ganttRef.current) {
        // Attendre que le Gantt soit rendu
        setTimeout(() => {
          const ganttContainer = ganttRef.current?.querySelector('[style*="--gantt-zoom"]') as HTMLElement;
          if (ganttContainer) {
            // Calculer la position de la dernière feuille
            // Le Gantt a une largeur de colonne qui dépend du range et du zoom
            // On va chercher l'élément dans le DOM et le scroller en vue
            const featureElement = ganttRef.current?.querySelector(`[data-feature-id="${lastFeature.id}"]`) as HTMLElement;
            if (featureElement) {
              ganttContainer.scrollLeft = featureElement.offsetLeft - 100;
            }
          }
        }, 100);
      }
    }, [lastFeature]);

    // Raccourcis clavier pour le zoom
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl + "+" ou Ctrl + "=" pour zoomer
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
          e.preventDefault();
          setGanttZoom((prev) => Math.min(200, prev + 25));
        }
        // Ctrl + "-" pour dézoomer
        else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
          e.preventDefault();
          setGanttZoom((prev) => Math.max(50, prev - 25));
        }
        // Ctrl + "0" pour réinitialiser
        else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
          e.preventDefault();
          setGanttZoom(100);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleViewFeature = (id: string) => {
      router.push(`/dashboard/hr-timesheet/${id}`);
    };

    const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
      if (!endAt) return;

      setFeatures((prev) =>
        prev.map((feature) =>
          feature.id === id ? { ...feature, startAt, endAt } : feature
        )
      );

      toast.info("Déplacement visuel uniquement", {
        description: "Les dates ne sont pas sauvegardées en base de données",
      });
    };

    const handleRemoveMarker = (id: string) => {
      setMarkers((prev) => prev.filter((m) => m.id !== id));
      toast.success("Marqueur supprimé");
    };

    const handleCreateMarker = (date: Date) => {
      const newMarkerId = `marker-${Date.now()}`;
      setMarkers((prev) => [
        ...prev,
        {
          id: newMarkerId,
          date,
          label: `Marqueur ${format(date, "dd MMM", { locale: fr })}`,
          className: 'bg-yellow-100 text-yellow-900',
        },
      ]);
      toast.success("Marqueur créé", {
        description: `Marqueur ajouté pour le ${format(date, "dd/MM/yyyy", { locale: fr })}`,
      });
    };

    return (
      <div ref={ganttRef} className="flex flex-col h-full">
        {/* Contrôles Gantt */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Sélecteur de plage */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Plage:</Label>
              <Select value={ganttRange} onValueChange={(value: any) => setGanttRange(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="quarterly">Trimestriel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contrôles de zoom */}
            <div className="flex items-center gap-4 pl-4 border-l">
              <Label className="text-sm font-medium">Zoom:</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGanttZoom(Math.max(50, ganttZoom - 25))}
                  disabled={ganttZoom <= 50}
                  title="Ctrl + -"
                >
                  -
                </Button>
                <span className="text-sm font-medium w-16 text-center">{ganttZoom}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGanttZoom(Math.min(200, ganttZoom + 25))}
                  disabled={ganttZoom >= 200}
                  title="Ctrl + +"
                >
                  +
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGanttZoom(100)}
                title="Ctrl + 0"
              >
                Réinitialiser
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground hidden sm:block">
            Raccourcis: <kbd className="px-1.5 py-0.5 rounded border bg-background">Ctrl +</kbd> / <kbd className="px-1.5 py-0.5 rounded border bg-background">Ctrl -</kbd> / <kbd className="px-1.5 py-0.5 rounded border bg-background">Ctrl 0</kbd>
          </div>
        </div>

        <GanttProvider
          className="rounded-none border-none flex-1"
          range={ganttRange}
          zoom={ganttZoom}
          onAddItem={(date) => {
            toast.info("Redirection vers la création", {
              description: `Nouvelle feuille de temps créée pour le ${format(date, "dd/MM/yyyy", { locale: fr })}`,
            });
            // Rediriger vers la création avec la date pré-remplie
            router.push(`/dashboard/hr-timesheet/new?startDate=${date.toISOString()}`);
          }}
        >
        <GanttSidebar>
          {Object.entries(sortedGroupedFeatures).map(([group, features]) => (
            <GanttSidebarGroup key={group} name={group}>
              {features.map((feature) => (
                <GanttSidebarItem
                  feature={feature}
                  key={feature.id}
                  onSelectItem={handleViewFeature}
                />
              ))}
            </GanttSidebarGroup>
          ))}
        </GanttSidebar>
        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList>
            {Object.entries(sortedGroupedFeatures).map(([group, features]) => (
              <GanttFeatureListGroup key={group}>
                {features.map((feature) => {
                  const timesheet = currentTimesheets.find(t => t.id === feature.id);
                  return (
                  <ContextMenu key={feature.id}>
                    <ContextMenuTrigger asChild>
                      <div className="flex w-full" data-feature-id={feature.id}>
                        <button
                          onClick={() => handleViewFeature(feature.id)}
                          type="button"
                          className="w-full"
                        >
                          <GanttFeatureItem
                            {...feature}
                            onMove={handleMoveFeature}
                          >
                            <p className="flex-1 truncate text-xs">
                              {feature.name}
                            </p>
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={feature.owner.image} />
                              <AvatarFallback>
                                {feature.owner.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="ml-2 text-xs font-medium">
                              {feature.totalHours.toFixed(1)}h
                            </span>
                          </GanttFeatureItem>
                        </button>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleViewFeature(feature.id)} className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Voir détails
                      </ContextMenuItem>
                      {timesheet?.status === 'DRAFT' && (
                        <>
                          <ContextMenuItem onClick={() => router.push(`/dashboard/hr-timesheet/${feature.id}/edit`)} className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Modifier
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleSubmit(feature.id)} className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Soumettre
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleDelete(feature.id)} className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </ContextMenuItem>
                        </>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                  );
                })}
              </GanttFeatureListGroup>
            ))}
          </GanttFeatureList>
          {markers.map((marker) => (
            <GanttMarker
              key={marker.id}
              {...marker}
              onRemove={handleRemoveMarker}
            />
          ))}
          <GanttToday />
          <GanttCreateMarkerTrigger onCreateMarker={handleCreateMarker} />
        </GanttTimeline>
      </GanttProvider>
      </div>
    );
  };

  const CalendarViewContent = () => (
    <div className="flex flex-col gap-4 h-full">
      {/* Légende des événements */}
      <div className="flex flex-wrap items-center gap-3 text-xs border rounded-lg p-3 bg-muted/30">
        <span className="font-medium text-muted-foreground">Légende:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-200 dark:bg-red-900 border border-red-400 dark:border-red-700"></div>
          <span>Jours fériés 🇬🇦</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-purple-200 dark:bg-purple-900 border border-purple-400 dark:border-purple-700"></div>
          <span>Fêtes religieuses ✝️</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-pink-200 dark:bg-pink-900 border border-pink-400 dark:border-pink-700"></div>
          <span>Célébrations 💝</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-900 border border-amber-400 dark:border-amber-700"></div>
          <span>Événements culturels 🌍</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-900 border-2 border-primary"></div>
          <span>Aujourd'hui</span>
        </div>
      </div>

      <CalendarProvider>
        <CalendarDate>
          <CalendarDatePicker>
            <CalendarMonthPicker />
            <CalendarYearPicker end={latestYear} start={earliestYear} />
          </CalendarDatePicker>
          <CalendarDatePagination />
        </CalendarDate>
        <CalendarHeader />
        <CalendarBody features={timesheetsAsFeatures}>
          {({ feature }) => (
            <CalendarItem
              feature={feature}
              key={feature.id}
              className="cursor-pointer"
              onClick={() => router.push(`/dashboard/hr-timesheet/${feature.id}`)}
            />
          )}
        </CalendarBody>
      </CalendarProvider>
    </div>
  );

  const ListViewContent = () => {
    const [features, setFeatures] = useState(timesheetsAsFeatures);

    const handleDragEnd = async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const status = statusColumns.find((s) => s.name === over.id);
      if (!status) return;

      // Mettre à jour l'état local immédiatement
      setFeatures(
        features.map((feature) => {
          if (feature.id === active.id) {
            return { ...feature, status: { ...feature.status, id: status.id, name: status.name, color: status.color } };
          }
          return feature;
        })
      );

      // Sauvegarder en base de données
      try {
        const result = await updateHRTimesheetStatus({
          timesheetId: active.id as string,
          status: status.id as any,
        });

        if (result?.data) {
          toast.success("Statut mis à jour", {
            description: `Le timesheet a été déplacé vers "${status.name}"`,
          });
          // Recharger les données
          if (dataView === "my") {
            loadMyTimesheets();
          } else {
            loadPendingTimesheets();
          }
        } else {
          toast.error(result?.serverError || "Erreur lors de la mise à jour du statut");
          // Restaurer l'état précédent en cas d'erreur
          setFeatures(timesheetsAsFeatures);
        }
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la mise à jour du statut");
        // Restaurer l'état précédent en cas d'erreur
        setFeatures(timesheetsAsFeatures);
      }
    };

    return (
      <ListProvider className="overflow-auto" onDragEnd={handleDragEnd}>
        {statusColumns.map((status) => (
          <ListGroup id={status.name} key={status.name}>
            <ListHeader color={status.color} name={status.name} />
            <ListItems>
              {features
                .filter((feature) => feature.status.id === status.id)
                .map((feature, index) => (
                  <ListItem
                    id={feature.id}
                    index={index}
                    key={feature.id}
                    name={feature.name}
                    parent={feature.status.name}
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: feature.status.color }}
                    />
                    <div className="flex-1">
                      <p className="m-0 font-medium text-sm">
                        {feature.name}
                      </p>
                      <p className="m-0 text-muted-foreground text-xs">
                        {feature.totalHours.toFixed(1)}h
                      </p>
                    </div>
                    <Avatar className="h-4 w-4 shrink-0">
                      <AvatarImage src={feature.owner.image} />
                      <AvatarFallback>
                        {feature.owner.name?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </ListItem>
                ))}
            </ListItems>
          </ListGroup>
        ))}
      </ListProvider>
    );
  };

  const KanbanViewContent = () => {
    const [features, setFeatures] = useState(timesheetsAsFeatures);

    const handleDragEnd = async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const status = statusColumns.find(({ id }) => id === over.id);
      if (!status) return;

      // Mettre à jour l'état local immédiatement
      setFeatures(
        features.map((feature) => {
          if (feature.id === active.id) {
            return { ...feature, status: { ...status }, column: status.id };
          }
          return feature;
        })
      );

      // Sauvegarder en base de données
      try {
        const result = await updateHRTimesheetStatus({
          timesheetId: active.id as string,
          status: status.id as any,
        });

        if (result?.data) {
          toast.success("Statut mis à jour", {
            description: `Le timesheet a été déplacé vers "${status.name}"`,
          });
          // Recharger les données
          if (dataView === "my") {
            loadMyTimesheets();
          } else {
            loadPendingTimesheets();
          }
        } else {
          toast.error(result?.serverError || "Erreur lors de la mise à jour du statut");
          // Restaurer l'état précédent en cas d'erreur
          setFeatures(timesheetsAsFeatures);
        }
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la mise à jour du statut");
        // Restaurer l'état précédent en cas d'erreur
        setFeatures(timesheetsAsFeatures);
      }
    };

    return (
      <KanbanProvider
        className="p-4"
        columns={statusColumns}
        data={features}
        onDragEnd={handleDragEnd}
      >
        {(column) => (
          <KanbanBoard id={column.id} key={column.id}>
            <KanbanHeader>{column.name}</KanbanHeader>
            <KanbanCards id={column.id}>
              {(feature: typeof features[number]) => (
                <KanbanCard
                  column={column.id}
                  id={feature.id}
                  key={feature.id}
                  name={feature.name}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="m-0 font-medium text-sm">
                          {feature.name}
                        </p>
                        <p className="m-0 text-muted-foreground text-xs">
                          {feature.product.name}
                        </p>
                      </div>
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={feature.owner.image} />
                        <AvatarFallback>
                          {feature.owner.name?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(feature.startAt, "dd/MM", { locale: fr })} - {format(feature.endAt, "dd/MM", { locale: fr })}</span>
                      <span className="font-bold text-primary">{feature.totalHours.toFixed(1)}h</span>
                    </div>
                  </div>
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>
    );
  };

  const TableViewContent = () => {
    const columns: ColumnDef<typeof timesheetsAsFeatures[number]>[] = [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Employé" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={row.original.owner.image} />
              <AvatarFallback>
                {row.original.owner.name?.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-medium">{row.original.owner.name}</span>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <span>{row.original.product.name}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'group',
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Site" />
        ),
        cell: ({ row }) => row.original.group.name,
      },
      {
        accessorKey: 'startAt',
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Début" />
        ),
        cell: ({ row }) =>
          format(row.original.startAt, "dd/MM/yyyy", { locale: fr }),
      },
      {
        accessorKey: 'endAt',
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Fin" />
        ),
        cell: ({ row }) =>
          format(row.original.endAt, "dd/MM/yyyy", { locale: fr }),
      },
      {
        accessorKey: 'totalHours',
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Heures" />
        ),
        cell: ({ row }) => (
          <span className="font-bold text-primary">
            {row.original.totalHours.toFixed(1)}h
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) => row.status.name,
        header: ({ column }) => (
          <TableColumnHeader column={column} title="Statut" />
        ),
        cell: ({ row }) => (
          <div
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
            style={{
              backgroundColor: row.original.status.color + '20',
              color: row.original.status.color,
            }}
          >
            {row.original.status.name}
          </div>
        ),
      },
    ];

    return (
      <div className="size-full overflow-auto">
        <TableProvider columns={columns} data={timesheetsAsFeatures}>
          <TableHeader>
            {({ headerGroup }) => (
              <TableHeaderGroup headerGroup={headerGroup} key={headerGroup.id}>
                {({ header }) => <TableHead header={header} key={header.id} />}
              </TableHeaderGroup>
            )}
          </TableHeader>
          <TableBody>
            {({ row }) => (
              <TableRow key={row.id} row={row}>
                {({ cell }) => <TableCell cell={cell} key={cell.id} />}
              </TableRow>
            )}
          </TableBody>
        </TableProvider>
      </div>
    );
  };

  const views = [
    { id: 'cards', label: 'Cartes', icon: LayoutGridIcon },
    { id: 'gantt', label: 'Gantt', icon: GanttChartSquareIcon },
    { id: 'calendar', label: 'Calendrier', icon: CalendarIcon },
    { id: 'list', label: 'Liste', icon: ListIcon },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquareIcon },
    { id: 'table', label: 'Tableau', icon: TableIcon },
  ];

  const renderCurrentView = () => {
    const commonEmptyState = (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Aucune donnée à afficher
      </div>
    );

    const commonLoadingState = (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    );

    switch (currentView) {
      case 'cards':
        if (isLoading) return commonLoadingState;
        if (currentTimesheets.length === 0) {
          return (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun timesheet trouvé</p>
              {dataView === "my" && (
                <Button
                  onClick={() => router.push("/dashboard/hr-timesheet/new")}
                  className="mt-4 bg-primary hover:bg-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer mon premier timesheet
                </Button>
              )}
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 isolate">
              {currentTimesheets.map((timesheet) => (
                <TimesheetCard key={timesheet.id} timesheet={timesheet} isPending={dataView === "pending"} />
              ))}
            </div>
            {dataView === "my" && currentTimesheets.length > 0 && (
              <div className="isolate">
                <HRTimesheetStatsChart
                  draft={currentTimesheets.filter((t) => t.status === "DRAFT").length}
                  pending={currentTimesheets.filter((t) => ["PENDING", "MANAGER_APPROVED"].includes(t.status)).length}
                  approved={currentTimesheets.filter((t) => t.status === "APPROVED").length}
                  rejected={currentTimesheets.filter((t) => t.status === "REJECTED").length}
                />
              </div>
            )}
          </div>
        );
      case 'gantt':
        return timesheetsAsFeatures.length > 0 ? <GanttView /> : commonEmptyState;
      case 'calendar':
        return timesheetsAsFeatures.length > 0 ? <CalendarViewContent /> : commonEmptyState;
      case 'list':
        return timesheetsAsFeatures.length > 0 ? <ListViewContent /> : commonEmptyState;
      case 'kanban':
        return timesheetsAsFeatures.length > 0 ? <KanbanViewContent /> : commonEmptyState;
      case 'table':
        return timesheetsAsFeatures.length > 0 ? <TableViewContent /> : commonEmptyState;
      default:
        return commonEmptyState;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 sm:gap-6 overflow-hidden">
      {/* En-tête */}
      <div className="flex flex-col gap-3 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Feuilles de temps RH</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Gestion des timesheets hebdomadaires des activités RH
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/hr-timesheet/new")}
            className="bg-primary hover:bg-primary w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau timesheet
          </Button>
        </div>

        {/* Sélecteur de données */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={dataView === "my" ? "default" : "outline"}
              onClick={() => setDataView("my")}
              size="sm"
            >
              Mes timesheets
            </Button>
            <Button
              variant={dataView === "pending" ? "default" : "outline"}
              onClick={() => setDataView("pending")}
              size="sm"
            >
              À valider
              {pendingTimesheets.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingTimesheets.length}
                </Badge>
              )}
            </Button>
          </div>

          {dataView === "my" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          )}
        </div>

        {/* Filtres */}
        {showFilters && dataView === "my" && (
          <Card>
            <CardContent className="pt-6">
              <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="DRAFT">Brouillon</SelectItem>
                        <SelectItem value="PENDING">En attente</SelectItem>
                        <SelectItem value="MANAGER_APPROVED">Validé Manager</SelectItem>
                        <SelectItem value="APPROVED">Approuvé</SelectItem>
                        <SelectItem value="REJECTED">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date début</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.startDate ? format(filters.startDate, "dd/MM/yyyy", { locale: fr }) : "Sélectionner..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={filters.startDate}
                          onSelect={(d) => setFilters({ ...filters, startDate: d })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Date fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.endDate ? format(filters.endDate, "dd/MM/yyyy", { locale: fr }) : "Sélectionner..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={filters.endDate}
                          onSelect={(d) => setFilters({ ...filters, endDate: d })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={applyFilters} className="bg-primary hover:bg-primary">
                    Appliquer
                  </Button>
                  <Button variant="outline" onClick={resetFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menubar pour sélection de vues */}
        <div className="flex items-center justify-end">
          <Menubar className="w-auto">
            {views.map((view) => (
              <MenubarMenu key={view.id}>
                <MenubarTrigger
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    currentView === view.id && "bg-accent"
                  )}
                  onClick={() => setCurrentView(view.id)}
                >
                  <view.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{view.label}</span>
                </MenubarTrigger>
              </MenubarMenu>
            ))}
          </Menubar>
        </div>
      </div>

      {/* Contenu des vues */}
      <div className="flex-1 overflow-hidden px-4 sm:px-0">
        <div className="h-full overflow-auto">
          {renderCurrentView()}
        </div>
      </div>

      <ConfirmationDialog />
    </div>
  );
}
