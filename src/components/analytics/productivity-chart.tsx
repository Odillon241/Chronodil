"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendData } from "@/lib/task-analytics";

export interface ProductivityChartProps {
  data: TrendData[];
  title?: string;
  description?: string;
}

export function ProductivityChart({
  data,
  title = "Tendances de Productivité",
  description = "Tâches créées vs complétées par jour",
}: ProductivityChartProps) {
  // Formater les données pour le graphique
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              name="Complétées"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="created"
              stroke="#3b82f6"
              name="Créées"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
