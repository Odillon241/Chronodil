# 🚀 Guide de Démarrage - Chronodil App

**Date**: 10 Octobre 2025
**Statut**: ✅ Application prête à démarrer

---

## ✅ Configuration Actuelle

### Base de Données
✅ **PostgreSQL** configuré sur `localhost:5432`
✅ **Schéma Prisma** synchronisé
✅ **15 modèles** prêts

### API Keys Configurées
✅ **Resend** - Email configuré
  - API Key: `re_gkmdHcJp_9gUbYuZ9Ewuxx8L6aVrtbNEY`
  - Domaine vérifié nécessaire pour envoyer des emails

⚠️ **Inngest** - À configurer (optionnel pour les notifications asynchrones)

---

## 📋 Étapes de Configuration Inngest (Optionnel)

### Option 1 : Sans Inngest (Mode Dev Rapide)

Si vous voulez tester l'application rapidement **sans** Inngest :

1. **L'application fonctionnera normalement** mais sans :
   - Notifications email asynchrones
   - Jobs en arrière-plan

2. Les notifications **in-app** fonctionneront quand même

### Option 2 : Avec Inngest (Recommandé pour Production)

#### Étape 1 : Créer un compte Inngest

1. Aller sur https://app.inngest.com/env/production/onboarding/create-app
2. Créer une nouvelle application "Chronodil"
3. Récupérer les clés :
   - **Event Key** : `evt_...`
   - **Signing Key** : `signkey_...`

#### Étape 2 : Configurer les variables d'environnement

Ajouter dans `.env` :
```bash
INNGEST_EVENT_KEY="evt_votre_event_key"
INNGEST_SIGNING_KEY="signkey_votre_signing_key"
```

#### Étape 3 : Lancer Inngest Dev Server

**Terminal 1** - Inngest Dev Server :
```bash
pnpm dlx inngest-cli@latest dev
```

**Terminal 2** - Application Next.js :
```bash
pnpm dev
```

#### Étape 4 : Vérifier l'intégration

1. Ouvrir http://localhost:8288 (Inngest Dev Server)
2. Vérifier que l'application est connectée
3. Tester une notification

---

## 🚀 Lancement de l'Application

### Méthode Simple (Sans Inngest)

```bash
# 1. Lancer l'application
pnpm dev
```

✅ Ouvrir http://localhost:3000

### Méthode Complète (Avec Inngest)

**Terminal 1** - Inngest :
```bash
pnpm dlx inngest-cli@latest dev
```

**Terminal 2** - Application :
```bash
pnpm dev
```

✅ Ouvrir http://localhost:3000 (Application)
✅ Ouvrir http://localhost:8288 (Inngest Dashboard)

---

## 👤 Première Utilisation

### 1. Créer un Compte Admin

**Option A** - Via l'interface web :
1. Ouvrir http://localhost:3000
2. Cliquer sur "S'inscrire"
3. Remplir le formulaire
4. Se connecter

**Option B** - Via script (créer un admin directement) :

