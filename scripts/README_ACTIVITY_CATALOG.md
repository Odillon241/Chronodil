# Catalogue d'activités RH - Guide d'installation

Ce guide explique comment peupler la base de données avec le catalogue d'activités RH basé sur le fichier Excel "MODIFICATION SUR LA FRH DU 12-11-2025".

## 📋 Contenu du catalogue

Le catalogue contient **4 catégories** avec **44 activités** au total :

### 1. ADMINISTRATION (10 activités - Type: OPERATIONAL)
- Courrier / Correspondances
- Archivage hebdomadaire
- Renseignement des cartes de travail
- Renseignement des registres
- Immatriculation / retraits (CNSS/CNAMGS/ASSURANCE)
- Entretiens de recrutement
- Analyse CV des candidats
- Rédaction des fiches de poste
- Rédaction des fiches d'objectifs
- AUTRES - Administration

### 2. CONTROLE ET REPORTING (17 activités - Type: REPORTING)
- Tableaux de bord
- Indicateurs de performance
- Variables de la paie
- Dossiers du personnel
- Contrats de travail
- Periode d'essai
- Rapport des incident
- Rapport des CDD
- Rapport des réclamations
- Evaluation des fin de CDD
- Rapport mensuel
- Rapport hebdomadaire
- Suivi du plan de congé
- Suivi du plan de formation
- Checklists (Recrutement, paie, congés, discipline, fin de contrat)
- Suivi des dossiers de mise en retraite
- AUTRES - Contrôle et Reporting

### 3. PROJETS & AUDITS (6 activités - Type: OPERATIONAL)
- Projet - clients
- Projet - Odillon
- Prospection client
- Projet RSE Odillon
- Audit externe (clients)
- AUTRES - Projets & Audits

### 4. DEVELOPPEMENT/LEARNING (5 activités - Type: OPERATIONAL)
- Formation interne Odillon
- Formation externe
- Session de coaching
- Séminaire / conférence
- AUTRES - Développement/Learning

## 🚀 Installation

### Option 1: Via SQL (Recommandé pour Supabase)

1. Ouvrez [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Copiez le contenu du fichier `scripts/sql/update_activity_catalog.sql`
3. Exécutez le script

```sql
-- Le script utilise ON CONFLICT pour remplacer les activités existantes
-- Si une activité existe déjà, elle sera mise à jour
-- Si elle n'existe pas, elle sera créée
```

### Option 2: Via script TypeScript (Développement local)

1. Installez `tsx` si ce n'est pas déjà fait :
```bash
pnpm add -D tsx
```

2. Exécutez le script de seed :
```bash
pnpm tsx scripts/seed-activity-catalog.ts
```

3. Vérifiez les résultats :
```bash
pnpm prisma studio
```

## 📊 Vérification

Après l'exécution, vérifiez que les données sont bien insérées :

```sql
-- Compter le total d'activités
SELECT COUNT(*) FROM "ActivityCatalog";
-- Devrait retourner: 44

-- Résumé par catégorie
SELECT category, type, COUNT(*) as total
FROM "ActivityCatalog"
GROUP BY category, type
ORDER BY category;
```

Résultat attendu :
```
ADMINISTRATION          | OPERATIONAL | 10
CONTROLE ET REPORTING   | REPORTING   | 17
DEVELOPPEMENT/LEARNING  | OPERATIONAL | 5
PROJETS & AUDITS        | OPERATIONAL | 6
```

## 🔧 Mapping Type / Périodicité

### Types d'activités
- **OPERATIONAL** : Activités opérationnelles (Administration, Projets, Formation)
- **REPORTING** : Activités de contrôle et reporting

### Périodicités par défaut
- **WEEKLY** : Activités hebdomadaires (courrier, archivage, tableaux de bord, etc.)
- **MONTHLY** : Activités mensuelles (indicateurs, rapports mensuels, etc.)
- **PUNCTUAL** : Activités ponctuelles (recrutement, formations, projets, etc.)
- **DAILY** : Activités quotidiennes (non utilisé dans ce catalogue)
- **WEEKLY_MONTHLY** : Activités hebdo/mensuelles (non utilisé dans ce catalogue)

## 🔄 Mise à jour

Pour mettre à jour le catalogue :

1. Modifiez le script TypeScript ou SQL
2. **Important** : Si vous avez déjà des activités existantes, décommentez la ligne de suppression dans le script :
   ```typescript
   // await prisma.activityCatalog.deleteMany({});
   ```
3. Réexécutez le script

## 🧪 Test

Après l'installation, testez dans l'application :

1. Allez sur `/dashboard/hr-timesheet/new`
2. Sélectionnez "Saisie manuelle"
3. Vérifiez que les catégories apparaissent dans le sélecteur
4. Sélectionnez une catégorie et vérifiez que les activités correspondantes s'affichent

## ⚠️ Notes importantes

- Les activités "AUTRES" n'ont pas de périodicité par défaut (`null`) pour permettre une flexibilité maximale
- Le champ `sortOrder` est utilisé pour maintenir l'ordre d'affichage dans les listes
- Toutes les activités sont créées avec `isActive: true`
- Les IDs sont générés automatiquement avec `gen_random_uuid()` (SQL) ou `crypto.randomUUID()` (TypeScript)

## 📝 Source

Données extraites de : **MODIFICATION SUR LA FRH DU 12-11-2025.csv**
Date de création : 2025-11-13
