# 📋 Mise à jour du Catalogue d'Activités RH - 2025-11-13

## 🎯 Objectif
Mettre à jour les catégories et noms d'activités RH selon le fichier Excel "MODIFICATION SUR LA FRH DU 12-11-2025.csv"

## 📊 Nouveau Catalogue d'Activités

### Structure des catégories

Le nouveau catalogue comprend **4 catégories** avec **44 activités** au total :

#### 1. ADMINISTRATION (10 activités - Type: OPERATIONAL)
- Courrier / Correspondances (WEEKLY)
- Archivage hebdomadaire (WEEKLY)
- Renseignement des cartes de travail (WEEKLY)
- Renseignement des registres (WEEKLY)
- Immatriculation / retraits (CNSS/CNAMGS/ASSURANCE) (PUNCTUAL)
- Entretiens de recrutement (PUNCTUAL)
- Analyse CV des candidats (PUNCTUAL)
- Rédaction des fiches de poste (PUNCTUAL)
- Rédaction des fiches d'objectifs (PUNCTUAL)
- AUTRES - Administration (null)

#### 2. CONTROLE ET REPORTING (17 activités - Type: REPORTING)
- Tableaux de bord (WEEKLY)
- Indicateurs de performance (MONTHLY)
- Variables de la paie (MONTHLY)
- Dossiers du personnel (WEEKLY)
- Contrats de travail (PUNCTUAL)
- Periode d'essai (PUNCTUAL)
- Rapport des incident (PUNCTUAL)
- Rapport des CDD (MONTHLY)
- Rapport des réclamations (MONTHLY)
- Evaluation des fin de CDD (PUNCTUAL)
- Rapport mensuel (MONTHLY)
- Rapport hebdomadaire (WEEKLY)
- Suivi du plan de congé (WEEKLY)
- Suivi du plan de formation (MONTHLY)
- Checklists (Recrutement, paie, congés, discipline, fin de contrat) (WEEKLY)
- Suivi des dossiers de mise en retraite (MONTHLY)
- AUTRES - Contrôle et Reporting (null)

#### 3. PROJETS & AUDITS (6 activités - Type: OPERATIONAL)
- Projet - clients (PUNCTUAL)
- Projet - Odillon (PUNCTUAL)
- Prospection client (PUNCTUAL)
- Projet RSE Odillon (PUNCTUAL)
- Audit externe (clients) (PUNCTUAL)
- AUTRES - Projets & Audits (null)

#### 4. DEVELOPPEMENT/LEARNING (5 activités - Type: OPERATIONAL)
- Formation interne Odillon (PUNCTUAL)
- Formation externe (PUNCTUAL)
- Session de coaching (PUNCTUAL)
- Séminaire / conférence (PUNCTUAL)
- AUTRES - Développement/Learning (null)

## 🔧 Modifications Techniques

### 1. Fichiers créés

#### a) Script SQL de mise à jour
**Fichier** : [scripts/sql/update_activity_catalog.sql](scripts/sql/update_activity_catalog.sql)
- Insert/Update de 44 activités dans la table `ActivityCatalog`
- Utilise `ON CONFLICT` pour remplacer les activités existantes
- Mapping des catégories aux types (OPERATIONAL/REPORTING)
- Attribution des périodicités par défaut

#### b) Script TypeScript de seed
**Fichier** : [scripts/seed-activity-catalog.ts](scripts/seed-activity-catalog.ts)
- Script exécutable avec `pnpm tsx scripts/seed-activity-catalog.ts`
- Insertion programmatique des activités avec Prisma
- Affichage de logs et résumé par catégorie

#### c) Documentation
**Fichier** : [scripts/README_ACTIVITY_CATALOG.md](scripts/README_ACTIVITY_CATALOG.md)
- Guide complet d'installation
- Instructions SQL et TypeScript
- Procédures de vérification

### 2. Fichiers modifiés

#### a) Page de création de feuille de temps RH
**Fichier** : [src/app/dashboard/hr-timesheet/new/page.tsx](src/app/dashboard/hr-timesheet/new/page.tsx)
- **Ligne 204-206** : Mise à jour de la fonction `getTypeFromCategory()`
  ```typescript
  // AVANT
  return category === "Reporting" ? "REPORTING" : "OPERATIONAL";

  // APRÈS
  return category === "CONTROLE ET REPORTING" ? "REPORTING" : "OPERATIONAL";
  ```

