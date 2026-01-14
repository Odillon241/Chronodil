"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function HRTimesheetHeader() {
    return (
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Feuilles de temps</h2>
                <p className="text-muted-foreground">
                    Gérez vos heures, vos activités et vos validations.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <Link href="/dashboard/hr-timesheet/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle feuille
                    </Button>
                </Link>
            </div>
        </div>
    );
}
