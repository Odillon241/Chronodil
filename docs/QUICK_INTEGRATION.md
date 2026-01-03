# ⚡ Quick Integration Guide - Task Complexity

Si vous intégrez le système de complexité dans votre interface, voici les snippets code rapides.

## 🎯 Imports Obligatoires

```typescript
// Composants
import { TaskComplexityBadge } from '@/components/features/task-complexity-badge';
import { TaskComplexitySelector } from '@/components/features/task-complexity-selector';
import { TaskEvaluationForm } from '@/components/features/task-evaluation-form';

// Actions
import { evaluateTask, updateTaskComplexity } from '@/actions/task.actions';

// Types
import { TaskComplexity, TrainingLevel, MasteryLevel, UnderstandingLevel } from '@prisma/client';
```

---

## 🔧 Snippets Code

### 1. Afficher Badge Complexité

```tsx
// Dans liste tâche
<TaskComplexityBadge complexity={task.complexity} size="md" />

// Dans détail tâche
<TaskComplexityBadge complexity={task.complexity} size="lg" />
```

### 2. Sélectionner Complexité (Création/Édition)

```tsx
'use client';
import { useState } from 'react';
import { TaskComplexitySelector } from '@/components/features/task-complexity-selector';

export function TaskCreationForm() {
  const [complexity, setComplexity] = useState<TaskComplexity>('MOYEN');

  return (
    <form>
      <TaskComplexitySelector
        value={complexity}
        onValueChange={setComplexity}
        required={true}
      />
      {/* Autres champs */}
    </form>
  );
}
```

### 3. Afficher Formulaire d'Évaluation

```tsx
'use client';
import { useState } from 'react';
import { TaskEvaluationForm } from '@/components/features/task-evaluation-form';
import { evaluateTask } from '@/actions/task.actions';

export function TaskDetailPanel({ task }) {
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluation = async (data) => {
    try {
      await evaluateTask({
        id: task.id,
        trainingLevel: data.trainingLevel,
        masteryLevel: data.masteryLevel,
        understandingLevel: data.understandingLevel,
        evaluationNotes: data.evaluationNotes,
      });
      toast.success('Évaluation enregistrée');
    } catch (error) {
      toast.error('Erreur lors de l\'évaluation');
    }
  };

  return (
    <div>
      <h2>Détails Tâche</h2>

      {/* Badge complexité */}
      <TaskComplexityBadge complexity={task.complexity} size="lg" />

      {/* Formulaire évaluation */}
      <TaskEvaluationForm
        trainingLevel={task.trainingLevel}
        masteryLevel={task.masteryLevel}
        understandingLevel={task.understandingLevel}
        evaluationNotes={task.evaluationNotes}
        onEvaluationChange={handleEvaluation}
        isReadOnly={!canEdit}
      />
    </div>
  );
}
```

### 4. Changer Complexité

```tsx
'use client';
import { updateTaskComplexity } from '@/actions/task.actions';
import { TaskComplexity } from '@prisma/client';

async function handleComplexityChange(taskId: string, newComplexity: TaskComplexity) {
  try {
    await updateTaskComplexity({
      id: taskId,
      complexity: newComplexity,
      recurrence: 'WEEKLY', // optionnel
    });
    toast.success('Complexité mise à jour');
  } catch (error) {
    toast.error('Erreur');
  }
}
```

### 5. Afficher Historique d'Évaluation

```tsx
'use client';

export function TaskActivityTimeline({ taskActivities }) {
  return (
    <div>
      {taskActivities.map(activity => (
        <div key={activity.id}>
          {/* Affiche les évaluations */}
          {activity.action === 'task_evaluated' && (
            <div className="bg-blue-50 p-3 rounded">
              <strong>{activity.User.name}</strong> a évalué la tâche
              <p className="text-sm text-gray-600">{activity.description}</p>
              <time className="text-xs">{new Date(activity.createdAt).toLocaleString('fr-FR')}</time>
            </div>
          )}

          {/* Affiche les changements de complexité */}
          {activity.action === 'complexity_changed' && (
            <div className="bg-amber-50 p-3 rounded">
              <strong>{activity.User.name}</strong> a modifié la complexité
              <p className="text-sm text-gray-600">
                De {activity.oldValue} à {activity.newValue}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 📋 Checklist d'Intégration

### Page Création/Édition Tâche
- [ ] Importer `TaskComplexitySelector`
- [ ] Ajouter sélecteur dans formulaire
- [ ] Capturer value et passer à action create/update
- [ ] Passer `complexity` au `createTask()`/`updateTask()`
- [ ] Tester avec les 3 niveaux

### Page Détail Tâche
- [ ] Importer `TaskComplexityBadge`
- [ ] Afficher badge dans header/détails
- [ ] Importer `TaskEvaluationForm`
- [ ] Ajouter section évaluation
- [ ] Connecter `evaluateTask()` action
- [ ] Afficher anciens résultats d'évaluation

### Liste Tâches
- [ ] Importer `TaskComplexityBadge`
- [ ] Afficher badge dans chaque ligne
- [ ] Ajouter filter optionnel par complexité
- [ ] Afficher couleur en background (optionnel)

### Historique Activité
- [ ] Vérifier actions "task_evaluated" et "complexity_changed" visibles
- [ ] Formater descriptions lisibles
- [ ] Afficher timestamps
- [ ] Lier à détail évaluation

---

## 🎨 Styling Avancé

### Colorer les tâches par complexité

```tsx
// Dans liste
const complexityColors = {
  FAIBLE: 'bg-green-50 border-green-200',
  MOYEN: 'bg-amber-50 border-amber-200',
  ÉLEVÉ: 'bg-red-50 border-red-200',
};

