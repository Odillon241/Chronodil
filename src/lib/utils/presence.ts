/**
 * Utilitaires pour le système de présence des utilisateurs
 */

const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes

/**
 * Vérifie si un utilisateur est en ligne basé sur son lastSeenAt
 */
export function isUserOnline(lastSeenAt: Date | null | undefined): boolean {
  if (!lastSeenAt) return false;

  const now = Date.now();
  const lastSeen = new Date(lastSeenAt).getTime();
  return now - lastSeen < ONLINE_THRESHOLD;
}

/**
 * Formate le temps écoulé depuis la dernière activité
 * Ex: "il y a 2 minutes", "il y a 1 heure", "il y a 3 jours"
 */
export function formatLastSeen(lastSeenAt: Date | null | undefined): string {
  if (!lastSeenAt) return "Jamais vu";

  const now = Date.now();
  const lastSeen = new Date(lastSeenAt).getTime();
  const diffMs = now - lastSeen;

  // Moins d'une minute
  if (diffMs < 60 * 1000) {
    return "À l'instant";
  }

  // Moins d'une heure
  if (diffMs < 60 * 60 * 1000) {
    const minutes = Math.floor(diffMs / (60 * 1000));
    return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  // Moins d'un jour
  if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  }

  // Moins d'une semaine
  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  }

  // Plus d'une semaine
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
}

/**
 * Retourne le statut de présence sous forme de texte
 */
export function getPresenceStatus(lastSeenAt: Date | null | undefined): "online" | "offline" {
  return isUserOnline(lastSeenAt) ? "online" : "offline";
}

/**
 * Retourne le label de statut de présence
 */
export function getPresenceLabel(lastSeenAt: Date | null | undefined): string {
  return isUserOnline(lastSeenAt) ? "En ligne" : "Hors ligne";
}

/**
 * Retourne la classe CSS pour l'indicateur de présence
 */
export function getPresenceBadgeClass(lastSeenAt: Date | null | undefined): string {
  return isUserOnline(lastSeenAt)
    ? "bg-green-500"
    : "bg-gray-400 dark:bg-gray-600";
}
