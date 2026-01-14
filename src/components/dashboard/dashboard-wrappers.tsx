import { Suspense } from "react";
import { getDashboardStats, getRecentActivity, getActivityChartData } from "@/actions/dashboard.actions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export async function StatsWrapper() {
    const result = await getDashboardStats({});
    return <StatsCards data={result?.data as any} />;
}

export async function ChartWrapper() {
    const result = await getActivityChartData({ months: 6 });
    return <OverviewChart data={result?.data} />;
}

export async function ActivityWrapper() {
    const result = await getRecentActivity({ limit: 5 });
    return <RecentActivity items={result?.data} />;
}
