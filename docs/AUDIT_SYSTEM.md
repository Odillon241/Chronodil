# Système d'Audit - Documentation Complète

## 📋 Vue d'ensemble

Le système d'audit de Chronodil permet de tracer toutes les actions importantes effectuées dans l'application. Chaque action est enregistrée avec :
- L'utilisateur qui a effectué l'action
- L'action effectuée (CREATE, UPDATE, DELETE, etc.)
- L'entité concernée (Task, Project, User, HRTimesheet, etc.)
- L'ID de l'entité
- Les détails des changements (optionnel)
- **L'adresse IP du client** (capturée automatiquement)
- **Le user-agent** (capturé automatiquement)
- La date et l'heure de l'action

## 🔐 Accès aux Audits

**Seul l'administrateur (ADMIN) peut accéder à la page d'audit** (`/dashboard/audit`).

Les audits retracent **toutes les actions de tous les utilisateurs**, pas seulement celles de l'administrateur.

## 🛠️ Utilisation

### Fonction principale : `createAuditLog()`

Tous les audits doivent être créés via la fonction centralisée `createAuditLog()` située dans `src/lib/audit.ts`.

```typescript
import { createAuditLog, AuditActions, AuditEntities } from "@/lib/audit";

await createAuditLog({
  userId: session.user.id,
  action: AuditActions.CREATE,
  entity: AuditEntities.TASK,
  entityId: task.id,
  changes: {
    name: task.name,
    status: task.status,
  },
});
```

### Actions standardisées

Utilisez les constantes `AuditActions` pour les actions :

```typescript
export const AuditActions = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  SUBMIT: "SUBMIT",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  REVERT: "REVERT",
  REVERT_TIMESHEET_STATUS: "REVERT_TIMESHEET_STATUS",
} as const;
```

### Entités auditées

Utilisez les constantes `AuditEntities` pour les entités :

```typescript
export const AuditEntities = {
  TASK: "Task",
  PROJECT: "Project",
  USER: "User",
  HRTIMESHEET: "HRTimesheet",
  HRACTIVITY: "HRActivity",
  MESSAGE: "Message",
  NOTIFICATION: "Notification",
  SETTINGS: "Settings",
} as const;
```

## 📝 Actions Auditées

### ✅ Tâches (`Task`)

- **CREATE** : Création d'une tâche
- **UPDATE** : Modification d'une tâche (avec détails des changements)
- **DELETE** : Suppression d'une tâche

**Fichier** : `src/actions/task.actions.ts`

### ✅ Projets (`Project`)

- **CREATE** : Création d'un projet
- **UPDATE** : Modification d'un projet (y compris archivage/réactivation)
- **DELETE** : Suppression d'un projet

**Fichier** : `src/actions/project.actions.ts`

### ✅ Utilisateurs (`User`)

- **CREATE** : Création d'un utilisateur
- **UPDATE** : Modification d'un utilisateur (rôle, département, etc.)
- **DELETE** : Suppression d'un utilisateur

**Fichier** : `src/actions/user.actions.ts`

### ✅ Timesheets RH (`HRTimesheet`)

- **CREATE** : Création d'un timesheet RH
- **UPDATE** : Modification d'un timesheet RH
- **SUBMIT** : Soumission d'un timesheet RH
- **APPROVE** : Approbation d'un timesheet RH (manager ou Odillon)
- **REJECT** : Rejet d'un timesheet RH (manager ou Odillon)
- **REVERT_TIMESHEET_STATUS** : Rétrogradation du statut d'un timesheet

**Fichier** : `src/actions/hr-timesheet.actions.ts`

## 🌐 Capture de l'Adresse IP

La fonction `createAuditLog()` capture automatiquement l'adresse IP du client via la fonction `getClientIP()` qui :

1. Vérifie `x-forwarded-for` (utilisé par les proxies et load balancers)
2. Vérifie `x-real-ip` (utilisé par certains proxies)
3. Vérifie `cf-connecting-ip` (Cloudflare)
4. Vérifie `x-client-ip`

**Note** : En développement local, l'IP peut ne pas être disponible (affichée comme "N/A"). En production (Vercel, etc.), l'IP est automatiquement capturée.

## 📊 Structure d'un Log d'Audit

```typescript
interface AuditLog {
  id: string;
  userId: string | null;        // ID de l'utilisateur (null pour actions système)
  action: string;               // Type d'action (CREATE, UPDATE, etc.)
  entity: string;               // Type d'entité (Task, Project, etc.)
  entityId: string;             // ID de l'entité concernée
  changes: Json | null;          // Détails des changements (optionnel)
  ipAddress: string | null;     // Adresse IP du client
  userAgent: string | null;      // User-agent du navigateur
  createdAt: Date;              // Date et heure de l'action
  User: {                        // Relation vers l'utilisateur
    name: string;
    email: string;
  } | null;
}
```

