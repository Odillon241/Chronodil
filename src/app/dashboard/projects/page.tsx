"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  FolderKanban,
  Users,
  Clock,
  MoreVertical,
  Edit,
  Archive,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  Eye,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowUpDown,
  Grid3x3,
  List,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { SpinnerCustom } from "@/components/features/loading-spinner";
import { toast } from "sonner";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import {
  getProjects,
  createProject,
  updateProject,
  archiveProject,
  cloneProject,
  deleteProject,
} from "@/actions/project.actions";
import { getDepartments } from "@/actions/settings.actions";
import { getAllUsers } from "@/actions/user.actions";
import { ProjectTeamDialog } from "@/components/features/project-team-dialog";
import type { Project } from "@/types/project.types";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/lib/auth-client";
import { ProjectHealthIndicator } from "@/components/features/project-health-indicator";
import { useRealtimeProjects } from "@/hooks/use-realtime-projects";
import { FilterButtonGroup } from "@/components/ui/filter-button-group";
import { StatusTabs } from "@/components/ui/status-menubar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ViewMode = "grid" | "list";
type SortField = "name" | "code" | "createdAt" | "budgetHours" | "progress";
type SortOrder = "asc" | "desc";

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function ProjectsPage() {
  // Get current user session
  const { data: session } = useSession();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const currentUser = session?.user;
  const t = useTranslations("projects");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Data states
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter and view states
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Filtrer les utilisateurs pour exclure les comptes ADMIN
  const availableUsers = useMemo(() => {
    return users.filter((user) => user.role !== "ADMIN");
  }, [users]);

  useEffect(() => {
    loadData();
  }, []);

  // Reload projects when filterStatus changes
  useEffect(() => {
    loadProjects();
  }, [filterStatus]);

  // Real-time updates pour les projets
  useRealtimeProjects({
    onProjectChange: (eventType, projectId) => {
      loadProjects();
    },
    userId: currentUser?.id,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStartDate, filterEndDate, filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsResult, deptResult, usersResult] = await Promise.all([
        getProjects({ 
          isActive: filterStatus === "all" ? undefined : filterStatus === "active" ? true : false
        }),
        getDepartments({}),
        getAllUsers({}),
      ]);

      if (projectsResult?.data) {
        setProjects(projectsResult.data);
      }
      if (deptResult?.data) {
        setDepartments(deptResult.data as Department[]);
      }
      if (usersResult?.data) {
        setUsers(usersResult.data);
      }
    } catch (error) {
      toast.error(t("messages.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const filterParam = filterStatus === "all" ? undefined : filterStatus === "active" ? true : false;
      const result = await getProjects({ isActive: filterParam });
      
      if (result?.data) {
        setProjects(result.data);
      }
    } catch (error) {
      toast.error(t("messages.loadProjectsError"));
    }
  };

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSubmitting(true);

    try {
      const result = await createProject({
        name: formData.get("name") as string,
        code: formData.get("code") as string,
        description: formData.get("description") as string,
        color: formData.get("color") as string,
        budgetHours: parseFloat(formData.get("budgetHours") as string) || undefined,
        hourlyRate: parseFloat(formData.get("hourlyRate") as string) || undefined,
        departmentId: formData.get("departmentId") as string || undefined,
        startDate: formData.get("startDate")
          ? new Date(formData.get("startDate") as string)
          : undefined,
        endDate: formData.get("endDate")
          ? new Date(formData.get("endDate") as string)
          : undefined,
        memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
      });

      if (result?.data) {
        toast.success(t("messages.created"));
        setCreateDialogOpen(false);
        setSelectedMemberIds([]);
        loadProjects();
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result?.serverError || t("messages.createError"));
      }
    } catch (error) {
      toast.error(t("messages.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProject) return;

    const formData = new FormData(e.currentTarget);
    setSubmitting(true);

    try {
      const result = await updateProject({
        id: selectedProject.id,
        data: {
          name: formData.get("name") as string,
          code: formData.get("code") as string,
          description: formData.get("description") as string,
          color: formData.get("color") as string,
          budgetHours: parseFloat(formData.get("budgetHours") as string) || undefined,
          hourlyRate: parseFloat(formData.get("hourlyRate") as string) || undefined,
          departmentId: formData.get("departmentId") as string || undefined,
          startDate: formData.get("startDate")
            ? new Date(formData.get("startDate") as string)
            : undefined,
          endDate: formData.get("endDate")
            ? new Date(formData.get("endDate") as string)
            : undefined,
        },
      });

      if (result?.data) {
        toast.success(t("messages.updated"));
        setEditDialogOpen(false);
        setSelectedProject(null);
        loadProjects();
      } else {
        toast.error(result?.serverError || t("messages.updateError"));
      }
    } catch (error) {
      toast.error(t("messages.updateError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveProject = async (project: any) => {
    const confirmed = await showConfirmation({
      title: `${project.isActive ? t("archive") : t("reactivate")} le projet`,
      description: `Voulez-vous vraiment ${project.isActive ? "archiver" : "réactiver"} le projet "${project.name}" ?`,
      confirmText: project.isActive ? t("archive") : t("reactivate"),
      cancelText: t("messages.undo"),
      variant: project.isActive ? "destructive" : "default",
      onConfirm: async () => {
        try {
          const result = await archiveProject({ id: project.id });
          if (result?.data) {
            const wasActive = project.isActive;
            
            // Afficher le toast avec action Undo
            toast.success(
              wasActive ? t("messages.archived") : t("messages.reactivated"),
              {
                description: `${project.name} a été ${wasActive ? "archivé" : "réactivé"} avec succès`,
                action: {
                  label: t("messages.undo"),
                  onClick: async () => {
                    try {
                      const undoResult = await archiveProject({ id: project.id });
                      if (undoResult?.data) {
                        toast.success(
                          wasActive ? t("messages.reactivated") : t("messages.archived"),
                          {
                            description: `${project.name} a été ${wasActive ? "réactivé" : "archivé"}`,
                          }
                        );
                        loadProjects();
                      } else {
                        toast.error(t("messages.undoError"));
                      }
                    } catch (error) {
                      toast.error(t("messages.undoError"));
                    }
                  },
                },
              }
            );
            loadProjects();
          } else {
            toast.error(result?.serverError || t("messages.archiveError"));
          }
        } catch (error) {
          toast.error(t("messages.archiveError"));
        }
      },
    });
  };

  const handleManageTeam = (project: any) => {
    setSelectedProject(project);
    setTeamDialogOpen(true);
  };

  const handleViewDetails = (project: any) => {
    setSelectedProject(project);
    setDetailsDialogOpen(true);
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setEditDialogOpen(true);
  };

  const handleCloneProject = async (project: any) => {
    const confirmed = await showConfirmation({
      title: "Cloner le projet",
      description: `Voulez-vous vraiment cloner le projet "${project.name}" ?\n\nLe nouveau projet sera créé avec tous les membres de l'équipe.`,
      confirmText: t("clone"),
      cancelText: t("messages.undo"),
      onConfirm: async () => {
        try {
          const result = await cloneProject({ id: project.id });
          if (result?.data) {
            toast.success(t("messages.cloned"));
            loadProjects();
          } else {
            toast.error(result?.serverError || "Erreur lors du clonage");
          }
        } catch (error) {
          toast.error(t("messages.cloneError"));
        }
      },
    });
  };

  const handleDeleteProject = async (project: any) => {
    // Vérifier les permissions côté client
    const userRole = (currentUser as any)?.role as string;
    const isAdmin = userRole === "ADMIN";
    const isCreator = project.createdBy === currentUser?.id;

    if (!isAdmin && !isCreator) {
      toast.error(
        t("messages.noPermissionDelete")
      );
      return;
    }

    const confirmed = await showConfirmation({
      title: "⚠️ Supprimer définitivement le projet",
      description: `Voulez-vous vraiment supprimer définitivement le projet "${project.name}" ?\n\nCette action est irréversible et supprimera :\n- Le projet et toutes ses données\n- Tous les membres associés\n- Toutes les tâches du projet\n- Toutes les entrées de timesheet associées`,
      confirmText: t("delete"),
      cancelText: t("messages.undo"),
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteProject({ id: project.id });
          if (result?.data) {
            toast.success(`Projet "${result.data.projectName}" supprimé avec succès !`);
            loadProjects();
          } else {
            toast.error(result?.serverError || "Erreur lors de la suppression");
          }
        } catch (error) {
          toast.error(t("messages.deleteError"));
        }
      },
    });
  };

  // Helper function to check if user can delete a project
  const canDeleteProject = (project: any): boolean => {
    if (!currentUser) return false;
    const userRole = (currentUser as any)?.role as string;
    const isAdmin = userRole === "ADMIN";
    const isCreator = project.createdBy === currentUser.id;
    return isAdmin || isCreator;
  };

  const handleExportCSV = () => {
    // Prepare CSV data
    const headers = [
      t("sortByCode"),
      t("sortByName"),
      t("department"),
      "Budget (h)",
      "Utilisé (h)",
      "Progression (%)",
      t("hourlyRate"),
      t("members"),
      "Date début",
      "Date fin",
      t("detailsDialog.status"),
    ];

    const rows = processedProjects.map((project) => {
      const progress = project.budgetHours
        ? ((project.usedHours / project.budgetHours) * 100).toFixed(1)
        : "0";

      return [
        project.code,
        project.name,
        project.Department?.name || "N/A",
        project.budgetHours || "N/A",
        project.usedHours?.toFixed(1) || "0",
        progress,
        project.hourlyRate || "N/A",
        project.ProjectMember?.length || "0",
        project.startDate
          ? new Date(project.startDate).toLocaleDateString("fr-FR")
          : "N/A",
        project.endDate
          ? new Date(project.endDate).toLocaleDateString("fr-FR")
          : "N/A",
        project.isActive ? t("status.active") : t("status.archived"),
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `projets_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(t("messages.exportSuccess"));
  };

  // Filtered and sorted projects with useMemo for performance
  const processedProjects = useMemo(() => {
    let filtered = projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDepartment = true;

      // Date range filtering
      let matchesDateRange = true;
      if (filterStartDate && project.startDate) {
        const projectStart = new Date(project.startDate);
        const filterStart = new Date(filterStartDate);
        matchesDateRange = matchesDateRange && projectStart >= filterStart;
      }
      if (filterEndDate && project.endDate) {
        const projectEnd = new Date(project.endDate);
        const filterEnd = new Date(filterEndDate);
        matchesDateRange = matchesDateRange && projectEnd <= filterEnd;
      }

      return matchesSearch && matchesDepartment && matchesDateRange;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "code":
          aValue = a.code.toLowerCase();
          bValue = b.code.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "budgetHours":
          aValue = a.budgetHours || 0;
          bValue = b.budgetHours || 0;
          break;
        case "progress":
          aValue = a.budgetHours ? (a.usedHours / a.budgetHours) * 100 : 0;
          bValue = b.budgetHours ? (b.usedHours / b.budgetHours) * 100 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projects, searchQuery, filterStartDate, filterEndDate, sortField, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.isActive);
    const totalBudgetHours = activeProjects.reduce(
      (sum, p) => sum + (p.budgetHours || 0),
      0
    );
    const totalUsedHours = activeProjects.reduce(
      (sum, p) => sum + (p.usedHours || 0),
      0
    );
    const averageProgress =
      activeProjects.length > 0
        ? activeProjects.reduce((sum, p) => {
            const progress = p.budgetHours ? (p.usedHours / p.budgetHours) * 100 : 0;
            return sum + progress;
          }, 0) / activeProjects.length
        : 0;

    return {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      totalBudgetHours,
      totalUsedHours,
      averageProgress,
    };
  }, [projects]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Pagination calculations
  const paginationInfo = useMemo(() => {
    const totalItems = processedProjects.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      currentPage,
      itemsPerPage,
    };
  }, [processedProjects.length, currentPage, itemsPerPage]);

  // Paginated projects
  const paginatedProjects = useMemo(() => {
    return processedProjects.slice(paginationInfo.startIndex, paginationInfo.endIndex);
  }, [processedProjects, paginationInfo.startIndex, paginationInfo.endIndex]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <SpinnerCustom />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary w-full sm:w-auto text-xs sm:text-sm">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {t("new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateProject}>
              <DialogHeader>
                <DialogTitle>{t("create.title")}</DialogTitle>
                <DialogDescription>
                  {t("create.subtitle")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Nom du projet *</Label>
                    <Input
                      id="create-name"
                      name="name"
                      placeholder={t("create.namePlaceholder")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-code">Code *</Label>
                    <Input
                      id="create-code"
                      name="code"
                      placeholder={t("create.codePlaceholder")}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-description">Description</Label>
                  <Textarea
                    id="create-description"
                    name="description"
                    placeholder={t("create.descPlaceholder")}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="create-department">Département</Label>
                    <Select name="departmentId">
                      <SelectTrigger id="create-department">
                        <SelectValue placeholder={t("create.selectDepartment")} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-color">Couleur</Label>
                    <Input
                      id="create-color"
                      name="color"
                      type="color"
                      defaultValue="#dd2d4a"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="create-budgetHours">Budget (heures)</Label>
                    <Input
                      id="create-budgetHours"
                      name="budgetHours"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-hourlyRate">Taux horaire (F CFA)</Label>
                    <Input
                      id="create-hourlyRate"
                      name="hourlyRate"
                      type="number"
                      step="100"
                      min="0"
                      placeholder="20000"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="create-startDate">Date de début</Label>
                    <Input id="create-startDate" name="startDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-endDate">Date de fin</Label>
                    <Input id="create-endDate" name="endDate" type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Membres du projet</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Sélectionnez les membres à ajouter au projet (vous serez automatiquement ajouté)
                  </p>
                  <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                    {availableUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Aucun utilisateur disponible
                      </p>
                    ) : (
                      availableUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedMemberIds.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMemberIds([...selectedMemberIds, user.id]);
                              } else {
                                setSelectedMemberIds(
                                  selectedMemberIds.filter((id) => id !== user.id)
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={`user-${user.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {user.name}
                            <span className="text-muted-foreground ml-2">
                              ({user.email})
                            </span>
                            {user.Department && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {user.Department.name}
                              </Badge>
                            )}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedMemberIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedMemberIds.length} membre(s) sélectionné(s)
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <SpinnerCustom />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barre de séparation */}
      <div className="border-b"></div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBudgetHours}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsedHours.toFixed(0)}h utilisées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Progression Moyenne
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageProgress.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Sur projets actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Départements</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">Impliqués</p>
          </CardContent>
        </Card>
      </div>

      {/* Nouveaux composants de filtre */}
      <div className="space-y-4">
        {/* Filtres de recherche et période */}
        <FilterButtonGroup
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterOptions={[
            { id: 'status', label: 'Statut', value: 'status' },
            { id: 'date', label: 'Date', value: 'date' },
          ]}
          selectedFilter=""
          onFilterChange={() => {}}
          startDate={filterStartDate}
          endDate={filterEndDate}
          onDateChange={(start, end) => {
            setFilterStartDate(start);
            setFilterEndDate(end);
          }}
          placeholder="Rechercher un projet..."
        />

        {/* Onglets de statut */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <StatusTabs
            options={[
              { id: 'active', label: 'Actifs', value: 'active', count: stats.activeProjects },
              { id: 'inactive', label: 'Archivés', value: 'inactive', count: stats.totalProjects - stats.activeProjects },
              { id: 'all', label: 'Tous', value: 'all', count: stats.totalProjects },
            ]}
            selectedValue={filterStatus}
            onValueChange={setFilterStatus}
          />
        </div>
      </div>

      {/* Actions et contrôles de vue */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={processedProjects.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Trier
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleSort("name")}>
                Nom {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("code")}>
                Code {sortField === "code" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("createdAt")}>
                Date {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("budgetHours")}>
                Budget {sortField === "budgetHours" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("progress")}>
                Progression{" "}
                {sortField === "progress" && (sortOrder === "asc" ? "↑" : "↓")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-none border-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border" />
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-none border-0"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>


      {/* Projects Display */}
      {processedProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun projet trouvé</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {searchQuery
                ? t("noProjectsFilter")
                : t("startCreating")}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedProjects.map((project) => {
            const progress = project.budgetHours
              ? (project.usedHours / project.budgetHours) * 100
              : 0;
            const progressColor =
              progress > 90
                ? "bg-red-500"
                : progress > 70
                  ? "bg-amber-500"
                  : "bg-green-500";

            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color || "#dd2d4a" }}
                        />
                        <span className="line-clamp-1">{project.name}</span>
                        {project.budgetHours && (
                          <ProjectHealthIndicator
                            budgetHours={project.budgetHours}
                            consumedHours={project.usedHours || 0}
                          />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <CardDescription>{project.code}</CardDescription>
                        {project.Department && (
                          <Badge variant="secondary" className="text-xs">
                            {project.Department.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(project)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditProject(project)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageTeam(project)}>
                          <Users className="mr-2 h-4 w-4" />
                          Gérer l'équipe
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCloneProject(project)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Cloner
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleArchiveProject(project)}
                          className="text-amber-600"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          {project.isActive ? t("archive") : t("reactivate")}
                        </DropdownMenuItem>
                        {canDeleteProject(project) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteProject(project)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description || t("noDescription")}
                  </p>

                  {project.startDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.startDate).toLocaleDateString("fr-FR")}
                      {project.endDate && (
                        <> → {new Date(project.endDate).toLocaleDateString("fr-FR")}</>
                      )}
                    </div>
                  )}

                  {project.budgetHours && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${progressColor} transition-all`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{project.usedHours?.toFixed(1) || 0}h utilisées</span>
                        <span>{project.budgetHours}h budget</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {project.ProjectMember?.length || 0} membres
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {project.budgetHours
                          ? `${Math.max(0, project.budgetHours - (project.usedHours || 0)).toFixed(0)}h restantes`
                          : "Pas de budget"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetails(project)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Détails
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary"
                      onClick={() => handleManageTeam(project)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Équipe
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {paginationInfo.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Affichage de {paginationInfo.startIndex + 1} à{" "}
              {Math.min(paginationInfo.endIndex, paginationInfo.totalItems)} sur{" "}
              {paginationInfo.totalItems} projets
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: paginationInfo.totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === paginationInfo.totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={
                          page === currentPage
                            ? "bg-primary hover:bg-primary"
                            : ""
                        }
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(paginationInfo.totalPages, p + 1))
                }
                disabled={currentPage === paginationInfo.totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        </div>
      ) : (
        <div className="space-y-4">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Nom du projet</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Membres</TableHead>
                  <TableHead className="text-center">Budget</TableHead>
                  <TableHead className="text-center">Progression</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucun projet trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProjects.map((project) => {
                    const progress = project.budgetHours
                      ? (project.usedHours / project.budgetHours) * 100
                      : 0;
                    const progressColor =
                      progress > 90
                        ? "bg-red-500"
                        : progress > 70
                          ? "bg-amber-500"
                          : "bg-green-500";

                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color || "#dd2d4a" }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {project.name}
                            {project.budgetHours && (
                              <ProjectHealthIndicator
                                budgetHours={project.budgetHours}
                                consumedHours={project.usedHours || 0}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {project.code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {project.Department ? (
                            <Badge variant="secondary" className="text-xs">
                              {project.Department.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="text-sm text-muted-foreground truncate">
                            {project.description || t("noDescription")}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {project.ProjectMember?.length || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {project.budgetHours ? (
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-medium">
                                {project.usedHours?.toFixed(0) || 0}/{project.budgetHours}h
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {Math.max(0, project.budgetHours - (project.usedHours || 0)).toFixed(0)}h restantes
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {project.budgetHours ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${progressColor} transition-all`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(project)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditProject(project)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManageTeam(project)}>
                                <Users className="mr-2 h-4 w-4" />
                                Gérer l'équipe
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCloneProject(project)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Cloner
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleArchiveProject(project)}
                                className="text-amber-600"
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                {project.isActive ? t("archive") : t("reactivate")}
                              </DropdownMenuItem>
                              {canDeleteProject(project) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteProject(project)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {paginationInfo.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Affichage de {paginationInfo.startIndex + 1} à{" "}
              {Math.min(paginationInfo.endIndex, paginationInfo.totalItems)} sur{" "}
              {paginationInfo.totalItems} projets
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: paginationInfo.totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === paginationInfo.totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={
                          page === currentPage
                            ? "bg-primary hover:bg-primary"
                            : ""
                        }
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(paginationInfo.totalPages, p + 1))
                }
                disabled={currentPage === paginationInfo.totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdateProject}>
            <DialogHeader>
              <DialogTitle>Modifier le projet</DialogTitle>
              <DialogDescription>
                Modifiez les informations du projet
              </DialogDescription>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nom du projet *</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      placeholder={t("create.namePlaceholder")}
                      defaultValue={selectedProject.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-code">Code *</Label>
                    <Input
                      id="edit-code"
                      name="code"
                      placeholder={t("create.codePlaceholder")}
                      defaultValue={selectedProject.code}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    placeholder={t("create.descPlaceholder")}
                    defaultValue={selectedProject.description || ""}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Département</Label>
                    <Select
                      name="departmentId"
                      defaultValue={selectedProject.departmentId || undefined}
                    >
                      <SelectTrigger id="edit-department">
                        <SelectValue placeholder={t("create.selectDepartment")} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-color">Couleur</Label>
                    <Input
                      id="edit-color"
                      name="color"
                      type="color"
                      defaultValue={selectedProject.color || "#dd2d4a"}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-budgetHours">Budget (heures)</Label>
                    <Input
                      id="edit-budgetHours"
                      name="budgetHours"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="500"
                      defaultValue={selectedProject.budgetHours || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hourlyRate">Taux horaire (F CFA)</Label>
                    <Input
                      id="edit-hourlyRate"
                      name="hourlyRate"
                      type="number"
                      step="100"
                      min="0"
                      placeholder="20000"
                      defaultValue={selectedProject.hourlyRate || ""}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startDate">Date de début</Label>
                    <Input
                      id="edit-startDate"
                      name="startDate"
                      type="date"
                      defaultValue={
                        selectedProject.startDate
                          ? new Date(selectedProject.startDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endDate">Date de fin</Label>
                    <Input
                      id="edit-endDate"
                      name="endDate"
                      type="date"
                      defaultValue={
                        selectedProject.endDate
                          ? new Date(selectedProject.endDate).toISOString().split("T")[0]
                          : ""
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedProject(null);
                }}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <SpinnerCustom />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Mettre à jour
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedProject.color || "#dd2d4a" }}
                  />
                  {selectedProject.name}
                </DialogTitle>
                <DialogDescription>
                  Code: {selectedProject.code}
                  {selectedProject.Department && ` • ${selectedProject.Department.name}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Description */}
                {selectedProject.description && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedProject.description}
                    </p>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Équipe</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {selectedProject.ProjectMember?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Membres</p>
                    </CardContent>
                  </Card>

                  {selectedProject.budgetHours && (
                    <>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Budget</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {selectedProject.budgetHours}h
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {selectedProject.usedHours?.toFixed(0) || 0}h utilisées
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Progression</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {((selectedProject.usedHours / selectedProject.budgetHours) * 100).toFixed(0)}%
                          </div>
                          <p className="text-xs text-muted-foreground">Complété</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {/* Timeline */}
                {(selectedProject.startDate || selectedProject.endDate) && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Calendrier</h3>
                    <div className="space-y-2">
                      {selectedProject.startDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Début:</span>
                          <span className="font-medium">
                            {new Date(selectedProject.startDate).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      )}
                      {selectedProject.endDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Fin:</span>
                          <span className="font-medium">
                            {new Date(selectedProject.endDate).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Info */}
                {selectedProject.hourlyRate && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Informations financières</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Taux horaire:</span>
                        <span className="font-medium">
                          {selectedProject.hourlyRate.toFixed(2)} F CFA/h
                        </span>
                      </div>
                      {selectedProject.budgetHours && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Budget total:</span>
                          <span className="font-medium">
                            {(selectedProject.budgetHours * selectedProject.hourlyRate).toFixed(2)} F CFA
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Statut</h3>
                  <div className="flex items-center gap-2">
                    {selectedProject.isActive ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-500 font-medium">Actif</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground font-medium">
                          Archivé
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleEditProject(selectedProject);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  className="bg-primary hover:bg-primary"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleManageTeam(selectedProject);
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Gérer l'équipe
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Team Management Dialog */}
      <ProjectTeamDialog
        project={selectedProject}
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        onUpdate={loadProjects}
      />
      <ConfirmationDialog />
    </div>
  );
}
