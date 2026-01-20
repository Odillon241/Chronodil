'use client'

import { Inter } from 'next/font/google'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fr" className={inter.className}>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-foreground">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
                Erreur critique
              </h1>
              <p className="text-muted-foreground text-lg">
                Une erreur inattendue s'est produite et a arrêté l'application.
              </p>
            </div>

            <Card className="border-destructive/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base text-destructive flex items-center justify-center gap-2">
                  Détails de l'erreur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-muted p-3 text-left">
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {error.message || 'Erreur inconnue'}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                      ID: {error.digest}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button onClick={reset} size="lg" className="gap-2 w-full sm:w-auto">
                <RotateCcw className="h-4 w-4" />
                Réessayer
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                <Home className="h-4 w-4" />
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
