# 🔧 Guide de Résolution des Problèmes Courants - Chronodil

---

## ❌ "Vous n'avez pas de manager assigné"

### 🎯 Problème
Lorsque vous essayez de soumettre un timesheet, vous obtenez :
```
Action error: Vous n'avez pas de manager assigné. Veuillez contacter votre administrateur.
```

### 📋 Cause
Pour soumettre un timesheet (normal ou HR), l'employé **doit avoir un manager assigné** dans son profil.

### ✅ Solution

#### Option 1 : Via l'Interface Admin

1. **Se connecter en tant qu'Admin/HR**
2. Aller sur **`/dashboard/settings/users`**
3. **Cliquer sur l'utilisateur** qui a le problème
4. **Éditer le profil** :
   - Champ "Manager" → Sélectionner un utilisateur avec le rôle MANAGER
   - Cliquer sur "Enregistrer"
5. **Déconnexion/Reconnexion** de l'employé
6. Réessayer de soumettre le timesheet

#### Option 2 : Via la Base de Données (Rapide)

```sql
-- Lister tous les utilisateurs et leurs managers
SELECT id, name, email, role, "managerId"
FROM "User";

-- Assigner un manager à un utilisateur
UPDATE "User"
SET "managerId" = 'ID_DU_MANAGER'
WHERE id = 'ID_DE_L_EMPLOYE';

-- Exemple :
-- UPDATE "User"
-- SET "managerId" = 'abc123'
-- WHERE email = 'employee@chronodil.com';
```

#### Option 3 : Via Prisma Studio (Interface Graphique)

```bash
# Ouvrir Prisma Studio
pnpm prisma studio
```

1. Ouvrir http://localhost:5555
2. Cliquer sur la table **User**
3. Trouver l'utilisateur
4. **Éditer** le champ `managerId`
5. Coller l'ID d'un manager (utilisateur avec role = MANAGER)
6. **Sauvegarder**

### 🎯 Créer la Hiérarchie Correcte

#### Structure Recommandée

```
1. Créer un ADMIN
   └─ Créer un HR
       └─ Créer un MANAGER
           └─ Créer des EMPLOYEE (avec managerId = ID du MANAGER)
```

#### Script de Configuration Rapide

Créer `scripts/setup-hierarchy.ts` :

