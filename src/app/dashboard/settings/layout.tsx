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
    subsections: [
      { title: "Informations personnelles", anchor: "#info", keywords: ["nom", "prénom", "email", "téléphone"] },
      { title: "Informations contractuelles", anchor: "#contrat", keywords: ["horaires", "congés", "solde", "heures", "semaine"] },
      { title: "Sécurité", anchor: "#securite", keywords: ["mot de passe", "password", "sécurité", "changer", "modifier"] },
    ],
  },
  {
    title: "Notifications",
    href: "/dashboard/settings/notifications",
    icon: Bell,
    description: "Préférences de notification",
    keywords: [
      "notification", "notifications", "son", "sons", "audio", "volume", "bip",
      "alerte", "alertes", "email", "courriel", "mail", "bureau", "desktop",
      "préférence", "préférences", "config", "configuration", "paramètre",
      "paramètres", "message", "messages", "test", "tester", "silencieux",
      "maximum", "classique", "doux", "discret", "urgent", "activer", "désactiver"
    ],
    subsections: [
      { title: "Sons", anchor: "#sons", keywords: ["son", "audio", "volume", "bip", "silencieux"] },
      { title: "Email", anchor: "#email", keywords: ["email", "courriel", "mail", "envoi"] },
      { title: "Bureau", anchor: "#bureau", keywords: ["desktop", "bureau", "push", "navigateur"] },
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
    subsections: [
      { title: "Activation", anchor: "#activation", keywords: ["activer", "désactiver", "on", "off"] },
      { title: "Horaire", anchor: "#horaire", keywords: ["heure", "horaire", "quand"] },
      { title: "Jours", anchor: "#jours", keywords: ["lundi", "mardi", "mercredi", "jeudi", "vendredi"] },
    ],
  },
  {
    title: "Général",
    href: "/dashboard/settings/general",
    icon: Settings,
    description: "Apparence et accessibilité",
    keywords: [
      "général", "apparence", "thème", "thèmes", "dark", "sombre", "light", "clair",
      "langue", "language", "localisation", "locale", "accessibilité", "a11y",
      "interface", "ui", "couleur", "couleurs", "police", "font", "taille",
      "contraste", "zoom", "affichage", "écran", "moniteur", "résolution",
      "personnalisation", "personnaliser", "paramètre", "paramètres", "config"
    ],
    subsections: [
      { title: "Thème", anchor: "#theme", keywords: ["thème", "dark", "sombre", "light", "clair", "mode"] },
      { title: "Langue", anchor: "#langue", keywords: ["langue", "français", "anglais", "language"] },
      { title: "Accessibilité", anchor: "#accessibilite", keywords: ["accessibilité", "contraste", "taille", "zoom"] },
    ],
  },
  {
    title: "Jours fériés",
    href: "/dashboard/settings/holidays",
    icon: Calendar,
    description: "Gestion des jours fériés",
    keywords: [
      "férié", "fériés", "vacance", "vacances", "jour", "jours", "gabon",
      "calendrier", "date", "dates", "fête", "fêtes", "célébration",
      "national", "religieux", "civile", "gestion", "ajouter", "supprimer",
      "modifier", "initialiser", "année", "années", "2025", "2026", "2027"
    ],
    subsections: [
      { title: "Liste des jours", anchor: "#liste", keywords: ["liste", "voir", "afficher", "calendrier"] },
      { title: "Ajouter", anchor: "#ajouter", keywords: ["ajouter", "nouveau", "créer"] },
      { title: "Initialiser", anchor: "#init", keywords: ["initialiser", "année", "gabon", "défaut"] },
    ],
  },
  {
    title: "Départements",
    href: "/dashboard/settings/departments",
    icon: Building2,
    description: "Gestion des départements",
    keywords: [
      "département", "départements", "service", "services", "organisation",
      "structure", "équipe", "équipes", "unité", "unités", "division",
      "code", "nom", "description", "gestion", "ajouter", "supprimer",
      "modifier", "créer", "éditer", "entreprise", "société"
    ],
    subsections: [
      { title: "Liste", anchor: "#liste", keywords: ["liste", "voir", "afficher"] },
      { title: "Ajouter un département", anchor: "#ajouter", keywords: ["ajouter", "nouveau", "créer"] },
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
    subsections: [
      { title: "Liste des utilisateurs", anchor: "#liste", keywords: ["liste", "voir", "afficher", "tableau"] },
      { title: "Ajouter un utilisateur", anchor: "#ajouter", keywords: ["ajouter", "nouveau", "créer", "inviter"] },
      { title: "Rôles et permissions", anchor: "#roles", keywords: ["rôle", "permission", "accès", "admin", "hr"] },
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

  // Filtrer les items selon la recherche (avec support des subsections)
  const filteredNavigation = useMemo(() => {
    if (!searchQuery.trim()) return roleFilteredNavigation.map(item => ({ ...item, matchedSubsection: null }));

    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(word => word.length > 0);

    return roleFilteredNavigation
      .map((item) => {
        // Recherche dans le titre
        const titleMatch = item.title.toLowerCase().includes(query);

        // Recherche dans la description
        const descriptionMatch = item.description.toLowerCase().includes(query);

        // Recherche dans les mots-clés principaux
        const keywords = item.keywords || [];
        const keywordMatch = keywords.some(keyword =>
          keyword.toLowerCase().includes(query) ||
          queryWords.some(word => keyword.toLowerCase().includes(word))
        );

        // Recherche dans les subsections
        const subsections = item.subsections || [];
        const matchedSubsection = subsections.find(sub => {
          const subKeywords = sub.keywords || [];
          return sub.title.toLowerCase().includes(query) ||
            subKeywords.some(kw =>
              kw.toLowerCase().includes(query) ||
              queryWords.some(word => kw.toLowerCase().includes(word))
            );
        });

        // Recherche par mots individuels
        const allWordsMatch = queryWords.every(word =>
          item.title.toLowerCase().includes(word) ||
          item.description.toLowerCase().includes(word) ||
          keywords.some(keyword => keyword.toLowerCase().includes(word)) ||
          subsections.some(sub =>
            sub.title.toLowerCase().includes(word) ||
            sub.keywords?.some(kw => kw.toLowerCase().includes(word))
          )
        );

        const matches = titleMatch || descriptionMatch || keywordMatch || !!matchedSubsection || allWordsMatch;

        return matches ? { ...item, matchedSubsection: matchedSubsection || null } : null;
      })
      .filter(Boolean) as (typeof roleFilteredNavigation[0] & { matchedSubsection: { title: string; anchor: string } | null })[];
  }, [roleFilteredNavigation, searchQuery]);

  // Déterminer l'item actif
  const getActiveItem = () => {
    // Vérifier directement les routes de page
    if (pathname.startsWith("/dashboard/settings/profile")) return "/dashboard/settings/profile";
    if (pathname.startsWith("/dashboard/settings/users")) return "/dashboard/settings/users";
    if (pathname.startsWith("/dashboard/settings/reminders")) return "/dashboard/settings/reminders";
    if (pathname.startsWith("/dashboard/settings/notifications")) return "/dashboard/settings/notifications";
    if (pathname.startsWith("/dashboard/settings/holidays")) return "/dashboard/settings/holidays";
    if (pathname.startsWith("/dashboard/settings/departments")) return "/dashboard/settings/departments";
    if (pathname.startsWith("/dashboard/settings/general")) return "/dashboard/settings/general";

    // Par défaut, profil
    return "/dashboard/settings/profile";
  };

  const activeHref = getActiveItem();

  return (
    <div className="flex flex-col lg:flex-row min-h-full -m-3 sm:-m-4 lg:-m-6">
      {/* Navigation latérale - Fixe sur desktop */}
      <aside className="w-full lg:w-64 lg:fixed lg:top-16 lg:left-[var(--sidebar-width)] lg:bottom-0 shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-border bg-background z-20">
        {/* Barre de recherche */}
        <div className="p-3 sm:p-4 shrink-0">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 bg-muted/50 border-border focus:ring-1 focus:ring-primary/20 focus:bg-background transition-all"
            />
          </div>
        </div>
        <Separator />
        {/* Navigation - Défilable */}
        <ScrollArea className="flex-1">
          <nav className="py-2">
            {filteredNavigation.length > 0 ? (
              filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === activeHref ||
                  pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200",
                      "hover:bg-muted/50",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {/* Ligne indicatrice à gauche */}
                    <span className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full transition-all duration-200",
                      isActive ? "bg-foreground" : "bg-transparent group-hover:bg-muted-foreground/30"
                    )} />

                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-opacity duration-200",
                      isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                    )} />

                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-medium transition-colors duration-200",
                        isActive ? "text-foreground" : ""
                      )}>
                        {item.title}
                        {item.matchedSubsection && searchQuery && (
                          <span className="text-muted-foreground font-normal"> › {item.matchedSubsection.title}</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground/70 truncate">
                        {item.matchedSubsection && searchQuery
                          ? `Dans : ${item.matchedSubsection.title}`
                          : item.description
                        }
                      </div>
                    </div>

                    <ChevronRight className={cn(
                      "h-4 w-4 shrink-0 transition-all duration-200",
                      isActive
                        ? "opacity-70"
                        : "opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0"
                    )} />
                  </Link>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucun résultat trouvé
              </div>
            )}
          </nav>
        </ScrollArea>
      </aside>


      {/* Contenu principal - Décalé à gauche pour la sidebar fixe */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:ml-64 pb-8">
        {children}
      </div>
    </div>
  );
}
