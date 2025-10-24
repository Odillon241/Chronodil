'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Projects error:', error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle>Erreur de chargement</CardTitle>
          </div>
          <CardDescription>
            Une erreur s'est produite lors du chargement des projets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Une erreur inattendue s\'est produite.'}
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground">
              ID d'erreur : {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset} variant="default">
            Réessayer
          </Button>
          <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
            Retour au tableau de bord
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
