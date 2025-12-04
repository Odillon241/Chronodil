"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NotificationItem } from "./notification-item";
import { markAsRead, markAllAsRead, deleteNotification } from "@/actions/notification.actions";
import { useRouter } from "next/navigation";

interface NotificationListProps {
  initialNotifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date | string;
    link?: string | null;
  }>;
}

export function NotificationList({ initialNotifications }: NotificationListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const unreadCount = useMemo(
    () => initialNotifications.filter((n) => !n.isRead).length,
    [initialNotifications]
  );

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? initialNotifications.map((n) => n.id) : []);
  }, [initialNotifications]);

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id)
    );
  }, []);

  const handleMarkAsRead = useCallback(async (id: string) => {
    startTransition(async () => {
      try {
        const result = await markAsRead({ id });
        if (result?.data) {
          router.refresh();
        }
      } catch (error) {
        toast.error("Erreur lors de la mise à jour");
      }
    });
  }, [router]);

  const handleMarkAllAsRead = useCallback(async () => {
    startTransition(async () => {
      try {
        const result = await markAllAsRead({});
        if (result?.data) {
          toast.success("Toutes les notifications marquées comme lues");
          router.refresh();
        }
      } catch (error) {
        toast.error("Erreur lors de la mise à jour");
      }
    });
  }, [router]);

  const handleDelete = useCallback(async (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteNotification({ id });
        if (result?.data) {
          toast.success("Notification supprimée");
          router.refresh();
        }
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    });
  }, [router]);

  const handleMarkSelectedAsRead = useCallback(async () => {
    startTransition(async () => {
      try {
        await Promise.all(selectedIds.map((id) => markAsRead({ id })));
        toast.success(
          `${selectedIds.length} notification${selectedIds.length > 1 ? "s" : ""} marquée${
            selectedIds.length > 1 ? "s" : ""
          } comme lue${selectedIds.length > 1 ? "s" : ""}`
        );
        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la mise à jour");
      }
    });
  }, [selectedIds, router]);

  const handleDeleteSelected = useCallback(async () => {
    startTransition(async () => {
      try {
        await Promise.all(selectedIds.map((id) => deleteNotification({ id })));
        toast.success(
          `${selectedIds.length} notification${selectedIds.length > 1 ? "s" : ""} supprimée${
            selectedIds.length > 1 ? "s" : ""
          }`
        );
        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    });
  }, [selectedIds, router]);

  const allSelected = initialNotifications.length > 0 && selectedIds.length === initialNotifications.length;

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {selectedIds.length > 0 ? (
            `${selectedIds.length} notification${
              selectedIds.length > 1 ? "s" : ""
            } sélectionnée${selectedIds.length > 1 ? "s" : ""}`
          ) : unreadCount > 0 ? (
            `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${
              unreadCount > 1 ? "s" : ""
            }`
          ) : (
            "Aucune notification non lue"
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          {selectedIds.length > 0 ? (
            <>
              <Button
                variant="outline"
                onClick={handleMarkSelectedAsRead}
                disabled={isPending}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <CheckCheck className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Marquer comme lu
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteSelected}
                disabled={isPending}
                className="w-full sm:w-auto text-xs sm:text-sm text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Supprimer
              </Button>
            </>
          ) : (
            unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <CheckCheck className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Tout marquer comme lu
              </Button>
            )
          )}
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {/* Select All Checkbox */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Sélectionner tout"
              />
              <span className="text-sm text-muted-foreground">
                Sélectionner tout
              </span>
            </div>
          </div>

          {/* Notification Items */}
          <div className="divide-y">
            {initialNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isSelected={selectedIds.includes(notification.id)}
                onSelect={(checked) => handleSelectOne(notification.id, checked)}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                onDelete={() => handleDelete(notification.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
