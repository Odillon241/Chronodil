# 🔒 Gestion des Permissions - Page de Validation

## Problème Identifié

L'erreur "Permissions insuffisantes" se produisait lorsqu'un utilisateur avec le rôle **EMPLOYEE** tentait d'accéder à la page `/dashboard/validation`.

### Cause

La page de validation est réservée aux utilisateurs ayant l'un des rôles suivants :
- **MANAGER** : Validation des temps de leur équipe
- **HR** : Validation de tous les temps
- **ADMIN** : Accès complet

## Solutions Implémentées

### 1. ✅ Amélioration de la Gestion d'Erreur dans la Page

**Fichier modifié** : `src/app/dashboard/validation/page.tsx`

**Changements** :
- Ajout d'un état `hasPermission` pour détecter les erreurs de permission
- Affichage d'un message d'erreur clair et élégant au lieu d'une erreur dans la console
- Ajout d'un bouton "Retour" pour faciliter la navigation

**Résultat** :
```tsx
if (!hasPermission) {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <XCircle className="h-16 w-16 text-red-500" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Accès refusé</h2>
        <p className="text-muted-foreground max-w-md">
          Vous n'avez pas les permissions nécessaires...
        </p>
      </div>
      <Button variant="outline" onClick={() => window.history.back()}>
        Retour
      </Button>
    </div>
  );
}
```

### 2. ✅ Protection au Niveau de la Navigation

**Fichier modifié** : `src/components/layout/app-sidebar.tsx`

**Changements** :
- Ajout de `roles: ["MANAGER", "HR", "ADMIN"]` à l'élément de menu "Validation"
- Le lien n'apparaît plus dans la sidebar pour les utilisateurs EMPLOYEE

**Avant** :
```typescript
{
  title: "Validation",
  url: "/dashboard/validation",
  icon: CheckSquare,
  // ❌ Pas de restriction !
}
```

**Après** :
```typescript
{
  title: "Validation",
  url: "/dashboard/validation",
  icon: CheckSquare,
  roles: ["MANAGER", "HR", "ADMIN"], // ✅ Restriction ajoutée
}
```

### 3. ✅ Scripts de Gestion des Rôles

Plusieurs scripts ont été créés pour faciliter la gestion des rôles :

#### `scripts/check-current-user-role.ts`
Affiche tous les utilisateurs et leurs rôles actuels, ainsi que le nombre d'utilisateurs ayant accès à la validation.

```bash
npx tsx scripts/check-current-user-role.ts
```

#### `scripts/update-user-role.ts`
Script interactif pour changer le rôle d'un utilisateur (Windows/Linux/Mac).

```bash
npx tsx scripts/update-user-role.ts
```

#### `scripts/make-dereck-manager.ts`
Script rapide pour donner le rôle MANAGER à l'utilisateur Déreck.

```bash
npx tsx scripts/make-dereck-manager.ts
```

#### `scripts/create-test-manager.ts`
Crée un compte manager de test (manager@chronodil.com / manager123).

```bash
npx tsx scripts/create-test-manager.ts
```

## Rôles et Permissions

### 📊 Matrice des Permissions

| Fonctionnalité | EMPLOYEE | MANAGER | HR | ADMIN |
|----------------|----------|---------|-----|-------|
| Saisie des temps | ✅ | ✅ | ✅ | ✅ |
| Projets (lecture) | ✅ | ✅ | ✅ | ✅ |
| Tâches | ✅ | ✅ | ✅ | ✅ |
| Chat | ✅ | ✅ | ✅ | ✅ |
| **Validation** | ❌ | ✅ (équipe) | ✅ (tous) | ✅ (tous) |
| Timesheets RH | ❌ | ❌ | ✅ | ✅ |
| Rapports avancés | ❌ | ✅ (équipe) | ✅ (tous) | ✅ (tous) |
| Gestion utilisateurs | ❌ | ❌ | 🔶 (limité) | ✅ |
| Audit | ❌ | ❌ | ✅ | ✅ |
| Configuration | ❌ | ❌ | ❌ | ✅ |

### 📝 Descriptions des Rôles

#### EMPLOYEE (Employé)
- Utilisateur standard
- Peut saisir ses temps
- Consulte ses projets et tâches
- Accès au chat d'équipe
- **Ne peut PAS** valider les temps

#### MANAGER (Manager)
- Toutes les permissions EMPLOYEE
- **Validation des temps** de ses subordonnés directs
- Rapports de son équipe
- Visibilité sur les performances de l'équipe

