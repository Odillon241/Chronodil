"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface TimesheetRadarChartProps {
  data: Array<{
    day: string;
    hours: number;
    target: number;
  }>;
  weekTotal: number;
  weekTarget: number;
}

const chartConfig = {
  hours: {
    label: "Heures saisies",
    color: "hsl(var(--chart-1))",
  },
  target: {
    label: "Objectif",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function TimesheetRadarChart({ data, weekTotal, weekTarget }: TimesheetRadarChartProps) {
  const progressPercent = ((weekTotal / weekTarget) * 100).toFixed(1);
  const isOnTrack = weekTotal >= weekTarget;

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Activité hebdomadaire</CardTitle>
        <CardDescription>
          Comparaison heures saisies vs objectifs journaliers
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              bottom: 10,
              left: 10,
            }}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis
              dataKey="day"
              tick={({ x, y, textAnchor, value, index, ...props }) => {
                const dayData = data[index]

                return (
                  <text
                    x={x}
                    y={index === 0 ? y - 10 : y}
                    textAnchor={textAnchor}
                    fontSize={13}
                    fontWeight={500}
                    {...props}
                  >
                    <tspan className={dayData.hours >= dayData.target ? "fill-green-600" : "fill-amber-600"}>
                      {dayData.hours}h
                    </tspan>
                    <tspan className="fill-muted-foreground">/</tspan>
                    <tspan className="fill-muted-foreground">{dayData.target}h</tspan>
                    <tspan
                      x={x}
                      dy={"1rem"}
                      fontSize={12}
                      className="fill-muted-foreground"
                    >
                      {dayData.day}
                    </tspan>
                  </text>
                )
              }}
            />

            <PolarGrid />
            <Radar
              dataKey="target"
              stroke="var(--color-target)"
              fill="var(--color-target)"
              fillOpacity={0.2}
              strokeDasharray="3 3"
            />
            <Radar
              dataKey="hours"
              fill="var(--color-hours)"
              fillOpacity={0.6}
              stroke="var(--color-hours)"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className={`flex items-center gap-2 leading-none font-medium ${isOnTrack ? 'text-green-600' : 'text-amber-600'}`}>
          {isOnTrack ? 'Objectif atteint' : `${progressPercent}% de l'objectif`}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 leading-none">
          {weekTotal}h / {weekTarget}h cette semaine
        </div>
      </CardFooter>
    </Card>
  )
}
