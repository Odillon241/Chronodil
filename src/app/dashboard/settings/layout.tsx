"use client";

import { ReactNode, useMemo, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Settings,
  User,
  Users,
  Bell,
  Calendar,
  Building2,
  Volume2,
} from "lucide-react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = useMemo(() => {
    const items = [
      {
        title: "Général",
        url: "/dashboard/settings",
        icon: Settings,
        exact: true,
      },
      {
        title: "Profil",
        url: "/dashboard/settings/profile",
        icon: User,
      },
      {
        title: "Notifications",
        url: "/dashboard/settings",
        icon: Volume2,
        hash: "#notifications",
      },
      {
        title: "Rappels",
        url: "/dashboard/settings/reminders",
        icon: Bell,
      },
    ];

    // Ajouter les items admin/HR/DIRECTEUR
    if (["ADMIN", "DIRECTEUR", "HR"].includes(userRole || "")) {
      items.push({
        title: "Utilisateurs",
        url: "/dashboard/settings/users",
        icon: Users,
      });
    }

    // Ajouter les items de configuration système
    if (["ADMIN", "DIRECTEUR", "HR"].includes(userRole || "")) {
      items.push(
        {
          title: "Jours fériés",
          url: "/dashboard/settings",
          icon: Calendar,
          hash: "#holidays",
        },
        {
          title: "Départements",
          url: "/dashboard/settings",
          icon: Building2,
          hash: "#departments",
        }
      );
    }

    return items;
  }, [userRole]);

  const isActive = (url: string, exact?: boolean, hash?: string) => {
    if (!mounted) return false;
    
    if (hash) {
      const currentHash = typeof window !== "undefined" ? window.location.hash : "";
      return pathname === url.split("#")[0] && currentHash === hash;
    }
    if (exact) {
      return pathname === url;
    }
    return pathname.startsWith(url);
  };

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.includes("#")) {
      e.preventDefault();
      const [path, hash] = href.split("#");
      router.push(path);
      setTimeout(() => {
        const element = document.querySelector(`#${hash}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  return (
    <div className="flex h-full w-full">
      <Sidebar className="border-r" collapsible="icon">
        <SidebarHeader className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Paramètres</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Configuration de l'application
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const active = isActive(item.url, item.exact, item.hash);
                  const href = item.hash ? `${item.url}${item.hash}` : item.url;
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                      >
                        <Link href={href} onClick={(e) => handleHashClick(e, href)}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
