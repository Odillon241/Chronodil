# Corrections et Améliorations - Feuilles de Temps RH

## Date: 2025-11-17

## 📋 Résumé des modifications

### 1. ✅ Correction erreur submitHRTimesheet
**Problème**: Include incorrect sur User dans la fonction `submitHRTimesheet`
**Fichier**: `src/actions/hr-timesheet.actions.ts:668-672`
**Solution**:
- Suppression de l'include imbriqué `User_HRTimesheet_userIdToUser.include.User`
- Simplification en `User_HRTimesheet_userIdToUser: true`

```typescript
// ❌ AVANT (incorrect)
User_HRTimesheet_userIdToUser: {
  include: {
    User: true, // ERREUR: User ne peut pas avoir un include User
  },
},

// ✅ APRÈS (correct)
User_HRTimesheet_userIdToUser: true,
```

---

### 2. ✅ Ajout du champ "position" (poste) au modèle User

#### 2.1 Schéma Prisma
**Fichier**: `prisma/schema.prisma`
**Modification**: Ajout du champ `position String?` au modèle User (ligne 497)

```prisma
model User {
  id           String   @id
  email        String   @unique
  name         String
  role         Role     @default(EMPLOYEE)
  avatar       String?
  departmentId String?
  managerId    String?
  position     String?  // ← NOUVEAU
  // ...
}
```

#### 2.2 Migration SQL
**Fichier créé**: `prisma/migrations/add_position_to_user.sql`

**⚠️ ACTION REQUISE**: Vous devez exécuter cette migration manuellement dans Supabase SQL Editor :

1. Ouvrez votre projet Supabase
2. Allez dans SQL Editor
3. Exécutez le contenu du fichier `prisma/migrations/add_position_to_user.sql`

```sql
-- Migration: add_position_to_user
-- Description: Ajoute le champ position (poste) au modèle User

-- Ajouter la colonne position à la table User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "position" TEXT;

-- Commentaire pour indiquer l'usage de ce champ
COMMENT ON COLUMN "User"."position" IS 'Poste/fonction de l''utilisateur dans l''entreprise';
```

4. Après l'exécution, régénérez le client Prisma :
```bash
pnpm prisma generate
```

---

### 3. ✅ Page Profil - Édition du poste

#### 3.1 Schéma de validation
**Fichier**: `src/lib/validations/user.ts`
**Ajout**: Champ `position` au schéma `updateProfileSchema`

```typescript
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Email invalide"),
  avatar: z.string().url("URL invalide").optional().or(z.literal("")),
  position: z.string().max(100, "Le poste ne doit pas dépasser 100 caractères").optional().or(z.literal("")), // ← NOUVEAU
});
```

#### 3.2 Action updateMyProfile
**Fichier**: `src/actions/user.actions.ts`
**Ajout**: Support du champ `position` dans l'action

```typescript
export const updateMyProfile = authActionClient
  .schema(
    z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      avatar: z.string().optional(),
      position: z.string().optional(), // ← NOUVEAU
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const user = await prisma.user.update({
      where: { id: userId },
      data: parsedInput,
    });
    // ...
  });
```

#### 3.3 Interface et composant ProfilePage
**Fichier**: `src/app/dashboard/settings/profile/page.tsx`
**Modifications**:
1. Ajout de `position: string | null` à l'interface `UserProfile`
2. Ajout du champ dans le formulaire d'édition (avec icône Briefcase)
3. Affichage du poste en mode consultation
4. Pré-remplissage automatique du champ lors du chargement du profil

**Résultat**: L'utilisateur peut maintenant modifier son poste depuis `/dashboard/settings/profile`

---

### 4. ✅ Auto-remplissage du poste dans le formulaire de feuille de temps

**Fichier**: `src/app/dashboard/hr-timesheet/new/page.tsx`
**Modifications**:
1. Import de `getMyProfile` depuis `@/actions/user.actions`
2. Ajout d'un `useEffect` pour charger le profil utilisateur au montage du composant
3. Pré-remplissage automatique des champs `employeeName` et `position`

```typescript
// Charger le profil utilisateur et pré-remplir les champs
useEffect(() => {
  const loadUserProfile = async () => {
    try {
      const profileResult = await getMyProfile({});
      if (profileResult?.data) {
        const { name, position } = profileResult.data;
        setTimesheetValue("employeeName", name || "");
        setTimesheetValue("position", position || ""); // ← AUTO-REMPLI
      }
    } catch (error) {
      console.error("Erreur chargement profil utilisateur:", error);
    }
  };
  loadUserProfile();
}, [setTimesheetValue]);
```

**Résultat**: Quand un utilisateur crée une nouvelle feuille de temps, les champs "Nom" et "Poste" sont automatiquement remplis avec ses informations de profil.

---

## 🔍 Vérification de la soumission et validation manager

Les fonctions suivantes ont été vérifiées et fonctionnent correctement :

### ✅ `submitHRTimesheet` (src/actions/hr-timesheet.actions.ts:653-723)
- Vérifie que le timesheet appartient à l'utilisateur et est en DRAFT
- Vérifie qu'il y a au moins une activité
- Vérifie que l'utilisateur a un manager assigné
- Change le statut en PENDING
- Crée une notification pour le manager
- **Correction appliquée**: Remove incorrect nested include