```typescript
import { prisma } from "../src/lib/db";
import { nanoid } from "nanoid";

async function setupHierarchy() {
  console.log("🚀 Configuration de la hiérarchie...\n");

  // 1. Créer un Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@chronodil.com" },
    update: {},
    create: {
      id: nanoid(),
      email: "admin@chronodil.com",
      name: "Admin Principal",
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log("✅ Admin créé:", admin.email);

  // 2. Créer un Manager
  const manager = await prisma.user.upsert({
    where: { email: "manager@chronodil.com" },
    update: {},
    create: {
      id: nanoid(),
      email: "manager@chronodil.com",
      name: "Manager Équipe",
      role: "MANAGER",
      emailVerified: true,
      managerId: admin.id, // Le manager reporte à l'admin
    },
  });
  console.log("✅ Manager créé:", manager.email);

  // 3. Créer des Employés
  const employee1 = await prisma.user.upsert({
    where: { email: "employee1@chronodil.com" },
    update: { managerId: manager.id },
    create: {
      id: nanoid(),
      email: "employee1@chronodil.com",
      name: "Employé 1",
      role: "EMPLOYEE",
      emailVerified: true,
      managerId: manager.id, // ✅ IMPORTANT : Assigner le manager
    },
  });
  console.log("✅ Employé 1 créé:", employee1.email);

  const employee2 = await prisma.user.upsert({
    where: { email: "employee2@chronodil.com" },
    update: { managerId: manager.id },
    create: {
      id: nanoid(),
      email: "employee2@chronodil.com",
      name: "Employé 2",
      role: "EMPLOYEE",
      emailVerified: true,
      managerId: manager.id, // ✅ IMPORTANT : Assigner le manager
    },
  });
  console.log("✅ Employé 2 créé:", employee2.email);

  console.log("\n🎉 Hiérarchie configurée avec succès !");
  console.log("\n📋 Comptes créés :");
  console.log("   Admin    : admin@chronodil.com");
  console.log("   Manager  : manager@chronodil.com");
  console.log("   Employé 1: employee1@chronodil.com");
  console.log("   Employé 2: employee2@chronodil.com");
  console.log("\n⚠️  Note : Vous devez définir les mots de passe via Better Auth");
}

setupHierarchy()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Exécuter** :
```bash
tsx scripts/setup-hierarchy.ts
```

---

## ❌ "Un timesheet existe déjà pour cette semaine"

### 🎯 Problème
```
Action error: Un timesheet existe déjà pour cette semaine
```

### 📋 Cause
Vous essayez de créer un 2ème timesheet HR pour la même semaine. **Un seul timesheet par semaine** est autorisé.

### ✅ Solutions

#### Option 1 : Éditer le Timesheet Existant
1. Aller sur **`/dashboard/hr-timesheet`**
2. Cliquer sur le timesheet de la semaine
3. Cliquer sur **"Modifier"**
4. Ajouter/Modifier les activités

#### Option 2 : Supprimer l'Ancien (si c'est un brouillon)
1. Aller sur **`/dashboard/hr-timesheet`**
2. Trouver le timesheet en statut **DRAFT**
3. Le supprimer
4. En créer un nouveau

#### Option 3 : Choisir une Autre Semaine
Lors de la création, sélectionner une **date de début de semaine différente**

---

## ❌ Erreur "Missing API key" (Resend)

### 🎯 Problème
```
Error: Missing API key. Pass it to the constructor `new Resend("re_123")`
```

### ✅ Solution
Déjà configurée ! La clé est dans `.env` :
```bash
RESEND_API_KEY="re_gkmdHcJp_9gUbYuZ9Ewuxx8L6aVrtbNEY"
```

Si l'erreur persiste :
```bash
# Redémarrer le serveur
# Ctrl+C puis
pnpm dev
```

---

## ❌ "Permission insuffisante"

### 🎯 Problème
```
Action error: Permissions insuffisantes
```

### 📋 Cause
L'utilisateur n'a pas le bon **rôle** pour effectuer l'action.

### ✅ Solution

#### Vérifier les Permissions par Rôle

| Action | EMPLOYEE | MANAGER | HR | ADMIN |
|--------|----------|---------|----|----|
| Saisir temps | ✅ | ✅ | ✅ | ✅ |
| Soumettre temps | ✅ | ✅ | ✅ | ✅ |
| Valider temps | ❌ | ✅ | ✅ | ✅ |
| Créer projets | ❌ | ✅ | ✅ | ✅ |
| Gérer users | ❌ | ❌ | ✅ | ✅ |
| Audit logs | ❌ | ❌ | ✅ | ✅ |

#### Changer le Rôle d'un Utilisateur

Via Prisma Studio :
```bash
pnpm prisma studio
```

Ou via SQL :
```sql
UPDATE "User"
SET role = 'MANAGER'
WHERE email = 'user@chronodil.com';
```

---

## ❌ Page Blanche ou Erreur de Compilation

### ✅ Solution Rapide
```bash
# 1. Arrêter le serveur (Ctrl+C)

# 2. Nettoyer le cache
rm -rf .next
rm -rf node_modules/.cache

# 3. Redémarrer
pnpm dev
```

---

## ❌ Erreur Base de Données "Connection Refused"

### 🎯 Problème
```
Error: Can't reach database server at `localhost:5432`
```

### ✅ Solution

1. **Vérifier PostgreSQL est lancé** :
```bash
# Windows
# Vérifier dans Services > PostgreSQL

