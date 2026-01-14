"use client";

import { useMemo, useState } from "react";
import {
    GanttFeature,
    GanttProvider,
    GanttSidebar,
    GanttSidebarGroup,
    GanttSidebarItem,
    GanttTimeline,
    GanttHeader,
    GanttFeatureList,
    GanttFeatureListGroup,
    GanttFeatureItem,
    GanttToday,
    type Range,
} from "@/components/ui/shadcn-io/gantt";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface HRTimesheet {
    id: string;
    weekStartDate: Date;
    weekEndDate: Date;
    employeeName: string;
    position: string;
    site: string;
    totalHours: number;
    status: string;
}

interface HRTimesheetGanttProps {
    timesheets: HRTimesheet[];
    onView: (id: string) => void;
    onAddNew?: (date: Date) => void;
}

// Map status to colors
const STATUS_COLORS: Record<string, string> = {
    DRAFT: "#94a3b8", // slate-400
    PENDING: "#facc15", // yellow-400
    MANAGER_APPROVED: "#60a5fa", // blue-400
    APPROVED: "#4ade80", // green-400
    REJECTED: "#ef4444", // red-500
};

// Helper: Group timesheets by Site
const groupTimesheetsBySite = (timesheets: HRTimesheet[]) => {
    const groups: Record<string, HRTimesheet[]> = {};
    timesheets.forEach((ts) => {
        const site = ts.site || "Sans site";
        if (!groups[site]) {
            groups[site] = [];
        }
        groups[site].push(ts);
    });
    return groups;
};

export function HRTimesheetGantt({ timesheets, onView, onAddNew }: HRTimesheetGanttProps) {
    const [range, setRange] = useState<Range>("monthly");
    const [zoom, setZoom] = useState(100);

    const groupedTimesheets = useMemo(() => groupTimesheetsBySite(timesheets), [timesheets]);

    // Transform to Gantt Features grouped by site
    const featuresByLane = useMemo(() => {
        const grouped = new Map<string, GanttFeature[]>();

        timesheets.forEach(ts => {
            const lane = ts.site || "Sans site";
            if (!grouped.has(lane)) {
                grouped.set(lane, []);
            }

            const feature: GanttFeature = {
                id: ts.id,
                name: `${ts.employeeName} - ${ts.totalHours}h`,
                startAt: new Date(ts.weekStartDate),
                endAt: new Date(ts.weekEndDate),
                status: {
                    id: ts.status,
                    name: ts.status,
                    color: STATUS_COLORS[ts.status] || STATUS_COLORS.DRAFT,
                },
            };

            grouped.get(lane)!.push(feature);
        });

        return grouped;
    }, [timesheets]);

    // Create a Map for quick access to timesheet data
    const timesheetMap = useMemo(() => {
        const map = new Map<string, HRTimesheet>();
        timesheets.forEach(ts => map.set(ts.id, ts));
        return map;
    }, [timesheets]);

    const handleSelectItem = (id: string) => {
        onView(id);
    };

    return (
        <div className="flex flex-col gap-4 border rounded-md p-4 bg-background">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Select value={range} onValueChange={(v) => setRange(v as Range)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Vue" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Journalier</SelectItem>
                            <SelectItem value="monthly">Mensuel</SelectItem>
                            <SelectItem value="quarterly">Trimestriel</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(50, z - 10))}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(200, z + 10))}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="h-[600px] border rounded-md overflow-hidden relative">
                <GanttProvider
                    range={range}
                    zoom={zoom}
                    onAddItem={onAddNew}
                >
                    <GanttSidebar>
                        {Array.from(featuresByLane.entries()).length === 0 ? (
                            <GanttSidebarGroup name="Aucune feuille">
                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    Aucune feuille de temps à afficher
                                </div>
                            </GanttSidebarGroup>
                        ) : (
                            Array.from(featuresByLane.entries()).map(([lane, features]) => (
                                <GanttSidebarGroup key={lane} name={lane}>
                                    {features.map((feature) => (
                                        <GanttSidebarItem
                                            key={feature.id}
                                            feature={feature}
                                            onSelectItem={handleSelectItem}
                                        />
                                    ))}
                                </GanttSidebarGroup>
                            ))
                        )}
                    </GanttSidebar>

                    <GanttTimeline>
                        <GanttHeader />
                        <GanttFeatureList>
                            {Array.from(featuresByLane.entries()).length === 0 ? (
                                <GanttFeatureListGroup>
                                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                                        Aucune feuille à afficher
                                    </div>
                                </GanttFeatureListGroup>
                            ) : (
                                Array.from(featuresByLane.entries()).map(([lane, features]) => (
                                    <GanttFeatureListGroup key={lane}>
                                        {features.map((feature) => {
                                            const ts = timesheetMap.get(feature.id);
                                            if (!ts) return null;

                                            return (
                                                <button
                                                    key={feature.id}
                                                    onClick={() => handleSelectItem(feature.id)}
                                                    type="button"
                                                    className="w-full"
                                                >
                                                    <GanttFeatureItem
                                                        {...feature}
                                                    >
                                                        {/* Status Indicator Bubble */}
                                                        <div
                                                            className="h-2 w-2 shrink-0 rounded-full"
                                                            style={{ backgroundColor: feature.status.color }}
                                                        />

                                                        {/* Name */}
                                                        <span className="truncate text-xs font-medium flex-1">
                                                            {feature.name}
                                                        </span>

                                                        {/* Avatar */}
                                                        <Avatar className="h-6 w-6 border border-background shrink-0">
                                                            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ts.employeeName)}&background=random`} />
                                                            <AvatarFallback className="text-[9px]">
                                                                {ts.employeeName.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </GanttFeatureItem>
                                                </button>
                                            );
                                        })}
                                    </GanttFeatureListGroup>
                                ))
                            )}
                        </GanttFeatureList>
                        <GanttToday />
                    </GanttTimeline>
                </GanttProvider>
            </div>
        </div>
    );
}
