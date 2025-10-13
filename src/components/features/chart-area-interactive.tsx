"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { format, startOfDay, endOfDay, eachDayOfInterval, subDays } from "date-fns"
import { fr } from "date-fns/locale"

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
  ChartLegend,
  ChartLegendContent,
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
import { getValidationStats } from "@/actions/validation.actions"

export const description = "Graphique des validations de temps"

interface ChartData {
  date: string
  approuvées: number
  rejetées: number
}

const chartConfig = {
  approuvées: {
    label: "Approuvées",
    color: "#ec4899", // Rose vif
  },
  rejetées: {
    label: "Rejetées",
    color: "#f472b6", // Rose plus clair
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState("90d")
  const [chartData, setChartData] = React.useState<ChartData[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadChartData = React.useCallback(async () => {
    try {
      setLoading(true)
      const endDate = new Date()
      let startDate = new Date()
      
      if (timeRange === "30d") {
        startDate = subDays(endDate, 30)
      } else if (timeRange === "90d") {
        startDate = subDays(endDate, 90)
      } else if (timeRange === "7d") {
        startDate = subDays(endDate, 7)
      }

      // Créer un tableau de dates pour la période
      const dates = eachDayOfInterval({ start: startDate, end: endDate })
      
      // Pour chaque date, récupérer les statistiques
      const dataPromises = dates.map(async (date) => {
        const startOfDate = startOfDay(date)
        const endOfDate = endOfDay(date)
        
        try {
          const result = await getValidationStats({
            startDate: startOfDate,
            endDate: endOfDate,
          })
          
          return {
            date: format(date, "yyyy-MM-dd"),
            approuvées: result?.data?.approved || 0,
            rejetées: result?.data?.rejected || 0,
          }
        } catch (error) {
          console.error(`Erreur pour la date ${format(date, "yyyy-MM-dd")}:`, error)
          return {
            date: format(date, "yyyy-MM-dd"),
            approuvées: 0,
            rejetées: 0,
          }
        }
      })

      const data = await Promise.all(dataPromises)
      setChartData(data)
    } catch (error) {
      console.error("Erreur lors du chargement des données du graphique:", error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  React.useEffect(() => {
    loadChartData()
  }, [loadChartData])

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Évolution des validations</CardTitle>
          <CardDescription>
            Historique des validations approuvées et rejetées
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Sélectionner une période"
          >
            <SelectValue placeholder="Derniers 3 mois" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Derniers 3 mois
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Derniers 30 jours
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Derniers 7 jours
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[250px]">
            <p className="text-muted-foreground">Chargement des données...</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillApprouvées" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#ec4899"
                  stopOpacity={0.9}
                />
                <stop
                  offset="50%"
                  stopColor="#f472b6"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="#fbbf24"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillRejetées" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#f472b6"
                  stopOpacity={0.8}
                />
                <stop
                  offset="50%"
                  stopColor="#fb7185"
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor="#fda4af"
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
                return format(date, "dd MMM", { locale: fr })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return format(date, "dd MMMM yyyy", { locale: fr })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="rejetées"
              type="natural"
              fill="url(#fillRejetées)"
              stroke="#f472b6"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="approuvées"
              type="natural"
              fill="url(#fillApprouvées)"
              stroke="#ec4899"
              strokeWidth={2}
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
