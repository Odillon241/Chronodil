"use client";

import { ReactNode, useState, useEffect } from "react";
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
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";

const settingsNavigation = [
  {
    title: "Profil",
    href: "/dashboard/settings/profile",
    icon: User,
    description: "Informations personnelles",
  },
  {
    title: "Notifications",
    href: "/dashboard/settings?tab=notifications",
    icon: Bell,
    description: "Préférences de notification",
  },
  {
    title: "Rappels",
    href: "/dashboard/settings/reminders",
    icon: Calendar,
    description: "Rappels de saisie de temps",
  },
  {
    title: "Général",
    href: "/dashboard/settings?tab=general",
    icon: Settings,
    description: "Apparence et accessibilité",
  },
  {
    title: "Jours fériés",
    href: "/dashboard/settings?tab=holidays",
    icon: Calendar,
    description: "Gestion des jours fériés",
  },
  {
    title: "Départements",
    href: "/dashboard/settings?tab=departments",
    icon: Building2,
    description: "Gestion des départements",
  },
  {
    title: "Utilisateurs",
    href: "/dashboard/settings/users",
    icon: Users,
    description: "Gestion des utilisateurs",
    roles: ["ADMIN", "DIRECTEUR", "HR"],
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filtrer les items selon le rôle
  const filteredNavigation = mounted
    ? settingsNavigation.filter((item) => {
        if (!item.roles) return true;
        const userRole = (session?.user as any)?.role;
        return userRole && item.roles.includes(userRole);
      })
    : settingsNavigation;

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
      {/* Navigation latérale */}
      <aside className="w-full lg:w-64 shrink-0">
        <ScrollArea className="h-full">
          <nav className="space-y-1 p-1">
            {filteredNavigation.map((item) => {
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
            })}
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
