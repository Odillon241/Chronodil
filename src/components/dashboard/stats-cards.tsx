"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    Briefcase,
    CheckCircle2,
    Clock
} from "lucide-react";


export interface StatsCardsProps {
    data?: {
        activeProjects: number;
        ongoingTasks: number;
        totalHours: number;
        usersCount?: number;
        completedTasks?: number;
        viewType?: "GLOBAL" | "PERSONAL";
    }
}

export function StatsCards({ data }: StatsCardsProps) {
    const isPersonal = data?.viewType === "PERSONAL";

    const stats = [
        {
            title: "Projets Actifs",
            value: data ? data.activeProjects.toString() : "0",
            change: "En cours",
            icon: Briefcase,
            trend: "neutral"
        },
        {
            title: "Tâches en Cours",
            value: data ? data.ongoingTasks.toString() : "0",
            change: "Non terminées",
            icon: CheckCircle2,
            trend: "neutral"
        },
        {
            title: "Heures Totales",
            value: data ? `${Math.round(data.totalHours)}h` : "0h",
            change: "Cumulées",
            icon: Clock,
            trend: "up"
        },
        {
            title: isPersonal ? "Tâches Terminées" : "Utilisateurs",
            value: data ? (isPersonal ? (data.completedTasks?.toString() || "0") : (data.usersCount?.toString() || "0")) : "0",
            change: isPersonal ? "Accomplies" : "Inscrits",
            icon: isPersonal ? CheckCircle2 : Users, // Optimized: Reusing CheckCircle2 or maybe a different check icon if available
            trend: "neutral"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {stat.change}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
