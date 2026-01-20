"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NotificationItem } from "./notification-item";
import { markAsRead, markAllAsRead, deleteNotification } from "@/actions/notification.actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
      } catch {
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
      } catch {
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
      } catch {
        toast.error("Erreur lors de la suppression");
      }
    });
  }, [router]);

  const handleMarkSelectedAsRead = useCallback(async () => {
    startTransition(async () => {
      try {
        await Promise.all(selectedIds.map((id) => markAsRead({ id })));
        toast.success(
          `${selectedIds.length} notification${selectedIds.length > 1 ? "s" : ""} marquée${selectedIds.length > 1 ? "s" : ""
          } comme lue${selectedIds.length > 1 ? "s" : ""}`
        );
        setSelectedIds([]);
        router.refresh();
      } catch {
        toast.error("Erreur lors de la mise à jour");
      }
    });
  }, [selectedIds, router]);

  const handleDeleteSelected = useCallback(async () => {
    startTransition(async () => {
      try {
        await Promise.all(selectedIds.map((id) => deleteNotification({ id })));
        toast.success(
          `${selectedIds.length} notification${selectedIds.length > 1 ? "s" : ""} supprimée${selectedIds.length > 1 ? "s" : ""
          }`
        );
        setSelectedIds([]);
        router.refresh();
      } catch {
        toast.error("Erreur lors de la suppression");
      }
    });
  }, [selectedIds, router]);

  const allSelected = initialNotifications.length > 0 && selectedIds.length === initialNotifications.length;

  return (
    <Card className="overflow-hidden border shadow-none bg-muted/20">
      {/* Header */}
      <CardHeader className="py-4 border-b bg-background/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold">Notifications</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {initialNotifications.length}
            </Badge>
            {unreadCount > 0 && (
              <Badge className="text-xs bg-primary/90">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 ? (
              <>
                <span className="text-xs text-muted-foreground">
                  {selectedIds.length} sélectionnée{selectedIds.length > 1 ? "s" : ""}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkSelectedAsRead}
                  disabled={isPending}
                  className="h-8 text-xs"
                >
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                  Marquer lu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={isPending}
                  className="h-8 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Supprimer
                </Button>
              </>
            ) : (
              unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isPending}
                  className="h-8 text-xs"
                >
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                  Tout marquer comme lu
                </Button>
              )
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 bg-background/40">
        {/* Select All */}
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-3">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Sélectionner tout"
          />
          <span className="text-xs text-muted-foreground">
            Sélectionner tout
          </span>
        </div>

        {/* Notification Items */}
        <div className="divide-y divide-border/50">
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
  );
}
