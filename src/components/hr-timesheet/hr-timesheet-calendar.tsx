"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    CalendarBody,
    CalendarDate,
    CalendarDatePagination,
    CalendarDatePicker,
    CalendarHeader,
    CalendarItem,
    CalendarMonthPicker,
    CalendarProvider,
    CalendarYearPicker,
    type CalendarFeature,
} from "@/components/ui/shadcn-io/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface HRTimesheetCalendarProps {
    timesheets: HRTimesheet[];
    onView: (id: string) => void;
}

// Map status to colors
const STATUS_COLORS: Record<string, string> = {
    DRAFT: "#94a3b8", // slate-400
    PENDING: "#facc15", // yellow-400
    MANAGER_APPROVED: "#60a5fa", // blue-400
    APPROVED: "#4ade80", // green-400
    REJECTED: "#ef4444", // red-500
};

export function HRTimesheetCalendar({ timesheets, onView }: HRTimesheetCalendarProps) {
    // Transform timesheets to CalendarFeatures
    const features = useMemo<CalendarFeature[]>(() => {
        return timesheets.map((ts) => ({
            id: ts.id,
            name: `${ts.employeeName} (${ts.totalHours}h)`,
            startAt: new Date(ts.weekStartDate),
            endAt: new Date(ts.weekEndDate),
            status: {
                color: STATUS_COLORS[ts.status] || STATUS_COLORS.DRAFT,
            },
        }));
    }, [timesheets]);

    return (
        <div className="h-[600px] border rounded-md overflow-hidden flex flex-col">
            <CalendarProvider>
                <CalendarDate className="flex-none">
                    <CalendarDatePicker>
                        <CalendarMonthPicker />
                        <CalendarYearPicker start={2020} end={2030} />
                    </CalendarDatePicker>
                    <CalendarDatePagination />
                </CalendarDate>
                <CalendarHeader className="flex-none" />
                <CalendarBody features={features} className="overflow-y-auto">
                    {({ feature }) => (
                        <CalendarItem
                            feature={feature}
                            onClick={() => onView(feature.id)}
                            className="mb-1"
                        />
                    )}
                </CalendarBody>
            </CalendarProvider>
        </div>
    );
}
