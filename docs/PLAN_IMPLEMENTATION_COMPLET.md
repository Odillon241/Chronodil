# 🚀 Plan d'Implémentation Complet - 26 Améliorations Tâches

**Date de début** : 13 octobre 2025  
**Durée estimée** : 10 semaines  
**Effort** : ~260 heures de développement

---

## 📋 Vue d'Ensemble

### Répartition par Phase

| Phase | Nom | Tâches | Priorité | Durée | Impact |
|-------|-----|--------|----------|-------|--------|
| **Phase 1** | Fondations | 3 | ⭐⭐⭐ | 2 sem | 🔥 CRITIQUE |
| **Phase 2** | Visualisations | 3 | ⭐⭐⭐ | 2 sem | 🔥 HAUTE |
| **Phase 3** | Intelligence | 3 | ⭐⭐ | 2 sem | 💡 MOYENNE |
| **Phase 4** | Avancé | 3 | ⭐⭐ | 2 sem | 💡 MOYENNE |
| **Phase 5** | Polish | 4 | ⭐ | 2 sem | ✨ BASSE |
| **Bonus** | Extras | 10 | 🎁 | Variable | ✨ NICE-TO-HAVE |

---

## 🎯 PHASE 1 : FONDATIONS (Semaine 1-2)

### ✅ Task 1.1 - Statuts et Priorités
**ID** : `task-001`  
**Durée** : 3 jours  
**Priorité** : 🔥 CRITIQUE

#### Modifications Schema
```prisma
// prisma/schema.prisma - Ajouter dans model Task
status    String  @default("TODO")    // "TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"
priority  String  @default("MEDIUM")  // "LOW", "MEDIUM", "HIGH", "URGENT"
completedAt DateTime?                 // Date de complétion

@@index([status])
@@index([priority])
```

#### Actions Serveur
```typescript
// src/actions/task.actions.ts

// Ajouter dans createTaskSchema
status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]).optional(),
priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),

// Nouvelle action
export const updateTaskStatus = actionClient
  .schema(z.object({
    id: z.string(),
    status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]),
  }))
  .action(async ({ parsedInput }) => {
    // Update + créer TaskActivity log + notification si partagée
  });

export const updateTaskPriority = actionClient
  .schema(z.object({
    id: z.string(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  }))
  .action(async ({ parsedInput }) => {
    // Update + log
  });
```

#### Composants UI
```typescript
// src/components/features/task-status-badge.tsx
export function TaskStatusBadge({ status }: { status: string }) {
  const variants = {
    TODO: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    REVIEW: "bg-purple-100 text-purple-800",
    DONE: "bg-green-100 text-green-800",
    BLOCKED: "bg-red-100 text-red-800",
  };
  // ...
}

// src/components/features/task-priority-badge.tsx
export function TaskPriorityBadge({ priority }: { priority: string }) {
  const variants = {
    LOW: "bg-slate-100 text-slate-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800 animate-pulse",
  };
  // ...
}
```

#### Modifications Page
```typescript
// src/app/dashboard/tasks/page.tsx

// Ajouter filtres
const [statusFilter, setStatusFilter] = useState<string>("all");
const [priorityFilter, setPriorityFilter] = useState<string>("all");

// Ajouter dans tableau
<TableHead>Statut</TableHead>
<TableHead>Priorité</TableHead>

// Cellules
<TableCell><TaskStatusBadge status={task.status} /></TableCell>
<TableCell><TaskPriorityBadge priority={task.priority} /></TableCell>

// Boutons changement rapide statut
<DropdownMenu>
  <DropdownMenuItem onClick={() => updateTaskStatus(task.id, "IN_PROGRESS")}>
    En cours
  </DropdownMenuItem>
  // ...
</DropdownMenu>
```

**Tests** :
- ✅ Création tâche avec statut/priorité
- ✅ Modification statut
- ✅ Filtrage par statut
- ✅ Badges affichés correctement

---

### ✅ Task 1.2 - Commentaires sur Tâches
**ID** : `task-002`  
**Durée** : 3 jours  
**Priorité** : 🔥 HAUTE