# Ou tester la connexion
psql -U postgres -d chronodil
```

2. **Vérifier DATABASE_URL** dans `.env` :
```bash
DATABASE_URL="postgresql://postgres:VotreMotDePasse@localhost:5432/chronodil"
```

3. **Créer la base si nécessaire** :
```bash
psql -U postgres
CREATE DATABASE chronodil;
\q

# Puis synchroniser Prisma
pnpm prisma db push
```

---

## ❌ Port 3000 Déjà Utilisé

### 🎯 Problème
```
Error: Port 3000 is already in use
```

### ✅ Solutions

#### Option 1 : Tuer le Processus
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_TROUVE> /F

# Relancer
pnpm dev
```

#### Option 2 : Utiliser un Autre Port
```bash
PORT=3001 pnpm dev
```

Ouvrir http://localhost:3001

---

## ❌ Notifications ne Fonctionnent Pas

### 🎯 Symptômes
- Pas de notifications in-app
- Pas d'emails reçus

### ✅ Solutions

#### Pour les Notifications In-App

1. **Vérifier l'action** `notification.actions.ts`
2. **Vérifier la table** `Notification` dans Prisma Studio
3. **Rafraîchir la page** `/dashboard/notifications`

#### Pour les Emails (Resend)

1. **Vérifier le domaine** sur https://resend.com/domains
   - Domaine vérifié = ✅
   - Non vérifié = ❌ Emails ne partiront pas

2. **Vérifier les logs** Resend : https://resend.com/emails

3. **Mode Dev sans Inngest** :
   - Les emails sont créés mais pas envoyés
   - Il faut lancer Inngest Dev Server

#### Lancer Inngest Dev Server

**Terminal 1** :
```bash
pnpm dlx inngest-cli@latest dev
```

**Terminal 2** :
```bash
pnpm dev
```

---

## ❌ Export Excel/PDF Ne Fonctionne Pas

### ✅ Solution

1. **Vérifier les données** : Il faut avoir des timesheets dans la période sélectionnée
2. **Vérifier la console** navigateur pour les erreurs
3. **Tester avec une période** contenant des données

---

## 🔍 Debugging Général

### Voir les Logs de l'Application

```bash
# Lancer avec logs détaillés
DEBUG=* pnpm dev
```

### Prisma Studio (Interface Graphique BDD)

```bash
pnpm prisma studio
```

Ouvrir http://localhost:5555
- Voir toutes les tables
- Éditer les données
- Débugger les relations

### Vérifier le Schéma Prisma

```bash
# Formater
pnpm prisma format

# Valider
pnpm prisma validate

# Voir l'état
pnpm prisma db pull
```

---

## 📞 Checklist de Dépannage

Quand quelque chose ne marche pas :

- [ ] Vérifier les **logs de la console** (navigateur F12)
- [ ] Vérifier les **logs du serveur** (terminal)
- [ ] Vérifier l'**authentification** (session valide ?)
- [ ] Vérifier les **permissions** (rôle correct ?)
- [ ] Vérifier la **base de données** (Prisma Studio)
- [ ] Vérifier le **`.env`** (variables correctes ?)
- [ ] **Redémarrer le serveur** (Ctrl+C puis `pnpm dev`)
- [ ] **Nettoyer le cache** (`rm -rf .next`)

---

## 🆘 Support

Si le problème persiste :

1. **Vérifier les fichiers de documentation** :
   - [README.md](README.md)
   - [GUIDE_DEMARRAGE.md](GUIDE_DEMARRAGE.md)
   - [CORRECTIONS_EFFECTUEES.md](CORRECTIONS_EFFECTUEES.md)

2. **Vérifier les logs** détaillés

3. **Consulter la documentation** des dépendances :
   - Next.js : https://nextjs.org/docs
   - Prisma : https://www.prisma.io/docs
   - Better Auth : https://www.better-auth.com/docs

---

**Bon debugging ! 🔧**
