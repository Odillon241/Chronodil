"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Clock, CheckCircle2, AlertCircle, TrendingUp as TrendingUpIcon, ListTodo, Loader } from "lucide-react";

interface StatCardWithComparisonProps {
  title: string;
  value: string;
  description: string;
  iconName: "clock" | "check-circle" | "alert-circle" | "trending-up" | "list-todo" | "loader";
  color: string;
  bgColor: string;
  previousValue?: number;
  currentValue?: number;
}

// Map des noms d'icônes vers les composants
const iconMap = {
  "clock": Clock,
  "check-circle": CheckCircle2,
  "alert-circle": AlertCircle,
  "trending-up": TrendingUpIcon,
  "list-todo": ListTodo,
  "loader": Loader,
};

export function StatCardWithComparison({
  title,
  value,
  description,
  iconName,
  color,
  bgColor,
  previousValue,
  currentValue,
}: StatCardWithComparisonProps) {
  // Calculer la différence et le pourcentage
  const diff = previousValue && currentValue ? currentValue - previousValue : null;
  const percentChange = previousValue && diff !== null
    ? Math.round((diff / previousValue) * 100)
    : null;

  const isPositive = diff !== null && diff > 0;
  const isNegative = diff !== null && diff < 0;
  const isNeutral = diff === 0;

  const Icon = iconMap[iconName];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <div className={`${bgColor} p-1.5 sm:p-2 rounded-md`}>
          <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[10px] sm:text-xs text-muted-foreground">{description}</p>
          {percentChange !== null && (
            <div className={`flex items-center text-[10px] sm:text-xs font-medium ${
              isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-600"
            }`}>
              {isPositive && <TrendingUp className="h-3 w-3 mr-0.5" />}
              {isNegative && <TrendingDown className="h-3 w-3 mr-0.5" />}
              {isNeutral && <Minus className="h-3 w-3 mr-0.5" />}
              <span>{Math.abs(percentChange)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
