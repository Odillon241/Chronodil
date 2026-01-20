import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
    const fullScreenClasses = "flex flex-col h-full min-h-0 overflow-hidden";

    return (
        <div className={`${fullScreenClasses} bg-background`}>
            <div className="flex h-full w-full overflow-hidden max-w-full">
                <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] w-full h-full min-w-0 max-w-full">
                    {/* Sidebar Skeleton */}
                    <div className="border-r bg-background h-full flex flex-col overflow-hidden min-w-0 max-w-full">
                        <div className="flex flex-col h-full min-h-0 overflow-hidden w-full max-w-full">
                            <div className="p-3 sm:p-4 border-b space-y-3 sm:space-y-4 shrink-0 w-full min-w-0">
                                <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                                    <Skeleton className="h-5 sm:h-6 w-24" />
                                    <Skeleton className="h-8 w-20 sm:w-24" />
                                </div>
                                <Skeleton className="h-9 w-full" />
                            </div>
                            <div className="flex-1 min-h-0 w-full min-w-0 overflow-hidden">
                                <div className="divide-y w-full min-w-0 max-w-full">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                                            <div className="flex gap-2 sm:gap-3 items-start min-w-0">
                                                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <Skeleton className="h-4 w-32 sm:w-40" />
                                                        <Skeleton className="h-3 w-12 sm:w-16" />
                                                    </div>
                                                    <Skeleton className="h-3 w-full max-w-[200px]" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Main Content Skeleton */}
                    <div className="bg-background h-full overflow-hidden flex flex-col min-w-0 max-w-full hidden md:flex">
                        <div className="flex flex-col h-full min-h-0">
                            <div className="p-3 sm:p-4 border-b flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 min-w-0 flex-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-9 w-9 rounded-md" />
                            </div>
                            <div className="flex-1 p-4 space-y-4 overflow-hidden">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className={`flex gap-2 sm:gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                                        {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                                        <div className="flex-1 space-y-1 max-w-[80%]">
                                            {i % 2 !== 0 && <Skeleton className="h-3 w-20" />}
                                            <Skeleton className={`h-16 sm:h-20 rounded-lg ${i % 2 === 0 ? "ml-auto" : ""}`} />
                                            <Skeleton className="h-3 w-16 ml-auto" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 sm:p-4 border-t shrink-0">
                                <div className="flex items-end gap-2">
                                    <Skeleton className="h-10 flex-1 rounded-lg" />
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
