"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bell, CheckCheck, Trash2, Info, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/actions/notification.actions";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await getMyNotifications({});
      if (result?.data) {
        setNotifications(result.data);
        // Reset selections after reload
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const result = await markAsRead({ id });
      if (result?.data) {
        loadNotifications();
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
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteNotification({ id });
      if (result?.data) {
        toast.success("Notification supprimée");
        loadNotifications();
      }
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(notifications.map((n) => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleMarkSelectedAsRead = async () => {
    try {
      await Promise.all(selectedIds.map((id) => markAsRead({ id })));
      toast.success(`${selectedIds.length} notification${selectedIds.length > 1 ? "s" : ""} marquée${selectedIds.length > 1 ? "s" : ""} comme lue${selectedIds.length > 1 ? "s" : ""}`);
      setSelectedIds([]);
      loadNotifications();
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(selectedIds.map((id) => deleteNotification({ id })));
      toast.success(`${selectedIds.length} notification${selectedIds.length > 1 ? "s" : ""} supprimée${selectedIds.length > 1 ? "s" : ""}`);
      setSelectedIds([]);
      loadNotifications();
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    const variants: { [key: string]: string } = {
      success: "bg-green-100 text-green-800 hover:bg-green-100",
      error: "bg-red-100 text-red-800 hover:bg-red-100",
      warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      info: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    };
    
    return variants[type] || variants.info;
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const allSelected = notifications.length > 0 && selectedIds.length === notifications.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < notifications.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {selectedIds.length > 0 ? (
              `${selectedIds.length} notification${selectedIds.length > 1 ? "s" : ""} sélectionnée${selectedIds.length > 1 ? "s" : ""}`
            ) : unreadCount > 0 ? (
              `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
            ) : (
              "Aucune notification non lue"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 ? (
            <>
              <Button
                variant="outline"
                onClick={handleMarkSelectedAsRead}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Marquer comme lu
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteSelected}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </>
          ) : (
            unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Tout marquer comme lu
              </Button>
            )
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rusty-red"></div>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Aucune notification
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Vous serez notifié ici des événements importants
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Sélectionner tout"
                      className={someSelected ? "data-[state=checked]:bg-muted" : ""}
                    />
                  </TableHead>
                  <TableHead className="w-[50px]">Type</TableHead>
                  <TableHead className="w-[60px]">Statut</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={!notification.isRead ? "bg-muted/30" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(notification.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(notification.id, checked as boolean)
                        }
                        aria-label={`Sélectionner ${notification.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {!notification.isRead && (
                        <Badge variant="default" className="bg-rusty-red hover:bg-rusty-red">
                          Nouveau
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {notification.title}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="space-y-1">
                        <p className="text-sm">{notification.message}</p>
                        {notification.link && (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs"
                            onClick={() => window.location.href = notification.link}
                          >
                            Voir plus →
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(notification.createdAt), "dd MMM yyyy", {
                        locale: fr,
                      })}
                      <br />
                      <span className="text-xs">
                        {format(new Date(notification.createdAt), "HH:mm", {
                          locale: fr,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Marquer comme lu"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          title="Supprimer"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