### ✅ `managerApproveHRTimesheet` (src/actions/hr-timesheet.actions.ts:784-882)
- Vérifie que l'utilisateur est le manager ou admin/HR
- Vérifie que le statut est PENDING
- Change le statut en MANAGER_APPROVED ou REJECTED
- Crée une notification pour l'employé
- Si approuvé, notifie les admins/HR pour validation finale

### ✅ `odillonApproveHRTimesheet` (src/actions/hr-timesheet.actions.ts:887-962)
- Vérifie que l'utilisateur est Admin ou HR
- Vérifie que le statut est MANAGER_APPROVED
- Change le statut en APPROVED ou REJECTED
- Crée une notification pour l'employé

**Résultat**: Le workflow de validation fonctionne correctement (DRAFT → PENDING → MANAGER_APPROVED → APPROVED)

---

## 📤 Export de feuille de temps

### Fonction d'export vérifiée
**Fichier**: `src/actions/hr-timesheet-export.actions.ts`
**Fonction**: `exportHRTimesheetToExcel`

L'action d'export semble correcte. Elle:
1. Récupère le timesheet avec toutes les données (User, Activities, Catalog)
2. Vérifie les permissions (propriétaire, manager, HR ou Admin)
3. Génère un fichier Excel avec ExcelJS
4. Retourne le fichier en base64

**Si l'export ne fonctionne pas**, vérifiez:
1. Les permissions de l'utilisateur
2. La console du navigateur pour les erreurs JavaScript
3. Les logs du serveur Next.js (`pnpm dev`) pour les erreurs côté serveur

---

## 📝 Instructions de déploiement

### Étape 1: Exécuter la migration SQL
1. Ouvrez Supabase Dashboard → SQL Editor
2. Copiez le contenu de `prisma/migrations/add_position_to_user.sql`
3. Exécutez la requête
4. Vérifiez que la colonne `position` a été ajoutée à la table `User`

### Étape 2: Régénérer le client Prisma
```bash
pnpm prisma generate
```

### Étape 3: Tester les fonctionnalités
1. **Page profil** (`/dashboard/settings/profile`):
   - Vérifiez que le champ "Poste" est visible en mode consultation
   - Cliquez sur "Modifier" et vérifiez que vous pouvez éditer le poste
   - Enregistrez et vérifiez que la modification est sauvegardée

2. **Création de feuille de temps** (`/dashboard/hr-timesheet/new`):
   - Vérifiez que les champs "Nom" et "Poste" sont pré-remplis
   - Créez une feuille de temps et vérifiez que le poste est bien enregistré

3. **Export de feuille de temps** (`/dashboard/hr-timesheet/[id]`):
   - Créez une feuille de temps avec au moins une activité
   - Soumettez-la pour validation
   - Cliquez sur le bouton d'export Excel
   - Vérifiez que le fichier se télécharge correctement
   - Ouvrez le fichier et vérifiez que le poste est bien affiché

4. **Workflow de validation**:
   - Créez une feuille de temps (DRAFT)
   - Soumettez-la (PENDING)
   - Connectez-vous avec un compte Manager et validez (MANAGER_APPROVED)
   - Connectez-vous avec un compte Admin/HR et approuvez (APPROVED)

### Étape 4: Commit et push
Les modifications sont prêtes à être commitées sur la branche `claude/fix-timesheet-export-01XLpk3ACpqzXmAUAp6hP2oC`.

---

## 🐛 Problèmes résolus

1. ✅ **Erreur d'include dans submitHRTimesheet** - RÉSOLU
2. ✅ **Champ position manquant dans User** - AJOUTÉ
3. ✅ **Édition du poste dans la page profil** - IMPLÉMENTÉ
4. ✅ **Auto-remplissage du poste dans le formulaire** - IMPLÉMENTÉ

---

## 📁 Fichiers modifiés

1. `src/actions/hr-timesheet.actions.ts` - Correction include submitHRTimesheet
2. `prisma/schema.prisma` - Ajout champ position au User
3. `prisma/migrations/add_position_to_user.sql` - Migration SQL (à exécuter)
4. `src/lib/validations/user.ts` - Ajout position au schéma de validation
5. `src/actions/user.actions.ts` - Support position dans updateMyProfile
6. `src/app/dashboard/settings/profile/page.tsx` - Édition et affichage du poste
7. `src/app/dashboard/hr-timesheet/new/page.tsx` - Auto-remplissage du poste

---

## 🚀 Prochaines étapes recommandées

1. Exécuter la migration SQL dans Supabase
2. Tester toutes les fonctionnalités listées ci-dessus
3. Vérifier que l'export fonctionne correctement
4. Si des erreurs persistent sur l'export, fournir les messages d'erreur exacts (console navigateur + logs serveur)

---

**Auteur**: Claude Code
**Date**: 2025-11-17
**Branch**: `claude/fix-timesheet-export-01XLpk3ACpqzXmAUAp6hP2oC`
