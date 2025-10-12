# Implémentation de la Suppression de Projet

## Fonctionnalité Implémentée

Les utilisateurs peuvent maintenant supprimer les projets qu'ils ont créés, tandis que les administrateurs peuvent supprimer n'importe quel projet.

## Règles de Permissions

- **Créateur du projet** : Peut supprimer uniquement les projets qu'il a créés
- **Administrateur (ADMIN)** : Peut supprimer n'importe quel projet
- **Autres utilisateurs** : Ne peuvent pas supprimer de projets

## Modifications Apportées

### 1. Base de Données (Schema Prisma)

**Fichier** : `prisma/schema.prisma`

- Ajout du champ `createdBy` au modèle `Project` (optionnel pour supporter les projets existants)
- Ajout de la relation `Creator` vers le modèle `User`
- Ajout d'un index sur `createdBy` pour optimiser les requêtes
- Ajout de la relation inverse `CreatedProjects` dans le modèle `User`

**Migration** : 
- Script exécuté : `scripts/set-project-creators.ts`
- Tous les projets existants ont été mis à jour avec un créateur (premier membre ou admin par défaut)

### 2. Actions Serveur

**Fichier** : `src/actions/project.actions.ts`

#### Modifications des actions existantes :

1. **`createProject`** :
   - Enregistre l'ID de l'utilisateur actuel dans `createdBy`

2. **`cloneProject`** :
   - Utilise l'ID de l'utilisateur actuel comme créateur du projet cloné

3. **`getProjects`** :
   - Inclut la relation `Creator` avec les informations de base (id, name, email)

4. **`getProjectById`** :
   - Inclut la relation `Creator` pour afficher les détails du créateur

#### Nouvelle action :

**`deleteProject`** :
```typescript
export const deleteProject = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { userRole, userId } = ctx;

    // Récupérer le projet avec son créateur
    const project = await prisma.project.findUnique({
      where: { id: parsedInput.id },
      select: { id: true, name: true, createdBy: true },
    });

    if (!project) {
      throw new Error("Projet non trouvé");
    }

    // Vérifier les permissions
    const isAdmin = userRole === "ADMIN";
    const isCreator = project.createdBy === userId;

    if (!isAdmin && !isCreator) {
      throw new Error("Vous n'avez pas la permission de supprimer ce projet...");
    }

    // Supprimer le projet (cascade deletion)
    await prisma.project.delete({
      where: { id: parsedInput.id },
    });

    revalidatePath("/dashboard/projects");
    return { success: true, projectName: project.name };
  });
```

### 3. Interface Utilisateur

**Fichier** : `src/app/dashboard/projects/page.tsx`

#### Modifications :

1. **Import du hook de session** :
   ```typescript
   import { useSession } from "@/lib/auth-client";
   ```

2. **Import de l'icône de suppression** :
   ```typescript
   import { Trash2 } from "lucide-react";
   ```

3. **Import de l'action de suppression** :
   ```typescript
   import { deleteProject } from "@/actions/project.actions";
   ```

4. **Récupération de l'utilisateur actuel** :
   ```typescript
   const { data: session } = useSession();
   const currentUser = session?.user;
   ```

5. **Fonction de vérification des permissions** :
   ```typescript
   const canDeleteProject = (project: any): boolean => {
     if (!currentUser) return false;
     const userRole = (currentUser as any)?.role as string;
     const isAdmin = userRole === "ADMIN";
     const isCreator = project.createdBy === currentUser.id;
     return isAdmin || isCreator;
   };
   ```

6. **Handler de suppression** :
   ```typescript
   const handleDeleteProject = async (project: any) => {
     // Vérification des permissions côté client
     // Confirmation avec dialogue d'avertissement détaillé
     // Appel de l'action deleteProject
     // Toast de succès ou d'erreur
     // Rechargement de la liste des projets
   };
   ```

7. **Bouton de suppression dans les menus** :
   - Ajouté dans le menu déroulant en mode grille
   - Ajouté dans le menu déroulant en mode liste
   - Visible uniquement si `canDeleteProject(project)` retourne `true`
   - Séparateur visuel avant l'option de suppression
   - Style en rouge destructive pour indiquer la dangerosité

## Effets de la Suppression (Cascade)

Lors de la suppression d'un projet, les éléments suivants sont automatiquement supprimés grâce aux contraintes `onDelete: Cascade` :

- **ProjectMember** : Tous les membres du projet
- **Task** : Toutes les tâches du projet
- **TimesheetEntry** : Toutes les entrées de timesheet associées
- **Conversation** : Toutes les conversations liées au projet (si applicable)

## Sécurité

### Vérifications Côté Serveur :
- Authentification requise via `authActionClient`
- Vérification que le projet existe
- Vérification que l'utilisateur est soit :
  - Le créateur du projet (createdBy === userId)
  - Un administrateur (role === "ADMIN")
- Message d'erreur explicite en cas de permission insuffisante

### Vérifications Côté Client :
- Vérification des permissions avant d'afficher le bouton
- Vérification des permissions avant d'appeler l'action
- Dialogue de confirmation avec avertissement détaillé
- Toast informatif en cas d'erreur ou de succès

## Tests à Effectuer

1. **En tant que créateur d'un projet** :
   - ✓ Voir le bouton de suppression sur mes projets
   - ✓ Pouvoir supprimer mes projets
   - ✗ Ne pas voir le bouton sur les projets d'autres utilisateurs

2. **En tant qu'administrateur** :
   - ✓ Voir le bouton de suppression sur tous les projets
   - ✓ Pouvoir supprimer n'importe quel projet

3. **En tant qu'utilisateur standard (non créateur)** :
   - ✗ Ne pas voir le bouton de suppression sur les projets des autres

4. **Vérifications après suppression** :
   - ✓ Le projet disparaît de la liste
   - ✓ Les membres sont supprimés
   - ✓ Les tâches sont supprimées
   - ✓ Les entrées de timesheet sont supprimées

## Scripts Utiles

- **Vérifier les créateurs de projets** :
  ```bash
  npx tsx scripts/set-project-creators.ts
  ```

- **Synchroniser le schéma Prisma** :
  ```bash
  npx prisma db push
  ```

- **Générer le client Prisma** :
  ```bash
  npx prisma generate
  ```

## Notes Importantes

- Le champ `createdBy` est optionnel dans le schéma pour supporter les projets existants qui n'avaient pas de créateur
- Pour les projets sans créateur, le script `set-project-creators.ts` a attribué le premier membre ou un administrateur par défaut
- La suppression est définitive et irréversible - une confirmation claire est demandée à l'utilisateur
- L'archivage reste disponible comme alternative non destructive