## 🔍 Exemples d'Utilisation

### Exemple 1 : Création simple

```typescript
await createAuditLog({
  userId: session.user.id,
  action: AuditActions.CREATE,
  entity: AuditEntities.TASK,
  entityId: task.id,
});
```

### Exemple 2 : Avec détails des changements

```typescript
await createAuditLog({
  userId: session.user.id,
  action: AuditActions.UPDATE,
  entity: AuditEntities.TASK,
  entityId: task.id,
  changes: {
    previous: {
      status: oldTask.status,
      priority: oldTask.priority,
    },
    new: {
      status: newTask.status,
      priority: newTask.priority,
    },
  },
});
```

### Exemple 3 : Suppression avec sauvegarde des données

```typescript
// Sauvegarder les données avant suppression
const taskData = {
  name: task.name,
  status: task.status,
  projectId: task.projectId,
};

await prisma.task.delete({
  where: { id: taskId },
});

// Créer l'audit
await createAuditLog({
  userId: session.user.id,
  action: AuditActions.DELETE,
  entity: AuditEntities.TASK,
  entityId: taskId,
  changes: taskData,
});
```

## ⚠️ Bonnes Pratiques

1. **Toujours utiliser `createAuditLog()`** : Ne jamais créer d'audit directement avec `prisma.auditLog.create()`

2. **Capturer les données avant suppression** : Pour les actions DELETE, sauvegarder les données importantes avant la suppression

3. **Inclure les détails pertinents** : Utiliser le champ `changes` pour stocker les informations importantes (statuts précédents/nouveaux, raisons, etc.)

4. **Ne pas bloquer l'opération principale** : La fonction `createAuditLog()` ne fait jamais échouer l'opération principale si elle échoue (gestion d'erreur silencieuse)

5. **Utiliser les constantes** : Toujours utiliser `AuditActions` et `AuditEntities` au lieu de chaînes en dur

## 🚀 Ajouter de Nouveaux Audits

Pour ajouter des audits à une nouvelle action :

1. **Importer les utilitaires** :
```typescript
import { createAuditLog, AuditActions, AuditEntities } from "@/lib/audit";
```

2. **Créer l'audit après l'opération** :
```typescript
// Après la création/modification/suppression
await createAuditLog({
  userId: session.user.id,
  action: AuditActions.CREATE, // ou UPDATE, DELETE, etc.
  entity: AuditEntities.VOTRE_ENTITE, // Ajouter à AuditEntities si nouvelle
  entityId: entity.id,
  changes: { /* détails pertinents */ },
});
```

3. **Ajouter la nouvelle entité** (si nécessaire) :
```typescript
// Dans src/lib/audit.ts
export const AuditEntities = {
  // ... existantes
  VOTRE_ENTITE: "VotreEntite",
} as const;
```

## 📈 Visualisation des Audits

Les audits sont visibles dans `/dashboard/audit` (accès ADMIN uniquement) avec :
- Filtres par entité et action
- Recherche textuelle
- Détails complets (IP, user-agent, changements)
- Export CSV

## 🔒 Sécurité

- Les audits sont **en lecture seule** : ils ne peuvent pas être modifiés ou supprimés
- Seul l'administrateur peut voir les audits
- Les adresses IP sont capturées pour la traçabilité et la sécurité
- Les audits ne contiennent jamais de mots de passe ou d'informations sensibles

## 📚 Fichiers Clés

- **`src/lib/audit.ts`** : Fonction utilitaire principale
- **`src/lib/utils.ts`** : Fonction `getClientIP()` pour capturer l'IP
- **`src/actions/audit.actions.ts`** : Actions pour récupérer les audits
- **`src/app/dashboard/audit/page.tsx`** : Interface de visualisation
- **`prisma/schema.prisma`** : Modèle `AuditLog`

## 🐛 Dépannage

### L'IP affiche "N/A"

- **En développement local** : Normal, l'IP n'est pas disponible dans les headers
- **En production** : Vérifier que le proxy/load balancer envoie les headers `x-forwarded-for` ou `x-real-ip`

### Les audits ne sont pas créés

- Vérifier que `createAuditLog()` est bien appelé
- Vérifier les logs du serveur pour les erreurs
- La fonction ne fait pas échouer l'opération principale, donc vérifier les logs

### Performance

- Les audits sont créés de manière asynchrone et ne bloquent pas l'opération principale
- En cas d'erreur, l'audit est ignoré mais l'opération continue

---

**Dernière mise à jour** : 2025-01-XX
**Version** : 1.0.0

