"use client";

import { useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimesheetEntry {
  id: string;
  date: Date;
  duration: number;
  status: string;
  project: {
    name: string;
    color?: string;
  };
  description?: string | null;
  type: string;
}

interface WeeklyTimesheetProps {
  entries: TimesheetEntry[];
  onDateSelect: (date: Date) => void;
  onAddEntry: (date: Date) => void;
  onSubmitWeek?: (weekStart: Date, weekEnd: Date) => void;
  selectedDate: Date;
}

export function WeeklyTimesheet({ entries, onDateSelect, onAddEntry, onSubmitWeek, selectedDate }: WeeklyTimesheetProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(selectedDate, { weekStartsOn: 1 })
  );

  const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Calculer les totaux par jour
  const getDayTotal = (day: Date) => {
    return entries
      .filter((entry) => isSameDay(new Date(entry.date), day))
      .reduce((sum, entry) => sum + entry.duration, 0);
  };

  // Calculer le total de la semaine
  const weekTotal = daysOfWeek.reduce((sum, day) => sum + getDayTotal(day), 0);

  // Obtenir les entrées d'un jour
  const getDayEntries = (day: Date) => {
    return entries.filter((entry) => isSameDay(new Date(entry.date), day));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: "bg-gray-200 border-gray-300",
      SUBMITTED: "bg-amber-200 border-amber-300",
      APPROVED: "bg-green-200 border-green-300",
      REJECTED: "bg-red-200 border-red-300",
      LOCKED: "bg-blue-200 border-blue-300",
    };
    return colors[status as keyof typeof colors] || colors.DRAFT;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      DRAFT: "Brouillon",
      SUBMITTED: "Soumis",
      APPROVED: "Approuvé",
      REJECTED: "Rejeté",
      LOCKED: "Verrouillé",
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vue hebdomadaire</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Aujourd'hui
            </Button>
            <div className="flex items-center gap-1 border rounded-md bg-background">
              <Button variant="ghost" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-4 text-sm font-medium whitespace-nowrap">
                {format(weekStart, "d MMM", { locale: fr })} - {format(weekEnd, "d MMM yyyy", { locale: fr })}
              </span>
              <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* En-têtes des jours */}
          {daysOfWeek.map((day) => {
            const dayTotal = getDayTotal(day);
            const dayEntries = getDayEntries(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const isWeekendDay = isWeekend(day);

            return (
              <div
                key={day.toString()}
                className={cn(
                  "border rounded-lg p-3 min-h-[200px] flex flex-col transition-colors bg-card",
                  isToday && "border-primary border-2",
                  isSelected && !isToday && "border-primary",
                  isWeekendDay && "bg-gray-50"
                )}
              >
                {/* En-tête du jour */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b">
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-xs font-medium uppercase",
                      isWeekendDay && "text-gray-500"
                    )}>
                      {format(day, "EEE", { locale: fr })}
                    </span>
                    <span className={cn(
                      "text-lg font-bold",
                      isToday && "text-primary",
                      isWeekendDay && !isToday && "text-gray-500"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-sm font-bold",
                      dayTotal >= 7 ? "text-green-600" : dayTotal > 0 ? "text-amber-600" : "text-gray-400"
                    )}>
                      {dayTotal.toFixed(1)}h
                    </div>
                    {dayTotal < 7 && dayTotal > 0 && (
                      <div className="text-xs text-muted-foreground">
                        -{(7 - dayTotal).toFixed(1)}h
                      </div>
                    )}
                  </div>
                </div>

                {/* Entrées du jour */}
                <div className="flex-1 space-y-1.5 overflow-y-auto">
                  {dayEntries.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onDateSelect(day);
                          onAddEntry(day);
                        }}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  ) : (
                    dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => onDateSelect(day)}
                        className={cn(
                          "p-2 rounded border cursor-pointer bg-background",
                          getStatusColor(entry.status)
                        )}
                        title={`${entry.project?.name || "Projet non assigné"} - ${entry.duration}h\n${entry.description || ""}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div
                            className="w-1 h-full rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.project?.color || "#3b82f6" }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                              {entry.project?.name || "Projet non assigné"}
                            </div>
                            {entry.description && (
                              <div className="text-[10px] text-muted-foreground truncate">
                                {entry.description}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-bold">
                                {entry.duration}h
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {getStatusLabel(entry.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bouton d'ajout si des entrées existent */}
                {dayEntries.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onDateSelect(day);
                      onAddEntry(day);
                    }}
                    className="mt-2 w-full text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Résumé de la semaine */}
        <div className="mt-4 pt-4 border-t space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Total semaine</div>
                <div className="text-2xl font-bold text-primary">{weekTotal.toFixed(1)}h</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Objectif</div>
                <div className="text-2xl font-bold text-gray-600">35.0h</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Écart</div>
                <div className={cn(
                  "text-2xl font-bold",
                  weekTotal >= 35 ? "text-green-600" : "text-amber-600"
                )}>
                  {weekTotal >= 35 ? "+" : ""}{(weekTotal - 35).toFixed(1)}h
                </div>
              </div>
            </div>

            {/* Légende des statuts */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gray-200 border-gray-300" />
                <span>Brouillon</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-200 border-amber-300" />
                <span>Soumis</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-200 border-green-300" />
                <span>Approuvé</span>
              </div>
            </div>
          </div>

          {/* Bouton de soumission de la semaine */}
          {onSubmitWeek && (() => {
            const draftCount = entries.filter(e => e.status === "DRAFT").length;
            const hasSubmitted = entries.some(e => e.status === "SUBMITTED" || e.status === "APPROVED" || e.status === "LOCKED");

            return draftCount > 0 && (
              <div className="flex items-center justify-end gap-3">
                <div className="text-sm text-muted-foreground">
                  {draftCount} entrée(s) en brouillon
                </div>
                <Button
                  onClick={() => onSubmitWeek(weekStart, weekEnd)}
                  className="bg-primary hover:bg-primary/90"
                  disabled={hasSubmitted && draftCount === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Soumettre la semaine
                </Button>
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
