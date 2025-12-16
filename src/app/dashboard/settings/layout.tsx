"use client";

import { ReactNode, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Settings,
  User,
  Bell,
  Users,
  Calendar,
  Building2,
  Volume2,
  Monitor,
  Globe,
  Shield,
  ChevronRight,
  Search,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth-client";

const settingsNavigation = [
  {
    title: "Profil",
    href: "/dashboard/settings/profile",
    icon: User,
    description: "Informations personnelles",
    keywords: [
      "profil", "personnel", "utilisateur", "user", "avatar", "photo", "image",
      "nom", "prénom", "email", "courriel", "département", "poste", "position",
      "manager", "responsable", "compte", "identité", "informations", "données"
    ],
  },
  {
    title: "Notifications",
    href: "/dashboard/settings?tab=notifications",
    icon: Bell,
    description: "Préférences de notification",
    keywords: [
      "notification", "notifications", "son", "sons", "audio", "volume", "bip",
      "alerte", "alertes", "email", "courriel", "mail", "bureau", "desktop",
      "préférence", "préférences", "config", "configuration", "paramètre",
      "paramètres", "message", "messages", "test", "tester", "silencieux",
      "maximum", "classique", "doux", "discret", "urgent", "activer", "désactiver"
    ],
  },
  {
    title: "Rappels",
    href: "/dashboard/settings/reminders",
    icon: Calendar,
    description: "Rappels de saisie de temps",
    keywords: [
      "rappel", "rappels", "temps", "saisie", "heures", "travail", "calendrier",
      "horaire", "heure", "jour", "jours", "semaine", "lundi", "mardi", "mercredi",
      "jeudi", "vendredi", "samedi", "dimanche", "activation", "désactivation",
      "préférence", "préférences", "notification", "notifications", "alerte"
    ],
  },
  {
    title: "Général",
    href: "/dashboard/settings?tab=general",
    icon: Settings,
    description: "Apparence et accessibilité",
    keywords: [
      "général", "apparence", "thème", "thèmes", "dark", "sombre", "light", "clair",
      "langue", "language", "localisation", "locale", "accessibilité", "a11y",
      "interface", "ui", "couleur", "couleurs", "police", "font", "taille",
      "contraste", "zoom", "affichage", "écran", "moniteur", "résolution",
      "personnalisation", "personnaliser", "paramètre", "paramètres", "config"
    ],
  },
  {
    title: "Jours fériés",
    href: "/dashboard/settings?tab=holidays",
    icon: Calendar,
    description: "Gestion des jours fériés",
    keywords: [
      "férié", "fériés", "vacance", "vacances", "jour", "jours", "gabon",
      "calendrier", "date", "dates", "fête", "fêtes", "célébration",
      "national", "religieux", "civile", "gestion", "ajouter", "supprimer",
      "modifier", "initialiser", "année", "années", "2025", "2026", "2027"
    ],
  },
  {
    title: "Départements",
    href: "/dashboard/settings?tab=departments",
    icon: Building2,
    description: "Gestion des départements",
    keywords: [
      "département", "départements", "service", "services", "organisation",
      "structure", "équipe", "équipes", "unité", "unités", "division",
      "code", "nom", "description", "gestion", "ajouter", "supprimer",
      "modifier", "créer", "éditer", "entreprise", "société"
    ],
  },
  {
    title: "Utilisateurs",
    href: "/dashboard/settings/users",
    icon: Users,
    description: "Gestion des utilisateurs",
    roles: ["ADMIN", "DIRECTEUR", "HR"],
    keywords: [
      "utilisateur", "utilisateurs", "user", "users", "gestion", "compte",
      "comptes", "membre", "membres", "collaborateur", "collaborateurs",
      "employé", "employés", "personnel", "équipe", "équipes", "ajouter",
      "supprimer", "modifier", "créer", "éditer", "rôle", "rôles", "permission",
      "permissions", "accès", "admin", "hr", "directeur"
    ],
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filtrer les items selon le rôle
  const roleFilteredNavigation = useMemo(() => {
    if (!mounted) return settingsNavigation;
    return settingsNavigation.filter((item) => {
      if (!item.roles) return true;
      const userRole = (session?.user as any)?.role;
      return userRole && item.roles.includes(userRole);
    });
  }, [mounted, session]);

  // Filtrer les items selon la recherche
  const filteredNavigation = useMemo(() => {
    if (!searchQuery.trim()) return roleFilteredNavigation;
    
    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(word => word.length > 0);
    
    return roleFilteredNavigation.filter((item) => {
      // Recherche dans le titre
      const titleMatch = item.title.toLowerCase().includes(query);
      
      // Recherche dans la description
      const descriptionMatch = item.description.toLowerCase().includes(query);
      
      // Recherche dans les mots-clés
      const keywords = item.keywords || [];
      const keywordMatch = keywords.some(keyword => 
        keyword.toLowerCase().includes(query) || 
        queryWords.some(word => keyword.toLowerCase().includes(word))
      );
      
      // Recherche par mots individuels (tous les mots doivent correspondre quelque part)
      const allWordsMatch = queryWords.every(word => 
        item.title.toLowerCase().includes(word) ||
        item.description.toLowerCase().includes(word) ||
        keywords.some(keyword => keyword.toLowerCase().includes(word))
      );
      
      return titleMatch || descriptionMatch || keywordMatch || allWordsMatch;
    });
  }, [roleFilteredNavigation, searchQuery]);

  // Déterminer l'item actif
  const getActiveItem = () => {
    if (pathname === "/dashboard/settings/profile") return "/dashboard/settings/profile";
    if (pathname === "/dashboard/settings/users") return "/dashboard/settings/users";
    if (pathname === "/dashboard/settings/reminders") return "/dashboard/settings/reminders";
    // Pour la page principale, vérifier les query params
    if (pathname === "/dashboard/settings") {
      const tab = searchParams.get("tab") || "notifications";
      return `/dashboard/settings?tab=${tab}`;
    }
    return "/dashboard/settings?tab=notifications";
  };

  const activeHref = getActiveItem();

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Navigation latérale - Sticky pour ne pas défiler avec le contenu */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col lg:sticky lg:top-0 lg:self-start lg:max-h-screen">
        {/* Barre de recherche - Fixe en haut */}
        <div className="p-3 pb-2 shrink-0 border-b bg-background">
          <div className="relative">
            <Input
              type="text"
              placeholder="Rechercher dans les paramètres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
        {/* Navigation - Défilable */}
        <ScrollArea className="flex-1 bg-background">
          <nav className="space-y-1 p-1">
            {filteredNavigation.length > 0 ? (
              filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === activeHref ||
                (item.href.startsWith("/dashboard/settings?tab=") && pathname === "/dashboard/settings" && activeHref === item.href) ||
                (item.href !== "/dashboard/settings" && !item.href.includes("?tab=") && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 shrink-0 ml-auto" />
                  )}
                </Link>
              );
            })
            ) : (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Aucun résultat trouvé
              </div>
            )}
          </nav>
        </ScrollArea>
      </aside>

      <Separator orientation="vertical" className="hidden lg:block" />

      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
