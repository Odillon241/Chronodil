# 🚀 Instructions de Déploiement - Champ Position

## ✅ Corrections appliquées (Build réussi)

### 1. Import manquant Briefcase
- **Erreur**: `Briefcase is not defined`
- **Fichier**: `src/app/dashboard/settings/profile/page.tsx`
- **Solution**: Ajout de `Briefcase` aux imports de `lucide-react`

### 2. TypeScript casts temporaires
- **Erreur**: `Property 'position' does not exist on type...`
- **Fichiers**:
  - `src/app/dashboard/settings/profile/page.tsx`
  - `src/app/dashboard/hr-timesheet/new/page.tsx`
- **Solution**: Ajout de casts `as any` temporaires pour `userData.position`
- **Note**: Ces casts seront automatiquement résolus après la migration SQL et la régénération de Prisma

---

## 📋 Prochaines étapes OBLIGATOIRES

### Étape 1: Exécuter la migration SQL dans Supabase ⚠️ IMPORTANT

**Le champ `position` n'existe pas encore dans la base de données !**

1. Ouvrez votre projet Supabase Dashboard
2. Allez dans **SQL Editor**
3. Créez une nouvelle query
4. Copiez et exécutez le SQL suivant :

```sql
-- Migration: add_position_to_user
-- Description: Ajoute le champ position (poste) au modèle User

-- Ajouter la colonne position à la table User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "position" TEXT;

-- Commentaire pour indiquer l'usage de ce champ
COMMENT ON COLUMN "User"."position" IS 'Poste/fonction de l''utilisateur dans l''entreprise';
```

5. Cliquez sur **Run** (ou appuyez sur F5)
6. Vérifiez que la requête s'est exécutée sans erreur
7. Vérifiez que la colonne `position` est maintenant visible dans la table `User`

**Alternative**: Vous pouvez aussi copier le contenu du fichier `prisma/migrations/add_position_to_user.sql`

---

### Étape 2: Régénérer le client Prisma

Une fois la migration SQL exécutée dans Supabase :

```bash
# Arrêtez le serveur de développement (Ctrl+C)
pnpm prisma db pull

# Régénérez le client Prisma
pnpm prisma generate

# Redémarrez le serveur de développement
pnpm dev
```

**Note**: Si vous obtenez une erreur de permission lors de `pnpm prisma generate`, assurez-vous que :
- Aucun serveur de dev n'est en cours d'exécution
- Aucun processus ne verrouille les fichiers `.prisma`
- Si le problème persiste, redémarrez votre terminal ou votre IDE

---

### Étape 3: Test des fonctionnalités

Une fois Prisma régénéré, testez les fonctionnalités :

#### 3.1 Page Profil
1. Allez sur `/dashboard/settings/profile`
2. Cliquez sur **Modifier**
3. Renseignez votre poste (ex: "Développeur Full-Stack", "Chef de projet", etc.)
4. Cliquez sur **Enregistrer**
5. Vérifiez que le poste s'affiche correctement

#### 3.2 Création de feuille de temps
1. Allez sur `/dashboard/hr-timesheet/new`
2. Vérifiez que les champs **Nom** et **Poste** sont automatiquement pré-remplis
3. Ajoutez une activité
4. Enregistrez la feuille de temps

#### 3.3 Export Excel
1. Ouvrez une feuille de temps existante
2. Cliquez sur le bouton **Export** (icône Download)
3. Vérifiez que le fichier Excel se télécharge
4. Ouvrez le fichier et vérifiez que le poste est bien affiché

---

## 🔍 En cas de problème

### Problème: L'export de feuille de temps ne fonctionne toujours pas

**Diagnostics à effectuer**:

1. **Console du navigateur** (F12):
   - Ouvrez les Developer Tools
   - Allez dans l'onglet Console
   - Tentez l'export
   - Partagez les messages d'erreur

2. **Logs du serveur Next.js**:
   - Regardez le terminal où `pnpm dev` tourne
   - Tentez l'export
   - Partagez les erreurs serveur

3. **Vérifications de base**:
   - La feuille de temps contient au moins une activité ?
   - L'utilisateur a les permissions nécessaires ?
   - Le statut de la feuille de temps permet l'export ?

### Problème: Prisma generate échoue avec erreur de permission

**Solution**:
1. Arrêtez tous les processus Node.js (serveur dev, build, etc.)
2. Fermez votre IDE (VSCode, etc.)
3. Ouvrez un nouveau terminal
4. Relancez `pnpm prisma generate`
5. Si le problème persiste, redémarrez Windows

### Problème: Le champ position n'apparaît pas dans le formulaire

**Vérifiez**:
1. La migration SQL a bien été exécutée dans Supabase
2. Le client Prisma a été régénéré
3. Le serveur de dev a été redémarré après la régénération
4. Rafraîchissez la page (Ctrl+F5 pour forcer le cache)

---

## 📊 Résumé des modifications

### Commits créés
1. **`39185dd`**: Ajout du champ position et corrections principales
2. **`81ce256`**: Corrections TypeScript et build

### Fichiers modifiés (10 fichiers)
1. `prisma/schema.prisma` - Ajout champ position
2. `prisma/migrations/add_position_to_user.sql` - Migration SQL
3. `src/actions/hr-timesheet.actions.ts` - Fix include
4. `src/actions/user.actions.ts` - Support position
5. `src/lib/validations/user.ts` - Validation position
6. `src/app/dashboard/settings/profile/page.tsx` - UI profil + fix import Briefcase + cast TypeScript
7. `src/app/dashboard/hr-timesheet/new/page.tsx` - Auto-remplissage + cast TypeScript
8. `MODIFICATIONS_TIMESHEET_EXPORT.md` - Documentation détaillée
9. `INSTRUCTIONS_DEPLOYMENT.md` - Ce fichier

### Branches
- **Branche de travail**: `claude/fix-timesheet-export-01XLpk3ACpqzXmAUAp6hP2oC`
- **Commits**: 2 commits pushés sur GitHub

---

## 🎯 Checklist de déploiement

- [ ] **Exécuter la migration SQL dans Supabase** ⚠️ CRITIQUE
- [ ] Vérifier que la colonne `position` existe dans la table `User`
- [ ] Exécuter `pnpm prisma db pull`
- [ ] Exécuter `pnpm prisma generate`
- [ ] Redémarrer le serveur de développement
- [ ] Tester la page profil (édition du poste)
- [ ] Tester la création de feuille de temps (auto-remplissage)
- [ ] Tester l'export Excel
- [ ] Vérifier que le workflow de validation fonctionne
- [ ] Merger la branche dans `main` si tout fonctionne

---

## 📖 Documentation complète

Pour plus de détails, consultez :
- `MODIFICATIONS_TIMESHEET_EXPORT.md` - Documentation complète des modifications
- `prisma/migrations/add_position_to_user.sql` - Script de migration SQL

---

**Auteur**: Claude Code
**Date**: 2025-11-17
**Build Status**: ✅ Réussi (28 routes générées)
**Branch**: `claude/fix-timesheet-export-01XLpk3ACpqzXmAUAp6hP2oC`

---

## 🆘 Support

Si vous rencontrez des problèmes, partagez :
1. Les messages d'erreur de la console navigateur (F12)
2. Les logs du serveur Next.js
3. Le résultat de `pnpm prisma db pull`
4. Le résultat de `pnpm prisma generate`