<div className={`border rounded p-3 ${complexityColors[task.complexity]}`}>
  {/* Contenu tâche */}
</div>
```

### Filtrer par complexité

```tsx
'use client';
import { useState } from 'react';

export function TaskFilter({ onFilterChange }) {
  const [selectedComplexity, setSelectedComplexity] = useState<TaskComplexity | null>(null);

  const handleSelect = (complexity: TaskComplexity) => {
    setSelectedComplexity(complexity);
    onFilterChange({ complexity });
  };

  return (
    <div className="flex gap-2">
      {(['FAIBLE', 'MOYEN', 'ÉLEVÉ'] as TaskComplexity[]).map(level => (
        <button
          key={level}
          onClick={() => handleSelect(level)}
          className={`px-3 py-1 rounded ${
            selectedComplexity === level ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
```

---

## 🔐 Vérifications de Sécurité

### Avant de déployer

```typescript
// ✅ Action evaluateTask vérifie:
// - Utilisateur authentifié
// - Utilisateur est MANAGER/DIRECTEUR/ADMIN
// - Tâche existe
// - Auto-set evaluatedBy = session.user.id

// ✅ Action updateTaskComplexity vérifie:
// - Utilisateur authentifié
// - Créateur OU MANAGER/DIRECTEUR/ADMIN
// - Tâche existe

// À implémenter côté UI:
// - Ne pas afficher bouton évaluation si non-manager
// - Ne pas afficher sélecteur complexité si pas autorisé
```

---

## ⚠️ Pièges Courants

### ❌ À Éviter

```typescript
// MAUVAIS - Pas de gestion d'erreur
await evaluateTask({ id: taskId, ... });

// MAUVAIS - Pas de vérification permission côté UI
<TaskEvaluationForm onEvaluationChange={...} /> // Pour tout le monde

// MAUVAIS - Pas de feedback utilisateur
handleComplexityChange(...); // Sans toast

// MAUVAIS - Complexité non sauvegardée
<TaskComplexitySelector onValueChange={setLocal} /> // Sans action submit
```

### ✅ À Faire

```typescript
// BON - Avec gestion erreur
try {
  await evaluateTask({ ... });
  toast.success('Évaluation enregistrée');
} catch (error) {
  toast.error('Erreur: ' + error.message);
}

// BON - Avec vérification
{canEvaluate && <TaskEvaluationForm ... />}

// BON - Avec action
await updateTaskComplexity({
  id: taskId,
  complexity: selectedComplexity
});

// BON - Avec soumission formulaire
<form onSubmit={handleSubmit}>
  <TaskComplexitySelector ... />
  <button type="submit">Sauvegarder</button>
</form>
```

---

## 🧪 Test Rapide

### Scénario Minimal de Test

1. **Créer tâche**
   ```
   Aller à Créer Tâche
   Remplir titre "Test Complexité"
   Sélectionner Complexité: "MOYEN"
   Créer
   ```

2. **Vérifier badge**
   ```
   Aller à liste
   Voir badge orange "Moyen"
   Cliquer sur tâche
   Voir badge dans détail
   ```

3. **Évaluer**
   ```
   Ouvrir tâche
   Cliquer "Évaluer"
   Remplir formulaire
   Cliquer "Enregistrer"
   Voir message succès
   ```

4. **Vérifier historique**
   ```
   Onglet Activité
   Voir "a évalué la tâche"
   Cliquer pour voir détails
   ```

---

## 📚 Ressources

- **Critères détaillés** → `TASK_COMPLEXITY_CRITERIA.md`
- **Guide manager** → `MANAGER_GUIDE_TASK_COMPLEXITY.md`
- **Architecture** → `IMPLEMENTATION_SUMMARY.md`
- **Sources** → `src/components/features/task-*.tsx`

---

## 💬 Questions Fréquentes

**Q: Comment je sais si l'user peut évaluer ?**
A: Vérifier `session.user.role` incluait "MANAGER", "DIRECTEUR" ou "ADMIN"

**Q: Quelle complexité par défaut ?**
A: "MOYEN" (voir schema.prisma @default(MOYEN))

**Q: Je peux modifier complexité après évaluation ?**
A: Oui ! Via `updateTaskComplexity()`. Audit trail complet.

**Q: Où voir tous les changements ?**
A: Onglet Activité → filtre par "complexity_changed" ou "task_evaluated"

---

**V1.0** - Oct 2024
