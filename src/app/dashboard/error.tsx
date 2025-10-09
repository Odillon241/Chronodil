"use client"

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Une erreur s'est produite lors du chargement de vos données.
        </p>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="bg-destructive/10 p-2 rounded-md">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">Erreur de chargement</CardTitle>
              <CardDescription>
                Impossible de charger les données du tableau de bord
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-mono text-muted-foreground">
              {error.message || "Une erreur inconnue s'est produite"}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                ID d'erreur: {error.digest}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={reset}
              variant="default"
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Réessayer
            </Button>
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
            >
              Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
