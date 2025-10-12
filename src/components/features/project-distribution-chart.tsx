"use client";

import * as React from "react";
import { TrendingUp, Target } from "lucide-react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ProjectDistributionChartProps {
  data: Array<{
    name: string;
    hours: number;
    color: string;
  }>;
  title?: string;
  description?: string;
}

export function ProjectDistributionChart({
  data,
  title = "Répartition par projet",
  description = "Distribution des heures par projet",
}: ProjectDistributionChartProps) {
  // Transform data for radial chart
  const chartData = data.map((project, index) => ({
    name: project.name,
    hours: project.hours,
    fill: project.color,
    cx: 150,
    cy: 150,
    innerRadius: 60 + (index * 20),
    outerRadius: 80 + (index * 20),
  }));

  // Create config dynamically from data
  const chartConfig = data.reduce((config, project, index) => {
    const key = `project${index}`;
    return {
      ...config,
      [key]: {
        label: project.name,
        color: project.color,
      },
    };
  }, {
    hours: {
      label: "Heures",
    },
  } as ChartConfig);

  const totalHours = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.hours, 0);
  }, [data]);

  if (data.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[350px]"
        >
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="90%"
            barSize={15}
            data={chartData}
            startAngle={180}
            endAngle={0}
          >
            <ChartTooltip
              content={<ChartTooltipContent 
                labelKey="name"
                indicator="dashed"
              />}
            />
            <RadialBar
              dataKey="hours"
              background
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium text-primary">
          <Target className="h-4 w-4" />
          {totalHours.toFixed(1)}h total • {data.length} projet{data.length > 1 ? "s" : ""} actif{data.length > 1 ? "s" : ""}
        </div>
      </CardFooter>
    </Card>
  );
}
