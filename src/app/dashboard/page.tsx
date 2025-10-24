import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, format, startOfDay, endOfDay, subWeeks, subDays } from "date-fns";
import { TimesheetAreaChart } from "@/components/features/timesheet-area-chart";
import { ProjectDistributionChart } from "@/components/features/project-distribution-chart";
import { StatCardWithComparison } from "@/components/features/stat-card-with-comparison";
import { WeeklyGoalSettings } from "@/components/features/weekly-goal-settings";
import { getTranslations } from "next-intl/server";

async function getDashboardData(userId: string) {
  try {
    const now = new Date();
    // Normalize dates to start/end of day to avoid timezone issues
    const weekStart = startOfDay(startOfWeek(now, { weekStartsOn: 1 }));
    const weekEnd = endOfDay(endOfWeek(now, { weekStartsOn: 1 }));
    const prevWeekStart = startOfDay(subWeeks(weekStart, 1));
    const prevWeekEnd = endOfDay(subWeeks(weekEnd, 1));
    const monthStart = startOfDay(startOfMonth(now));
    const monthEnd = endOfDay(endOfMonth(now));

  // Récupérer l'objectif hebdomadaire de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { weeklyGoal: true },
  });
  const weeklyGoal = user?.weeklyGoal || 40;

  // Stats de la semaine actuelle
  const weekEntries = await prisma.timesheetEntry.findMany({
    where: {
      userId,
      date: { gte: weekStart, lte: weekEnd },
    },
  });

  const weekHours = weekEntries.reduce((sum, entry) => sum + entry.duration, 0);

  // Stats de la semaine précédente (pour comparaison)
  const prevWeekEntries = await prisma.timesheetEntry.findMany({
    where: {
      userId,
      date: { gte: prevWeekStart, lte: prevWeekEnd },
    },
  });

  const prevWeekHours = prevWeekEntries.reduce((sum, entry) => sum + entry.duration, 0);

  // Stats du mois
  const monthEntries = await prisma.timesheetEntry.findMany({
    where: {
      userId,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  const approvedHours = monthEntries
    .filter((e) => e.status === "APPROVED")
    .reduce((sum, entry) => sum + entry.duration, 0);

  const pendingHours = monthEntries
    .filter((e) => e.status === "SUBMITTED")
    .reduce((sum, entry) => sum + entry.duration, 0);

  // Entrées récentes
  const recentEntries = await prisma.timesheetEntry.findMany({
    where: { userId },
    include: {
      Project: true,
      Task: true,
    },
    orderBy: { date: "desc" },
    take: 5,
  });

  // Répartition par projet (cette semaine) - Optimized with single query
  const projectsData = await prisma.timesheetEntry.groupBy({
    by: ["projectId"],
    where: {
      userId,
      date: { gte: weekStart, lte: weekEnd },
    },
    _sum: {
      duration: true,
    },
  });

  // Fetch all projects in a single query (filter out null projectIds)
  const projectIds = projectsData
    .map(item => item.projectId)
    .filter((id): id is string => id !== null);
  
  const projects = projectIds.length > 0 
    ? await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, name: true, color: true },
      })
    : [];

  // Create a map for O(1) lookup
  const projectMap = new Map(projects.map(p => [p.id, p]));

  const projectsWithDetails = projectsData.map((item) => {
    const project = item.projectId ? projectMap.get(item.projectId) : null;
    return {
      name: project?.name || (item.projectId ? "Projet supprimé" : "Sans projet"),
      hours: item._sum.duration || 0,
      color: project?.color || "#6b7280", // Couleur grise pour les entrées sans projet
    };
  });


  // Données pour le graphique radar (activité par jour de la semaine) - Optimized with single query
  const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const dailyTarget = 8; // 8h par jour

  // Group entries by day in a single aggregation query
  const dailyEntries = await prisma.timesheetEntry.groupBy({
    by: ["date"],
    where: {
      userId,
      date: { gte: weekStart, lte: weekEnd },
    },
    _sum: {
      duration: true,
    },
  });

  // Create a map of date -> total hours
  const dailyHoursMap = new Map<string, number>();
  dailyEntries.forEach((entry) => {
    const dateKey = format(new Date(entry.date), "yyyy-MM-dd");
    dailyHoursMap.set(dateKey, entry._sum.duration || 0);
  });

  const radarData = daysOfWeek.map((day, index) => {
    const dayDate = addDays(weekStart, index);
    const dateKey = format(dayDate, "yyyy-MM-dd");
    const dayHours = dailyHoursMap.get(dateKey) || 0;

    return {
      day,
      hours: parseFloat(dayHours.toFixed(1)),
      target: dailyTarget,
    };
  });

  // Données pour le graphique area (90 derniers jours)
  const ninetyDaysAgo = startOfDay(subDays(now, 90));
  const areaChartEntries = await prisma.timesheetEntry.groupBy({
    by: ["date"],
    where: {
      userId,
      date: { gte: ninetyDaysAgo, lte: endOfDay(now) },
    },
    _sum: {
      duration: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  // Créer un tableau avec tous les jours (même ceux sans données)
  const areaChartData = [];
  for (let i = 0; i <= 90; i++) {
    const currentDate = subDays(now, 90 - i);
    const dateKey = format(startOfDay(currentDate), "yyyy-MM-dd");
    const entry = areaChartEntries.find(e => format(new Date(e.date), "yyyy-MM-dd") === dateKey);

    areaChartData.push({
      date: dateKey,
      hours: entry?._sum.duration || 0,
    });
  }

    return {
      weekHours,
      prevWeekHours,
      approvedHours,
      pendingHours,
      recentEntries,
      projectsWithDetails,
      radarData,
      areaChartData,
      weeklyGoal,
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
  const maxHours = Math.max(...data.projectsWithDetails.map((p) => p.hours), 1);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("welcome")} {session.user.name} ! Voici un aperçu de votre activité.
          </p>
        </div>
        <WeeklyGoalSettings currentGoal={data.weeklyGoal} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCardWithComparison
          title={t("stats.thisWeek")}
          value={`${data.weekHours.toFixed(1)}h`}
          description={t("stats.thisWeek")}
          iconName="clock"
          color="text-primary"
          bgColor="bg-primary/10"
          currentValue={data.weekHours}
          previousValue={data.prevWeekHours}
        />
        <StatCardWithComparison
          title={t("stats.approved")}
          value={`${data.approvedHours.toFixed(1)}h`}
          description={t("stats.thisMonth")}
          iconName="check-circle"
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCardWithComparison
          title={t("stats.pending")}
          value={`${data.pendingHours.toFixed(1)}h`}
          description="À faire valider"
          iconName="alert-circle"
          color="text-amber-600"
          bgColor="bg-amber-100"
        />
        <StatCardWithComparison
          title="Progression"
          value={`${Math.round((data.weekHours / data.weeklyGoal) * 100)}%`}
          description={`Objectif hebdomadaire (${data.weeklyGoal}h)`}
          iconName="trending-up"
          color="text-light-cyan-300"
          bgColor="bg-light-cyan/20"
          currentValue={data.weekHours}
          previousValue={data.prevWeekHours}
        />
      </div>

      {/* Section graphique avec onglets de période */}
      <TimesheetAreaChart
        data={data.areaChartData}
        weeklyGoal={data.weeklyGoal}
      />

      {/* Sections avec onglets */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="activity">
            Activité récente
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
              {data.recentEntries.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance cette semaine</CardTitle>
                <CardDescription>Comparaison avec la semaine précédente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Heures travaillées</span>
                    <span className="text-sm font-medium">{data.weekHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Semaine précédente</span>
                    <span className="text-sm font-medium">{data.prevWeekHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Évolution</span>
                    <span className={`text-sm font-medium ${
                      data.weekHours > data.prevWeekHours ? "text-green-600" :
                      data.weekHours < data.prevWeekHours ? "text-red-600" :
                      "text-muted-foreground"
                    }`}>
                      {data.weekHours > data.prevWeekHours ? "+" : ""}
                      {((data.weekHours - data.prevWeekHours) / data.prevWeekHours * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Projets actifs</CardTitle>
                <CardDescription>Distribution du temps cette semaine</CardDescription>
              </CardHeader>
              <CardContent>
                {data.projectsWithDetails.length > 0 ? (
                  <div className="space-y-3">
                    {data.projectsWithDetails.slice(0, 3).map((project, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-sm truncate max-w-[150px]">{project.name}</span>
                        </div>
                        <span className="text-sm font-medium">{project.hours.toFixed(1)}h</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun projet actif
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dernières entrées</CardTitle>
              <CardDescription>Vos saisies de temps les plus récentes</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune saisie récente
                </p>
              ) : (
                <div className="space-y-4">
                  {data.recentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                          {entry.Project?.name || "Sans projet"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {entry.Task?.name || "Sans tâche"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString("fr-FR", {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{entry.duration}h</p>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            entry.status === "APPROVED"
                              ? "bg-green-500"
                              : entry.status === "SUBMITTED"
                              ? "bg-amber-500"
                              : "bg-gray-500"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Répartition par projet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Visualisez comment votre temps est réparti entre vos différents projets cette semaine.
            </p>
            <ProjectDistributionChart
              data={data.projectsWithDetails}
              title="Répartition par projet"
              description="Heures de cette semaine"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
