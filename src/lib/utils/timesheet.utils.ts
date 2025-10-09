import { format, getHours, getMinutes, isSameDay, startOfWeek, endOfWeek } from "date-fns";

export interface TimesheetEntry {
  id?: string;
  date: Date;
  startTime?: Date | null;
  endTime?: Date | null;
  duration: number;
  userId: string;
}

/**
 * Vérifie si deux entrées de temps se chevauchent
 */
export function hasOverlap(entry1: TimesheetEntry, entry2: TimesheetEntry): boolean {
  // Les entrées ne peuvent se chevaucher que si elles sont le même jour
  if (!isSameDay(entry1.date, entry2.date)) {
    return false;
  }

  // Si aucune heure de début/fin, pas de chevauchement possible
  if (!entry1.startTime || !entry1.endTime || !entry2.startTime || !entry2.endTime) {
    return false;
  }

  const start1 = entry1.startTime.getTime();
  const end1 = entry1.endTime.getTime();
  const start2 = entry2.startTime.getTime();
  const end2 = entry2.endTime.getTime();

  // Vérifier le chevauchement: deux intervalles [a,b] et [c,d] se chevauchent si max(a,c) < min(b,d)
  return Math.max(start1, start2) < Math.min(end1, end2);
}

/**
 * Vérifie si une nouvelle entrée chevauche des entrées existantes
 */
export function checkOverlapWithEntries(
  newEntry: TimesheetEntry,
  existingEntries: TimesheetEntry[]
): { hasOverlap: boolean; conflictingEntry?: TimesheetEntry } {
  for (const existing of existingEntries) {
    // Ne pas comparer avec soi-même
    if (existing.id && newEntry.id && existing.id === newEntry.id) {
      continue;
    }

    if (hasOverlap(newEntry, existing)) {
      return {
        hasOverlap: true,
        conflictingEntry: existing,
      };
    }
  }

  return { hasOverlap: false };
}

/**
 * Calcule la durée totale de travail pour un jour donné
 */
export function calculateDailyTotal(date: Date, entries: TimesheetEntry[]): number {
  return entries
    .filter((entry) => isSameDay(entry.date, date))
    .reduce((sum, entry) => sum + entry.duration, 0);
}

/**
 * Vérifie si la durée totale journalière dépasse 24h
 */
export function checkDailyLimit(
  newEntry: TimesheetEntry,
  existingEntries: TimesheetEntry[]
): { isValid: boolean; totalHours: number; maxAllowed: number } {
  const total = calculateDailyTotal(newEntry.date, [...existingEntries, newEntry]);
  const maxAllowed = 24;

  return {
    isValid: total <= maxAllowed,
    totalHours: total,
    maxAllowed,
  };
}

/**
 * Calcule la durée totale de travail pour une semaine
 */
export function calculateWeeklyTotal(date: Date, entries: TimesheetEntry[]): number {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  return entries
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate <= weekEnd;
    })
    .reduce((sum, entry) => sum + entry.duration, 0);
}

/**
 * Détecte automatiquement si ce sont des heures supplémentaires
 * En France: au-delà de 35h/semaine ou 7h/jour (configurable)
 */
export function detectOvertime(
  newEntry: TimesheetEntry,
  existingEntries: TimesheetEntry[],
  weeklyThreshold: number = 35,
  dailyThreshold: number = 7
): { isOvertime: boolean; reason: string; weeklyTotal?: number; dailyTotal?: number } {
  // Vérifier le seuil journalier
  const dailyTotal = calculateDailyTotal(newEntry.date, [...existingEntries, newEntry]);
  if (dailyTotal > dailyThreshold) {
    return {
      isOvertime: true,
      reason: `Dépassement du seuil journalier (${dailyTotal}h > ${dailyThreshold}h)`,
      dailyTotal,
    };
  }

  // Vérifier le seuil hebdomadaire
  const weeklyTotal = calculateWeeklyTotal(newEntry.date, [...existingEntries, newEntry]);
  if (weeklyTotal > weeklyThreshold) {
    return {
      isOvertime: true,
      reason: `Dépassement du seuil hebdomadaire (${weeklyTotal}h > ${weeklyThreshold}h)`,
      weeklyTotal,
    };
  }

  return { isOvertime: false, reason: "" };
}

/**
 * Détecte si ce sont des heures de nuit (21h-6h)
 */
export function detectNightHours(startTime?: Date | null, endTime?: Date | null): boolean {
  if (!startTime || !endTime) {
    return false;
  }

  const startHour = getHours(startTime);
  const endHour = getHours(endTime);

  // Heures de nuit: 21h-6h (21h-minuit et minuit-6h)
  const isNightStart = startHour >= 21 || startHour < 6;
  const isNightEnd = endHour >= 21 || endHour <= 6;

  return isNightStart || isNightEnd;
}

/**
 * Détecte si c'est un weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Dimanche, 6 = Samedi
}

/**
 * Suggestion automatique du type de temps basé sur l'analyse
 */
export function suggestTimeType(
  newEntry: TimesheetEntry,
  existingEntries: TimesheetEntry[]
): "NORMAL" | "OVERTIME" | "NIGHT" | "WEEKEND" {
  // Priorité 1: Weekend
  if (isWeekend(newEntry.date)) {
    return "WEEKEND";
  }

  // Priorité 2: Heures de nuit
  if (detectNightHours(newEntry.startTime, newEntry.endTime)) {
    return "NIGHT";
  }

  // Priorité 3: Heures supplémentaires
  const overtimeCheck = detectOvertime(newEntry, existingEntries);
  if (overtimeCheck.isOvertime) {
    return "OVERTIME";
  }

  return "NORMAL";
}

/**
 * Valide une entrée de temps contre toutes les règles métier
 */
export function validateTimesheetEntry(
  newEntry: TimesheetEntry,
  existingEntries: TimesheetEntry[]
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Vérifier les chevauchements
  const overlapCheck = checkOverlapWithEntries(newEntry, existingEntries);
  if (overlapCheck.hasOverlap && overlapCheck.conflictingEntry) {
    errors.push(
      `Cette entrée chevauche une autre entrée du même jour (${format(
        overlapCheck.conflictingEntry.date,
        "HH:mm"
      )})`
    );
  }

  // 2. Vérifier le maximum journalier
  const dailyCheck = checkDailyLimit(newEntry, existingEntries);
  if (!dailyCheck.isValid) {
    errors.push(
      `La durée totale journalière dépasse ${dailyCheck.maxAllowed}h (total: ${dailyCheck.totalHours.toFixed(
        2
      )}h)`
    );
  }

  // 3. Avertissement pour heures supplémentaires
  const overtimeCheck = detectOvertime(newEntry, existingEntries);
  if (overtimeCheck.isOvertime) {
    warnings.push(overtimeCheck.reason);
  }

  // 4. Avertissement pour heures de nuit
  if (detectNightHours(newEntry.startTime, newEntry.endTime)) {
    warnings.push("Cette entrée contient des heures de nuit (21h-6h)");
  }

  // 5. Avertissement pour weekend
  if (isWeekend(newEntry.date)) {
    warnings.push("Cette entrée est un weekend");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Formatte un temps en heures et minutes
 */
export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
