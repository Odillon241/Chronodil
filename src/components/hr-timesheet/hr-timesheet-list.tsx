"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MoreVertical,
    Edit,
    Trash2,
    Send,
    Eye,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

interface HRTimesheet {
    id: string;
    weekStartDate: Date;
    weekEndDate: Date;
    employeeName: string;
    position: string;
    site: string;
    totalHours: number;
    status: string;
    User?: {
        name: string;
        email: string;
    };
}

interface HRTimesheetListProps {
    timesheets: HRTimesheet[];
    currentUserId?: string;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onSubmit: (id: string) => void;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    isAdminOrManager?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
    DRAFT: { label: 'Brouillon', color: 'outline', icon: Edit },
    PENDING: { label: 'En attente', color: 'secondary', icon: Clock },
    MANAGER_APPROVED: { label: 'Validé Manager', color: 'default', icon: CheckCircle },
    APPROVED: { label: 'Approuvé', color: 'default', icon: CheckCircle },
    REJECTED: { label: 'Rejeté', color: 'destructive', icon: XCircle },
};

export function HRTimesheetList({
    timesheets,
    onView,
    onEdit,
    onDelete,
    onSubmit,
    onApprove,
    onReject,
    isAdminOrManager = false,
}: HRTimesheetListProps) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedTimesheets = [...timesheets].sort((a, b) => {
        if (!sortConfig) return 0;

        // Helper to extract value based on key
        const getValue = (item: HRTimesheet, key: string) => {
            if (key === 'employeeName') return item.employeeName;
            if (key === 'weekStartDate') return new Date(item.weekStartDate).getTime();
            if (key === 'site') return item.site;
            if (key === 'totalHours') return item.totalHours;
            if (key === 'status') return item.status;
            return '';
        };

        const valA = getValue(a, sortConfig.key);
        const valB = getValue(b, sortConfig.key);

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (timesheets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10 border-dashed hover:bg-muted/20 transition-colors">
                <div className="rounded-full bg-muted p-3 mb-4">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Aucune feuille de temps</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Aucune feuille de temps ne correspond à vos critères.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[250px] cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('employeeName')}>
                            <div className="flex items-center gap-1">
                                Employé
                                <ArrowUpDown className="h-3 w-3" />
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('weekStartDate')}>
                            <div className="flex items-center gap-1">
                                Période
                                <ArrowUpDown className="h-3 w-3" />
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('site')}>
                            <div className="flex items-center gap-1">
                                Site / Poste
                                <ArrowUpDown className="h-3 w-3" />
                            </div>
                        </TableHead>
                        <TableHead className="text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('totalHours')}>
                            <div className="flex items-center justify-center gap-1">
                                Heures
                                <ArrowUpDown className="h-3 w-3" />
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('status')}>
                            <div className="flex items-center gap-1">
                                Statut
                                <ArrowUpDown className="h-3 w-3" />
                            </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTimesheets.map((ts) => {
                        const status = STATUS_CONFIG[ts.status] || STATUS_CONFIG.DRAFT;
                        const StatusIcon = status.icon;

                        return (
                            <ContextMenu key={ts.id}>
                                <ContextMenuTrigger asChild>
                                    <TableRow
                                        className="group hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => onView(ts.id)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border">
                                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(ts.employeeName)}&background=random`} />
                                                    <AvatarFallback>{ts.employeeName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{ts.employeeName}</span>
                                                    <span className="text-xs text-muted-foreground">{ts.User?.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">
                                                    {format(new Date(ts.weekStartDate), "dd MMM", { locale: fr })} - {format(new Date(ts.weekEndDate), "dd MMM yyyy", { locale: fr })}
                                                </span>
                                                <span className="text-xs text-muted-foreground">Semaine {format(new Date(ts.weekStartDate), "w")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{ts.site}</span>
                                                <span className="text-xs text-muted-foreground">{ts.position}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                {ts.totalHours}h
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={status.color} className="gap-1 font-normal">
                                                <StatusIcon className="h-3 w-3" />
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onView(ts.id)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Voir les détails
                                                    </DropdownMenuItem>

                                                    {ts.status === 'DRAFT' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => onEdit(ts.id)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Modifier
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => onSubmit(ts.id)}>
                                                                <Send className="mr-2 h-4 w-4" />
                                                                Soumettre
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => onDelete(ts.id)} className="text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {isAdminOrManager && ts.status === 'PENDING' && onApprove && (
                                                        <DropdownMenuItem onClick={() => onApprove(ts.id)} className="text-green-600 focus:text-green-600">
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Valider
                                                        </DropdownMenuItem>
                                                    )}

                                                    {isAdminOrManager && ts.status === 'PENDING' && onReject && (
                                                        <DropdownMenuItem onClick={() => onReject(ts.id)} className="text-destructive focus:text-destructive">
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Rejeter
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem onClick={() => onView(ts.id)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Voir les détails
                                    </ContextMenuItem>
                                    {ts.status === 'DRAFT' && (
                                        <>
                                            <ContextMenuItem onClick={() => onEdit(ts.id)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Modifier
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => onSubmit(ts.id)}>
                                                <Send className="mr-2 h-4 w-4" />
                                                Soumettre
                                            </ContextMenuItem>
                                            <ContextMenuSeparator />
                                            <ContextMenuItem onClick={() => onDelete(ts.id)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Supprimer
                                            </ContextMenuItem>
                                        </>
                                    )}
                                    {isAdminOrManager && ts.status === 'PENDING' && onApprove && (
                                        <ContextMenuItem onClick={() => onApprove(ts.id)} className="text-green-600 focus:text-green-600">
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Valider
                                        </ContextMenuItem>
                                    )}
                                    {isAdminOrManager && ts.status === 'PENDING' && onReject && (
                                        <ContextMenuItem onClick={() => onReject(ts.id)} className="text-destructive focus:text-destructive">
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Rejeter
                                        </ContextMenuItem>
                                    )}
                                </ContextMenuContent>
                            </ContextMenu>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
