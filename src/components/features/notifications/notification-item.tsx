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
import { CheckCheck, Trash2, Info, AlertCircle, CheckCircle, XCircle, ExternalLink, Eye } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
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

const NOTIFICATION_STYLES: Record<string, { icon: typeof Info; color: string; bgColor: string }> = {
  success: { icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  error: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  warning: { icon: AlertCircle, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  info: { icon: Info, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
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

  const style = NOTIFICATION_STYLES[notification.type] || NOTIFICATION_STYLES.info;
  const Icon = style.icon;

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
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
          "flex items-start gap-4 p-4 transition-all cursor-pointer group",
          "hover:bg-muted/40",
          !notification.isRead && "bg-primary/5"
        )}
        onClick={handleOpenDialog}
      >
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          aria-label={`Sélectionner ${notification.title}`}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Icon */}
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", style.bgColor)}>
          <Icon className={cn("h-5 w-5", style.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn(
              "font-medium text-sm leading-tight truncate",
              !notification.isRead && "font-semibold"
            )}>
              {notification.title}
            </h3>
            {!notification.isRead && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/90 hover:bg-primary">
                Nouveau
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {formatDistanceToNow(date, { addSuffix: true, locale: fr })}
          </p>
        </div>

        {/* Actions - visible on hover */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleOpenDialog}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onMarkAsRead}
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", style.bgColor)}>
                <Icon className={cn("h-5 w-5", style.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-left">{notification.title}</DialogTitle>
                <DialogDescription className="text-left">
                  {format(date, "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {notification.message}
              </p>
            </div>

            {notification.link && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleGoToLink}
              >
                <ExternalLink className="h-4 w-4" />
                Accéder à la page
              </Button>
            )}

            <div className="flex items-center gap-2 pt-2 border-t">
              <Badge variant={notification.isRead ? "secondary" : "default"} className="text-xs">
                {notification.isRead ? "Lu" : "Non lu"}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {notification.type}
              </Badge>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {!notification.isRead && (
              <Button
                variant="outline"
                size="sm"
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
              size="sm"
              onClick={() => {
                onDelete();
                setIsDialogOpen(false);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
