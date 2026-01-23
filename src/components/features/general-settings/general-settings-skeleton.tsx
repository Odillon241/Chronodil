'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton loading pour la page des paramètres généraux
 * Affiche une structure similaire à la page réelle pendant le chargement
 */
export function GeneralSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Apparence Section Skeleton */}
      <Card className="overflow-hidden border shadow-none bg-muted/20">
        <CardHeader className="pb-3 border-b bg-background/50">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent className="p-0 bg-background/30">
          {/* Couleurs d'accent */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Densité et Taille de police */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-48 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Langue Section Skeleton */}
      <Card className="overflow-hidden border shadow-none bg-muted/20">
        <CardHeader className="pb-3 border-b bg-background/50">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex gap-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-32 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Localisation Section Skeleton */}
      <Card className="overflow-hidden border shadow-none bg-muted/20">
        <CardHeader className="pb-3 border-b bg-background/50">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-background/30">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accessibilité Section Skeleton */}
      <Card className="overflow-hidden border shadow-none bg-muted/20">
        <CardHeader className="pb-3 border-b bg-background/50">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent className="p-0 bg-background/30">
          <div className="divide-y divide-border/50">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heures silencieuses Section Skeleton */}
      <Card className="overflow-hidden border shadow-none bg-muted/20">
        <CardHeader className="pb-3 border-b bg-background/50">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48 mt-1" />
              </div>
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex gap-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-10 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
