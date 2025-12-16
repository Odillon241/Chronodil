"use client";

import { Suspense, useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationDropdown } from "@/components/features/notification-dropdown";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { DynamicBreadcrumb } from "@/components/features/dynamic-breadcrumb";
import { CommandPalette } from "@/components/features/command-palette";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Input } from "@/components/ui/input";
import { registerServiceWorker } from "@/lib/service-worker-registration";
import { usePresenceTracker } from "@/hooks/use-presence-tracker";

function SearchBar() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  return (
    <div className="relative w-full group">
      <Input
        type="text"
        placeholder="Rechercher..."
        className="pr-20 h-9 cursor-pointer"
        onClick={() => {
          const event = new CustomEvent("open-search");
          document.dispatchEvent(event);
        }}
        readOnly
      />
      <kbd className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        {isMac ? (
          <>
            <span className="text-xs">⌘</span>
            <span className="text-xs">+</span>
            <span className="text-xs">K</span>
          </>
        ) : (
          <>
            <span className="text-xs">Ctrl</span>
            <span className="text-xs">+</span>
            <span className="text-xs">K</span>
          </>
        )}
      </kbd>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Tracker la présence de l'utilisateur (met à jour lastSeenAt en DB)
  usePresenceTracker();

  // Enregistrer le service worker au chargement du dashboard
  useEffect(() => {
    registerServiceWorker({
      onSuccess: (registration) => {
        console.log("[Service Worker] Enregistré avec succès dans le dashboard");
      },
      onError: (error) => {
        console.warn("[Service Worker] Erreur d'enregistrement:", error);
      },
    });
  }, []);

  return (
    <QueryProvider>
      <SettingsProvider>
        <SidebarProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <AppSidebar />
          </Suspense>
          <SidebarInset className="flex flex-col h-screen overflow-hidden">
            <header className="sticky top-0 z-10 flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 sm:mr-2 h-4" />
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <Suspense fallback={<div>Loading...</div>}>
                  <DynamicBreadcrumb />
                </Suspense>
              </div>
              <div className="hidden md:flex items-center gap-2 max-w-md mx-4">
                <SearchBar />
              </div>
              <div className="flex items-center gap-2">
                <ThemeSwitcher />
                <Suspense fallback={<div>Loading...</div>}>
                  <NotificationDropdown />
                </Suspense>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto flex flex-col gap-4 p-3 sm:p-4 lg:gap-6 lg:p-6">
              {children}
            </main>
          </SidebarInset>
          <Suspense fallback={null}>
            <CommandPalette />
          </Suspense>
        </SidebarProvider>
      </SettingsProvider>
    </QueryProvider>
  );
}