#### HR (Ressources Humaines)
- Toutes les permissions MANAGER
- **Validation de TOUS les temps** (pas seulement l'équipe)
- Accès aux timesheets RH
- Rapports globaux de l'entreprise
- Gestion limitée des utilisateurs
- Accès à l'audit

#### ADMIN (Administrateur)
- **Accès complet** à toutes les fonctionnalités
- Gestion des utilisateurs
- Configuration système
- Audit complet
- Peut débloquer/modifier toutes les données

## Tests

### Test 1 : Utilisateur EMPLOYEE (Accès Refusé)

1. Se connecter avec : `dereckdanel01@chronodil.com` (si rôle EMPLOYEE)
2. Essayer d'accéder à `/dashboard/validation`
3. **Résultat attendu** :
   - ✅ Message "Accès refusé" s'affiche
   - ✅ Explication claire des permissions requises
   - ✅ Bouton "Retour" fonctionnel
   - ✅ Pas d'erreur dans la console

### Test 2 : Utilisateur MANAGER (Accès Autorisé)

1. Changer le rôle de Déreck en MANAGER :
   ```bash
   npx tsx scripts/make-dereck-manager.ts
   ```
2. Se reconnecter avec : `dereckdanel01@chronodil.com`
3. Accéder à `/dashboard/validation`
4. **Résultat attendu** :
   - ✅ Le lien "Validation" apparaît dans la sidebar
   - ✅ La page se charge correctement
   - ✅ Affiche les saisies en attente de validation
   - ✅ Peut approuver/rejeter les entrées de ses subordonnés

### Test 3 : Utilisateur ADMIN (Accès Complet)

1. Se connecter avec : `admin@chronodil.com`
2. Accéder à `/dashboard/validation`
3. **Résultat attendu** :
   - ✅ Accès immédiat
   - ✅ Voit TOUTES les saisies en attente
   - ✅ Peut valider n'importe quelle entrée

## Vérifications de Sécurité

### ✅ Côté Serveur (Server Action)

**Fichier** : `src/actions/validation.actions.ts`

```typescript
export const getPendingValidations = authActionClient
  .schema(z.object({...}))
  .action(async ({ parsedInput, ctx }) => {
    const { userId, userRole } = ctx;

    // ✅ Vérification stricte des permissions
    if (!["MANAGER", "HR", "ADMIN"].includes(userRole)) {
      throw new Error("Permissions insuffisantes");
    }

    // ✅ Les MANAGER ne voient que leur équipe
    if (userRole === "MANAGER") {
      const subordinates = await prisma.user.findMany({
        where: { managerId: userId },
      });
      userIds = subordinates.map((u) => u.id);
    }

    // ...
  });
```

### ✅ Côté Client (UI)

1. **Sidebar** : Le lien est masqué via le filtre de rôles
2. **Page** : Affiche un message d'accès refusé si permissions insuffisantes
3. **Toast** : Notification claire à l'utilisateur

### ✅ Protection en Profondeur

- **Middleware** : Vérification de session (auth)
- **Server Actions** : Vérification de rôle (validation.actions.ts)
- **UI** : Navigation conditionnelle (sidebar)
- **Page** : Gestion d'erreur élégante (validation/page.tsx)

## Utilisation en Production

### Recommandations

1. **Attribution des Rôles** :
   - Attribuer EMPLOYEE par défaut
   - MANAGER pour les responsables d'équipe
   - HR pour le service RH
   - ADMIN uniquement pour les administrateurs système

2. **Sécurité** :
   - Toujours vérifier les permissions côté serveur
   - Ne jamais se fier uniquement aux restrictions UI
   - Logger les tentatives d'accès non autorisées

3. **Audit** :
   - Utiliser `/dashboard/audit` pour tracer les validations
   - Vérifier régulièrement les permissions

## Commandes Utiles

```bash
# Vérifier les rôles actuels
npx tsx scripts/check-current-user-role.ts

# Changer un rôle (interactif)
npx tsx scripts/update-user-role.ts

# Donner le rôle MANAGER à Déreck
npx tsx scripts/make-dereck-manager.ts

# Créer un compte manager de test
npx tsx scripts/create-test-manager.ts

# Lister tous les comptes
npx tsx scripts/list-all-accounts.ts
```

## Problèmes Connus et Solutions

### Problème : Le lien "Validation" apparaît encore après changement de rôle

**Solution** : Se déconnecter et se reconnecter pour rafraîchir la session.

```bash
# Ou redémarrer le serveur Next.js
pnpm dev
```

### Problème : "Permissions insuffisantes" même avec le bon rôle

**Vérifications** :
1. Vérifier le rôle dans la BDD :
   ```bash
   npx tsx scripts/check-current-user-role.ts
   ```
2. Vérifier que la session est à jour (se reconnecter)
3. Vérifier que `authActionClient` récupère bien le rôle de la session

### Problème : Script ne fonctionne pas sur Windows

**Solution** : Utiliser les scripts TypeScript avec `npx tsx` au lieu des scripts shell.

---

## 📌 Résumé

**Problème** : Erreur "Permissions insuffisantes" pour les utilisateurs EMPLOYEE

**Solutions** :
1. ✅ Gestion d'erreur élégante dans la page
2. ✅ Protection au niveau de la navigation (sidebar)
3. ✅ Scripts pour gérer les rôles facilement
4. ✅ Documentation complète

**Test rapide** :
```bash
# 1. Vérifier les rôles
npx tsx scripts/check-current-user-role.ts

# 2. Changer Déreck en MANAGER
npx tsx scripts/make-dereck-manager.ts

# 3. Se reconnecter et tester /dashboard/validation
```

---

**Dernière mise à jour** : 12 octobre 2025
**Auteur** : Assistant IA Chronodil

