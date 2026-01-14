# 🚀 Système de Tâches Intelligent avec Inngest

## 📋 Vue d'ensemble

Ce dossier contient l'implémentation complète du système de tâches intelligent basé sur **Inngest** pour CHRONODIL App.

### Fonctionnalités

✅ **Rappels serverless** - Notifications multi-canaux (push + email) même navigateur fermé
✅ **Détection automatique de retards** - Escalade progressive aux managers
✅ **Tâches récurrentes** - Génération automatique via expressions cron
✅ **SLA tracking** - Métriques de performance en temps réel

---

## 🏗️ Architecture

```
src/inngest/
├── client.ts                    # Configuration client Inngest
├── events.ts                    # Types d'événements TypeScript
├── index.ts                     # Export des fonctions
├── functions/
│   ├── task-reminders.ts        # Job: Rappels (5 min)
│   ├── task-overdue.ts          # Job: Retards (9h daily)
│   └── task-recurring.ts        # Job: Récurrence (minuit)
└── README.md                    # Ce fichier
```

---

## ⚙️ Installation & Configuration

### 1. Variables d'environnement

Ajouter dans `.env` et `.env.production` :

```bash
# Inngest (optionnel en dev, requis en production)
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here

# App URL (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Migration de base de données

Exécuter la migration SQL pour ajouter les nouveaux champs :

```bash
# Ouvrir Supabase SQL Editor
# Copier le contenu de prisma/migrations/add_intelligent_task_system_fields.sql
# Exécuter dans Supabase
```

**Champs ajoutés :**
- `reminderNotifiedAt` - Évite doublons de rappels
- `overdueDays` - Nombre de jours de retard
- `overdueNotifiedAt` - Date dernière notification retard
- `lastEscalatedAt` - Date dernière escalade manager
- `slaDeadline` - Date limite SLA
- `slaStatus` - Statut SLA (ON_TRACK | AT_RISK | BREACHED)
- `isRecurringTemplate` - Indique si template récurrence
- `recurrenceEndDate` - Date fin récurrence
- `recurrenceExceptions` - Dates à exclure (JSON)

### 3. Démarrer Inngest Dev Server

```bash
# Terminal 1: Next.js dev server
pnpm dev

# Terminal 2: Inngest dev server
pnpx inngest-cli@latest dev

# Ouvrir le dashboard Inngest
http://localhost:8288
```

---

## 📦 Jobs Disponibles

### 1️⃣ **Task Reminders** (`task-reminders.ts`)

**Fréquence :** Toutes les 5 minutes
**Cron :** `*/5 * * * *`

**Fonctionnement :**
1. Recherche les tâches avec `reminderDate <= now`
2. Filtre les tâches non encore notifiées (ou notifiées il y a >24h)
3. Envoie notifications push + email à tous les membres
4. Marque `reminderNotifiedAt = now`

**Bénéfices vs client-side :**
- ✅ Fonctionne même navigateur fermé
- ✅ Gestion fuseaux horaires serveur
- ✅ Fiabilité 100%
- ✅ Multi-canaux (push, email)

---

### 2️⃣ **Task Overdue Detection** (`task-overdue.ts`)

**Fréquence :** Chaque jour à 9h00
**Cron :** `0 9 * * *`

**Escalade progressive :**

| Retard | Niveau | Action |
|--------|--------|--------|
| **J+1** | TEAM | Notification aux membres de la tâche |
| **J+3** | MANAGER | + Notification au manager du créateur |
| **J+7+** | CRITICAL | + Notification aux managers du projet |

**Champs mis à jour :**
- `overdueDays` = Nombre de jours de retard
- `overdueNotifiedAt` = Date notification
- `slaStatus` = ON_TRACK / AT_RISK / BREACHED

---

### 3️⃣ **Recurring Tasks Generator** (`task-recurring.ts`)

**Fréquence :** Chaque jour à minuit
**Cron :** `0 0 * * *`

**Fonctionnement :**
1. Recherche les templates (`isRecurringTemplate = true`)
2. Vérifie l'expression cron (`recurrence`)
3. Ignore les exceptions (`recurrenceExceptions`)
4. Crée les nouvelles instances
5. Copie les membres du template
6. Envoie notifications de création

**Formats cron supportés :**
```
"0 9 * * 1"     → Chaque lundi à 9h
"0 9 1 * *"     → Le 1er de chaque mois à 9h
"0 9 * * 1-5"   → Chaque jour de semaine à 9h
"0 9 1,15 * *"  → Le 1er et 15 de chaque mois
```

**Exemple d'exception (jours fériés) :**
```json
{
  "recurrenceExceptions": [
    "2026-01-01",
    "2026-12-25"
  ]
}
```

---

## 🧪 Tests

### Tester les rappels manuellement

```typescript
// Dans Inngest Dev Server UI (http://localhost:8288)
// 1. Aller dans "Functions" → "task-reminder-check"
// 2. Cliquer "Test Function"
// 3. Voir les résultats en temps réel
```

### Tester via SQL (créer une tâche avec rappel immédiat)

```sql
INSERT INTO "Task" (
  id,
  name,
  description,
  "createdBy",
  "reminderDate",
  "reminderTime",
  "soundEnabled",
  status,
  priority,
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'Test Rappel',
  'Tâche de test pour le système de rappel',
  'your-user-id-here',
  NOW() + INTERVAL '2 minutes',  -- Dans 2 minutes
  TO_CHAR(NOW() + INTERVAL '2 minutes', 'HH24:MI'),
  true,
  'TODO',
  'MEDIUM',
  true,
  NOW(),
  NOW()
);
```

---

## 🐛 Dépannage

### Inngest ne démarre pas

**Erreur:** `Could not connect to Inngest`

**Solution:**
```bash
# Vérifier que l'API route est accessible
curl http://localhost:3000/api/inngest

