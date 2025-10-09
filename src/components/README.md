# Composants Chronodil

Documentation des composants réutilisables du projet Chronodil.

## 📁 Structure

```
components/
├── ui/              # Composants UI de base (shadcn/ui)
├── layout/          # Composants de layout
└── features/        # Composants métier réutilisables
```

---

## 🎨 Composants UI (`/ui`)

Composants de base fournis par shadcn/ui et personnalisés pour Chronodil.

### Button
Bouton avec variants (default, destructive, outline, secondary, ghost, link).

```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Cliquez-moi</Button>
<Button variant="outline">Annuler</Button>
<Button className="bg-rusty-red hover:bg-ou-crimson">Action primaire</Button>
```

### Card
Container avec header et content.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Contenu</CardContent>
</Card>
```

### Input, Label, Textarea
Champs de formulaire.

```tsx
import { Input, Label, Textarea } from "@/components/ui"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="vous@exemple.com" />
</div>
```

### Select
Sélecteur déroulant.

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select onValueChange={(value) => console.log(value)}>
  <SelectTrigger>
    <SelectValue placeholder="Sélectionnez" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Dialog
Modale.

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Ouvrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Titre</DialogTitle>
    </DialogHeader>
    <p>Contenu</p>
  </DialogContent>
</Dialog>
```

### Table
Tableau structuré.

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nom</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Badge
Étiquette.

```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="default">Nouveau</Badge>
<Badge variant="destructive">Urgent</Badge>
<Badge variant="outline">Info</Badge>
```

---

## 🏗️ Composants Layout (`/layout`)

### Header
En-tête de l'application avec menu mobile, notifications et dropdown utilisateur.

```tsx
import { Header } from "@/components/layout/header"

<Header />
```

### Sidebar
Barre latérale de navigation.

```tsx
import { Sidebar } from "@/components/layout/sidebar"

<Sidebar />
```

### UserDropdown
Menu dropdown de l'utilisateur (séparé du Header pour réutilisabilité).

```tsx
import { UserDropdown } from "@/components/layout/user-dropdown"

<UserDropdown
  user={{ name: "John Doe", email: "john@example.com" }}
  onProfileClick={() => console.log("Profile")}
  onSettingsClick={() => console.log("Settings")}
/>
```

### NotificationButton
Bouton de notifications avec badge et dropdown.

```tsx
import { NotificationButton } from "@/components/layout/notification-button"

<NotificationButton
  notifications={[...]}
  unreadCount={5}
  onNotificationClick={(id) => console.log(id)}
  onMarkAllRead={() => console.log("Mark all")}
/>
```

---

## 🎯 Composants Features (`/features`)

Composants métier réutilisables spécifiques à Chronodil.

### TimesheetForm
Formulaire de saisie de temps complet avec validation Zod.

```tsx
import { TimesheetForm } from "@/components/features/timesheet-form"

<TimesheetForm
  projects={projects}
  tasks={tasks}
  onSubmit={async (data) => {
    await createTimesheetEntry(data)
  }}
  isLoading={false}
  defaultDate={new Date()}
/>
```

**Props:**
- `projects`: Liste des projets disponibles
- `tasks?`: Liste des tâches (optionnel)
- `onSubmit`: Fonction appelée à la soumission
- `isLoading?`: État de chargement
- `defaultDate?`: Date par défaut

### TimesheetEntryCard
Carte d'affichage d'une entrée de temps.

```tsx
import { TimesheetEntryCard } from "@/components/features/timesheet-entry-card"

<TimesheetEntryCard
  entry={entry}
  onDelete={(id) => handleDelete(id)}
  showActions={true}
/>
```

**Props:**
- `entry`: Objet entrée avec project, duration, status, etc.
- `onDelete?`: Fonction de suppression
- `showActions?`: Afficher les actions (défaut: true)

### ProjectCard
Carte de projet avec progression et statistiques.

```tsx
import { ProjectCard } from "@/components/features/project-card"

<ProjectCard
  project={project}
  onDetails={(id) => router.push(`/projects/${id}`)}
  onManage={(id) => console.log("Manage", id)}
/>
```

