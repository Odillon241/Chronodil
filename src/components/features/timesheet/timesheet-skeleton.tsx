import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function TimesheetSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Main content skeleton */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Weekly grid skeleton */}
            <div className="grid grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry form skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
