"use client";

import { ReactNode } from "react";
import { AuthBackground } from "./auth-background";
import { AuthFooter } from "./auth-footer";
import { AuthHeader } from "./auth-header";

interface AuthLayoutProps {
  children: ReactNode;
  /** Citations à afficher en rotation (optionnel) */
  quotes?: string[];
  /** Afficher la grille interactive en arrière-plan */
  showBackground?: boolean;
  /** Afficher le logo complet dans le footer */
  showFooterLogo?: boolean;
}

/**
 * Layout commun pour toutes les pages d'authentification
 * Fournit le fond, les citations et le footer
 */
export function AuthLayout({
  children,
  quotes,
  showBackground = true,
  showFooterLogo = true,
}: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 pb-24 relative overflow-hidden"
      style={{ backgroundColor: "hsl(141, 78.9%, 90%)" }}
    >
      {showBackground && <AuthBackground />}
      
      {quotes && quotes.length > 0 && <AuthHeader quotes={quotes} />}
      
      {children}
      
      <AuthFooter showLogo={showFooterLogo} />
    </div>
  );
}
