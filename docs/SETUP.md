# 🚀 Guide de Configuration - Chronodil

Ce guide vous accompagne étape par étape pour configurer et lancer l'application Chronodil.

## ✅ Prérequis installés

- ✅ Node.js
- ✅ pnpm
- ✅ Dépendances installées

## 📦 Étape 1 : Installer PostgreSQL

### Option 1 : PostgreSQL traditionnel (Recommandé pour production)

**Windows :**
1. Télécharger : https://www.postgresql.org/download/windows/
2. Installer avec les paramètres par défaut
3. Retenir le mot de passe du superutilisateur `postgres`

**Linux :**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS :**
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Option 2 : Docker (Recommandé pour développement)

```bash
# Lancer PostgreSQL avec Docker
docker run --name chronodil-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=chronodil -p 5432:5432 -d postgres:14
```

### Option 3 : Services cloud gratuits

- **Supabase** : https://supabase.com/ (gratuit jusqu'à 500 Mo)
- **Neon** : https://neon.tech/ (gratuit)
- **Railway** : https://railway.app/ (essai gratuit)

## 🔧 Étape 2 : Configurer la connexion

Le fichier `.env` a déjà été créé avec cette configuration :

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chronodil"
```

**Modifier si nécessaire :**
- `postgres:postgres` → `utilisateur:mot_de_passe`
- `localhost:5432` → votre serveur PostgreSQL
- `chronodil` → nom de votre base de données

## 🗄️ Étape 3 : Créer la base de données

### Si PostgreSQL est installé localement :

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Dans psql, créer la base
CREATE DATABASE chronodil;

# Quitter
\q
```

### Si vous utilisez Docker :

```bash
# La base est déjà créée avec le paramètre POSTGRES_DB
docker ps  # Vérifier que le conteneur tourne
```

### Si vous utilisez un service cloud :

La base est généralement créée automatiquement. Copiez simplement la `DATABASE_URL` fournie dans votre `.env`.

## 🔄 Étape 4 : Exécuter les migrations

```bash
pnpm db:migrate
```

Cette commande :
- Crée toutes les tables dans la base de données
- Configure les relations
- Initialise le schéma Prisma

## 🌱 Étape 5 : Alimenter la base avec des données de test

```bash
pnpm db:seed
```

Cette commande crée :
- 3 départements (Dev, Design, RH)
- 6 utilisateurs avec différents rôles
- 4 projets actifs
- Des tâches et des entrées de temps
- Des données de démonstration

**Comptes créés :**
- Admin : `admin@chronodil.com` / `Admin2025!`
- Manager : `manager@chronodil.com` / `Manager2025!`
- RH : `rh@chronodil.com` / `RH2025!`
- Employé : `employe@chronodil.com` / `Employee2025!`

## 🎯 Étape 6 : Lancer l'application

```bash
pnpm dev
```

L'application sera disponible sur : **http://localhost:3000**

## 🎉 C'est prêt !

Vous pouvez maintenant :
1. Ouvrir http://localhost:3000
2. Cliquer sur "Se connecter"
3. Utiliser un des comptes de test
4. Explorer l'application !

---

## 🐛 Dépannage

### Erreur : "Can't reach database server"

**Cause :** PostgreSQL n'est pas démarré ou mauvaise URL de connexion.

**Solutions :**
1. Vérifier que PostgreSQL tourne :
   ```bash
   # Windows (Services)
   services.msc  # Chercher PostgreSQL

   # Linux
   sudo systemctl status postgresql

   # Docker
   docker ps
   ```

2. Vérifier la `DATABASE_URL` dans `.env`

3. Tester la connexion :
   ```bash
   psql -U postgres -d chronodil
   ```

### Erreur : "Port 5432 already in use"

**Cause :** Un autre PostgreSQL tourne déjà.

**Solutions :**
1. Utiliser ce PostgreSQL existant
2. Ou changer le port dans `.env` et Docker :
   ```bash
   docker run -p 5433:5432 ...
   DATABASE_URL="...@localhost:5433/chronodil"
   ```

### Erreur : "Relation already exists"

**Cause :** La base a déjà des tables.

**Solution :** Réinitialiser la base :
```bash
pnpm prisma migrate reset
pnpm db:seed
```

### Erreur lors du seed

**Cause :** Conflit de données ou migration non exécutée.

**Solution :**
```bash
# Réinitialiser complètement
pnpm prisma migrate reset --force
pnpm db:migrate
pnpm db:seed
```

### L'application ne démarre pas sur le port 3000

**Cause :** Port déjà utilisé.

**Solutions :**
1. Trouver et arrêter le processus :
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -ti:3000 | xargs kill
   ```

2. Ou utiliser un autre port :
   ```bash
   PORT=3001 pnpm dev
   ```

---

## 📚 Commandes utiles

```bash
# Développement
pnpm dev                    # Lancer le serveur de dev

# Base de données
pnpm db:migrate             # Exécuter les migrations
pnpm db:seed                # Alimenter la base
pnpm db:studio              # Interface visuelle Prisma

# Production
pnpm build                  # Build de production
pnpm start                  # Lancer en production

# Outils
pnpm lint                   # Linter le code
prisma studio               # Interface admin base de données
```

---

## 🔐 Sécurité

**Important :** Avant de déployer en production :

1. Changer `BETTER_AUTH_SECRET` dans `.env`
2. Utiliser un mot de passe PostgreSQL fort
3. Ne jamais commiter le fichier `.env`
4. Activer SSL pour PostgreSQL

---

## 📞 Besoin d'aide ?

- Documentation Prisma : https://www.prisma.io/docs
- Documentation PostgreSQL : https://www.postgresql.org/docs/
- Issues du projet : (créer un lien vers votre repo)

---

**Bon développement ! 🚀**
