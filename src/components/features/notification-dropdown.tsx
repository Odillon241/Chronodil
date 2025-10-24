"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Info, AlertCircle, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { SpinnerCustom } from "@/components/features/loading-spinner";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "@/actions/notification.actions";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadUnreadCount = async () => {
    try {
      const result = await getUnreadCount({});
      if (result?.data !== undefined) {
        setUnreadCount(result.data);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await getMyNotifications({ limit: 5 });
      if (result?.data) {
        setNotifications(result.data as Notification[]);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Erreur lors du chargement des notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await markAsRead({ id });
      if (result?.data) {
        loadNotifications();
        loadUnreadCount();
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllAsRead({});
      if (result?.data) {
        toast.success("Toutes les notifications marquées comme lues");
        loadNotifications();
        loadUnreadCount();
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead({ id: notification.id });
    }
    if (notification.link) {
      router.push(notification.link);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <SpinnerCustom />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  !notification.isRead ? "bg-muted/50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-1">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="h-auto p-1 shrink-0"
                        >
                          <CheckCheck className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.createdAt), "dd MMM HH:mm", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            router.push("/dashboard/notifications");
            setIsOpen(false);
          }}
          className="cursor-pointer justify-center text-center"
        >
          <span className="text-sm font-medium text-primary flex items-center gap-1">
            Voir toutes les notifications
            <ArrowRight className="h-3 w-3" />
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
