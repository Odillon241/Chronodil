# 📊 Graphique des Statistiques de Tâches - Évolutivité

## ✅ État Actuel

Le graphique `TaskStatsChart` est **partiellement évolutif** avec les fonctionnalités suivantes :

### Fonctionnalités Implémentées

1. **✅ Props configurables**
   - `period`: Type de période (week/month/quarter) - *préparé pour usage futur*
   - `periodCount`: Nombre de périodes à afficher - *préparé pour usage futur*
   - `title`: Titre personnalisable
   - `description`: Description personnalisable
   - `height`: Hauteur du graphique personnalisable

2. **✅ Données historiques**
   - Récupération des données des 4 dernières semaines
   - Groupement par semaine avec comptage par statut
   - Fallback sur données factices si aucune donnée historique

3. **✅ Interface flexible**
   - Composant réutilisable dans d'autres pages
   - Props optionnelles avec valeurs par défaut
   - Gestion des cas sans données

## 🚀 Améliorations Possibles pour Plus d'Évolutivité

### 1. **Utiliser TaskActivity pour Données Historiques Réelles** ⭐ RECOMMANDÉ

**Problème actuel** : Le graphique utilise le statut actuel des tâches, pas leur statut historique réel.

**Solution** : Utiliser la table `TaskActivity` pour reconstruire l'historique des statuts :

```typescript
// Dans getDashboardData, remplacer la logique actuelle par :
const taskActivities = await prisma.taskActivity.findMany({
  where: {
    Task: { createdBy: userId },
    action: "status_changed",
    createdAt: { gte: weeks[0].weekStart },
  },
  select: {
    taskId: true,
    oldValue: true,
    newValue: true,
    createdAt: true,
  },
  orderBy: { createdAt: "asc" },
});

// Reconstruire l'état des tâches à chaque point dans le temps
// En utilisant les changements de statut enregistrés
```

**Avantages** :
- ✅ Données historiques précises
- ✅ Reflète les changements réels de statut
- ✅ Plus fiable pour l'analyse des tendances

### 2. **Ajouter des Filtres** ⭐ RECOMMANDÉ

**Props à ajouter** :
```typescript
interface TaskStatsChartProps {
  // ... props existantes
  projectId?: string; // Filtrer par projet
  userId?: string; // Filtrer par utilisateur (pour les admins)
  dateRange?: { start: Date; end: Date }; // Période personnalisée
}
```

**Implémentation** :
- Ajouter des contrôles UI (Select pour projet, DatePicker pour période)
- Passer les filtres à `getDashboardData`
- Filtrer les requêtes Prisma en conséquence

### 3. **Support Multi-Périodes**

**Actuellement** : Seulement les semaines sont supportées.

**Amélioration** :
```typescript
// Dans getDashboardData, adapter selon period:
if (period === "month") {
  // Grouper par mois
  const months = [];
  for (let i = periodCount - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    // ...
  }
} else if (period === "quarter") {
  // Grouper par trimestre
  // ...
}
```

### 4. **Ajouter d'Autres Métriques**

**Métriques possibles** :
- Temps moyen de complétion (entre création et DONE)
- Taux de complétion (% de tâches terminées)
- Tâches bloquées (statut BLOCKED)
- Tâches en review (statut REVIEW)
- Priorité moyenne

**Implémentation** :
```typescript
interface TaskStatsChartProps {
  // ... props existantes
  metrics?: ("count" | "completionRate" | "avgCompletionTime")[];
}
```

### 5. **Types de Graphiques Multiples**

**Actuellement** : Seulement Area Chart (stacked).

**Amélioration** :
```typescript
interface TaskStatsChartProps {
  // ... props existantes
  chartType?: "area" | "line" | "bar";
}
```

**Implémentation** :
- Conditionner le rendu selon `chartType`
- Utiliser `LineChart` ou `BarChart` de Recharts

### 6. **Export et Partage**

**Fonctionnalités** :
- Export en PNG/PDF
- Partage via URL avec paramètres
- Export CSV des données

**Implémentation** :
```typescript
// Ajouter des boutons dans CardHeader
<Button onClick={handleExportPNG}>Exporter PNG</Button>
<Button onClick={handleExportCSV}>Exporter CSV</Button>
```

### 7. **Comparaison Temporelle**

**Fonctionnalité** : Comparer la période actuelle avec la période précédente.

**Implémentation** :
```typescript
interface TaskStatsChartProps {
  // ... props existantes
  showComparison?: boolean; // Afficher % de changement
}
```

### 8. **Mode Temps Réel**

**Fonctionnalité** : Mise à jour automatique via WebSocket/Realtime.

**Implémentation** :
- Utiliser `useRealtimeTasks` hook existant
- Re-fetch les données quand une tâche change
- Animation de transition lors des mises à jour

## 📝 Plan d'Implémentation Recommandé

### Phase 1 : Précision des Données (Priorité Haute)
1. ✅ Utiliser `TaskActivity` pour données historiques réelles
2. ✅ Tester avec données réelles
3. ✅ Optimiser les requêtes Prisma

### Phase 2 : Filtres et Flexibilité (Priorité Moyenne)
1. ✅ Ajouter filtres par projet
2. ✅ Ajouter sélecteur de période
3. ✅ Support mois/trimestre

### Phase 3 : Métriques Avancées (Priorité Basse)
1. ✅ Ajouter autres métriques
2. ✅ Comparaison temporelle
3. ✅ Export/Partage

## 🔧 Code d'Exemple pour Utilisation Future

```typescript
// Utilisation basique (actuelle)
<TaskStatsChart
  todo={data.todoCount}
  inProgress={data.inProgressCount}
  done={data.doneCount}
  weeklyData={data.taskWeeklyData}
/>

// Utilisation avancée (futur)
<TaskStatsChart
  todo={data.todoCount}
  inProgress={data.inProgressCount}
  done={data.doneCount}
  weeklyData={data.taskWeeklyData}
  period="month"
  periodCount={6}
  projectId={selectedProjectId}
  chartType="line"
  showComparison={true}
  height={400}
/>
```

## 📊 Conclusion

Le graphique est **déjà évolutif** avec :
- ✅ Props configurables
- ✅ Structure modulaire
- ✅ Facile à étendre

**Prochaine étape recommandée** : Utiliser `TaskActivity` pour des données historiques précises (Phase 1).

