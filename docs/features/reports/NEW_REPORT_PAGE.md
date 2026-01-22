# Page de Création de Rapport - Full Page Editor

## 📍 Route

`/dashboard/reports/new`

## 🎨 Architecture

### Layout à 3 Colonnes

```
┌──────────────────────────────────────────────────────────────┐
│                         Header                                │
│  [← Back]  Nouveau rapport    [Sauvegarder] [Publier]       │
├──────────┬─────────────────────────────────┬─────────────────┤
│   Left   │           Main Area             │   Right Preview │
│ Sidebar  │                                 │     (320px)     │
│ (280px)  │      Rich Text Editor           │                 │
│          │        (flex-1)                 │   [Collapse →]  │
│  Config  │                                 │                 │
│  Form    │   MinimalTiptap Editor          │   Live Preview  │
│          │                                 │                 │
│          │   Full-width editing area       │   HTML render   │
│          │                                 │                 │
└──────────┴─────────────────────────────────┴─────────────────┘
```

## 🔧 Fonctionnalités

### Left Sidebar - Configuration Form

- **Titre** (requis) - Titre du rapport
- **Modèle** - Sélection d'un template prédéfini
- **Format d'export** - PDF, Word, Excel
- **Période** - Optionnel, ex: "Janvier 2026"
- **Résumé IA** - Toggle pour activer la génération automatique
- **Raccourcis clavier** - Aide visuelle

### Main Area - Rich Text Editor

- **MinimalTiptap** - Éditeur WYSIWYG complet
- Chargement dynamique (pas de SSR)
- Skeleton pendant le chargement
- Zone d'édition full-width centrée (max-width: 4xl)
- Hauteur minimale: 600px

### Right Sidebar - Live Preview

- Aperçu HTML en temps réel
- Affiche le titre et le contenu formaté
- Collapsible avec bouton ← →
- Scroll indépendant

## 💾 Auto-save

### Fonctionnement

- **Intervalle**: 30 secondes
- **Stockage**: localStorage (clé `report-draft`)
- **Durée**: 24 heures
- **Données sauvegardées**:
  - title
  - content
  - format
  - period
  - includeSummary
  - templateId
  - timestamp

### Comportements

- Sauvegarde automatique toutes les 30s si modifications détectées
- Bouton manuel "Sauvegarder" (Ctrl+S)
- Restauration automatique au chargement si brouillon < 24h
- Nettoyage après publication réussie

## ⌨️ Raccourcis Clavier

| Raccourci | Action                          |
| --------- | ------------------------------- |
| `Ctrl+S`  | Sauvegarder le brouillon        |
| `Esc`     | Annuler et retourner à la liste |

## 🔄 Actions Server

### getReportTemplates

```typescript
// Charger les modèles de rapport disponibles
const { execute: fetchTemplates } = useAction(getReportTemplates)
```

### createReport

```typescript
// Créer un nouveau rapport
const { execute: executeCreate, isExecuting: isCreating } = useAction(
  createReport,
  {
    onSuccess: () => {
      toast.success('Rapport créé avec succès')
      clearDraft()
      router.push('/dashboard/reports')
    },
  },
)
```

## 📋 Types TypeScript

```typescript
interface ReportDraft {
  title: string
  content: string
  format: ReportFormat // "pdf" | "word" | "excel"
  period: string
  includeSummary: boolean
  templateId: string
  timestamp: number
}

type ReportFormat = 'pdf' | 'word' | 'excel'
```

## 🎯 Validation

### Côté Client

- Titre requis (bouton Publier désactivé si vide)
- Toast d'erreur si tentative de publication sans titre

### Côté Serveur

- Schema Zod dans `report.actions.ts`
- Validation du format (enum)
- Validation du titre (min 1 caractère)

## 🔒 Sécurité

### Protection des modifications non sauvegardées

```typescript
// Warning avant navigation
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault()
      e.returnValue = ''
    }
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
}, [hasUnsavedChanges])
```

### Confirmation d'annulation

- Popup de confirmation si modifications non sauvegardées
- Bypass si aucune modification