Créer `scripts/create-admin.ts` :
```typescript
import { prisma } from "../src/lib/db";
import { nanoid } from "nanoid";

async function main() {
  const admin = await prisma.user.create({
    data: {
      id: nanoid(),
      email: "admin@chronodil.com",
      name: "Admin Chronodil",
      role: "ADMIN",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Admin créé:", admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Exécuter :
```bash
tsx scripts/create-admin.ts
```

### 2. Configuration Initiale

Une fois connecté en tant qu'admin :

1. **Créer des départements** : `/dashboard/settings`
   - IT, RH, Finance, etc.

2. **Créer des utilisateurs** : `/dashboard/settings/users`
   - Assigner des départements
   - Définir des managers

3. **Créer des projets** : `/dashboard/projects`
   - Assigner des équipes
   - Définir des budgets

4. **Créer des tâches** : `/dashboard/tasks`
   - Lier aux projets

5. **Configurer les jours fériés** : `/dashboard/settings`

---

## 📱 Fonctionnalités Disponibles

### Pour les Employés (EMPLOYEE)

✅ **Saisie des temps** : `/dashboard/timesheet`
- Vue hebdomadaire
- Types : Normal, Heures sup., Nuit, Week-end
- Validation anti-chevauchement

✅ **Mes projets** : `/dashboard/projects`
- Vue de tous les projets assignés

✅ **HR Timesheet** : `/dashboard/hr-timesheet`
- Feuilles de temps RH hebdomadaires
- Catalogue d'activités

✅ **Notifications** : `/dashboard/notifications`
- Notifications in-app en temps réel

✅ **Profil** : `/dashboard/settings/profile`

### Pour les Managers (MANAGER)

✅ Tout ce qu'un employé peut faire, PLUS :

✅ **Validations** : `/dashboard/validations`
- Valider/Rejeter les temps de l'équipe
- Validation en masse
- Commentaires

✅ **Rapports équipe** : `/dashboard/reports`
- Analytics de l'équipe
- Exports Excel/PDF

✅ **Validation HR Timesheet** : Workflow de validation

### Pour HR/Admin (HR/ADMIN)

✅ Tout ce qu'un manager peut faire, PLUS :

✅ **Gestion utilisateurs** : `/dashboard/settings/users`
- Créer/Modifier/Désactiver utilisateurs
- Gestion des rôles

✅ **Gestion projets** : Création et configuration

✅ **Rapports globaux** : `/dashboard/reports`
- Vue d'ensemble de l'organisation
- Exports multiples

✅ **Audit Logs** : `/dashboard/audit`
- Traçabilité complète

✅ **Paramètres système** : `/dashboard/settings`
- Départements
- Jours fériés
- Configuration générale

---

## 🧪 Tester l'Application

### Workflow Complet de Test

1. **Créer un employé** (via `/dashboard/settings/users`)
   - Email: `employee@test.com`
   - Rôle: EMPLOYEE
   - Manager: Vous (admin)

2. **Créer un projet** (via `/dashboard/projects`)
   - Nom: "Projet Test"
   - Assigner l'employé

3. **Se connecter en tant qu'employé**
   - Saisir des heures : `/dashboard/timesheet`
   - Soumettre pour validation

4. **Revenir en admin/manager**
   - Valider les temps : `/dashboard/validations`
   - Voir les notifications

5. **Générer un rapport**
   - `/dashboard/reports`
   - Exporter en Excel/PDF

---

## 📧 Configuration Email (Resend)

### Domaine Vérifié

Pour envoyer des emails, vous devez vérifier votre domaine sur Resend :

1. Aller sur https://resend.com/domains
2. Ajouter votre domaine (ex: `chronodil.com`)
3. Configurer les DNS records (SPF, DKIM, DMARC)
4. Attendre la vérification (~5 minutes)

### Emails de Test

En développement, vous pouvez utiliser :
- **Votre email personnel** (max 100/jour)
- **Email test** : Les emails seront visibles dans Resend Dashboard

### Emails Envoyés par l'Application

1. **Notification de soumission** - Quand un employé soumet ses temps
   - Destinataire: Manager
   - Déclencheur: Soumission timesheet

2. **Notification de validation** - Quand un manager valide/rejette
   - Destinataire: Employé
   - Déclencheur: Validation/Rejet

3. **Rappels** (si activé) - Rappels de saisie
   - Destinataire: Employés
   - Déclencheur: Inngest schedule

---

## 🔧 Commandes Utiles

```bash
# Développement
pnpm dev                    # Lancer l'app en dev
pnpm build                  # Build de production
pnpm start                  # Lancer la production

# Base de données
pnpm prisma studio          # Interface graphique BDD
pnpm prisma db push         # Sync schéma
pnpm prisma generate        # Générer client Prisma
pnpm prisma migrate dev     # Créer migration

# Inngest
pnpm dlx inngest-cli@latest dev    # Dev server

# Lint et format
pnpm lint                   # ESLint
pnpm format                 # Prettier (si configuré)
```

---

## 🐛 Dépannage

### Erreur : "Missing API key" (Resend)

✅ **Déjà corrigé** - La clé API est configurée dans `.env`

Si l'erreur persiste :
```bash
# Vérifier que .env contient
RESEND_API_KEY="re_gkmdHcJp_9gUbYuZ9Ewuxx8L6aVrtbNEY"

# Redémarrer le serveur
pnpm dev
```

### Erreur : Base de données inaccessible

```bash
# Vérifier PostgreSQL
psql -U postgres -d chronodil

# Si erreur de connexion, vérifier DATABASE_URL dans .env
# Relancer Prisma
pnpm prisma db push
```

### Erreur : Port 3000 déjà utilisé

```bash
# Trouver le processus
netstat -ano | findstr :3000

