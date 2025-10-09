# 🚀 Démarrage Rapide - Chronodil

## ✅ L'application est configurée !

- ✅ PostgreSQL connecté
- ✅ Base de données créée
- ✅ Tables Prisma + Better Auth créées
- ✅ Données de test chargées
- ✅ Serveur lancé sur **http://localhost:3001**

## 🔐 Pour se connecter

L'authentification utilise **Better Auth**. Pour créer votre premier compte :

### Option 1 : Utiliser l'inscription (Recommandé)

1. Ouvrir http://localhost:3001
2. Cliquer sur "S'inscrire" / "Register"
3. Créer un compte avec :
   - **Nom** : Votre nom
   - **Email** : votre@email.com
   - **Mot de passe** : minimum 6 caractères

### Option 2 : Utiliser Prisma Studio

```bash
pnpm db:studio
```

Cela ouvre une interface graphique pour voir/modifier la base de données.

## 📋 Données de Démonstration

La base contient déjà :
- **6 utilisateurs** (admin, manager, RH, 3 employés)
- **4 projets** actifs
- **4 tâches**
- **Entrées de temps** des 7 derniers jours
- **Départements**, jours fériés, paramètres

**Note** : Ces utilisateurs ont été créés mais **n'ont pas de mot de passe** configuré via Better Auth.
Il faut créer votre propre compte via l'inscription.

## 🎯 Prochaines étapes

### 1. Créer votre premier compte

```
http://localhost:3001/auth/register
```

### 2. Tester l'application

Une fois connecté, vous pouvez :
- ✅ Saisir des temps de travail
- ✅ Voir le dashboard avec vos stats
- ✅ Consulter les projets
- ✅ (Si manager) Valider des temps

### 3. Assigner le rôle via Prisma Studio

Si vous voulez être **MANAGER** ou **ADMIN** :

```bash
pnpm db:studio
```

1. Aller dans la table `User`
2. Trouver votre compte (par email)
3. Changer `role` de `EMPLOYEE` vers `MANAGER` ou `ADMIN`
4. Sauvegarder

## 🛠️ Commandes Utiles

```bash
# Lancer l'application
pnpm dev

# Ouvrir Prisma Studio (interface DB)
pnpm db:studio

# Réinitialiser la base
pnpm prisma db push --accept-data-loss
pnpm db:seed

# Voir les logs
# Le serveur affiche les logs dans le terminal
```

## 📚 Structure de l'Application

```
/auth/login      → Page de connexion
/auth/register   → Page d'inscription
/dashboard       → Tableau de bord principal
/dashboard/timesheet  → Saisie des temps
/dashboard/projects   → Gestion des projets
/dashboard/validation → Validation (managers)
/dashboard/reports    → Rapports et analytics
```

## 🐛 En cas de problème

### "Unauthorized" ou erreur de connexion

1. Vérifier que vous avez créé un compte via `/auth/register`
2. Vérifier que Better Auth fonctionne :
   ```bash
   # Dans le terminal du serveur, chercher des erreurs
   ```

### La base est vide

```bash
pnpm db:seed
```

### Erreur Prisma

```bash
pnpm prisma generate
pnpm prisma db push
```

## ✨ Prêt !

L'application est maintenant fonctionnelle. Créez votre compte et commencez à l'utiliser ! 🎉

---

**Besoin d'aide ?** Consultez le [README.md](README.md) ou le [SETUP.md](SETUP.md)
