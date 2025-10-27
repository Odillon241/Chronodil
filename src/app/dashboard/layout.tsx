import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationDropdown } from "@/components/features/notification-dropdown";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { DynamicBreadcrumb } from "@/components/features/dynamic-breadcrumb";
import { CommandPalette } from "@/components/features/command-palette";
import { SettingsProvider } from "@/components/providers/settings-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <AppSidebar />
        </Suspense>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 sm:mr-2 h-4" />
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <Suspense fallback={<div>Loading...</div>}>
                <DynamicBreadcrumb />
              </Suspense>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <ModeToggle />
              <Suspense fallback={<div>Loading...</div>}>
                <NotificationDropdown />
              </Suspense>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </SidebarInset>
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </SidebarProvider>
    </SettingsProvider>
  );
}
