'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  timesheetEntrySchema,
  type TimesheetEntryInput,
} from '@/lib/validations/timesheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Save, Trash2, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useConfirmationDialog } from '@/hooks/use-confirmation-dialog';
import {
  createTimesheetEntry,
  deleteTimesheetEntry,
  submitTimesheetEntries,
  updateTimesheetEntry,
} from '@/actions/timesheet.actions';
import { WeeklyTimesheet } from '@/components/features/weekly-timesheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TimesheetQuickEntry } from '@/components/features/timesheet-quick-entry';

type ViewMode = 'week' | 'history';

interface TimesheetClientProps {
  initialEntries: any[];
  initialProjects: any[];
  initialViewMode: ViewMode;
  initialSelectedDate: Date;
  initialFilters?: {
    status?: string;
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
  };
}

export function TimesheetClient({
  initialEntries,
  initialProjects,
  initialViewMode,
  initialSelectedDate,
  initialFilters,
}: TimesheetClientProps) {
  const router = useRouter();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const [entries, setEntries] = useState(initialEntries);
  const [projects] = useState(initialProjects);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [showFilters, setShowFilters] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState<any | null>(null);
  const [filters, setFilters] = useState({
    status: initialFilters?.status || 'all',
    projectId: initialFilters?.projectId || 'all',
    startDate: initialFilters?.startDate || startOfMonth(new Date()),
    endDate: initialFilters?.endDate || endOfMonth(new Date()),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TimesheetEntryInput>({
    resolver: zodResolver(timesheetEntrySchema),
    defaultValues: {
      date: new Date(),
      type: 'NORMAL',
      duration: 0,
    },
  });

  // Refresh data via router
  const refreshData = useCallback(() => {
    router.refresh();
  }, [router]);

  const onSubmit = async (data: TimesheetEntryInput) => {
    setIsLoading(true);
    try {
      let result;

      if (editingEntryId) {
        // Mode modification
        result = await updateTimesheetEntry({
          id: editingEntryId,
          data: {
            ...data,
            projectId: data.projectId || undefined,
          },
        });
      } else {
        // Mode création
        result = await createTimesheetEntry(data);
      }

      if (result && 'data' in result && result.data) {
        toast.success(editingEntryId ? 'Temps modifié !' : 'Temps enregistré !');
        reset();
        setEditingEntryId(null);
        refreshData();
      } else {
        const errorMessage = result && 'serverError' in result ? result.serverError : 'Erreur';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      toast.error(error.message || String(error) || "Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirmation({
      title: "Supprimer l'entrée",
      description:
        "Êtes-vous sûr de vouloir supprimer cette entrée de timesheet ? Cette action est irréversible.",
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const result = await deleteTimesheetEntry({ id });
          if (result && 'data' in result && result.data) {
            toast.success('Entrée supprimée');
            refreshData();
          } else {
            const errorMessage =
              result && 'serverError' in result
                ? result.serverError
                : 'Erreur lors de la suppression';
            toast.error(errorMessage);
          }
        } catch (error: any) {
          toast.error(error.message || String(error) || 'Erreur lors de la suppression');
        }
      },
    });
  };

  const handleEdit = (entry: any) => {
    setEditingEntryId(entry.id);
    setValue('date', new Date(entry.date));
    setValue('projectId', entry.projectId || 'none');
    setValue('startTime', entry.startTime ? format(new Date(entry.startTime), 'HH:mm') : '');
    setValue('endTime', entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : '');
    setValue('duration', entry.duration);
    setValue('type', entry.type);
    setValue('description', entry.description || '');
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const searchParams = new URLSearchParams();
    searchParams.set('view', mode);
    if (mode === 'week') {
      searchParams.set('date', selectedDate.toISOString());
    }
    router.push(`/dashboard/timesheet?${searchParams.toString()}`);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    const searchParams = new URLSearchParams();
    searchParams.set('view', viewMode);
    searchParams.set('date', date.toISOString());
    router.push(`/dashboard/timesheet?${searchParams.toString()}`);
  };

  const handleFiltersChange = () => {
    const searchParams = new URLSearchParams();
    searchParams.set('view', 'history');
    if (filters.status !== 'all') searchParams.set('status', filters.status);
    if (filters.projectId !== 'all') searchParams.set('projectId', filters.projectId);
    searchParams.set('startDate', filters.startDate.toISOString());
    searchParams.set('endDate', filters.endDate.toISOString());
    router.push(`/dashboard/timesheet?${searchParams.toString()}`);
  };

  return (
    <div className="space-y-6">
      <ConfirmationDialog />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Feuilles de temps</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérez vos entrées de temps
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Tabs pour mode de vue */}
      <Tabs value={viewMode} onValueChange={handleViewModeChange as any}>
        <TabsList>
          <TabsTrigger value="week">Semaine</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="entry">Saisie rapide</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-6">
          {/* Navigation semaine */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 7);
                handleDateChange(newDate);
              }}
            >
              Semaine précédente
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP', { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 7);
                handleDateChange(newDate);
              }}
            >
              Semaine suivante
            </Button>
          </div>

          {/* Vue hebdomadaire */}
          <WeeklyTimesheet
            entries={entries}
            selectedDate={selectedDate}
            onDateSelect={handleDateChange}
            onAddEntry={handleDateChange}
            onSubmitWeek={(start, end) => console.log('Submit week:', start, end)}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Filtres historique */}
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filtres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="DRAFT">Brouillon</SelectItem>
                        <SelectItem value="SUBMITTED">Soumis</SelectItem>
                        <SelectItem value="APPROVED">Approuvé</SelectItem>
                        <SelectItem value="REJECTED">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Projet</Label>
                    <Select
                      value={filters.projectId}
                      onValueChange={(value) => setFilters({ ...filters, projectId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les projets</SelectItem>
                        {projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleFiltersChange}>Appliquer</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        status: 'all',
                        projectId: 'all',
                        startDate: startOfMonth(new Date()),
                        endDate: endOfMonth(new Date()),
                      });
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste historique */}
          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
              <CardDescription>
                {entries.length} entrée(s) trouvée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune entrée trouvée
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{entry.Project?.name || 'Sans projet'}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.date), 'dd/MM/yyyy')} - {entry.duration}h
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry" className="space-y-6">
          <TimesheetQuickEntry
            projects={projects}
            onEntryCreated={refreshData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
