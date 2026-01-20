import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="flex h-full overflow-hidden bg-background rounded-lg border">
      {/* Sidebar Skeleton */}
      <div className="w-full md:w-[380px] border-r flex flex-col">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-5 w-8" />
          </div>
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-3 flex items-start gap-3 border-b">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Detail Skeleton */}
      <div className="flex-1 hidden md:flex items-center justify-center bg-muted/20">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
    </div>
  );
}
