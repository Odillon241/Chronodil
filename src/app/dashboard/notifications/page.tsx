import { Suspense } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/features/page-header";
import { EmptyState } from "@/components/features/empty-state";
import { NotificationList } from "@/components/features/notifications/notification-list";
import { NotificationFilters } from "@/components/features/notifications/notification-filters";
import { QuietHoursSettings } from "@/components/features/quiet-hours-settings";
import { getMyNotifications } from "@/actions/notification.actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

interface NotificationsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    type?: string;
  }>;
}

async function NotificationsContent({
  searchParams,
}: {
  searchParams: Awaited<NotificationsPageProps["searchParams"]>;
}) {
  const result = await getMyNotifications({});
  const notifications = result?.data || [];

  // Apply filters
  const { search = "", status = "all", type = "all" } = searchParams;

  const filteredNotifications = notifications.filter((notification) => {
    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchesSearch =
        notification.title?.toLowerCase().includes(query) ||
        notification.message?.toLowerCase().includes(query) ||
        notification.type?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (status !== "all") {
      if (status === "read" && !notification.isRead) return false;
      if (status === "unread" && notification.isRead) return false;
    }

    // Type filter
    if (type !== "all" && notification.type !== type) {
      return false;
    }

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <NotificationFilters resultCount={filteredNotifications.length} />

      <Separator />

      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={search ? "Aucun résultat trouvé" : "Aucune notification"}
          description={
            search
              ? "Essayez avec d'autres mots-clés"
              : "Vous serez notifié ici des événements importants"
          }
        />
      ) : (
        <NotificationList initialNotifications={filteredNotifications} />
      )}
    </>
  );
}

function NotificationsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
      </div>
      <Separator />
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <Skeleton className="h-5 w-32" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0 space-y-3">
              <div className="flex gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-3/4 ml-9" />
              <Skeleton className="h-3 w-1/2 ml-9" />
              <div className="flex justify-between ml-9">
                <Skeleton className="h-3 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  // Await searchParams as required in Next.js 15+
  const resolvedSearchParams = await searchParams;

  // Get unread count for the badge (separate query for optimization)
  const result = await getMyNotifications({});
  const notifications = result?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Notifications"
        description="Gérez vos notifications et configurez vos préférences"
      />

      <Separator />

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Heures calmes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-4">
          <Suspense fallback={<NotificationsLoadingSkeleton />}>
            <NotificationsContent searchParams={resolvedSearchParams} />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <QuietHoursSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
