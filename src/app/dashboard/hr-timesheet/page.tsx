"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Filter, X, Plus, Eye, Edit, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/actions/hr-timesheet.actions";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HRTimesheetStatsChart } from "@/components/features/hr-timesheet-stats-chart";

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

export default function HRTimesheetPage() {
  const router = useRouter();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [myTimesheets, setMyTimesheets] = useState<HRTimesheet[]>([]);
  const [pendingTimesheets, setPendingTimesheets] = useState<HRTimesheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentTab, setCurrentTab] = useState<"my" | "pending">("my");

  const [filters, setFilters] = useState({
    status: "all",
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  });

  const loadMyTimesheets = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getMyHRTimesheets({
        ...(filters.status && filters.status !== "all" && { status: filters.status as any }),
        weekStartDate: filters.startDate,
        weekEndDate: filters.endDate,
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
    if (currentTab === "my") {
      loadMyTimesheets();
    } else {
      loadPendingTimesheets();
    }
  }, [currentTab, loadMyTimesheets, loadPendingTimesheets]);

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
                      toast.error("Erreur lors de l'annulation");
                    }
                  } catch (error) {
                    toast.error("Erreur lors de l'annulation");
                  }
                },
              },
            });
            loadMyTimesheets();
          } else {
            toast.error(result?.serverError || "Erreur lors de la soumission");
          }
        } catch (error) {
          toast.error("Erreur lors de la soumission");
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
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, icon: any }> = {
      DRAFT: { variant: "outline", label: "Brouillon", icon: Edit },
      PENDING: { variant: "secondary", label: "En attente", icon: Clock },
      MANAGER_APPROVED: { variant: "default", label: "Validé Manager", icon: CheckCircle },
      APPROVED: { variant: "default", label: "Approuvé", icon: CheckCircle },
      REJECTED: { variant: "destructive", label: "Rejeté", icon: XCircle },
    };

    const config = variants[status] || variants.DRAFT;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const TimesheetCard = ({ timesheet, isPending = false }: { timesheet: HRTimesheet, isPending?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
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
            <p className="font-bold text-rusty-red text-lg">{timesheet.totalHours.toFixed(1)}h</p>
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

        {/* Commentaires */}
        {(timesheet.employeeObservations || timesheet.managerComments || timesheet.odillonComments) && (
          <div className="space-y-1 text-xs border-t pt-3">
            {timesheet.employeeObservations && (
              <div>
                <p className="font-medium">Observations employé:</p>
                <p className="text-muted-foreground">{timesheet.employeeObservations}</p>
              </div>
            )}
            {timesheet.managerComments && (
              <div>
                <p className="font-medium">Commentaires manager:</p>
                <p className="text-muted-foreground">{timesheet.managerComments}</p>
              </div>
            )}
            {timesheet.odillonComments && (
              <div>
                <p className="font-medium">Commentaires admin:</p>
                <p className="text-muted-foreground">{timesheet.odillonComments}</p>
              </div>
            )}
          </div>
        )}

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
                className="bg-rusty-red hover:bg-ou-crimson"
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
              className="bg-rusty-red hover:bg-ou-crimson"
              onClick={() => router.push(`/dashboard/hr-timesheet/${timesheet.id}/validate`)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Valider
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feuilles de temps RH</h1>
          <p className="text-muted-foreground">
            Gestion des timesheets hebdomadaires des activités RH
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/hr-timesheet/new")}
          className="bg-rusty-red hover:bg-ou-crimson"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau timesheet
        </Button>
      </div>

      <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as "my" | "pending")}>
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="my">Mes timesheets</TabsTrigger>
          <TabsTrigger value="pending">
            À valider
            {pendingTimesheets.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingTimesheets.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Mes timesheets */}
        <TabsContent value="my" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mes timesheets RH</CardTitle>
                  <CardDescription>
                    Consultez et gérez vos feuilles de temps hebdomadaires
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtres */}
              {showFilters && (
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
                            {format(filters.startDate, "dd/MM/yyyy", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={filters.startDate}
                            onSelect={(d) => d && setFilters({ ...filters, startDate: d })}
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
                            {format(filters.endDate, "dd/MM/yyyy", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={filters.endDate}
                            onSelect={(d) => d && setFilters({ ...filters, endDate: d })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={applyFilters} className="bg-rusty-red hover:bg-ou-crimson">
                      Appliquer
                    </Button>
                    <Button variant="outline" onClick={resetFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              )}

              {/* Liste des timesheets */}
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : myTimesheets.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/30">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucun timesheet trouvé</p>
                  <Button
                    onClick={() => router.push("/dashboard/hr-timesheet/new")}
                    className="mt-4 bg-rusty-red hover:bg-ou-crimson"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer mon premier timesheet
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myTimesheets.map((timesheet) => (
                    <TimesheetCard key={timesheet.id} timesheet={timesheet} />
                  ))}
                </div>
              )}

              {/* Graphique des statistiques */}
              {myTimesheets.length > 0 && (
                <div className="mt-6">
                  <HRTimesheetStatsChart
                    draft={myTimesheets.filter((t) => t.status === "DRAFT").length}
                    pending={myTimesheets.filter((t) => ["PENDING", "MANAGER_APPROVED"].includes(t.status)).length}
                    approved={myTimesheets.filter((t) => t.status === "APPROVED").length}
                    rejected={myTimesheets.filter((t) => t.status === "REJECTED").length}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timesheets à valider */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timesheets à valider</CardTitle>
              <CardDescription>
                Validez les feuilles de temps en attente d'approbation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : pendingTimesheets.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/30">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="text-muted-foreground">Aucun timesheet en attente de validation</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingTimesheets.map((timesheet) => (
                    <TimesheetCard key={timesheet.id} timesheet={timesheet} isPending />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ConfirmationDialog />
    </div>
  );
}
