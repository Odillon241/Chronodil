# 🔔 Système de Rappels de Saisie de Temps

**Date** : 2025-01-08  
**Statut** : ✅ Implémenté et fonctionnel

---

## 📋 Vue d'ensemble

Le système de rappels de saisie de temps permet aux utilisateurs de recevoir des notifications automatiques pour les rappeler de saisir leurs heures de travail. Les rappels sont intelligents et ne sont envoyés que si l'utilisateur n'a pas encore saisi de temps pour la journée.

---

## 🎯 Fonctionnalités

### ✅ Préférences utilisateur
- Activation/désactivation des rappels
- Configuration de l'heure du rappel (format HH:MM)
- Sélection des jours de la semaine
- Intégration avec les préférences de notifications (email, desktop)

### ✅ Rappels automatiques
- Exécution automatique toutes les heures via cron job
- Vérification intelligente : ne notifie que si aucun temps n'est saisi
- Respect des préférences utilisateur (heure, jours, activation)
- Support du déclenchement manuel pour les tests

### ✅ Notifications
- **Notification in-app** : Toujours créée
- **Email** : Si `emailNotificationsEnabled` est activé
- **Notification desktop** : Si `desktopNotificationsEnabled` est activé

---

## 🏗️ Architecture

### Composants

```
┌─────────────────────────────────────────────────────────┐
│              Page Préférences Rappels                    │
│         /dashboard/settings/reminders                    │
│  - Configuration heure/jours                             │
│  - Activation/désactivation                             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         Actions Server (reminder-preferences.actions)     │
│  - getReminderPreferences()                              │
│  - updateReminderPreferences()                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         Base de données (Prisma)                         │
│  User.enableTimesheetReminders                           │
│  User.reminderTime                                       │
│  User.reminderDays                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         Fonction Inngest (sendTimesheetReminders)        │
│  - Cron: 0 * * * * (toutes les heures)                  │
│  - Event: reminder/timesheet.trigger (manuel)           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         Système de Notifications                         │
│  - Notification in-app (Prisma)                          │
│  - Email (Resend)                                        │
│  - Desktop (Browser API)                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Configuration

### Variables d'environnement

```env
# Inngest (requis pour les rappels automatiques)
INNGEST_EVENT_KEY="evt_xxxxxxxxxxxxx"
INNGEST_SIGNING_KEY="signkey_xxxxxxxxxxxxx"

# Email (optionnel, pour les emails de rappel)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@chronodil.app"

# URL de l'application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Configuration Inngest

1. **Créer un compte Inngest** : https://app.inngest.com
2. **Créer une application** : "Chronodil"
3. **Récupérer les clés** :
   - Event Key : `evt_...`
   - Signing Key : `signkey_...`
4. **Ajouter dans `.env`**

### Lancer Inngest Dev Server (développement)

```bash
# Terminal 1 - Inngest Dev Server
pnpm dlx inngest-cli@latest dev

# Terminal 2 - Application Next.js
pnpm dev
```

L'interface Inngest sera accessible sur http://localhost:8288

---

## 🧪 Tests

### Test manuel via script

```bash
pnpm tsx scripts/testing/test-reminders.ts
```

Ce script :
1. Liste les utilisateurs avec rappels activés
2. Vérifie les temps saisis aujourd'hui
3. Déclenche les rappels manuellement
4. Affiche les notifications créées

### Test via helper

```typescript
import { triggerTimesheetReminders } from '@/lib/inngest/helpers';

// Déclencher immédiatement (sans attendre le cron)
await triggerTimesheetReminders();
```

### Test via interface utilisateur

1. Aller sur `/dashboard/settings/reminders`
2. Activer les rappels
3. Configurer l'heure (ex: 17:00)
4. Sélectionner les jours (ex: Lundi-Vendredi)
5. Sauvegarder
6. S'assurer qu'aucun temps n'est saisi pour aujourd'hui
7. Attendre l'heure configurée OU déclencher manuellement
8. Vérifier la notification dans `/dashboard/notifications`

---

## 🔍 Logique de détection "Temps saisi"

La fonction vérifie si un utilisateur a déjà saisi du temps aujourd'hui en cherchant des activités HR qui **chevauchent** la journée actuelle :

```typescript
// Une activité chevauche aujourd'hui si :
// - startDate <= demain ET endDate >= aujourd'hui
// - totalHours > 0 (temps réellement saisi)
// - Status: DRAFT, SUBMITTED, ou APPROVED
```

