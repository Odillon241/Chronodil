/**
 * Utilitaires pour le calcul des heures de travail
 * Basé sur une semaine de travail standard : 8h/jour, 5 jours (lundi-vendredi)
 */

import { differenceInDays, eachDayOfInterval, getDay } from "date-fns";

/**
 * Nombre d'heures de travail par jour ouvrable
 */
export const WORKING_HOURS_PER_DAY = 8;

/**
 * Jours de la semaine ouvrables (1 = lundi, 5 = vendredi)
 */
export const WORKING_DAYS = [1, 2, 3, 4, 5];

/**
 * Vérifie si un jour est un jour ouvrable (lundi-vendredi)
 * @param date - La date à vérifier
 * @returns true si c'est un jour ouvrable
 */
export function isWorkingDay(date: Date): boolean {
  const dayOfWeek = getDay(date);
  return WORKING_DAYS.includes(dayOfWeek);
}

/**
 * Calcule le nombre de jours ouvrables entre deux dates (inclusif)
 * @param startDate - Date de début (incluse)
 * @param endDate - Date de fin (incluse)
 * @returns Le nombre de jours ouvrables
 */
export function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
  // Si les dates sont identiques, vérifier si c'est un jour ouvrable
  if (startDate.getTime() === endDate.getTime()) {
    return isWorkingDay(startDate) ? 1 : 0;
  }

  // Si endDate < startDate, retourner 0
  if (endDate < startDate) {
    return 0;
  }

  // Obtenir tous les jours dans l'intervalle
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Compter uniquement les jours ouvrables
  const workingDays = allDays.filter(isWorkingDay);

  return workingDays.length;
}

/**
 * Calcule le nombre d'heures de travail entre deux dates
 * Basé sur 8 heures par jour ouvrable (lundi-vendredi)
 * @param startDate - Date de début
 * @param endDate - Date de fin
 * @returns Le nombre total d'heures de travail
 */
export function calculateWorkingHours(startDate: Date, endDate: Date): number {
  const workingDays = getWorkingDaysBetween(startDate, endDate);
  return workingDays * WORKING_HOURS_PER_DAY;
}

/**
 * Formatte les heures de travail pour l'affichage
 * @param hours - Nombre d'heures
 * @returns Chaîne formatée (ex: "40h", "8.5h")
 */
export function formatWorkingHours(hours: number): string {
  return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
}

/**
 * Calcule le nombre de semaines de travail entre deux dates
 * @param startDate - Date de début
 * @param endDate - Date de fin
 * @returns Le nombre de semaines (arrondi au dixième)
 */
export function getWorkingWeeks(startDate: Date, endDate: Date): number {
  const workingDays = getWorkingDaysBetween(startDate, endDate);
  return Math.round((workingDays / 5) * 10) / 10;
}
