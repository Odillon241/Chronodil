"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, TrendingUp } from "lucide-react";

export interface InsightsPanelProps {
  insights: string[];
  recommendations: string[];
}

export function InsightsPanel({ insights, recommendations }: InsightsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Insights
          </CardTitle>
          <CardDescription>Analyse automatique de vos données</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun insight disponible pour le moment
            </p>
          ) : (
            insights.map((insight, index) => (
              <Alert key={index}>
                <AlertDescription>{insight}</AlertDescription>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recommandations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Recommandations
            </CardTitle>
            <CardDescription>Actions suggérées pour améliorer votre productivité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <Alert key={index} className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-900">
                  {recommendation}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