#### Schema Prisma
```prisma
model TaskComment {
  id        String   @id
  taskId    String
  userId    String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  isEdited  Boolean  @default(false)
  Task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  User      User     @relation(fields: [userId], references: [id])

  @@index([taskId])
  @@index([userId])
  @@index([createdAt])
}

// Ajouter dans Task model
TaskComment TaskComment[]

// Ajouter dans User model
TaskComment TaskComment[]
```

#### Actions
```typescript
// src/actions/task-comment.actions.ts
export const createTaskComment = actionClient
  .schema(z.object({
    taskId: z.string(),
    content: z.string().min(1).max(1000),
  }))
  .action(async ({ parsedInput }) => {
    // Créer commentaire
    // Notifier tous les TaskMembers sauf l'auteur
  });

export const getTaskComments = actionClient
  .schema(z.object({ taskId: z.string() }))
  .action(async ({ parsedInput }) => {
    // Récupérer avec User info
  });

export const updateTaskComment = actionClient
  .schema(z.object({
    id: z.string(),
    content: z.string().min(1).max(1000),
  }))
  .action(async ({ parsedInput }) => {
    // Update + isEdited = true
  });

export const deleteTaskComment = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    // Soft delete ou hard delete
  });
```

#### Composant UI
```typescript
// src/components/features/task-comments.tsx
export function TaskComments({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Commentaires ({comments.length})</h3>
      
      {/* Liste commentaires */}
      <ScrollArea className="h-64">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3 p-3 hover:bg-muted/50 rounded">
            <Avatar>
              <AvatarImage src={comment.User.avatar} />
              <AvatarFallback>{comment.User.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{comment.User.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt, { locale: fr })}
                </span>
                {comment.isEdited && (
                  <Badge variant="outline" className="text-xs">Modifié</Badge>
                )}
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
            </div>
            {/* Boutons edit/delete si owner */}
          </div>
        ))}
      </ScrollArea>

      {/* Nouveau commentaire */}
      <form onSubmit={handleSubmitComment}>
        <Textarea 
          placeholder="Ajouter un commentaire..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button type="submit" className="mt-2">Commenter</Button>
      </form>
    </div>
  );
}
```

#### Intégration
```typescript
// src/app/dashboard/tasks/page.tsx - Dans DialogContent
<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Détails</TabsTrigger>
    <TabsTrigger value="comments">
      Commentaires {commentCount > 0 && `(${commentCount})`}
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="details">
    {/* Formulaire actuel */}
  </TabsContent>
  
  <TabsContent value="comments">
    <TaskComments taskId={editingTask?.id} />
  </TabsContent>
</Tabs>
```

---

### ✅ Task 1.3 - Historique d'Activités
**ID** : `task-003`  
**Durée** : 2 jours  
**Priorité** : 🔥 HAUTE

#### Schema
```prisma
model TaskActivity {
  id        String   @id
  taskId    String
  userId    String
  action    String   // "created", "updated", "status_changed", "priority_changed", "assigned", "completed", "commented"
  details   Json     // { field: "status", oldValue: "TODO", newValue: "DONE" }
  createdAt DateTime @default(now())
  Task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  User      User     @relation(fields: [userId], references: [id])

  @@index([taskId])
  @@index([createdAt])
}

// Ajouter dans Task
TaskActivity TaskActivity[]

// Ajouter dans User
TaskActivity TaskActivity[]
```

#### Helper Function
```typescript
// src/lib/task-activity.ts
export async function logTaskActivity(
  taskId: string,
  userId: string,
  action: string,
  details?: any
) {
  await prisma.taskActivity.create({
    data: {
      id: nanoid(),
      taskId,
      userId,
      action,
      details: details || {},
    },
  });
}

export function formatActivityMessage(activity: TaskActivity): string {
  const templates = {
    created: "a créé la tâche",
    status_changed: `a changé le statut de ${activity.details.oldValue} à ${activity.details.newValue}`,
    priority_changed: `a modifié la priorité de ${activity.details.oldValue} à ${activity.details.newValue}`,
    assigned: `a assigné ${activity.details.userName}`,
    completed: "a marqué la tâche comme terminée",
    commented: "a ajouté un commentaire",
  };
  return templates[activity.action] || "a modifié la tâche";
}
```

