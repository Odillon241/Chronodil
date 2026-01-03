import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Cache en mémoire pour les previews (5 minutes)
const previewCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
  type?: string;
}

/**
 * Extrait les meta tags OpenGraph d'une page HTML
 */
function extractOpenGraphData(html: string, url: string): OpenGraphData {
  const ogData: OpenGraphData = {
    url,
  };

  // Regex pour extraire les meta tags OpenGraph
  const ogRegex = /<meta\s+property=["']og:([^"']+)["']\s+content=["']([^"']+)["']\s*\/?>/gi;
  const twitterRegex = /<meta\s+name=["']twitter:([^"']+)["']\s+content=["']([^"']+)["']\s*\/?>/gi;
  const titleRegex = /<title[^>]*>([^<]+)<\/title>/i;
  const descriptionRegex = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']\s*\/?>/i;

  // Extraire les balises OpenGraph
  let match;
  while ((match = ogRegex.exec(html)) !== null) {
    const [, property, content] = match;

    switch (property) {
      case "title":
        ogData.title = content;
        break;
      case "description":
        ogData.description = content;
        break;
      case "image":
        ogData.image = content;
        break;
      case "url":
        ogData.url = content;
        break;
      case "site_name":
        ogData.siteName = content;
        break;
      case "type":
        ogData.type = content;
        break;
    }
  }

  // Fallback sur les balises Twitter si OpenGraph manquant
  while ((match = twitterRegex.exec(html)) !== null) {
    const [, property, content] = match;

    switch (property) {
      case "title":
        if (!ogData.title) ogData.title = content;
        break;
      case "description":
        if (!ogData.description) ogData.description = content;
        break;
      case "image":
        if (!ogData.image) ogData.image = content;
        break;
    }
  }

  // Fallback sur les balises HTML standards
  if (!ogData.title) {
    const titleMatch = titleRegex.exec(html);
    if (titleMatch) ogData.title = titleMatch[1];
  }

  if (!ogData.description) {
    const descMatch = descriptionRegex.exec(html);
    if (descMatch) ogData.description = descMatch[1];
  }

  // Normaliser l'URL de l'image (relative -> absolue)
  if (ogData.image && !ogData.image.startsWith("http")) {
    try {
      const baseUrl = new URL(url);
      ogData.image = new URL(ogData.image, baseUrl.origin).toString();
    } catch (e) {
      // Ignorer les erreurs de parsing d'URL
    }
  }

  return ogData;
}

/**
 * Route API pour récupérer les previews de liens (OpenGraph)
 * GET /api/link-preview?url=https://example.com
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'URL depuis les query params
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL manquante" },
        { status: 400 }
      );
    }

    // Valider l'URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
      // Autoriser seulement HTTP et HTTPS
      if (!["http:", "https:"].includes(validUrl.protocol)) {
        throw new Error("Protocole non autorisé");
      }
    } catch (e) {
      return NextResponse.json(
        { error: "URL invalide" },
        { status: 400 }
      );
    }

    // Vérifier le cache
    const cached = previewCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Fetch la page HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ChronodilBot/1.0; +https://chronodil.com)",
      },
      // Timeout de 10 secondes
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erreur HTTP: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Extraire les données OpenGraph
    const ogData = extractOpenGraphData(html, url);

    // Mettre en cache
    previewCache.set(url, {
      data: ogData,
      timestamp: Date.now(),
    });

    // Nettoyer le cache (garder seulement les 100 dernières entrées)
    if (previewCache.size > 100) {
      const sortedEntries = Array.from(previewCache.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp);

      previewCache.clear();
      sortedEntries.slice(0, 100).forEach(([key, value]) => {
        previewCache.set(key, value);
      });
    }

    return NextResponse.json(ogData);
  } catch (error: any) {
    console.error("Erreur lors de la récupération de la preview:", error);

    // Timeout
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Timeout lors de la récupération de la page" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la récupération de la preview" },
      { status: 500 }
    );
  }
}
