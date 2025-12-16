import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function NotificationsLoading() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>

        <Separator />

        {/* Notifications List Skeleton */}
        <Card>
          <CardContent className="p-0">
            {/* Select All Skeleton */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Notification Items Skeleton */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border-b last:border-b-0 space-y-3">
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-3/4 ml-9" />
                <Skeleton className="h-3 w-1/2 ml-9" />
                <div className="flex justify-between ml-9 pt-2">
                  <Skeleton className="h-3 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
