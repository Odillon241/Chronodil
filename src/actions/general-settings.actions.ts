"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

// Schéma de validation pour les paramètres généraux Phase 1
const generalSettingsSchema = z.object({
  // Apparence
  accentColor: z.enum(["rusty-red", "ou-crimson", "powder-blue", "forest-green", "golden-orange"]).optional(),
  viewDensity: z.enum(["compact", "normal", "comfortable"]).optional(),
  fontSize: z.number().int().min(12).max(24).optional(),

  // Localisation
  language: z.enum(["fr", "en"]).optional(),
  dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),
  hourFormat: z.enum(["12", "24"]).optional(),
  timezone: z.string().optional(),

  // Accessibilité
  highContrast: z.boolean().optional(),
  screenReaderMode: z.boolean().optional(),
  reduceMotion: z.boolean().optional(),
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;

/**
 * Récupère les paramètres généraux de l'utilisateur
 */
export const getGeneralSettings = actionClient
  .schema(z.object({}))
  .action(async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        accentColor: true,
        viewDensity: true,
        fontSize: true,
        language: true,
        dateFormat: true,
        hourFormat: true,
        timezone: true,
        highContrast: true,
        screenReaderMode: true,
        reduceMotion: true,
      },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    return user;
  });

/**
 * Met à jour les paramètres généraux de l'utilisateur
 */
export const updateGeneralSettings = actionClient
  .schema(generalSettingsSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: parsedInput,
      select: {
        accentColor: true,
        viewDensity: true,
        fontSize: true,
        language: true,
        dateFormat: true,
        hourFormat: true,
        timezone: true,
        highContrast: true,
        screenReaderMode: true,
        reduceMotion: true,
      },
    });

    console.log("Mise à jour réussie:", user);
    return user;
  });

/**
 * Réinitialise les paramètres généraux aux valeurs par défaut
 */
export const resetGeneralSettings = actionClient
  .schema(z.object({}))
  .action(async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Apparence
        accentColor: "rusty-red",
        viewDensity: "normal",
        fontSize: 16,

        // Localisation
        language: "fr",
        dateFormat: "DD/MM/YYYY",
        hourFormat: "24",
        timezone: "Africa/Libreville",

        // Accessibilité
        highContrast: false,
        screenReaderMode: false,
        reduceMotion: false,
      },
      select: {
        accentColor: true,
        viewDensity: true,
        fontSize: true,
        language: true,
        dateFormat: true,
        hourFormat: true,
        timezone: true,
        highContrast: true,
        screenReaderMode: true,
        reduceMotion: true,
      },
    });

    return user;
  });
