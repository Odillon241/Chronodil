"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    Flag,
    Sparkles,
    ChevronRight,
    PartyPopper,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { format, isSameDay, startOfDay, getYear, getMonth } from "date-fns";
import { fr } from "date-fns/locale";
import {
    getHolidays,
    createHoliday,
    deleteHoliday,
} from "@/actions/settings.actions";
import { useConfirmationDialog } from "@/hooks/use-confirmation-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Données des jours fériés du Gabon
const gabonHolidaysTemplate = [
    { name: "Jour de l'An", month: 1, day: 1, description: "Premier jour de l'année civile", emoji: "🎊" },
    { name: "Journée des droits de la femme", month: 4, day: 17, description: "Journée internationale des droits de la femme", emoji: "👩" },
    { name: "Fête du Travail", month: 5, day: 1, description: "Journée internationale des travailleurs", emoji: "💼" },
    { name: "Assomption de Marie", month: 8, day: 15, description: "Fête de l'Assomption de la Vierge Marie", emoji: "✨" },
    { name: "Jour de l'Indépendance", month: 8, day: 16, description: "Célébration de l'indépendance du Gabon (1960)", emoji: "🇬🇦" },
    { name: "Jour de l'Indépendance (J2)", month: 8, day: 17, description: "Célébration de l'indépendance - Jour 2", emoji: "🇬🇦" },
    { name: "Toussaint", month: 11, day: 1, description: "Fête de tous les saints", emoji: "🕯️" },
    { name: "Noël", month: 12, day: 25, description: "Naissance de Jésus-Christ", emoji: "🎄" },
];

const variableHolidaysByYear: Record<number, Array<{ name: string, month: number, day: number, description: string, emoji: string }>> = {
    2025: [
        { name: "Aïd al-Fitr", month: 3, day: 30, description: "Fin du Ramadan", emoji: "🌙" },
        { name: "Lundi de Pâques", month: 4, day: 21, description: "Lendemain de Pâques", emoji: "🐣" },
        { name: "Ascension", month: 5, day: 29, description: "Ascension du Christ", emoji: "☁️" },
        { name: "Aïd al-Adha", month: 6, day: 6, description: "Fête du sacrifice", emoji: "🐑" },
        { name: "Lundi de Pentecôte", month: 6, day: 9, description: "Pentecôte", emoji: "🕊️" },
    ],
    2026: [
        { name: "Aïd al-Fitr", month: 3, day: 20, description: "Fin du Ramadan", emoji: "🌙" },
        { name: "Lundi de Pâques", month: 4, day: 6, description: "Lendemain de Pâques", emoji: "🐣" },
        { name: "Ascension", month: 5, day: 14, description: "Ascension du Christ", emoji: "☁️" },
        { name: "Aïd al-Adha", month: 5, day: 27, description: "Fête du sacrifice", emoji: "🐑" },
        { name: "Lundi de Pentecôte", month: 5, day: 25, description: "Pentecôte", emoji: "🕊️" },
    ],
    2027: [
        { name: "Aïd al-Fitr", month: 3, day: 9, description: "Fin du Ramadan", emoji: "🌙" },
        { name: "Lundi de Pâques", month: 3, day: 29, description: "Lendemain de Pâques", emoji: "🐣" },
        { name: "Ascension", month: 5, day: 6, description: "Ascension du Christ", emoji: "☁️" },
        { name: "Aïd al-Adha", month: 5, day: 16, description: "Fête du sacrifice", emoji: "🐑" },
        { name: "Lundi de Pentecôte", month: 5, day: 17, description: "Pentecôte", emoji: "🕊️" },
    ],
};

