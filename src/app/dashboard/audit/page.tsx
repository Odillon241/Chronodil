"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Activity, Users, Database } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getAuditLogs, getAuditStats } from "@/actions/audit.actions";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    entity: "",
    action: "",
    search: "",
  });

  useEffect(() => {
    loadData();
  }, [filters.entity, filters.action]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsResult, statsResult] = await Promise.all([
        getAuditLogs({
          entity: filters.entity === "all" ? undefined : filters.entity || undefined,
          action: filters.action === "all" ? undefined : filters.action || undefined,
        }),
        getAuditStats({}),
      ]);

      if (logsResult?.data) {
        setLogs(logsResult.data);
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
    if (action.toLowerCase().includes("create")) return "bg-green-100 text-green-800";
    if (action.toLowerCase().includes("update")) return "bg-blue-100 text-blue-800";
    if (action.toLowerCase().includes("delete")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit des actions</h1>
        <p className="text-muted-foreground">
          Historique complet des actions effectuées dans l'application
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total actions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rusty-red">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Actions enregistrées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Action principale</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rusty-red">
                {stats.byAction[0]?.action || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.byAction[0]?.count || 0} fois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entité principale</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rusty-red">
                {stats.byEntity[0]?.entity || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.byEntity[0]?.count || 0} actions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Recherche</Label>
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Entité</Label>
              <Select
                value={filters.entity}
                onValueChange={(value) => setFilters({ ...filters, entity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les entités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="User">Utilisateur</SelectItem>
                  <SelectItem value="Project">Projet</SelectItem>
                  <SelectItem value="TimesheetEntry">Saisie temps</SelectItem>
                  <SelectItem value="Task">Tâche</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger>
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
          <CardTitle>Historique des actions</CardTitle>
          <CardDescription>
            {filteredLogs.length} action{filteredLogs.length > 1 ? "s" : ""} trouvée{filteredLogs.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rusty-red"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun log trouvé
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Utilisateur</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Entité</th>
                    <th className="px-6 py-3">ID Entité</th>
                    <th className="px-6 py-3">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-4">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", {
                          locale: fr,
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {log.User ? (
                          <div>
                            <div className="font-medium">{log.User.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.User.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Système</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{log.entity}</td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {log.entityId.substring(0, 8)}...
                        </code>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {log.ipAddress || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