**Props:**
- `project`: Objet projet
- `onDetails?`: Callback pour voir les détails
- `onManage?`: Callback pour gérer le projet

### ProjectCreateDialog
Dialog de création de projet.

```tsx
import { ProjectCreateDialog } from "@/components/features/project-create-dialog"

<ProjectCreateDialog
  onSubmit={async (formData) => {
    await createProject({
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      // ...
    })
  }}
  trigger={<Button>Nouveau</Button>} // Optionnel
/>
```

**Props:**
- `onSubmit`: Fonction avec FormData
- `trigger?`: Élément déclencheur custom

### StatusBadge
Badge de statut avec couleurs prédéfinies.

```tsx
import { StatusBadge, getStatusLabel, getStatusClassName } from "@/components/features/status-badge"

<StatusBadge status="APPROVED" />
<StatusBadge status="DRAFT" className="text-xs" />

// Ou utiliser les helpers
const label = getStatusLabel("APPROVED") // "Approuvé"
const className = getStatusClassName("APPROVED") // "bg-green-100..."
```

### PageHeader
En-tête de page standardisé.

```tsx
import { PageHeader } from "@/components/features/page-header"

<PageHeader
  title="Projets"
  description="Gérez vos projets et suivez leur avancement"
  action={<Button>Nouveau projet</Button>}
/>
```

### SearchBar
Barre de recherche avec icône.

```tsx
import { SearchBar } from "@/components/features/search-bar"

const [search, setSearch] = useState("")

<SearchBar
  value={search}
  onChange={setSearch}
  placeholder="Rechercher un projet..."
/>
```

### EmptyState
État vide avec icône et message.

```tsx
import { EmptyState } from "@/components/features/empty-state"
import { FolderKanban } from "lucide-react"

<EmptyState
  icon={FolderKanban}
  title="Aucun projet"
  description="Commencez par créer votre premier projet"
  action={<Button>Créer un projet</Button>}
/>
```

### LoadingSpinner
Spinner de chargement.

```tsx
import { LoadingSpinner, LoadingPage } from "@/components/features/loading-spinner"

<LoadingSpinner size="md" text="Chargement..." />

// Ou version pleine page
<LoadingPage text="Chargement des données..." />
```

---

## 🎨 Conventions de style

### Palette de couleurs Chronodil

```tsx
// Classes Tailwind personnalisées (définies dans tailwind.config.ts)
className="bg-ou-crimson"        // #880d1e
className="bg-rusty-red"         // #dd2d4a
className="bg-bright-pink"       // #f26a8d
className="bg-amaranth-pink"     // #f49cbb
className="bg-light-cyan"        // #cbeef3
```

### Boutons primaires

```tsx
// Bouton d'action primaire
<Button className="bg-rusty-red hover:bg-ou-crimson">
  Action
</Button>

// Bouton secondaire
<Button variant="outline">Annuler</Button>
```

---

## ✅ Checklist avant utilisation

Avant d'utiliser un composant :

1. ✅ Vérifier que les types sont correctement définis
2. ✅ Importer les dépendances nécessaires
3. ✅ Passer toutes les props requises
4. ✅ Gérer les états de chargement et erreurs
5. ✅ Tester la réactivité (mobile/desktop)

---

## 📝 Contribuer

### Créer un nouveau composant

1. Placer dans le bon dossier (`ui/`, `layout/`, `features/`)
2. Typer avec TypeScript strict
3. Utiliser les conventions de naming (PascalCase)
4. Documenter les props avec JSDoc si complexe
5. Ajouter dans ce README

### Exemple de composant bien typé

```tsx
interface MyComponentProps {
  /** Titre affiché en haut */
  title: string;
  /** Description optionnelle */
  description?: string;
  /** Callback au clic */
  onClick?: (id: string) => void;
  /** Désactiver le composant */
  disabled?: boolean;
}

export function MyComponent({
  title,
  description,
  onClick,
  disabled = false,
}: MyComponentProps) {
  // ...
}
```

---

**Dernière mise à jour:** Octobre 2025
**Projet:** Chronodil by Odillon
