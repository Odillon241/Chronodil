import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StatsCardsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                        <Skeleton className="h-3 w-32" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function OverviewChartSkeleton() {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="pl-2">
                <Skeleton className="h-[300px] w-full" />
            </CardContent>
        </Card>
    );
}

export function RecentActivitySkeleton() {
    return (
        <Card className="col-span-3 border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="px-0">
                <div className="space-y-8 ml-[19px]">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="ml-4 space-y-1">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