export default function HolidaysPage() {
    const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
    const [holidays, setHolidays] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
    const [isInitializingHolidays, setIsInitializingHolidays] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const [holidayForm, setHolidayForm] = useState({
        name: "",
        date: new Date(),
        description: "",
    });

    useEffect(() => {
        loadHolidays();
    }, []);

    const loadHolidays = async () => {
        setIsLoading(true);
        try {
            const result = await getHolidays({});
            console.log("📅 Résultat getHolidays:", result);
            if (result?.data) {
                console.log("📅 Jours fériés chargés:", result.data);
                setHolidays(result.data);
            } else {
                console.warn("⚠️ Pas de data dans result:", result);
                // Essayer avec result directement si c'est un array
                if (Array.isArray(result)) {
                    console.log("📅 result est un array, utilisation directe");
                    setHolidays(result);
                }
            }
        } catch (error) {
            console.error("❌ Erreur:", error);
            toast.error("Erreur lors du chargement");
        } finally {
            setIsLoading(false);
        }
    };

    // Filtrer les jours fériés par année
    const holidaysByYear = useMemo(() => {
        const filtered = holidays.filter(h => getYear(new Date(h.date)) === selectedYear);
        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [holidays, selectedYear]);

    // Grouper par mois
    const holidaysByMonth = useMemo(() => {
        const groups: Record<number, typeof holidays> = {};
        holidaysByYear.forEach(h => {
            const month = getMonth(new Date(h.date));
            if (!groups[month]) groups[month] = [];
            groups[month].push(h);
        });
        return groups;
    }, [holidaysByYear]);

    // Années disponibles
    const availableYears = useMemo(() => {
        const years = new Set(holidays.map(h => getYear(new Date(h.date))));
        const currentYear = new Date().getFullYear();
        for (let y = currentYear; y <= currentYear + 2; y++) years.add(y);
        return Array.from(years).sort();
    }, [holidays]);

    const holidayDates = holidays.map((h) => startOfDay(new Date(h.date)));
    const isHoliday = (date: Date) => holidayDates.some((hd) => isSameDay(date, hd));

    const handleCreateHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createHoliday(holidayForm);
            toast.success("Jour férié ajouté");
            setIsHolidayDialogOpen(false);
            setHolidayForm({ name: "", date: new Date(), description: "" });
            loadHolidays();
        } catch {
            toast.error("Erreur lors de l'ajout");
        }
    };

    const handleDeleteHoliday = async (id: string, name: string) => {
        await showConfirmation({
            title: "Supprimer le jour férié",
            description: `Voulez-vous vraiment supprimer "${name}" ?`,
            confirmText: "Supprimer",
            variant: "destructive",
            onConfirm: async () => {
                try {
                    await deleteHoliday({ id });
                    toast.success("Jour férié supprimé");
                    loadHolidays();
                } catch {
                    toast.error("Erreur lors de la suppression");
                }
            },
        });
    };

    const handleInitializeGabonHolidays = async (year: number) => {
        const variableHolidays = variableHolidaysByYear[year] || [];
        const totalHolidays = gabonHolidaysTemplate.length + variableHolidays.length;

        await showConfirmation({
            title: `Ajouter les jours fériés ${year}`,
            description: `Ajouter les ${totalHolidays} jours fériés du Gabon pour ${year} ?\n\n• 8 dates fixes\n• ${variableHolidays.length} dates variables`,
            confirmText: "Ajouter",
            onConfirm: async () => {
                setIsInitializingHolidays(true);
                try {
                    let added = 0;
                    let skipped = 0;

                    const allHolidays = [
                        ...gabonHolidaysTemplate.map(h => ({ ...h, year })),
                        ...variableHolidays.map(h => ({ ...h, year }))
                    ];

                    for (const holiday of allHolidays) {
                        const holidayDate = new Date(holiday.year, holiday.month - 1, holiday.day);
                        const exists = holidays.some(h => isSameDay(new Date(h.date), holidayDate));

                        if (!exists) {
                            console.log("📅 Création du jour férié:", { name: holiday.name, date: holidayDate });
                            const result = await createHoliday({
                                name: holiday.name,
                                date: holidayDate,
                                description: holiday.description || "",
                            });
                            console.log("📅 Résultat createHoliday:", result);
                            if (result?.data) {
                                added++;
                            } else if (result?.serverError) {
                                console.error("❌ Erreur serveur:", result.serverError);
                            }
                        } else {
                            skipped++;
                        }
                    }

                    if (added > 0) {
                        toast.success(`${added} jour${added > 1 ? 's' : ''} férié${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''}`);
                    } else {
                        toast.info("Tous les jours fériés existent déjà");
                    }
                    setSelectedYear(year);
                    await loadHolidays();
                } catch (error) {
                    console.error("❌ Erreur globale:", error);
                    toast.error("Erreur lors de l'ajout");
                } finally {
                    setIsInitializingHolidays(false);
                }
            },
        });
    };


    const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    return (
        <div className="flex flex-col gap-6 pb-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Jours fériés</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    Gérez les jours fériés pour le calcul des temps
                </p>
            </div>

            {isLoading ? (
                <Card className="border-dashed">
                    <CardContent className="py-16">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 rounded-full bg-muted animate-pulse">
                                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <Spinner className="size-6" />
                            <p className="text-muted-foreground">Chargement des jours fériés...</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Actions rapides */}
                    <Card className="overflow-hidden border shadow-none bg-muted/20">
                        <CardHeader className="pb-3 border-b bg-background/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Flag className="h-5 w-5 text-primary" />
                                        Initialisation rapide
                                    </CardTitle>
                                    <CardDescription>Ajoutez les jours fériés du Gabon en un clic</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 bg-background/30">
                            <div className="flex flex-wrap gap-2">
                                {[2025, 2026, 2027, 2028, 2029, 2030].map((year) => {
                                    const hasHolidays = holidays.some(h => getYear(new Date(h.date)) === year);
                                    return (
                                        <Button
                                            key={year}
                                            variant={hasHolidays ? "secondary" : "outline"}
                                            onClick={() => handleInitializeGabonHolidays(year)}
                                            disabled={isInitializingHolidays}
                                            className={cn(
                                                "gap-2 transition-all",
                                                hasHolidays && "border-primary/30 bg-primary/5"
                                            )}
                                        >
                                            <span className="text-base">🇬🇦</span>
                                            {year}
                                            {hasHolidays && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">✓</Badge>}
                                        </Button>
                                    );
                                })}
                                <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Personnalisé
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <PartyPopper className="h-5 w-5 text-primary" />
                                                Nouveau jour férié
                                            </DialogTitle>
                                            <DialogDescription>
                                                Ajoutez un jour férié personnalisé au calendrier
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleCreateHoliday} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Nom du jour férié *</Label>
                                                <Input
                                                    id="name"
                                                    value={holidayForm.name}
                                                    onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                                                    placeholder="Ex: Noël, Pâques..."
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Date *</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className="w-full justify-start font-normal">
                                                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            {format(holidayForm.date, "EEEE d MMMM yyyy", { locale: fr })}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={holidayForm.date}
                                                            onSelect={(d) => d && setHolidayForm({ ...holidayForm, date: d })}
                                                            locale={fr}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description (optionnel)</Label>
                                                <Textarea
                                                    id="description"
                                                    value={holidayForm.description}
                                                    onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                                                    placeholder="Description du jour férié..."
                                                    rows={2}
                                                />
                                            </div>

                                            <Button type="submit" className="w-full">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Ajouter le jour férié
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vue calendrier + Liste */}
                    <div className="grid lg:grid-cols-5 gap-6">
                        {/* Calendrier */}
                        <Card className="lg:col-span-2 overflow-hidden border shadow-none bg-muted/20">
                            <CardHeader className="pb-3 border-b bg-background/50">
                                <CardTitle className="text-lg font-bold">Aperçu calendrier</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex justify-center bg-background/30">
                                <Calendar
                                    mode="single"
                                    month={calendarMonth}
                                    onMonthChange={setCalendarMonth}
                                    locale={fr}
                                    modifiers={{
                                        holiday: (date) => isHoliday(date),
                                    }}
                                    modifiersStyles={{
                                        holiday: {
                                            fontWeight: "bold",
                                            color: "white",
                                            backgroundColor: "hsl(var(--primary))",
                                            borderRadius: "50%",
                                        },
                                    }}
                                    className="rounded-md"
                                />
                            </CardContent>
                        </Card>

                        {/* Liste par année */}
                        <Card className="lg:col-span-3 overflow-hidden border shadow-none bg-muted/20">
                            <CardHeader className="pb-3 border-b bg-background/50">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold">
                                        Liste des jours fériés
                                    </CardTitle>
                                    <Badge variant="secondary" className="font-bold">
                                        {holidaysByYear.length} jour{holidaysByYear.length > 1 ? 's' : ''}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 bg-background/30">
                                {/* Tabs par année */}
                                <Tabs value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))} className="w-full">
                                    <div className="border-b px-4">
                                        <TabsList className="h-12 bg-transparent w-full justify-start gap-1 p-0">
                                            {availableYears.map((year) => (
                                                <TabsTrigger
                                                    key={year}
                                                    value={String(year)}
                                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-t-lg rounded-b-none px-4"
                                                >
                                                    {year}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>

                                    <TabsContent value={String(selectedYear)} className="mt-0">
                                        <div className="max-h-[500px] overflow-y-auto">
                                            {holidaysByYear.length === 0 ? (
                                                <div className="py-12 text-center">
                                                    <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                                    <p className="text-muted-foreground">Aucun jour férié pour {selectedYear}</p>
                                                    <Button
                                                        variant="link"
                                                        onClick={() => handleInitializeGabonHolidays(selectedYear)}
                                                        className="mt-2"
                                                    >
                                                        <Sparkles className="h-4 w-4 mr-2" />
                                                        Ajouter les jours fériés du Gabon
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-border/50">
                                                    {Object.entries(holidaysByMonth).map(([month, items]) => (
                                                        <div key={month}>
                                                            <div className="px-4 py-2 bg-muted/30 sticky top-0">
                                                                <span className="font-semibold text-sm text-muted-foreground">
                                                                    {monthNames[Number(month)]}
                                                                </span>
                                                            </div>
                                                            <div className="divide-y divide-border/30">
                                                                {items.map((holiday) => (
                                                                    <div
                                                                        key={holiday.id}
                                                                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
                                                                    >
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold">
                                                                                <span className="text-lg leading-none">{format(new Date(holiday.date), "d")}</span>
                                                                                <span className="text-[10px] uppercase">{format(new Date(holiday.date), "MMM", { locale: fr })}</span>
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-semibold">{holiday.name}</div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {format(new Date(holiday.date), "EEEE", { locale: fr })}
                                                                                    {holiday.description && ` • ${holiday.description}`}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                                                                            className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            <ConfirmationDialog />
        </div>
    );
}
