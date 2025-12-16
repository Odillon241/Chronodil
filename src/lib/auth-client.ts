"use client";

import { createAuthClient } from "better-auth/react";

// Forcer l'URL locale en développement pour éviter les appels CORS vers production
const getBaseURL = () => {
  // En développement, toujours utiliser localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  // En production, utiliser la variable d'environnement
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
