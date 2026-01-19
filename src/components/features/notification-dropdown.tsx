"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { useRealtimeChat } from "@/hooks/use-realtime-chat";
import { useNotificationWithSound } from "@/hooks/use-notification-with-sound";
import { useDesktopNotifications } from "@/hooks/use-desktop-notifications";
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
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // Hooks pour les notifications
  const { playNotificationSound, soundEnabled } = useNotificationWithSound();
  const desktop = useDesktopNotifications({
    enabled: true,
    onPlaySound: (soundType) => {
      if (soundEnabled) {
        playNotificationSound(soundType || 'info');
      }
    },
  });

  // Éviter les erreurs d'hydratation en ne rendant le DropdownMenu qu'après le montage
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fonctions de chargement avec useCallback pour éviter les dépendances cycliques
  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadCount({});
      if (result?.data !== undefined) {
        setUnreadCount(result.data);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
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
  }, []);

  // Callback pour gérer les nouvelles notifications en temps réel
  const handleNewNotification = useCallback((notification: any) => {
    console.log('🔔 Nouvelle notification reçue dans le dropdown:', notification);

    // ⚡ MISE À JOUR INSTANTANÉE du compteur (optimistic update)
    setUnreadCount(prev => prev + 1);

    // ⚡ Animation du badge
    setHasNewNotification(true);
    setTimeout(() => setHasNewNotification(false), 2000);

    // Jouer le son si activé
    if (soundEnabled) {
      let soundType: 'success' | 'error' | 'info' | 'warning' = 'info';
      if (notification.type === 'success') soundType = 'success';
      else if (notification.type === 'error') soundType = 'error';
      else if (notification.type === 'warning') soundType = 'warning';
      playNotificationSound(soundType);
    }

    // Afficher notification desktop si activé
    if (desktop.hasPermission && desktop.desktopNotificationsEnabled) {
      desktop.notifyNewNotification(
        notification.title,
        notification.message,
        () => {
          if (notification.link) {
            router.push(notification.link);
          } else {
            router.push('/dashboard');
          }
        }
      );
    }

    // Afficher un toast
    toast.info(notification.title, {
      description: notification.message,
      duration: 5000,
    });

    // Vérifier avec le serveur (pour garder la sync)
    loadUnreadCount();
    if (isOpen) {
      loadNotifications();
    }
  }, [soundEnabled, playNotificationSound, desktop, router, isOpen, loadUnreadCount, loadNotifications]);

  // Hook realtime pour écouter les nouvelles notifications
  // Désactivé tant que la session n'est pas chargée pour éviter les warnings inutiles
  useRealtimeNotifications({
    onNewNotification: handleNewNotification,
    userId: session?.user?.id || '',
    enabled: !!session?.user?.id, // Désactiver tant que userId n'est pas disponible
  });

  // Hook pour écouter quand une conversation est marquée comme lue
  // Cela rafraîchit le compteur de notifications car markAsRead marque aussi les notifs chat comme lues
  useRealtimeChat({
    onConversationChange: useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount]),
    onMessageChange: useCallback(() => { }, []),
    userId: session?.user?.id,
  });

  useEffect(() => {
    if (mounted) {
      loadUnreadCount();
      // Refresh every 30 seconds (fallback si realtime ne fonctionne pas)
      const interval = setInterval(loadUnreadCount, 30000);

      // Écouter l'événement de rafraîchissement des notifications (émis par le chat)
      const handleRefresh = () => {
        loadUnreadCount();
        if (isOpen) {
          loadNotifications();
        }
      };
      window.addEventListener('notifications-refresh', handleRefresh);

      return () => {
        clearInterval(interval);
        window.removeEventListener('notifications-refresh', handleRefresh);
      };
    }
  }, [mounted, loadUnreadCount, isOpen, loadNotifications]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

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

  // Pendant l'hydratation, rendre uniquement le bouton sans le DropdownMenu
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative h-8 w-8" disabled>
        <Bell className="h-4 w-4" />
        <span className="sr-only">Notifications</span>
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0">
          <Bell className={`h-4 w-4 transition-transform ${hasNewNotification ? 'animate-bounce' : ''}`} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary transition-all ${hasNewNotification ? 'animate-pulse scale-110' : ''
                }`}
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
            <Spinner className="size-5" />
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
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.isRead ? "bg-muted/50" : ""
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
