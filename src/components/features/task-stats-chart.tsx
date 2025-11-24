"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TaskStatsChartProps {
  todo: number;
  inProgress: number;
  done: number;
  weeklyData?: Array<{
    week: string;
    todo: number;
    inProgress: number;
    done: number;
  }>;
  /** Période d'affichage (par défaut: 4 semaines) */
  period?: "week" | "month" | "quarter";
  /** Nombre de périodes à afficher (par défaut: 4) */
  periodCount?: number;
  /** Titre personnalisé */
  title?: string;
  /** Description personnalisée */
  description?: string;
  /** Hauteur du graphique (par défaut: 300px) */
  height?: number;
}

export function TaskStatsChart({
  todo,
  inProgress,
  done,
  weeklyData,
  period = "week",
  periodCount = 4,
  title = "Évolution des tâches",
  description,
  height = 300,
}: TaskStatsChartProps) {
  // Si on a des données hebdomadaires, on les utilise, sinon on génère des données factices
  const chartData = weeklyData || [
    { week: "Sem. 1", todo: Math.max(0, todo - 2), inProgress: Math.max(0, inProgress - 1), done: Math.max(0, done - 1) },
    { week: "Sem. 2", todo: Math.max(0, todo - 1), inProgress: Math.max(0, inProgress - 2), done: Math.max(0, done - 2) },
    { week: "Sem. 3", todo: Math.max(0, todo - 3), inProgress: Math.max(0, inProgress - 1), done: Math.max(0, done - 1) },
    { week: "Sem. 4", todo, inProgress, done },
  ];

  // Description par défaut selon la période
  const defaultDescription = description || 
    (period === "week" 
      ? `Tendances sur ${periodCount} semaines`
      : period === "month"
      ? `Tendances sur ${periodCount} mois`
      : `Tendances sur ${periodCount} trimestres`);

  const chartConfig = {
    todo: {
      label: "À faire",
      color: "hsl(43, 96%, 56%)", // amber-500
    },
    inProgress: {
      label: "En cours",
      color: "hsl(170, 50%, 45%)", // green-teal (vert sarcelle/carcel)
    },
    done: {
      label: "Terminées",
      color: "hsl(142, 76%, 36%)", // green-600
    },
  } satisfies ChartConfig;

  const total = todo + inProgress + done;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{defaultDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="flex items-center justify-center text-muted-foreground"
            style={{ height: `${height}px` }}
          >
            Aucune donnée disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{defaultDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="w-full"
          style={{ height: `${height}px` }}
        >
          <AreaChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip 
              content={<ChartTooltipContent 
                indicator="dashed"
              />} 
            />
            <Area
              type="monotone"
              dataKey="done"
              stackId="1"
              stroke="hsl(142, 76%, 36%)"
              fill="hsl(142, 76%, 36%)"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="inProgress"
              stackId="1"
              stroke="hsl(170, 50%, 45%)"
              fill="hsl(170, 50%, 45%)"
              fillOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="todo"
              stackId="1"
              stroke="hsl(43, 96%, 56%)"
              fill="hsl(43, 96%, 56%)"
              fillOpacity={0.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