# Relancer Inngest dev server
pnpx inngest-cli@latest dev
```

### Jobs ne s'exécutent pas

**Vérifications:**
1. ✅ Inngest dev server tourne (`http://localhost:8288`)
2. ✅ API route accessible (`http://localhost:3000/api/inngest`)
3. ✅ Fonction visible dans dashboard Inngest
4. ✅ Migration SQL exécutée

### Notifications non envoyées

**Vérifications:**
1. ✅ Push notifications configurées (VAPID keys dans `.env`)
2. ✅ Email configuré (Resend API key dans `.env`)
3. ✅ Utilisateur a `desktopNotificationsEnabled = true`
4. ✅ Utilisateur a `emailNotificationsEnabled = true`

---

## 📊 Métriques & Monitoring

### Dashboard Inngest

Aller sur `http://localhost:8288` pour voir :
- ✅ Nombre d'exécutions
- ✅ Taux de succès/échec
- ✅ Durée d'exécution
- ✅ Logs détaillés

### Logs serveur

```typescript
// Les logs sont automatiquement affichés dans:
// - Console Next.js (pnpm dev)
// - Dashboard Inngest (http://localhost:8288)
```

---

## 🚀 Déploiement Production

### 1. Configurer Inngest Cloud

```bash
# Créer un compte sur https://www.inngest.com
# Créer une app
# Récupérer les clés API
```

### 2. Ajouter les variables Vercel

```bash
# Dans Vercel Dashboard → Settings → Environment Variables
INNGEST_EVENT_KEY=evt_xxx
INNGEST_SIGNING_KEY=signkey_xxx
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Déployer

```bash
git push origin main
# Vercel déploie automatiquement
```

### 4. Vérifier

```bash
# Tester l'endpoint
curl https://your-app.vercel.app/api/inngest

# Voir les jobs dans Inngest Cloud Dashboard
https://app.inngest.com
```

---

## 📚 Ressources

- [Documentation Inngest](https://www.inngest.com/docs)
- [Cron Expression Generator](https://crontab.guru/)
- [Next.js 16 Cache API](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

## 🎯 Prochaines Étapes

### Phase 2: Optimistic Updates (TanStack Query)

Implémenter les mutations optimistes pour une UI ultra-réactive :
- ✅ Mise à jour instantanée
- ✅ Rollback automatique en cas d'erreur
- ✅ Synchronisation cache intelligente

### Phase 3: Analytics & Métriques

Dashboard de métriques pour les tâches :
- ✅ Taux de complétion
- ✅ Temps moyen de résolution
- ✅ Compliance SLA
- ✅ Tendances de productivité

---

**Développé avec ❤️ pour CHRONODIL App**
