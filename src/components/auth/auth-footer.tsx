"use client";

import Image from "next/image";

interface AuthFooterProps {
  /** Afficher le logo ODILLON complet ou juste le texte */
  showLogo?: boolean;
}

/**
 * Footer commun pour les pages d'authentification
 */
export function AuthFooter({ showLogo = true }: AuthFooterProps) {
  return (
    <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 flex items-center space-x-2 z-10">
      <span>&copy; 2026 by </span>
      <span className="font-semibold">ODILLON</span>
    </footer>
  );
}
