import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// Store pour le rate limiting (en production, utiliser Redis)
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_WINDOW = 30 * 1000; // 30 secondes

/**
 * Route API pour mettre à jour la présence de l'utilisateur
 *
 * Rate limiting: max 1 requête toutes les 30 secondes par utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const now = Date.now();

    // Rate limiting: vérifier si l'utilisateur a fait une requête récemment
    const lastUpdate = rateLimitStore.get(userId);
    if (lastUpdate && now - lastUpdate < RATE_LIMIT_WINDOW) {
      // Requête trop rapide, mais on retourne success pour éviter les erreurs côté client
      return NextResponse.json({
        success: true,
        message: "Rate limit - requête ignorée",
        lastSeenAt: new Date(lastUpdate).toISOString(),
      });
    }

    // Mettre à jour lastSeenAt dans la base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        lastSeenAt: new Date(),
      },
      select: {
        id: true,
        lastSeenAt: true,
      },
    });

    // Enregistrer le timestamp dans le store de rate limiting
    rateLimitStore.set(userId, now);

    // Nettoyer les anciennes entrées du store (garder seulement les 5 dernières minutes)
    if (rateLimitStore.size > 1000) {
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      for (const [key, timestamp] of rateLimitStore.entries()) {
        if (timestamp < fiveMinutesAgo) {
          rateLimitStore.delete(key);
        }
      }
    }

    return NextResponse.json({
      success: true,
      lastSeenAt: updatedUser.lastSeenAt?.toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la présence:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la présence" },
      { status: 500 }
    );
  }
}
