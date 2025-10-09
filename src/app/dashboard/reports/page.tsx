"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Calendar, TrendingUp, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");
  const [reportType, setReportType] = useState("summary");

  // Données de démonstration pour les graphiques
  const weeklyData = [
    { day: "Lun", hours: 8 },
    { day: "Mar", hours: 7.5 },
    { day: "Mer", hours: 8 },
    { day: "Jeu", hours: 9 },
    { day: "Ven", hours: 6 },
  ];

  const projectData = [
    { name: "Application Mobile", hours: 124, color: "#dd2d4a" },
    { name: "Site Web Corporate", hours: 87, color: "#f26a8d" },
    { name: "API Backend", hours: 65, color: "#f49cbb" },
    { name: "Refonte Intranet", hours: 42, color: "#cbeef3" },
  ];

  const maxHours = Math.max(...projectData.map(p => p.hours));

  const handleExport = (format: string) => {
    toast.success(`Export ${format.toUpperCase()} en cours...`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-muted-foreground">
            Analysez vos données de temps et générez des rapports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("excel")}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="quarter">Ce trimestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
            <SelectItem value="custom">Personnalisé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="summary">Vue d'ensemble</SelectItem>
            <SelectItem value="detailed">Détaillé</SelectItem>
            <SelectItem value="by-project">Par projet</SelectItem>
            <SelectItem value="by-user">Par utilisateur</SelectItem>
            <SelectItem value="by-task">Par tâche</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total heures", value: "318h", icon: Clock, trend: "+12% vs mois dernier" },
          { title: "Heures facturables", value: "287h", icon: TrendingUp, trend: "90% du total" },
          { title: "Projets actifs", value: "8", icon: FileText, trend: "2 nouveaux" },
          { title: "Taux validation", value: "94%", icon: BarChart3, trend: "+5% vs mois dernier" },
        ].map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rusty-red">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activité hebdomadaire</CardTitle>
            <CardDescription>
              Heures saisies par jour de la semaine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.map((day, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{day.day}</span>
                    <span className="text-muted-foreground">{day.hours}h</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rusty-red"
                      style={{ width: `${(day.hours / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total hebdomadaire</span>
                <span className="text-2xl font-bold text-rusty-red">
                  {weeklyData.reduce((acc, day) => acc + day.hours, 0)}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par projet</CardTitle>
            <CardDescription>
              Heures par projet ce mois-ci
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectData.map((project, index) => (
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
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total mensuel</span>
                <span className="text-2xl font-bold text-rusty-red">
                  {projectData.reduce((acc, project) => acc + project.hours, 0)}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détail des heures</CardTitle>
          <CardDescription>
            Vue détaillée par type d'activité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Heures normales</th>
                  <th className="px-6 py-3">Heures sup.</th>
                  <th className="px-6 py-3">Nuit</th>
                  <th className="px-6 py-3">Week-end</th>
                  <th className="px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { type: "Développement", normal: 124, overtime: 12, night: 0, weekend: 4, total: 140 },
                  { type: "Tests", normal: 42, overtime: 0, night: 0, weekend: 0, total: 42 },
                  { type: "Réunions", normal: 28, overtime: 0, night: 0, weekend: 0, total: 28 },
                  { type: "Code Review", normal: 18, overtime: 2, night: 0, weekend: 0, total: 20 },
                  { type: "Documentation", normal: 24, overtime: 0, night: 0, weekend: 0, total: 24 },
                ].map((row, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium">{row.type}</td>
                    <td className="px-6 py-4">{row.normal}h</td>
                    <td className="px-6 py-4">
                      {row.overtime > 0 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-bright-pink/20 text-bright-pink-700">
                          {row.overtime}h
                        </span>
                      )}
                      {row.overtime === 0 && "-"}
                    </td>
                    <td className="px-6 py-4">{row.night > 0 ? `${row.night}h` : "-"}</td>
                    <td className="px-6 py-4">
                      {row.weekend > 0 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-amaranth-pink/20 text-amaranth-pink-700">
                          {row.weekend}h
                        </span>
                      )}
                      {row.weekend === 0 && "-"}
                    </td>
                    <td className="px-6 py-4 font-bold text-rusty-red">{row.total}h</td>
                  </tr>
                ))}
                <tr className="bg-muted font-semibold">
                  <td className="px-6 py-4">Total</td>
                  <td className="px-6 py-4">236h</td>
                  <td className="px-6 py-4">14h</td>
                  <td className="px-6 py-4">0h</td>
                  <td className="px-6 py-4">4h</td>
                  <td className="px-6 py-4 text-rusty-red">254h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