# Tuer le processus (Windows)
taskkill /PID <PID> /F

# Ou utiliser un autre port
PORT=3001 pnpm dev
```

### Problème : Emails ne partent pas

1. **Vérifier Resend Dashboard** : https://resend.com/emails
2. **Vérifier les logs** dans la console
3. **Vérifier le domaine** est vérifié
4. **Mode dev** : Les emails sont simulés sans Inngest

---

## 📊 Structure des Données

### Hiérarchie Utilisateurs

```
ADMIN
  └─ HR
      └─ MANAGER
          └─ EMPLOYEE
```

### Workflow de Validation

```
1. EMPLOYEE : Saisie temps → Statut: DRAFT
2. EMPLOYEE : Soumettre → Statut: SUBMITTED
3. MANAGER : Valider/Rejeter → Statut: APPROVED/REJECTED
4. SYSTEM : Verrouiller → isLocked: true (si APPROVED)
```

### HR Timesheet Workflow

```
1. EMPLOYEE : Créer timesheet → Statut: DRAFT
2. EMPLOYEE : Soumettre → Statut: PENDING
3. MANAGER : Valider → Statut: MANAGER_APPROVED
4. ODILLON/ADMIN : Approuver final → Statut: APPROVED
```

---

## 🚀 Déploiement Production (Vercel)

### 1. Préparer le Déploiement

```bash
# Vérifier que tout compile
pnpm build

# Tester en production locale
pnpm start
```

### 2. Déployer sur Vercel

```bash
# Installer Vercel CLI
pnpm add -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Première fois : répondre aux questions
# - Project name: chronodil-app
# - Framework: Next.js
# - Build command: pnpm build
# - Output directory: .next
```

### 3. Configurer les Variables d'Environnement

Dans Vercel Dashboard (https://vercel.com/dashboard) :

```bash
DATABASE_URL="postgresql://..."  # Base de données de production
BETTER_AUTH_SECRET="..."         # Générer un nouveau secret
BETTER_AUTH_URL="https://chronodil.vercel.app"
RESEND_API_KEY="re_gkmdHcJp_9gUbYuZ9Ewuxx8L6aVrtbNEY"
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
NEXT_PUBLIC_APP_URL="https://chronodil.vercel.app"
```

### 4. Base de Données Production

Options recommandées :
- **Vercel Postgres** : Intégration native
- **Supabase** : Gratuit jusqu'à 500 MB
- **Neon** : Serverless PostgreSQL
- **Railway** : PostgreSQL managé

### 5. Déploiement Final

```bash
# Déployer en production
vercel --prod
```

---

## 📝 Notes Importantes

### Sécurité

⚠️ **IMPORTANT** - En production :
1. Changer `BETTER_AUTH_SECRET` dans `.env`
2. Utiliser HTTPS uniquement
3. Configurer CORS si nécessaire
4. Activer rate limiting
5. Backups automatiques de la BDD

### Performance

- **Caching** : Next.js cache automatiquement
- **Images** : Optimisées par Next.js Image
- **Build** : ~18 secondes (très bon)

### Monitoring

Recommandé en production :
- **Sentry** : Error tracking
- **Vercel Analytics** : Performance
- **Uptime Robot** : Monitoring uptime

---

## ✅ Checklist de Lancement

- [x] Base de données configurée
- [x] Resend API configurée
- [ ] Inngest configuré (optionnel)
- [ ] Compte admin créé
- [ ] Départements créés
- [ ] Premier projet créé
- [ ] Tests effectués
- [ ] Déploiement production

---

## 🆘 Support

### Documentation
- [README.md](README.md) - Vue d'ensemble
- [VERIFICATION_APIS.md](VERIFICATION_APIS.md) - Guide de vérification
- [CORRECTIONS_EFFECTUEES.md](CORRECTIONS_EFFECTUEES.md) - Corrections appliquées

### Ressources Externes
- **Next.js** : https://nextjs.org/docs
- **Prisma** : https://www.prisma.io/docs
- **Better Auth** : https://www.better-auth.com/docs
- **Resend** : https://resend.com/docs
- **Inngest** : https://www.inngest.com/docs

---

**Prêt à démarrer ? Lancez simplement :**

```bash
pnpm dev
```

**🎉 Votre application Chronodil est prête !**
