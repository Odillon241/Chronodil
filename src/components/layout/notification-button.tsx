"use client";

import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationSound } from "@/hooks/use-notification-sound";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: Date;
}

interface NotificationButtonProps {
  notifications?: Notification[];
  unreadCount?: number;
  onNotificationClick?: (id: string) => void;
  onMarkAllRead?: () => void;
}

export function NotificationButton({
  notifications = [],
  unreadCount = 0,
  onNotificationClick,
  onMarkAllRead,
}: NotificationButtonProps) {
  const { playSound, soundEnabled } = useNotificationSound();
  const previousUnreadCountRef = useRef(unreadCount);

  // Jouer un son lorsqu'une nouvelle notification arrive
  useEffect(() => {
    if (unreadCount > previousUnreadCountRef.current && soundEnabled) {
      playSound('notification');
    }
    previousUnreadCountRef.current = unreadCount;
  }, [unreadCount, soundEnabled, playSound]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllRead}
              className="h-auto p-0 text-xs font-normal text-primary"
            >
              Tout marquer comme lu
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`cursor-pointer flex flex-col items-start gap-1 p-3 ${
                  !notification.isRead ? "bg-muted/50" : ""
                }`}
                onClick={() => onNotificationClick?.(notification.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium text-sm">{notification.title}</span>
                  {!notification.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {notification.message}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
