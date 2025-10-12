"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

interface HRTimesheetStatsChartProps {
  draft: number;
  pending: number;
  approved: number;
  rejected?: number;
}

export function HRTimesheetStatsChart({
  draft,
  pending,
  approved,
  rejected = 0,
}: HRTimesheetStatsChartProps) {
  const chartData = [
    { 
      status: "Brouillons", 
      count: draft, 
      fill: "hsl(var(--chart-4))",
      icon: "📝"
    },
    { 
      status: "En attente", 
      count: pending, 
      fill: "hsl(var(--chart-3))",
      icon: "⏳"
    },
    { 
      status: "Approuvés", 
      count: approved, 
      fill: "hsl(var(--chart-2))",
      icon: "✅"
    },
    ...(rejected > 0 ? [{ 
      status: "Rejetés", 
      count: rejected, 
      fill: "hsl(var(--chart-1))",
      icon: "❌"
    }] : []),
  ].filter((item) => item.count > 0);

  const chartConfig = {
    count: {
      label: "Nombre de timesheets",
    },
    draft: {
      label: "Brouillons",
      color: "hsl(var(--chart-4))",
    },
    pending: {
      label: "En attente",
      color: "hsl(var(--chart-3))",
    },
    approved: {
      label: "Approuvés",
      color: "hsl(var(--chart-2))",
    },
    rejected: {
      label: "Rejetés",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const total = draft + pending + approved + rejected;

  if (total === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Répartition des timesheets</CardTitle>
          <CardDescription>Par statut</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Aucune donnée disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Statistiques des timesheets</CardTitle>
        <CardDescription>Répartition par statut</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-4">
        <ChartContainer
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="status" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip 
              content={<ChartTooltipContent 
                labelKey="status"
                indicator="line"
              />} 
            />
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]}
              className="fill-primary"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
