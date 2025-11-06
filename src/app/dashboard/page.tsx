import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { StatCardWithComparison } from "@/components/features/stat-card-with-comparison";
import { getTranslations } from "@/lib/i18n";

export const metadata = {
  title: 'Tableau de bord | Chronodil',
  description: 'Vue d\'ensemble de vos activités, projets et statistiques de temps',
};

async function getDashboardData(userId: string) {
  try {
    // 🚀 PARALLÉLISATION : Exécuter toutes les requêtes en même temps
    const [
      activeProjects,
      myProjects,
      recentTasks,
      taskStats,
    ] = await Promise.all([
      // 1. Projets actifs
      prisma.project.findMany({
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
      }),
      // 2. Mes projets (où je suis membre)
      prisma.projectMember.findMany({
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
      }),
      // 3. Tâches récentes
      prisma.task.findMany({
        where: {
          createdBy: userId,
          isActive: true,
        },
        include: {
          Project: {
            select: { name: true, code: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // 4. Statistiques des tâches
      prisma.task.groupBy({
        by: ["status"],
        where: {
          createdBy: userId,
          isActive: true,
        },
        _count: true,
      }),
    ]);

    const todoCount = taskStats.find(s => s.status === "TODO")?._count || 0;
    const inProgressCount = taskStats.find(s => s.status === "IN_PROGRESS")?._count || 0;
    const doneCount = taskStats.find(s => s.status === "DONE")?._count || 0;

    return {
      activeProjects,
      myProjects: myProjects.map(pm => pm.Project),
      recentTasks,
      todoCount,
      inProgressCount,
      doneCount,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error("Impossible de charger les données du tableau de bord. Veuillez réessayer.");
  }
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const t = await getTranslations("dashboard");
  const data = await getDashboardData(session.user.id);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("welcome")} {session.user.name} ! Voici un aperçu de votre activité.
          </p>
        </div>
      </div>

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

      {/* Sections avec onglets */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
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

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes Projets</CardTitle>
              <CardDescription>Projets auxquels vous participez</CardDescription>
            </CardHeader>
            <CardContent>
              {data.myProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Vous ne participez à aucun projet
                </p>
              ) : (
                <div className="space-y-3">
                  {data.myProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <div>
                          <p className="text-sm font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.code}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projets Actifs</CardTitle>
              <CardDescription>Tous les projets actifs dans l'organisation</CardDescription>
            </CardHeader>
            <CardContent>
              {data.activeProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun projet actif
                </p>
              ) : (
                <div className="space-y-3">
                  {data.activeProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <div>
                          <p className="text-sm font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.code}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {project._count.Task} tâche{project._count.Task > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tâches récentes</CardTitle>
              <CardDescription>Vos dernières tâches créées</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune tâche récente
                </p>
              ) : (
                <div className="space-y-4">
                  {data.recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                          {task.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {task.Project?.name || "Sans projet"}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Échéance: {format(new Date(task.dueDate), "dd/MM/yyyy")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            task.status === "DONE"
                              ? "bg-green-100 text-green-700"
                              : task.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {task.status === "DONE" ? "Terminée" : task.status === "IN_PROGRESS" ? "En cours" : "À faire"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
