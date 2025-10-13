"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
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
  description = "Heures de cette semaine",
}: ProjectDistributionChartProps) {
  // Transform data for bar chart - create a single data point with all projects
  const chartData = [
    data.reduce((acc, project, index) => {
      acc[`project${index}`] = project.hours;
      return acc;
    }, {} as Record<string, number>)
  ];

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
    projects: {
      label: "Projets",
    },
  } as ChartConfig);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
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
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px]">
          <BarChart accessibilityLayer data={chartData}>
            <XAxis
              dataKey="projects"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}h`}
            />
            {data.map((project, index) => (
              <Bar
                key={project.name}
                dataKey={`project${index}`}
                stackId="a"
                fill={`var(--color-project${index})`}
                radius={index === 0 ? [0, 0, 4, 4] : index === data.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
            <ChartTooltip
              content={
                <ChartTooltipContent 
                  labelKey="projects" 
                  indicator="line"
                  labelFormatter={() => "Projets"}
                />
              }
              cursor={false}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
