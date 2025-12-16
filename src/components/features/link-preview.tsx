"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
  type?: string;
}

interface LinkPreviewProps {
  url: string;
  className?: string;
}

/**
 * Composant pour afficher une preview de lien avec OpenGraph
 *
 * Fonctionnalités:
 * - Fetch automatique des données OpenGraph via API
 * - Affichage carte avec image, titre, description
 * - Gestion des états de chargement et erreurs
 * - Design responsive
 */
export function LinkPreview({ url, className }: LinkPreviewProps) {
  const [data, setData] = useState<OpenGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchPreview = async () => {
      try {
        const response = await fetch(
          `/api/link-preview?url=${encodeURIComponent(url)}`
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération");
        }

        const ogData = await response.json();

        if (mounted) {
          setData(ogData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Erreur preview lien:", err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      mounted = false;
    };
  }, [url]);

  // Afficher seulement un lien simple en cas d'erreur
  if (error) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline",
          className
        )}
      >
        <span className="break-all">{url}</span>
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </a>
    );
  }

  // État de chargement
  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Chargement de la preview...</span>
      </div>
    );
  }

  // Pas de données OpenGraph disponibles
  if (!data || (!data.title && !data.description && !data.image)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline",
          className
        )}
      >
        <span className="break-all">{url}</span>
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </a>
    );
  }

  // Afficher la carte de preview
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block border rounded-lg overflow-hidden hover:bg-accent transition-colors group",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image OpenGraph */}
        {data.image && (
          <div className="sm:w-1/3 aspect-video sm:aspect-square bg-muted flex-shrink-0">
            <img
              src={data.image}
              alt={data.title || "Preview image"}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Cacher l'image si elle ne charge pas
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Contenu */}
        <div className="flex-1 p-3 min-w-0">
          {/* Site name */}
          {data.siteName && (
            <div className="text-xs text-muted-foreground mb-1 truncate">
              {data.siteName}
            </div>
          )}

          {/* Title */}
          {data.title && (
            <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {data.title}
            </h3>
          )}

          {/* Description */}
          {data.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {data.description}
            </p>
          )}

          {/* URL */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate">{new URL(url).hostname}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </div>
        </div>
      </div>
    </a>
  );
}
