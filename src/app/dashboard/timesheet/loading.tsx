import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TimesheetLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-10 w-10" />
      </div>

      {/* Calendar grid */}
      <Card className="p-4">
        <div className="space-y-2">
          {/* Days header */}
          <div className="grid grid-cols-8 gap-2 pb-2 border-b">
            <Skeleton className="h-4 w-16" />
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>

          {/* Time entries */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-8 gap-2">
              <Skeleton className="h-12 w-full" />
              {[...Array(7)].map((_, j) => (
                <Skeleton key={j} className="h-12 w-full" />
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Summary */}
      <div className="flex gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="flex-1 p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-16" />
          </Card>
        ))}
      </div>
    </div>
  );
}
