"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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

export default function HolidaysPage() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [isInitializingHolidays, setIsInitializingHolidays] = useState(false);

  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: new Date(),
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getHolidays({});
      if (result?.data) {
        setHolidays(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createHoliday(holidayForm);
      if (result?.data) {
        toast.success("Jour férié ajouté !");
        setIsHolidayDialogOpen(false);
        setHolidayForm({ name: "", date: new Date(), description: "" });
        loadData();
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    const confirmed = await showConfirmation({
      title: "Supprimer le jour férié",
      description: "Êtes-vous sûr de vouloir supprimer ce jour férié ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const result = await deleteHoliday({ id });
          if (result?.data) {
            toast.success("Jour férié supprimé");
            loadData();
          }
        } catch (error) {
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  // Jours fériés du Gabon - Template
  const gabonHolidaysTemplate = [
    { name: "Jour de l'An", month: 1, day: 1, description: "Premier jour de l'année civile", fixed: true },
    { name: "Journée des droits de la femme", month: 4, day: 17, description: "Journée internationale des droits de la femme au Gabon", fixed: true },
    { name: "Fête du Travail", month: 5, day: 1, description: "Journée internationale des travailleurs", fixed: true },
    { name: "Assomption de Marie", month: 8, day: 15, description: "Fête de l'Assomption de la Vierge Marie", fixed: true },
    { name: "Jour de l'Indépendance", month: 8, day: 16, description: "Célébration de l'indépendance du Gabon (1960)", fixed: true },
    { name: "Jour de l'Indépendance (suite)", month: 8, day: 17, description: "Célébration de l'indépendance du Gabon - Jour 2", fixed: true },
    { name: "Toussaint", month: 11, day: 1, description: "Fête de tous les saints", fixed: true },
    { name: "Noël", month: 12, day: 25, description: "Célébration de la naissance de Jésus-Christ", fixed: true },
  ];

  const variableHolidaysByYear: Record<number, Array<{name: string, month: number, day: number, description: string}>> = {
    2025: [
      { name: "Fête de fin du Ramadan (Aïd al-Fitr)", month: 3, day: 30, description: "Fête marquant la fin du mois de Ramadan" },
      { name: "Lundi de Pâques", month: 4, day: 21, description: "Lendemain du dimanche de Pâques" },
      { name: "Ascension", month: 5, day: 29, description: "Célébration de l'Ascension du Christ" },
      { name: "Fête du Sacrifice (Aïd al-Adha)", month: 6, day: 6, description: "Fête du sacrifice" },
      { name: "Lundi de Pentecôte", month: 6, day: 9, description: "Célébration de la Pentecôte" },
    ],
    2026: [
      { name: "Fête de fin du Ramadan (Aïd al-Fitr)", month: 3, day: 20, description: "Fête marquant la fin du mois de Ramadan" },
      { name: "Lundi de Pâques", month: 4, day: 6, description: "Lendemain du dimanche de Pâques" },
      { name: "Ascension", month: 5, day: 14, description: "Célébration de l'Ascension du Christ" },
      { name: "Fête du Sacrifice (Aïd al-Adha)", month: 5, day: 27, description: "Fête du sacrifice" },
      { name: "Lundi de Pentecôte", month: 5, day: 25, description: "Célébration de la Pentecôte" },
    ],
    2027: [
      { name: "Fête de fin du Ramadan (Aïd al-Fitr)", month: 3, day: 9, description: "Fête marquant la fin du mois de Ramadan" },
      { name: "Lundi de Pâques", month: 3, day: 29, description: "Lendemain du dimanche de Pâques" },
      { name: "Ascension", month: 5, day: 6, description: "Célébration de l'Ascension du Christ" },
      { name: "Fête du Sacrifice (Aïd al-Adha)", month: 5, day: 16, description: "Fête du sacrifice" },
      { name: "Lundi de Pentecôte", month: 5, day: 17, description: "Célébration de la Pentecôte" },
    ],
  };

  const handleInitializeGabonHolidays = async (year: number) => {
    const variableHolidays = variableHolidaysByYear[year] || [];
    const totalHolidays = gabonHolidaysTemplate.length + variableHolidays.length;
    
    const confirmed = await showConfirmation({
      title: `Ajouter les jours fériés du Gabon pour ${year}`,
      description: `Voulez-vous ajouter les ${totalHolidays} jours fériés du Gabon pour ${year} ?\n\nNote : Les dates variables (Pâques, fêtes musulmanes) ${variableHolidays.length === 0 ? 'ne sont pas disponibles pour cette année. Seules les dates fixes seront ajoutées.' : 'seront également ajoutées.'}`,
      confirmText: "Ajouter",
      cancelText: "Annuler",
      onConfirm: async () => {
        setIsInitializingHolidays(true);
        try {
          let added = 0;
          let skipped = 0;
          
          for (const holiday of gabonHolidaysTemplate) {
            try {
              const result = await createHoliday({
                name: holiday.name,
                date: new Date(year, holiday.month - 1, holiday.day),
                description: holiday.description,
              });
              if (result?.data) {
                added++;
              }
            } catch (error: any) {
              const errorMessage = error?.message || error?.serverError || "";
              if (
                errorMessage.includes("Unique constraint") ||
                errorMessage.includes("déjà") ||
                errorMessage.includes("existe déjà")
              ) {
                skipped++;
              } else {
                console.error("Erreur lors de l'ajout du jour férié:", error);
              }
            }
          }
          
          for (const holiday of variableHolidays) {
            try {
              const result = await createHoliday({
                name: holiday.name,
                date: new Date(year, holiday.month - 1, holiday.day),
                description: holiday.description,
              });
              if (result?.data) {
                added++;
              }
            } catch (error: any) {
              const errorMessage = error?.message || error?.serverError || "";
              if (
                errorMessage.includes("Unique constraint") ||
                errorMessage.includes("déjà") ||
                errorMessage.includes("existe déjà")
              ) {
                skipped++;
              } else {
                console.error("Erreur lors de l'ajout du jour férié:", error);
              }
            }
          }
          
          if (added > 0) {
            toast.success(`${added} jour${added > 1 ? 's' : ''} férié${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''} pour ${year}${skipped > 0 ? ` (${skipped} déjà existant${skipped > 1 ? 's' : ''})` : ''} !`);
          } else if (skipped > 0) {
            toast.info(`Tous les jours fériés pour ${year} existent déjà.`);
          }
          loadData();
        } catch (error) {
          console.error("Erreur lors de l'ajout des jours fériés:", error);
          toast.error("Erreur lors de l'ajout des jours fériés");
        } finally {
          setIsInitializingHolidays(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jours fériés</h1>
        <p className="text-base text-muted-foreground mt-1">
          Gérez les jours fériés pour le calcul des temps (Gabon)
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">Jours fériés</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gérez les jours fériés pour le calcul des temps (Gabon)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isInitializingHolidays}
                    className="w-full sm:w-auto border-powder-blue text-powder-blue hover:bg-powder-blue hover:text-white text-xs sm:text-sm"
                  >
                    {isInitializingHolidays ? "Ajout en cours..." : "🇬🇦 Initialiser jours fériés"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Choisir l'année</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                        <Button
                          key={year}
                          variant="outline"
                          onClick={() => handleInitializeGabonHolidays(year)}
                          disabled={isInitializingHolidays}
                          className="w-full"
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      8 dates fixes + 5 dates variables (selon l'année)
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm">
                    <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nouveau jour férié</DialogTitle>
                    <DialogDescription>
                      Ajoutez un jour férié au calendrier
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateHoliday} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom *</Label>
                      <Input
                        id="name"
                        value={holidayForm.name}
                        onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                        placeholder="Ex: Noël"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(holidayForm.date, "dd/MM/yyyy", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={holidayForm.date}
                            onSelect={(d: Date | undefined) => d && setHolidayForm({ ...holidayForm, date: d })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={holidayForm.description}
                        onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                        placeholder="Description optionnelle..."
                        rows={2}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setIsHolidayDialogOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">
                        Annuler
                      </Button>
                      <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary text-xs sm:text-sm">
                        Ajouter
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucun jour férié défini</p>
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden md:block border rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium text-sm">Nom</th>
                      <th className="text-left p-3 font-medium text-sm">Date</th>
                      <th className="text-left p-3 font-medium text-sm">Description</th>
                      <th className="text-right p-3 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((holiday) => (
                      <tr key={holiday.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium text-sm">{holiday.name}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {format(new Date(holiday.date), "dd/MM/yyyy")}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {holiday.description || "-"}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-2">
                {holidays.map((holiday) => (
                  <div key={holiday.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{holiday.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(holiday.date), "dd/MM/yyyy")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteHoliday(holiday.id)}
                        className="text-red-600 hover:text-red-800 -mt-1 -mr-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {holiday.description && (
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        {holiday.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog />
    </div>
  );
}

