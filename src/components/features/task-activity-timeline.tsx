"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  CheckCircle2, 
  Circle, 
  Edit, 
  Flag, 
  PlusCircle, 
  UserPlus, 
  UserMinus,
  MessageSquare,
  Clock,
  Calendar,
  Share2,
  Lock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getTaskActivities } from "@/actions/task-activity.actions";

interface TaskActivityTimelineProps {
  taskId: string;
}

// Icônes par type d'action
const ACTION_ICONS: Record<string, any> = {
  created: PlusCircle,
  updated: Edit,
  status_changed: Circle,
  priority_changed: Flag,
  assigned: UserPlus,
  unassigned: UserMinus,
  commented: MessageSquare,
  completed: CheckCircle2,
  reopened: Circle,
  name_changed: Edit,
  description_changed: Edit,
  due_date_changed: Calendar,
  reminder_set: Clock,
  shared: Share2,
  unshared: Lock,
};

// Couleurs par type d'action
const ACTION_COLORS: Record<string, string> = {
  created: "text-green-600 bg-green-100",
  updated: "text-blue-600 bg-blue-100",
  status_changed: "text-purple-600 bg-purple-100",
  priority_changed: "text-orange-600 bg-orange-100",
  assigned: "text-green-600 bg-green-100",
  unassigned: "text-red-600 bg-red-100",
  commented: "text-blue-600 bg-blue-100",
  completed: "text-green-600 bg-green-100",
  reopened: "text-yellow-600 bg-yellow-100",
  name_changed: "text-blue-600 bg-blue-100",
  description_changed: "text-blue-600 bg-blue-100",
  due_date_changed: "text-orange-600 bg-orange-100",
  reminder_set: "text-purple-600 bg-purple-100",
  shared: "text-blue-600 bg-blue-100",
  unshared: "text-gray-600 bg-gray-100",
};

export function TaskActivityTimeline({ taskId }: TaskActivityTimelineProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [taskId]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const result = await getTaskActivities({ taskId });
      if (result?.data) {
        setActivities(result.data);
      }
    } catch (error) {
      console.error("Erreur chargement activités:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
        <p className="text-muted-foreground text-sm">Aucune activité enregistrée</p>
        <p className="text-muted-foreground text-xs mt-1">
          L'historique des modifications apparaîtra ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">
          Historique d'activités {activities.length > 0 && `(${activities.length})`}
        </h3>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="relative space-y-4">
          {/* Ligne verticale de connexion */}
          <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-border" />

          {activities.map((activity, index) => {
            const Icon = ACTION_ICONS[activity.action] || Activity;
            const colorClass = ACTION_COLORS[activity.action] || "text-gray-600 bg-gray-100";

            return (
              <div key={activity.id} className="relative flex gap-4 group">
                {/* Icône avec cercle */}
                <div className="relative z-10 flex-shrink-0">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.User.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {activity.User.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{activity.User.name}</span>
                    </div>

                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        locale: fr,
                        addSuffix: true,
                      })}
                    </time>
                  </div>

                  <p className="text-sm text-foreground">
                    {activity.description}
                  </p>

                  {/* Metadata si présent */}
                  {activity.metadata && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Détails supplémentaires
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Stats en bas */}
      <div className="border-t pt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{activities.length} {activities.length > 1 ? "modifications" : "modification"}</span>
        {activities.length > 0 && (
          <span>
            Créée {formatDistanceToNow(new Date(activities[activities.length - 1].createdAt), {
              locale: fr,
              addSuffix: true,
            })}
          </span>
        )}
      </div>
    </div>
  );
}