## 📱 Responsive Design

### Structure Fixed

- Header: hauteur fixe
- Main area: `flex flex-col h-[calc(100vh-4rem)]`
- Sidebars: scroll indépendant

### Breakpoints

- **Desktop**: Layout 3 colonnes complet
- **Tablet/Mobile**: Non optimisé (TODO)

## 🧪 Tests

### Scénarios à Tester

1. ✅ Création rapport vide (titre seul)
2. ✅ Création avec modèle
3. ✅ Chargement modèle (contenu + format)
4. ✅ Auto-save après 30s
5. ✅ Sauvegarde manuelle (Ctrl+S)
6. ✅ Restauration brouillon
7. ✅ Warning navigation non sauvegardée
8. ✅ Collapse/expand preview panel
9. ✅ Publication réussie → redirect
10. ✅ Annulation → retour liste

## 🐛 Points d'Attention

### Performance

- MinimalTiptap chargé dynamiquement (pas de SSR)
- Preview HTML avec `dangerouslySetInnerHTML`
  - ⚠️ **TODO**: Ajouter sanitisation (DOMPurify) si contenu utilisateur non
    fiable

### UX

- Indicateur visuel "Modifications non sauvegardées" dans le header
- Désactivation des contrôles pendant `isCreating`
- Skeleton pendant chargement templates

### Limitations

- Preview panel: pas de sanitisation HTML actuellement
- Pas de versioning des brouillons (1 seul brouillon à la fois)
- Pas de collaboration temps réel

## 🔗 Navigation

### Entrée

- Depuis `/dashboard/reports` via bouton "Créer un rapport"
- Ou navigation directe vers `/dashboard/reports/new`

### Sortie

- Publication réussie → `/dashboard/reports`
- Annulation → `/dashboard/reports`
- Bouton retour (←) → `/dashboard/reports` (avec confirmation si unsaved)

## 📦 Composants Utilisés

```typescript
// shadcn/ui
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

// Lucide icons
import {
  ArrowLeft,
  Save,
  Send,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

// Dynamic editor
import { MinimalTiptap } from '@/components/ui/minimal-tiptap-dynamic'

// Toast notifications
import { toast } from 'sonner'
```

## 🚀 Améliorations Futures

### Priorité Haute

- [ ] Responsive design pour mobile/tablet
- [ ] Sanitisation HTML pour preview (DOMPurify)
- [ ] Gestion erreurs réseau (retry logic)

### Priorité Moyenne

- [ ] Versioning des brouillons (historique)
- [ ] Export direct depuis la page (sans passer par liste)
- [ ] Preview par format (PDF, Word, Excel)
- [ ] Upload d'images dans l'éditeur

### Priorité Basse

- [ ] Collaboration temps réel (WebSocket)
- [ ] Suggestions IA pour le contenu
- [ ] Templates drag-and-drop
- [ ] Mode plein écran pour l'éditeur

## 🎓 Exemples d'Usage

### Création Rapport Simple

```typescript
1. Remplir le titre: "Rapport Mensuel Janvier 2026"
2. Sélectionner format: "PDF"
3. Écrire le contenu dans l'éditeur
4. Cliquer "Publier"
```

### Utilisation d'un Modèle

```typescript
1. Sélectionner un modèle dans le dropdown
2. Le contenu est chargé automatiquement
3. Le format est défini selon le modèle
4. Modifier le contenu selon besoin
5. Cliquer "Publier"
```

### Sauvegarde Brouillon

```typescript
1. Commencer à rédiger
2. Attendre 30s → auto-save
   OU
   Ctrl+S → save manuel
3. Fermer le navigateur
4. Revenir plus tard → brouillon restauré automatiquement
```

## 📊 Métriques

### Bundle Size Impact

- MinimalTiptap: ~250KB (lazy loaded)
- Total page JS: ~15KB (sans éditeur)
- First Load JS: ~15KB (éditeur chargé à la demande)

### Performance Targets

- Time to Interactive: < 2s
- Editor load time: < 500ms
- Auto-save duration: < 100ms
