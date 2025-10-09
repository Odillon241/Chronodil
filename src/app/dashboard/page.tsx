import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, format, startOfDay, endOfDay } from "date-fns";
import { TimesheetRadarChart } from "@/components/features/timesheet-radar-chart";

async function getDashboardData(userId: string) {
  try {
    const now = new Date();
    // Normalize dates to start/end of day to avoid timezone issues
    const weekStart = startOfDay(startOfWeek(now, { weekStartsOn: 1 }));
    const weekEnd = endOfDay(endOfWeek(now, { weekStartsOn: 1 }));
    const monthStart = startOfDay(startOfMonth(now));
    const monthEnd = endOfDay(endOfMonth(now));

  // Stats de la semaine
  const weekEntries = await prisma.timesheetEntry.findMany({
    where: {
      userId,
      date: { gte: weekStart, lte: weekEnd },
    },
  });

  const weekHours = weekEntries.reduce((sum, entry) => sum + entry.duration, 0);

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
      project: true,
      task: true,
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

  // Fetch all projects in a single query
  const projectIds = projectsData.map(item => item.projectId);
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true, color: true },
  });

  // Create a map for O(1) lookup
  const projectMap = new Map(projects.map(p => [p.id, p]));

  const projectsWithDetails = projectsData.map((item) => {
    const project = projectMap.get(item.projectId);
    return {
      name: project?.name || "Inconnu",
      hours: item._sum.duration || 0,
      color: project?.color || "#3b82f6",
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

    return {
      weekHours,
      approvedHours,
      pendingHours,
      recentEntries,
      projectsWithDetails,
      radarData,
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

  const data = await getDashboardData(session.user.id);
  const maxHours = Math.max(...data.projectsWithDetails.map((p) => p.hours), 1);

  const stats = [
    {
      title: "Heures cette semaine",
      value: `${data.weekHours.toFixed(1)}h`,
      description: "Semaine en cours",
      icon: Clock,
      color: "text-rusty-red",
      bgColor: "bg-rusty-red/10",
    },
    {
      title: "Temps approuvés",
      value: `${data.approvedHours.toFixed(1)}h`,
      description: "Ce mois-ci",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "En attente",
      value: `${data.pendingHours.toFixed(1)}h`,
      description: "À faire valider",
      icon: AlertCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Progression",
      value: `${Math.round((data.weekHours / 40) * 100)}%`,
      description: "Objectif hebdomadaire (40h)",
      icon: TrendingUp,
      color: "text-light-cyan-300",
      bgColor: "bg-light-cyan/20",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue {session.user.name} ! Voici un aperçu de votre activité.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-md`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-3">
          <TimesheetRadarChart
            data={data.radarData}
            weekTotal={data.weekHours}
            weekTarget={40}
          />
        </div>

        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Vos dernières saisies de temps</CardDescription>
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
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {entry.project.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.task?.name || "Sans tâche"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{entry.duration}h</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Répartition par projet</CardTitle>
            <CardDescription>Heures de cette semaine</CardDescription>
          </CardHeader>
          <CardContent>
            {data.projectsWithDetails.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune saisie cette semaine
              </p>
            ) : (
              <div className="space-y-4">
                {data.projectsWithDetails.map((project, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="font-medium">{project.name}</span>
                      </div>
                      <span className="text-muted-foreground">{project.hours}h</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          backgroundColor: project.color,
                          width: `${(project.hours / maxHours) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
