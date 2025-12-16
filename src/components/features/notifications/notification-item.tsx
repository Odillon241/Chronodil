"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCheck, Trash2, Info, AlertCircle, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date | string;
    link?: string | null;
  };
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

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

export const NotificationItem = memo(function NotificationItem({
  notification,
  isSelected,
  onSelect,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const date = typeof notification.createdAt === "string"
    ? new Date(notification.createdAt)
    : notification.createdAt;

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    // Marquer comme lu automatiquement quand on ouvre les détails
    if (!notification.isRead) {
      onMarkAsRead();
    }
  };

  const handleGoToLink = () => {
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <>
      <div
        className={cn(
          "p-4 space-y-3 transition-all cursor-pointer hover:bg-muted/50",
          !notification.isRead && "bg-muted/30"
        )}
        onClick={handleOpenDialog}
      >
        {/* Header with checkbox and status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              aria-label={`Sélectionner ${notification.title}`}
              className="mt-0.5"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center gap-2">
              {getNotificationIcon(notification.type)}
              {!notification.isRead && (
                <Badge variant="default" className="bg-primary hover:bg-primary text-xs">
                  Nouveau
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="pl-9">
          <h3 className="font-medium text-sm leading-tight">
            {notification.title}
          </h3>
        </div>

        {/* Message */}
        <div className="pl-9 space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <Button
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog();
            }}
          >
            Voir plus →
          </Button>
        </div>

        {/* Date and Actions */}
        <div className="pl-9 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-muted-foreground">
            {format(date, "dd MMM yyyy 'à' HH:mm", {
              locale: fr,
            })}
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {!notification.isRead && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAsRead}
                className="flex-1 sm:flex-none text-xs"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Lu
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="flex-1 sm:flex-none text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog pour afficher les détails complets */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              {getNotificationIcon(notification.type)}
              <DialogTitle>{notification.title}</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {format(date, "EEEE dd MMMM yyyy 'à' HH:mm", {
                locale: fr,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Message</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {notification.message}
              </p>
            </div>

            {notification.link && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Lien associé</h4>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleGoToLink}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Accéder à la page
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t">
              <Badge variant={notification.isRead ? "secondary" : "default"}>
                {notification.isRead ? "Lu" : "Non lu"}
              </Badge>
              <Badge variant="outline">{notification.type}</Badge>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {!notification.isRead && (
              <Button
                variant="outline"
                onClick={() => {
                  onMarkAsRead();
                  setIsDialogOpen(false);
                }}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Marquer comme lu
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => {
                onDelete();
                setIsDialogOpen(false);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
