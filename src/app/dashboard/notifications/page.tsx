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
import { Bell, CheckCheck, Trash2, Info, AlertCircle, CheckCircle, XCircle, Filter, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { SearchBar } from "@/components/features/search-bar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
      setSelectedIds(filteredNotifications.map((n) => n.id));
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

  // Filtrer les notifications selon la recherche et les filtres
  const filteredNotifications = notifications.filter((notification) => {
    // Filtre de recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        notification.title?.toLowerCase().includes(query) ||
        notification.message?.toLowerCase().includes(query) ||
        notification.type?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Filtre par statut (lu/non lu)
    if (filterStatus !== "all") {
      if (filterStatus === "read" && !notification.isRead) return false;
      if (filterStatus === "unread" && notification.isRead) return false;
    }

    // Filtre par type
    if (filterType !== "all" && notification.type !== filterType) {
      return false;
    }

    return true;
  });

  const hasActiveFilters = filterStatus !== "all" || filterType !== "all";
  const activeFiltersCount = (filterStatus !== "all" ? 1 : 0) + (filterType !== "all" ? 1 : 0);

  const handleClearFilters = () => {
    setFilterStatus("all");
    setFilterType("all");
    setIsFilterOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {selectedIds.length > 0 ? (
              `${selectedIds.length} notification${selectedIds.length > 1 ? "s" : ""} sélectionnée${selectedIds.length > 1 ? "s" : ""}`
            ) : unreadCount > 0 ? (
              `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
            ) : (
              "Aucune notification non lue"
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          {selectedIds.length > 0 ? (
            <>
              <Button
                variant="outline"
                onClick={handleMarkSelectedAsRead}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <CheckCheck className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Marquer comme lu
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteSelected}
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
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <CheckCheck className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Tout marquer comme lu
              </Button>
            )
          )}
        </div>
      </div>

      <Separator />

      {/* Barre de recherche et filtre */}
      <div className="flex items-center gap-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher dans les notifications..."
          className="w-full sm:w-auto flex-1"
        />
        
        {/* Bouton filtre */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 relative">
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Filtres</Label>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-xs"
                    onClick={handleClearFilters}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Effacer
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-status">Statut</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="filter-status">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="unread">Non lues</SelectItem>
                    <SelectItem value="read">Lues</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-type">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger id="filter-type">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="success">Succès</SelectItem>
                    <SelectItem value="warning">Avertissement</SelectItem>
                    <SelectItem value="error">Erreur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {searchQuery && (
          <p className="text-sm text-muted-foreground hidden sm:block">
            {filteredNotifications.length} résultat{filteredNotifications.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner className="size-5" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              {searchQuery ? "Aucun résultat trouvé" : "Aucune notification"}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              {searchQuery
                ? "Essayez avec d'autres mots-clés"
                : "Vous serez notifié ici des événements importants"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={filteredNotifications.length > 0 && selectedIds.length === filteredNotifications.length}
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
                  {filteredNotifications.map((notification) => (
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
                          <Badge variant="default" className="bg-primary hover:bg-primary text-xs">
                            Nouveau
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
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
            </div>

            {/* Mobile Card View - Visible only on mobile */}
            <div className="md:hidden divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 space-y-3 ${
                    !notification.isRead ? "bg-muted/30" : ""
                  }`}
                >
                  {/* Header with checkbox and status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={selectedIds.includes(notification.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(notification.id, checked as boolean)
                        }
                        aria-label={`Sélectionner ${notification.title}`}
                        className="mt-0.5"
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
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {notification.message}
                    </p>
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

                  {/* Date and Actions */}
                  <div className="pl-9 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), "dd MMM yyyy 'à' HH:mm", {
                        locale: fr,
                      })}
                    </div>
                    <div className="flex gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="flex-1 sm:flex-none text-xs"
                        >
                          <CheckCheck className="mr-1 h-3 w-3" />
                          Lu
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="flex-1 sm:flex-none text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
