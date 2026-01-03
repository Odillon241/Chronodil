import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { StatCardWithComparison } from "@/components/features/stat-card-with-comparison";
import { getTranslations } from "@/lib/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, Users, CheckSquare2, Calendar, Clock, ListTodo, Plus, FileText } from "lucide-react";
import Link from "next/link";
import { DashboardRealtimeWrapper } from "@/components/features/dashboard-realtime-wrapper";
import { TaskStatsChart } from "@/components/features/task-stats-chart";

export const metadata = {
  title: 'Tableau de bord | Chronodil',
  description: 'Vue d\'ensemble de vos activités, projets et statistiques de temps',
};

async function getDashboardData(userId: string) {
  // Exécution séquentielle pour respecter la limite du pool de connexions (connection_limit=1)
  // Chaque requête s'exécute une après l'autre pour éviter les timeouts

  let activeProjects: any[] = [];
  let myProjects: any[] = [];
  let taskStats: any[] = [];
  let recentTasks: any[] = [];
  let recentHRTimesheets: any[] = [];
  let taskWeeklyData: any[] = [];

  try {
    // 1. Projets actifs
    activeProjects = await prisma.project.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        color: true,
        _count: {
          select: { Task: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch (error) {
    console.error("Error fetching activeProjects:", error);
  }

  try {
    // 2. Mes projets (où je suis membre)
    myProjects = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        Project: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true
          }
        }
      },
      take: 5,
    });
  } catch (error) {
    console.error("Error fetching myProjects:", error);
  }

  try {
    // 3. Statistiques des tâches
    taskStats = await prisma.task.groupBy({
      by: ["status"],
      where: {
        createdBy: userId,
        isActive: true,
      },
      _count: true,
    }) as any;
  } catch (error) {
    console.error("Error fetching taskStats:", error);
  }

  try {
    // 4. Tâches récentes
    recentTasks = await prisma.task.findMany({
      where: {
        createdBy: userId,
        isActive: true,
      },
      include: {
        Project: {
          select: { name: true, code: true, color: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch (error) {
    console.error("Error fetching recentTasks:", error);
  }

  try {
    // 5. Feuilles RH récentes
    recentHRTimesheets = await prisma.hRTimesheet.findMany({
      where: { userId },
      select: {
        id: true,
        weekStartDate: true,
        weekEndDate: true,
        status: true,
        totalHours: true,
        employeeName: true,
        position: true,
        site: true,
      },
      orderBy: { weekStartDate: "desc" },
      take: 5,
    });
  } catch (error) {
    console.error("Error fetching recentHRTimesheets:", error);
  }

  try {
    // 6. Données historiques des tâches par semaine (4 dernières semaines)
    const now = new Date();
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weeks.push({
        weekStart,
        weekEnd,
        weekLabel: format(weekStart, "dd MMM", { locale: fr }),
      });
    }

    // Récupérer toutes les tâches actives créées avant ou pendant les 4 dernières semaines
    const allTasks = await prisma.task.findMany({
      where: {
        createdBy: userId,
        isActive: true,
        createdAt: {
          lte: weeks[weeks.length - 1].weekEnd,
        },
      },
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Grouper par semaine et par statut
    // Pour chaque semaine, on compte les tâches qui existaient à la fin de cette semaine
    taskWeeklyData = weeks.map((week) => {
      // Tâches qui existaient à la fin de cette semaine (créées avant ou pendant la semaine)
      const weekTasks = allTasks.filter((task) => {
        const taskDate = new Date(task.createdAt);
        return taskDate <= week.weekEnd;
      });

      // Compter les tâches par statut
      // Note: On utilise le statut actuel, idéalement on devrait utiliser le statut historique
      // mais pour simplifier, on utilise le statut actuel
      const todo = weekTasks.filter((t) => t.status === "TODO").length;
      const inProgress = weekTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const done = weekTasks.filter((t) => t.status === "DONE").length;

      return {
        week: week.weekLabel,
        todo,
        inProgress,
        done,
      };
    });
  } catch (error) {
    console.error("Error fetching taskWeeklyData:", error);
  }

  const todoCount = taskStats.find((s: { status: string }) => s.status === "TODO")?._count || 0;
  const inProgressCount = taskStats.find((s: { status: string }) => s.status === "IN_PROGRESS")?._count || 0;
  const doneCount = taskStats.find((s: { status: string }) => s.status === "DONE")?._count || 0;

  return {
    activeProjects,
    myProjects: myProjects.map((pm: { Project: unknown }) => pm.Project),
    recentTasks,
    recentHRTimesheets,
    todoCount,
    inProgressCount,
    doneCount,
    taskWeeklyData,
  };
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const t = await getTranslations("dashboard");
  const data = await getDashboardData(session.user.id);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <DashboardRealtimeWrapper />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("welcome")} {session.user.name} ! Voici un aperçu de votre activité.
          </p>
        </div>
      </div>

      <hr className="border-border" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCardWithComparison
          title="Tâches à faire"
          value={data.todoCount.toString()}
          description="Tâches en attente"
          iconName="list-todo"
          color="text-amber-600"
          bgColor="bg-amber-100"
        />
        <StatCardWithComparison
          title="En cours"
          value={data.inProgressCount.toString()}
          description="Tâches en progression"
          iconName="loader"
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCardWithComparison
          title="Terminées"
          value={data.doneCount.toString()}
          description="Tâches complétées"
          iconName="check-circle"
          color="text-green-600"
          bgColor="bg-green-100"
        />
      </div>

      <TaskStatsChart
        todo={data.todoCount}
        inProgress={data.inProgressCount}
        done={data.doneCount}
        weeklyData={data.taskWeeklyData}
      />

      {/* Sections avec onglets */}
      <Tabs defaultValue="hr-timesheets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="hr-timesheets">
            Mes Feuilles RH
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
              {data.recentHRTimesheets.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="projects">
            Mes Projets
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
              {data.myProjects.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tâches récentes
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
              {data.recentTasks.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hr-timesheets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mes Feuilles RH</CardTitle>
                  <CardDescription>Vos dernières feuilles de temps hebdomadaires</CardDescription>
                </div>
                <Link href="/dashboard/hr-timesheet">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Créer une feuille</span>
                    <span className="sm:hidden">Créer</span>
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-b-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="h-12 font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Semaine</span>
                        </div>
                      </TableHead>
                      <TableHead className="h-12 font-semibold">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>Employé</span>
                        </div>
                      </TableHead>
                      <TableHead className="h-12 font-semibold">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Heures</span>
                        </div>
                      </TableHead>
                      <TableHead className="h-12 text-right font-semibold">
                        <div className="flex items-center justify-end gap-2">
                          <CheckSquare2 className="h-4 w-4 text-muted-foreground" />
                          <span>Statut</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentHRTimesheets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm font-medium text-muted-foreground">
                              Aucune feuille de temps disponible
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              Les feuilles de temps apparaîtront ici une fois créées
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.recentHRTimesheets.map((timesheet: any) => (
                        <TableRow key={timesheet.id} className="group">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                              <div>
                                <p className="text-sm font-semibold text-foreground leading-tight">
                                  {format(new Date(timesheet.weekStartDate), "dd/MM/yyyy")} - {format(new Date(timesheet.weekEndDate), "dd/MM/yyyy")}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight">
                                {timesheet.employeeName || "-"}
                              </p>
                              {timesheet.position && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {timesheet.position}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                              <span className="text-sm font-semibold text-foreground">
                                {timesheet.totalHours.toFixed(1)}h
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <Badge
                              variant={
                                timesheet.status === "ODILLON_APPROVED"
                                  ? "default"
                                  : timesheet.status === "MANAGER_APPROVED" || timesheet.status === "PENDING"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={
                                timesheet.status === "ODILLON_APPROVED"
                                  ? "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20 dark:bg-green-500/20 dark:text-green-400"
                                  : timesheet.status === "MANAGER_APPROVED"
                                  ? "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400"
                                  : timesheet.status === "PENDING"
                                  ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400"
                                  : "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-400"
                              }
                            >
                              {timesheet.status === "ODILLON_APPROVED" ? (
                                <>
                                  <CheckSquare2 className="h-3 w-3 mr-1.5" />
                                  Approuvée
                                </>
                              ) : timesheet.status === "MANAGER_APPROVED" ? (
                                <>
                                  <CheckSquare2 className="h-3 w-3 mr-1.5" />
                                  Validée
                                </>
                              ) : timesheet.status === "PENDING" ? (
                                <>
                                  <Clock className="h-3 w-3 mr-1.5" />
                                  En attente
                                </>
                              ) : (
                                <>
                                  <FileText className="h-3 w-3 mr-1.5" />
                                  Brouillon
                                </>
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projets</CardTitle>
                  <CardDescription>Vue d'ensemble de tous les projets</CardDescription>
                </div>
                <Link href="/dashboard/projects">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Créer un projet</span>
                    <span className="sm:hidden">Créer</span>
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-b-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="h-12 font-semibold">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-muted-foreground" />
                          <span>Projet</span>
                        </div>
                      </TableHead>
                      <TableHead className="h-12 font-semibold">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Type</span>
                        </div>
                      </TableHead>
                      <TableHead className="h-12 text-right font-semibold">
                        <div className="flex items-center justify-end gap-2">
                          <CheckSquare2 className="h-4 w-4 text-muted-foreground" />
                          <span>Tâches</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.myProjects.length === 0 && data.activeProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm font-medium text-muted-foreground">
                              Aucun projet disponible
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              Les projets apparaîtront ici une fois créés
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {data.myProjects.map((project: any) => (
                          <TableRow key={`my-${project.id}`} className="group">
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-5 w-5 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-background transition-all group-hover:ring-4"
                                  style={{
                                    backgroundColor: project.color,
                                    "--tw-ring-color": project.color + "40"
                                  } as React.CSSProperties}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground leading-tight">
                                    {project.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                    {project.code}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge 
                                variant="secondary" 
                                className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                              >
                                <Users className="h-3 w-3 mr-1.5" />
                                Mes Projets
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <span className="text-sm font-medium text-muted-foreground">-</span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {data.activeProjects.map((project: any) => (
                          <TableRow key={`active-${project.id}`} className="group">
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-5 w-5 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-background transition-all group-hover:ring-4"
                                  style={{
                                    backgroundColor: project.color,
                                    "--tw-ring-color": project.color + "40"
                                  } as React.CSSProperties}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground leading-tight">
                                    {project.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                    {project.code}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge 
                                variant="outline" 
                                className="border-muted-foreground/30 hover:bg-muted/50"
                              >
                                <FolderKanban className="h-3 w-3 mr-1.5" />
                                Projets Actifs
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <CheckSquare2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <span className="text-sm font-medium text-foreground">
                                  {project._count.Task}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  tâche{project._count.Task > 1 ? 's' : ''}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tâches récentes</CardTitle>
                  <CardDescription>Vos dernières tâches créées</CardDescription>
                </div>
                <Link href="/dashboard/tasks">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Créer une tâche</span>
                    <span className="sm:hidden">Créer</span>
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-b-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="h-12 font-semibold">
                        <div className="flex items-center gap-2">
                          <ListTodo className="h-4 w-4 text-muted-foreground" />
                          <span>Tâche</span>
                        </div>
                      </TableHead>
                      <TableHead className="h-12 font-semibold">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-muted-foreground" />
                          <span>Projet</span>
                        </div>
                      </TableHead>
                      <TableHead className="h-12 font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Échéance</span>
                        </div>
                      </TableHead>
                      <TableHead className="h-12 text-right font-semibold">
                        <div className="flex items-center justify-end gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Statut</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <ListTodo className="h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm font-medium text-muted-foreground">
                              Aucune tâche récente
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              Les tâches créées apparaîtront ici
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.recentTasks.map((task: any) => (
                        <TableRow key={task.id} className="group">
                          <TableCell className="py-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground leading-tight">
                                {task.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              {task.Project ? (
                                <>
                                  <div
                                    className="h-3 w-3 rounded-full shrink-0 ring-1 ring-offset-1 ring-offset-background"
                                    style={{
                                      backgroundColor: task.Project.color || "#94a3b8",
                                      "--tw-ring-color": (task.Project.color || "#94a3b8") + "40"
                                    } as React.CSSProperties}
                                  />
                                  <span className="text-sm text-muted-foreground truncate">
                                    {task.Project.name}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground/60 italic">
                                  Sans projet
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {task.dueDate ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <span className="text-sm text-foreground font-medium">
                                  {format(new Date(task.dueDate), "dd/MM/yyyy")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground/60">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <Badge
                              variant={
                                task.status === "DONE"
                                  ? "default"
                                  : task.status === "IN_PROGRESS"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={
                                task.status === "DONE"
                                  ? "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20 dark:bg-green-500/20 dark:text-green-400"
                                  : task.status === "IN_PROGRESS"
                                  ? "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400"
                                  : "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-400"
                              }
                            >
                              {task.status === "DONE" ? (
                                <>
                                  <CheckSquare2 className="h-3 w-3 mr-1.5" />
                                  Terminée
                                </>
                              ) : task.status === "IN_PROGRESS" ? (
                                <>
                                  <Clock className="h-3 w-3 mr-1.5" />
                                  En cours
                                </>
                              ) : (
                                <>
                                  <ListTodo className="h-3 w-3 mr-1.5" />
                                  À faire
                                </>
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
