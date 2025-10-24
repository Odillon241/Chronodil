"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimesheetDataPoint {
  date: string
  hours: number
  target?: number
}

interface TimesheetAreaChartProps {
  data: TimesheetDataPoint[]
  weeklyGoal?: number
}

const chartConfig = {
  hours: {
    label: "Heures",
    color: "hsl(var(--chart-1))",
  },
  target: {
    label: "Objectif",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function TimesheetAreaChart({ data, weeklyGoal = 40 }: TimesheetAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState("7d")

  const filteredData = React.useMemo(() => {
    const now = new Date()
    let daysToSubtract = 7

    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "90d") {
      daysToSubtract = 90
    }

    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return data.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= startDate
    })
  }, [data, timeRange])

  const totalHours = filteredData.reduce((sum, item) => sum + item.hours, 0)

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Activité hebdomadaire</CardTitle>
          <CardDescription>
            Total: {totalHours.toFixed(1)}h sur les {timeRange === "7d" ? "7 derniers jours" : timeRange === "30d" ? "30 derniers jours" : "3 derniers mois"}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg"
            aria-label="Sélectionner une période"
          >
            <SelectValue placeholder="7 derniers jours" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">
              7 derniers jours
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              30 derniers jours
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              3 derniers mois
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillHours" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-hours)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-hours)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("fr-FR", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("fr-FR", {
                      weekday: 'long',
                      day: "numeric",
                      month: "long",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="hours"
              type="natural"
              fill="url(#fillHours)"
              stroke="var(--color-hours)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