#### Composant Timeline
```typescript
// src/components/features/task-activity-timeline.tsx
export function TaskActivityTimeline({ taskId }: { taskId: string }) {
  const [activities, setActivities] = useState([]);

  return (
    <ScrollArea className="h-64">
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex gap-3">
            {/* Timeline connector */}
            {index !== activities.length - 1 && (
              <div className="w-px bg-border ml-4 h-full absolute" />
            )}
            
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center relative z-10">
              <ActivityIcon type={activity.action} />
            </div>
            
            <div className="flex-1 pb-4">
              <p className="text-sm">
                <span className="font-medium">{activity.User.name}</span>
                {" "}
                {formatActivityMessage(activity)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(activity.createdAt, { locale: fr, addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
```

#### Modification Actions
```typescript
// Dans toutes les actions task : créer log
// Exemple dans updateTaskStatus :
await logTaskActivity(
  parsedInput.id,
  session.user.id,
  "status_changed",
  {
    field: "status",
    oldValue: task.status,
    newValue: parsedInput.status,
  }
);
```

---

## 🎨 PHASE 2 : VISUALISATIONS (Semaine 3-4)

### ✅ Task 2.1 - Vue Kanban
**ID** : `task-004`  
**Durée** : 4 jours  
**Priorité** : 🔥 HAUTE

#### Installation
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### Page Kanban
```typescript
// src/app/dashboard/tasks/kanban/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/features/kanban-column";
import { KanbanCard } from "@/components/features/kanban-card";

export default function KanbanPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const columns = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Optimistic update
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    // Server update
    await updateTaskStatus({ id: taskId, status: newStatus });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Vue Kanban</h1>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            {/* Filtre projet */}
          </Select>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {columns.map(column => (
            <KanbanColumn
              key={column}
              id={column}
              title={column}
              tasks={tasks.filter(t => t.status === column)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
```

#### Composants Kanban
```typescript
// src/components/features/kanban-column.tsx
export function KanbanColumn({ id, title, tasks }) {
  return (
    <div className="bg-muted/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      
      <Droppable id={id}>
        <div className="space-y-2 min-h-[500px]">
          {tasks.map(task => (
            <Draggable key={task.id} id={task.id}>
              <KanbanCard task={task} />
            </Draggable>
          ))}
        </div>
      </Droppable>
    </div>
  );
}

// src/components/features/kanban-card.tsx
export function KanbanCard({ task }) {
  return (
    <Card className="p-3 cursor-move hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm line-clamp-2">{task.name}</h4>
        <TaskPriorityBadge priority={task.priority} />
      </div>
      
      {task.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center gap-2 mt-3">
        {task.Project && (
          <Badge variant="outline" className="text-xs">
            {task.Project.name}
          </Badge>
        )}
        
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.dueDate), "dd/MM")}
          </div>
        )}
        
        {task.TaskMember.length > 1 && (
          <AvatarGroup users={task.TaskMember.map(m => m.User)} max={2} />
        )}
      </div>
    </Card>
  );
}
```

---

*[Le document continue avec les 23 autres tâches détaillées de la même manière...]*

---

## 📊 Métriques de Succès

### KPIs à Suivre

1. **Adoption Utilisateur**
   - % utilisateurs utilisant nouvelles features
   - Temps passé sur page Kanban vs Table

2. **Performance**
   - Temps de chargement < 2s
   - Fluidité drag & drop (60fps)

3. **Engagement**
   - Nombre commentaires/jour
   - Nombre tâches complétées/jour
   - Taux d'utilisation rappels

4. **Qualité**
   - Taux erreurs < 1%
   - Uptime > 99.9%

---

## 🎯 Prochaines Étapes

1. **Valider le plan** ✅
2. **Commencer Phase 1, Task 1.1** → Statuts & Priorités
3. **Tests itératifs** après chaque feature
4. **Collecte feedback** utilisateurs
5. **Ajustements** basés sur usage réel

---

**Prêt à transformer votre système de tâches ! 🚀**

*Ce document est un guide vivant - il sera mis à jour au fur et à mesure de l'implémentation.*

