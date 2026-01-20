"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/translations";
import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  CheckSquare,
  Calendar,
  Users,
  Settings,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  User,
  ListTodo,
  Shield,
  FileText,
  MessageSquare,
  BarChart3,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useSession, signOut } from "@/lib/auth-client";
import { useChatUnreadCount } from "@/hooks/use-chat-unread-count";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = React.useState<string[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const t = useT();
  const { unreadCount: chatUnread } = useChatUnreadCount();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Navigation items - créés de manière statique pour éviter les différences d'hydratation
  const navMain = React.useMemo(() => [
    {
      title: t("navigation.dashboard"),
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("navigation.hrTimesheets"),
      url: "/dashboard/hr-timesheet",
      icon: FileText,
    },
    {
      title: t("navigation.projects"),
      url: "/dashboard/projects",
      icon: FolderKanban,
    },
    {
      title: t("navigation.tasks"),
      url: "/dashboard/tasks",
      icon: ListTodo,
    },
  ], [t]);

  const navSecondary = React.useMemo(() => [
    {
      title: t("navigation.chat"),
      url: "/dashboard/chat",
      icon: MessageSquare,
    },
    {
      title: t("navigation.reports"),
      url: "/dashboard/reports",
      icon: BarChart3,
    },
  ], [t]);

  const navSettings = React.useMemo(() => [
    {
      title: t("navigation.settings"),
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: "Audit",
      url: "/dashboard/audit",
      icon: Shield,
      roles: ["ADMIN"],
    },
  ], [t]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/auth/login";
  };
  // Filtrer les items de navigation de manière cohérente côté serveur et client
  // Utiliser 'mounted' pour éviter les différences d'hydratation
  const filteredNavMain = React.useMemo(() => {
    // Sur le serveur (mounted=false), afficher tous les items pour éviter l'hydratation mismatch
    if (!mounted) return navMain;

    return navMain.filter((item: any) => {
      if (!item.roles) return true;
      return (session?.user as any)?.role && item.roles.includes((session?.user as any)?.role);
    });
  }, [navMain, session, mounted]);

  const filteredNavSettings = React.useMemo(() => {
    // Sur le serveur (mounted=false), afficher tous les items pour éviter l'hydratation mismatch
    if (!mounted) return navSettings;

    return navSettings.filter((item: any) => {
      if (!item.roles) return true;
      return (session?.user as any)?.role && item.roles.includes((session?.user as any)?.role);
    });
  }, [navSettings, session, mounted]);


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border h-14 sm:h-16 flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        <SidebarMenu className="w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:w-8! group-data-[collapsible=icon]:justify-center!">
              <Link href="/dashboard" className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image
                    src="/assets/media/chronodil-icon.svg"
                    alt="Chronodil"
                    width={32}
                    height={32}
                    className="size-8"
                    priority
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">Chronodil</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t("navigation.timesheets")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.dashboard")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu suppressHydrationWarning>
              {filteredNavMain.map((item) => {
                // Utiliser une logique d'activation plus stable pour éviter les différences d'hydratation
                const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"));
                const hasItems = (item as any).items && (item as any).items.length > 0;
                const isOpen = openMenus.includes(item.title);

                return (
                  <SidebarMenuItem key={item.title}>
                    {hasItems ? (
                      <>
                        <SidebarMenuButton
                          onClick={() => toggleMenu(item.title)}
                          tooltip={item.title}
                          isActive={isActive}
                        >
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight
                            className={`ml-auto transition-transform ${isOpen ? "rotate-90" : ""
                              }`}
                          />
                        </SidebarMenuButton>
                        {isOpen && (
                          <SidebarMenuSub>
                            {(item as any).items?.map((subItem: any) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.url}
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        )}
                      </>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive && item.url !== "/dashboard"}
                        className={
                          isActive && item.url === "/dashboard"
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 *:text-white"
                            : ""
                        }
                      >
                        <Link href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.chatReports")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu suppressHydrationWarning>
              {navSecondary.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <Link href={item.url} className="flex items-center gap-2">
                        {item.icon && <item.icon />}
                        <span className="flex w-full items-center gap-2">
                          <span className="truncate">{item.title}</span>
                          {item.url === "/dashboard/chat" && chatUnread > 0 && (
                            <Badge
                              variant="outline"
                              className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full border-primary/40 bg-primary/10 text-[11px] font-semibold text-primary ${chatUnread < 10 ? "p-0" : "px-1"}`}
                            >
                              {chatUnread > 99 ? "99+" : chatUnread}
                            </Badge>
                          )}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu suppressHydrationWarning>
              {filteredNavSettings.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className={
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : ""
                      }
                    >
                      <Link href={item.url}>
                        {item.icon && <item.icon />}
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

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu suppressHydrationWarning>
          <SidebarMenuItem>
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <UserAvatar
                      name={(session?.user as any)?.name}
                      avatar={(session?.user as any)?.avatar}
                      size="sm"
                    />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {session?.user?.name || t("common.name")}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {session?.user?.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <UserAvatar
                        name={(session?.user as any)?.name}
                        avatar={(session?.user as any)?.avatar}
                        size="sm"
                      />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {session?.user?.name || t("common.name")}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {session?.user?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings/profile">
                      <User className="mr-2 h-4 w-4" />
                      {t("navigation.profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("navigation.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                suppressHydrationWarning
              >
                <UserAvatar size="sm" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold" suppressHydrationWarning>
                    {t("common.name")}
                  </span>
                  <span className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                    {""}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
