"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Activity, Database, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { SpinnerCustom } from "@/components/features/loading-spinner";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getAuditLogs, getAuditStats } from "@/actions/audit.actions";

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  User: {
    name: string;
    email: string;
  } | null;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalLogs, setTotalLogs] = useState(0);

  const [filters, setFilters] = useState({
    entity: "",
    action: "",
    search: "",
  });

  useEffect(() => {
    loadData();
  }, [filters.entity, filters.action, currentPage]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const [logsResult, statsResult] = await Promise.all([
        getAuditLogs({
          entity: filters.entity === "all" ? undefined : filters.entity || undefined,
          action: filters.action === "all" ? undefined : filters.action || undefined,
          limit: itemsPerPage,
          offset: offset,
        }),
        getAuditStats({}),
      ]);

      if (logsResult?.data) {
        setLogs(logsResult.data);
        setTotalLogs(statsResult?.data?.total || logsResult.data.length);
      }

      if (statsResult?.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes("create")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (action.toLowerCase().includes("update")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    if (action.toLowerCase().includes("delete")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const filteredLogs = logs.filter((log) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entity.toLowerCase().includes(searchLower) ||
      log.User?.name.toLowerCase().includes(searchLower) ||
      log.User?.email.toLowerCase().includes(searchLower)
    );
  });

  const exportToCSV = () => {
    try {
      const headers = ["Date", "Utilisateur", "Email", "Action", "Entité", "ID Entité", "IP", "User Agent"];
      const csvContent = [
        headers.join(","),
        ...filteredLogs.map((log) =>
          [
            format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss"),
            log.User?.name || "Système",
            log.User?.email || "",
            log.action,
            log.entity,
            log.entityId,
            log.ipAddress || "",
            log.userAgent || "",
          ]
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      toast.success("Export CSV réussi");
    } catch (error) {
      console.error("Erreur export CSV:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  const viewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Audit des actions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Historique complet des actions effectuées dans l'application
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          <span className="sm:inline">Exporter CSV</span>
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total actions</CardTitle>
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">{stats.total}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Actions enregistrées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Action principale</CardTitle>
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary truncate">
                {stats.byAction[0]?.action || "N/A"}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {stats.byAction[0]?.count || 0} fois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Entité principale</CardTitle>
              <Database className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary truncate">
                {stats.byEntity[0]?.entity || "N/A"}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {stats.byEntity[0]?.count || 0} actions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Recherche</Label>
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Entité</Label>
              <Select
                value={filters.entity}
                onValueChange={(value) => setFilters({ ...filters, entity: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Toutes les entités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="User">Utilisateur</SelectItem>
                  <SelectItem value="Project">Projet</SelectItem>
                  <SelectItem value="TimesheetEntry">Saisie temps</SelectItem>
                  <SelectItem value="Task">Tâche</SelectItem>
                  <SelectItem value="HRTimesheet">Timesheet RH</SelectItem>
                  <SelectItem value="Message">Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="CREATE">Création</SelectItem>
                  <SelectItem value="UPDATE">Modification</SelectItem>
                  <SelectItem value="DELETE">Suppression</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Historique des actions</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {filteredLogs.length} action{filteredLogs.length > 1 ? "s" : ""} trouvée{filteredLogs.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <SpinnerCustom />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aucun log trouvé
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden md:block relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted">
                    <tr>
                      <th className="px-4 lg:px-6 py-3">Date</th>
                      <th className="px-4 lg:px-6 py-3">Utilisateur</th>
                      <th className="px-4 lg:px-6 py-3">Action</th>
                      <th className="px-4 lg:px-6 py-3">Entité</th>
                      <th className="px-4 lg:px-6 py-3">ID Entité</th>
                      <th className="px-4 lg:px-6 py-3">IP</th>
                      <th className="px-4 lg:px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", {
                            locale: fr,
                          })}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          {log.User ? (
                            <div>
                              <div className="font-medium text-xs sm:text-sm">{log.User.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {log.User.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm text-muted-foreground">Système</span>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 font-medium text-xs sm:text-sm">{log.entity}</td>
                        <td className="px-4 lg:px-6 py-4">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.entityId.substring(0, 8)}...
                          </code>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-xs text-muted-foreground">
                          {log.ipAddress || "N/A"}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewDetails(log)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Détails
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-3">
                {filteredLogs.map((log) => (
                  <Card key={log.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                            <span className="text-xs font-medium truncate">{log.entity}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewDetails(log)}
                          className="gap-1 h-8 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="pt-2 border-t space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Utilisateur:</span>
                          <span className="font-medium">
                            {log.User ? log.User.name : "Système"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">ID:</span>
                          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                            {log.entityId.substring(0, 8)}...
                          </code>
                        </div>
                        {log.ipAddress && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">IP:</span>
                            <span className="text-[10px]">{log.ipAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  Page {currentPage} sur {totalPages} ({totalLogs} logs au total)
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="flex-1 sm:flex-initial"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Précédent</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || isLoading}
                    className="flex-1 sm:flex-initial"
                  >
                    <span className="text-xs sm:text-sm">Suivant</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de détails */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Détails de l'action audit</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Informations complètes sur cette action
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">Date</Label>
                  <p className="font-medium text-xs sm:text-sm">
                    {format(new Date(selectedLog.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">Action</Label>
                  <p>
                    <span className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">Entité</Label>
                  <p className="font-medium text-xs sm:text-sm">{selectedLog.entity}</p>
                </div>
                <div>
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">ID Entité</Label>
                  <p className="font-mono text-[10px] sm:text-xs break-all">{selectedLog.entityId}</p>
                </div>
                <div>
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">Utilisateur</Label>
                  <p className="font-medium text-xs sm:text-sm">
                    {selectedLog.User ? (
                      <>
                        {selectedLog.User.name}
                        <br />
                        <span className="text-[10px] sm:text-xs text-muted-foreground">{selectedLog.User.email}</span>
                      </>
                    ) : (
                      "Système"
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">Adresse IP</Label>
                  <p className="font-mono text-[10px] sm:text-sm">{selectedLog.ipAddress || "N/A"}</p>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">User Agent</Label>
                  <p className="text-[10px] sm:text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}

              {selectedLog.changes && (
                <div>
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">Changements</Label>
                  <pre className="text-[10px] sm:text-xs bg-muted p-3 sm:p-4 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
