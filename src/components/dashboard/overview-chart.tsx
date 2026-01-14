"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface OverviewChartProps {
    data?: { name: string; total: number }[];
}

export function OverviewChart({ data = [] }: OverviewChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Activité Générale</CardTitle>
                <CardDescription>
                    Aperçu de l'activité sur les 6 derniers mois
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={{
                    total: {
                        label: "Activité",
                        color: "hsl(var(--primary))",
                    },
                }} className="h-[300px] w-full">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="var(--color-total)"
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
