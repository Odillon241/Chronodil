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
    CalendarMonthPicker,
    CalendarProvider,
    CalendarYearPicker,
    type CalendarFeature,
} from "@/components/ui/shadcn-io/calendar";

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
// Map status to colors (bg = background, fg = foreground/indicator)
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
    DRAFT: { bg: "#f1f5f9", fg: "#64748b" }, // slate-100 / slate-500
    PENDING: { bg: "#fef9c3", fg: "#ca8a04" }, // yellow-100 / yellow-600
    MANAGER_APPROVED: { bg: "#dbeafe", fg: "#2563eb" }, // blue-100 / blue-600
    APPROVED: { bg: "#dcfce7", fg: "#16a34a" }, // green-100 / green-600
    REJECTED: { bg: "#fee2e2", fg: "#dc2626" }, // red-100 / red-600
};

// Map status to labels
const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Brouillon",
    PENDING: "En attente",
    MANAGER_APPROVED: "Validé Manager",
    APPROVED: "Validé",
    REJECTED: "Rejeté",
};

// Fallback color
const DEFAULT_COLOR = { bg: "#f1f5f9", fg: "#64748b" };

export function HRTimesheetCalendar({ timesheets, onView }: HRTimesheetCalendarProps) {
    // Transform timesheets to CalendarFeatures
    const features = useMemo<CalendarFeature[]>(() => {
        return timesheets.map((ts) => {
            const colors = STATUS_COLORS[ts.status] || DEFAULT_COLOR;
            return {
                id: ts.id,
                name: `${ts.employeeName} (${ts.totalHours}h) - ${STATUS_LABELS[ts.status] || ts.status}`,
                startAt: new Date(ts.weekStartDate),
                endAt: new Date(ts.weekEndDate),
                status: {
                    color: colors.fg,
                    backgroundColor: colors.bg,
                },
            };
        });
    }, [timesheets]);

    return (
        <div className="border rounded-md overflow-hidden flex flex-col bg-background">
            <CalendarProvider>
                <CalendarDate className="flex-none">
                    <CalendarDatePicker>
                        <CalendarMonthPicker />
                        <CalendarYearPicker start={2020} end={2030} />
                    </CalendarDatePicker>
                    <CalendarDatePagination />
                </CalendarDate>
                <CalendarHeader className="flex-none" />
                <CalendarBody
                    features={features}
                    onFeatureClick={(feature) => onView(feature.id)}
                />
            </CalendarProvider>
        </div>
    );
}