**Exemples** :
- ✅ Activité du 01/01 au 05/01 → Détectée le 03/01
- ✅ Activité du 08/01 au 08/01 → Détectée le 08/01
- ❌ Activité du 01/01 au 05/01 → Non détectée le 10/01
- ❌ Activité avec totalHours = 0 → Non comptée

---

## 📊 Fonction Inngest

### `sendTimesheetReminders`

**Déclenchement** :
- **Cron** : `0 * * * *` (toutes les heures à la minute 0)
- **Event** : `reminder/timesheet.trigger` (déclenchement manuel)

**Étapes** :
1. **find-users-to-remind** : Trouve les utilisateurs avec rappels activés pour l'heure/jour actuels
2. **check-users-without-time** : Vérifie qui n'a pas encore saisi de temps aujourd'hui
3. **send-reminders** : Envoie les notifications (in-app + email si activé)

**Retry** : 2 tentatives en cas d'échec

---

## 🎨 Interface utilisateur

### Page des préférences (`/dashboard/settings/reminders`)

**Sections** :
1. **Alert d'information** : Explique l'intégration avec les notifications
2. **Activation** : Switch pour activer/désactiver les rappels
3. **Heure du rappel** : Input time (HH:MM)
4. **Jours de rappel** : Checkboxes pour chaque jour
5. **Types de notifications** : Affiche les 3 types (in-app, email, desktop)
6. **Informations** : Explications sur le fonctionnement

**Lien vers notifications** : `/dashboard/settings?tab=notifications`

---

## 🔧 Helpers disponibles

### `triggerTimesheetReminders()`

Déclenche manuellement les rappels (utile pour les tests).

```typescript
import { triggerTimesheetReminders } from '@/lib/inngest/helpers';

await triggerTimesheetReminders();
```

**Note** : La fonction vérifie toujours l'heure/jour actuels, donc elle ne notifiera que les utilisateurs qui correspondent à la configuration actuelle.

---

## 📈 Monitoring

### Vérifier les rappels envoyés

1. **Via Inngest Dashboard** :
   - Aller sur https://app.inngest.com
   - Voir les exécutions de `send-timesheet-reminders`
   - Vérifier les logs et résultats

2. **Via base de données** :
   ```sql
   SELECT * FROM "Notification" 
   WHERE type = 'reminder' 
   AND "createdAt" >= NOW() - INTERVAL '24 hours'
   ORDER BY "createdAt" DESC;
   ```

3. **Via interface** :
   - `/dashboard/notifications`
   - Filtrer par type "reminder"

---

## ⚠️ Points d'attention

### Fuseau horaire
- Les rappels utilisent le fuseau horaire du serveur
- Assurez-vous que le serveur est configuré correctement

### Performance
- La fonction s'exécute toutes les heures
- Pour de grandes bases de données, considérer l'ajout d'index sur :
  - `User.enableTimesheetReminders`
  - `User.reminderTime`
  - `User.reminderDays`
  - `HRActivity.startDate`
  - `HRActivity.endDate`

### Emails
- Les emails ne sont envoyés que si `RESEND_API_KEY` est configuré
- Vérifier que le domaine est vérifié dans Resend

---

## 🚀 Déploiement

### Vercel

1. **Configurer les variables d'environnement** dans Vercel Dashboard
2. **Configurer Inngest** :
   - Ajouter l'URL de l'application dans Inngest
   - Configurer le webhook : `https://votre-app.vercel.app/api/inngest`
3. **Vérifier les logs** après déploiement

### Production

- ✅ Les rappels fonctionnent automatiquement via cron
- ✅ Pas besoin de serveur dédié
- ✅ Inngest gère la scalabilité

---

## 📚 Références

- **Documentation Inngest** : https://www.inngest.com/docs
- **Documentation Resend** : https://resend.com/docs
- **Page des préférences** : `/dashboard/settings/reminders`
- **Page des notifications** : `/dashboard/settings?tab=notifications`
- **API Documentation** : `docs/VERIFICATION_APIS.md`

---

## ✅ Checklist de vérification

- [ ] Variables d'environnement Inngest configurées
- [ ] Inngest Dev Server lancé (développement)
- [ ] Préférences de rappel configurées pour au moins un utilisateur
- [ ] Test manuel effectué avec succès
- [ ] Notifications in-app vérifiées
- [ ] Emails vérifiés (si activés)
- [ ] Logs Inngest vérifiés
- [ ] Documentation à jour

---

**Dernière mise à jour** : 2025-01-08