#### b) Page d'édition de feuille de temps RH
**Fichier** : [src/app/dashboard/hr-timesheet/[id]/edit/page.tsx](src/app/dashboard/hr-timesheet/[id]/edit/page.tsx)
- **Ligne 348-351** : Mise à jour de la fonction `getTypeFromCategory()`
  ```typescript
  // AVANT
  return category === "Reporting" ? "REPORTING" : "OPERATIONAL";

  // APRÈS
  return category === "CONTROLE ET REPORTING" ? "REPORTING" : "OPERATIONAL";
  ```

## 🚀 Procédure d'Installation

### Étape 1 : Exécuter le script SQL dans Supabase

1. Ouvrir [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Copier le contenu de `scripts/sql/update_activity_catalog.sql`
3. Exécuter le script (il va remplacer les activités existantes)
4. Vérifier le résumé affiché automatiquement
5. Vérifier le nombre total :
   ```sql
   SELECT COUNT(*) FROM "ActivityCatalog"; -- Doit retourner au minimum 44
   ```

### Étape 2 : Vérifier dans l'application

1. Lancer l'application en développement : `pnpm dev`
2. Aller sur `/dashboard/hr-timesheet/new`
3. Sélectionner "Saisie manuelle"
4. Vérifier que les 4 catégories apparaissent :
   - ADMINISTRATION
   - CONTROLE ET REPORTING
   - PROJETS & AUDITS
   - DEVELOPPEMENT/LEARNING
5. Sélectionner "CONTROLE ET REPORTING" et vérifier que le badge affiche "Reporting"
6. Sélectionner une autre catégorie et vérifier que le badge affiche "Opérationnel"

### Étape 3 : Nettoyer les anciennes données (optionnel)

Le script utilise `ON CONFLICT` qui met à jour automatiquement les activités existantes.

Si vous souhaitez vraiment repartir de zéro (⚠️ **à éviter en production**) :

```sql
-- ⚠️ ATTENTION : Cette commande supprime TOUTES les activités existantes
DELETE FROM "ActivityCatalog";

-- Puis réexécuter le script scripts/sql/update_activity_catalog.sql
```

## 📝 Notes importantes

### Mapping Type / Périodicité

| Catégorie | Type | Périodicités communes |
|-----------|------|----------------------|
| ADMINISTRATION | OPERATIONAL | WEEKLY, PUNCTUAL |
| CONTROLE ET REPORTING | REPORTING | WEEKLY, MONTHLY |
| PROJETS & AUDITS | OPERATIONAL | PUNCTUAL |
| DEVELOPPEMENT/LEARNING | OPERATIONAL | PUNCTUAL |

### Activités "AUTRES"

- Chaque catégorie a une activité "AUTRES" sans périodicité par défaut (`null`)
- Permet de saisir des activités personnalisées dans chaque catégorie

### Compatibilité

- ✅ Compatible avec le schéma Prisma existant
- ✅ Pas de migration Prisma nécessaire
- ✅ Fonctionnement immédiat après insertion SQL

## ✅ Checklist de validation

- [x] Script SQL créé
- [x] Script TypeScript créé
- [x] Documentation rédigée
- [x] Fonction `getTypeFromCategory` mise à jour (new/page.tsx)
- [x] Fonction `getTypeFromCategory` mise à jour (edit/page.tsx)
- [ ] Script SQL exécuté dans Supabase
- [ ] Vérification interface utilisateur
- [ ] Test de création d'une feuille de temps avec nouvelles activités
- [ ] Test d'édition d'une feuille de temps avec nouvelles activités

## 🎓 Pour aller plus loin

### Ajouter une nouvelle activité

1. **Via SQL** :
   ```sql
   INSERT INTO "ActivityCatalog" (id, name, category, type, "defaultPeriodicity", description, "isActive", "sortOrder", "createdAt", "updatedAt")
   VALUES (gen_random_uuid(), 'Nouvelle activité', 'ADMINISTRATION', 'OPERATIONAL', 'WEEKLY', 'Description', true, 99, now(), now());
   ```

2. **Via Prisma Studio** :
   - Ouvrir Prisma Studio : `pnpm prisma studio`
   - Naviguer vers le modèle `ActivityCatalog`
   - Cliquer sur "Add record"

### Désactiver une activité

Au lieu de supprimer une activité, il est recommandé de la désactiver :

```sql
UPDATE "ActivityCatalog"
SET "isActive" = false
WHERE name = 'Nom de l''activité';
```

## 📞 Support

En cas de problème :
1. Vérifier les logs de l'application : `pnpm dev`
2. Vérifier les données dans Prisma Studio : `pnpm prisma studio`
3. Consulter le fichier [scripts/README_ACTIVITY_CATALOG.md](scripts/README_ACTIVITY_CATALOG.md)

---

**Source** : MODIFICATION SUR LA FRH DU 12-11-2025.csv
**Date** : 2025-11-13
**Auteur** : Claude Code
