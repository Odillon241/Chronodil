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

interface ValidationStatsChartProps {
  pending: number;
  approved: number;
  rejected: number;
  weeklyData?: Array<{
    week: string;
    pending: number;
    approved: number;
    rejected: number;
  }>;
}

export function ValidationStatsChart({
  pending,
  approved,
  rejected,
  weeklyData,
}: ValidationStatsChartProps) {
  // Si on a des données hebdomadaires, on les utilise, sinon on génère des données factices
  const chartData = weeklyData || [
    { week: "Sem. 1", pending: Math.max(0, pending - 2), approved: Math.max(0, approved - 1), rejected: Math.max(0, rejected - 1) },
    { week: "Sem. 2", pending: Math.max(0, pending - 1), approved: Math.max(0, approved - 2), rejected },
    { week: "Sem. 3", pending: Math.max(0, pending - 3), approved: Math.max(0, approved - 1), rejected: Math.max(0, rejected - 1) },
    { week: "Sem. 4", pending, approved, rejected },
  ];

  const chartConfig = {
    pending: {
      label: "En attente",
      color: "hsl(var(--chart-3))",
    },
    approved: {
      label: "Approuvées",
      color: "hsl(var(--chart-2))",
    },
    rejected: {
      label: "Rejetées",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const total = pending + approved + rejected;

  if (total === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Répartition des validations</CardTitle>
          <CardDescription>Ce mois-ci</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            Aucune donnée disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Évolution des validations</CardTitle>
        <CardDescription>Tendances sur 4 semaines</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-4">
        <ChartContainer
          config={chartConfig}
          className="h-[300px] w-full"
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
              dataKey="approved"
              stackId="1"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="pending"
              stackId="1"
              stroke="hsl(var(--chart-3))"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="rejected"
              stackId="1"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.8}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
