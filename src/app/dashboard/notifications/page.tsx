
import { Suspense } from "react";
import { Bell, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuietHoursSettings } from "@/components/features/quiet-hours-settings";
import { NotificationsView } from "./notifications-view";
import NotificationsLoading from "./loading"; // Assuming loading.tsx exports a component
import { getMyNotifications } from "@/actions/notification.actions";

// Server Component Wrapper
async function NotificationsData() {
  const result = await getMyNotifications({});
  const notifications = result?.data || [];

  return <NotificationsView initialNotifications={notifications} />;
}

// Main Page Component
export default async function NotificationsPage() {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Page Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos notifications et configurez vos préférences
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 w-fit bg-muted/50 p-1">
          <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-background px-4">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-background px-4">
            <Settings className="h-4 w-4" />
            <span>Heures calmes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="flex-1 mt-4 min-h-0 relative">
          <Suspense fallback={<NotificationsLoading />}>
            <NotificationsData />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <QuietHoursSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
