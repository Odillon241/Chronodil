# 📋 Plan d'Implémentation - Complétion Inngest

> **Objectif :** Rendre le système Inngest complètement opérationnel **Estimé
> :** 2-3 heures

---

## 🎯 Vue d'ensemble

### État actuel

- ✅ 9 fonctions Inngest opérationnelles (tâches, HR timesheets, emails)
- ❌ 3 fonctions manquantes (chat schedulé, rappels messages, rappels
  multi-activités)

### Fichiers à créer/modifier

| Fichier                                   | Action                    | Priorité |
| ----------------------------------------- | ------------------------- | -------- |
| `src/lib/inngest/functions-chat.ts`       | **CRÉER**                 | Haute    |
| `src/inngest/functions/user-reminders.ts` | **CRÉER**                 | Moyenne  |
| `src/app/api/inngest/route.ts`            | Modifier                  | Haute    |
| `src/inngest/client.ts`                   | Modifier (ajouter Events) | Basse    |

---

## 📦 Phase 1 : Messages Programmés (`sendScheduledMessages`)

### 1.1 Créer le fichier `src/lib/inngest/functions-chat.ts`

```typescript
import { inngest } from './client'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'

/**
 * Job: Envoi des messages programmés
 * Fréquence: Toutes les minutes
 * Cron: "* * * * *"
 */
export const sendScheduledMessages = inngest.createFunction(
  {
    id: 'send-scheduled-messages',
    name: 'Send Scheduled Messages',
    retries: 3,
  },
  { cron: '* * * * *' },
  async ({ step }) => {
    const now = new Date()

    // Étape 1: Trouver les messages programmés à envoyer
    const scheduledMessages = await step.run(
      'find-scheduled-messages',
      async () => {
        return prisma.scheduledMessage.findMany({
          where: {
            scheduledAt: { lte: now },
            status: 'PENDING', // Ajouter un champ status si non existant
          },
          include: {
            User: { select: { id: true, name: true } },
            Conversation: true,
          },
          take: 50,
        })
      },
    )

    if (scheduledMessages.length === 0) {
      return { processed: 0, message: 'Aucun message programmé à envoyer' }
    }

    // Étape 2: Créer les messages réels
    const results = []
    for (const scheduled of scheduledMessages) {
      const result = await step.run(
        `send-message-${scheduled.id}`,
        async () => {
          // Créer le message dans la conversation
          const message = await prisma.message.create({
            data: {
              id: nanoid(),
              content: scheduled.content,
              senderId: scheduled.userId,
              conversationId: scheduled.conversationId,
              // Copier les attachments si présents
            },
          })

          // Marquer comme envoyé
          await prisma.scheduledMessage.update({
            where: { id: scheduled.id },
            data: { status: 'SENT', sentAt: now },
          })

          return { scheduledId: scheduled.id, messageId: message.id }
        },
      )
      results.push(result)
    }

    return { processed: scheduledMessages.length, results }
  },
)
```

### 1.2 Points d'attention

- Vérifier le schéma `ScheduledMessage` dans Prisma (champs `status`, `sentAt`)
- Gérer les attachments si le message programmé en contient
- Émettre un event realtime pour notifier les membres de la conversation

---

## 📦 Phase 2 : Rappels de Messages (`sendMessageReminders`)

### 2.1 Ajouter dans `src/lib/inngest/functions-chat.ts`

```typescript
/**
 * Job: Envoi des rappels de messages
 * Fréquence: Toutes les 5 minutes
 * Cron: "*/5 * * * *"
 */
export const sendMessageReminders = inngest.createFunction(
  {
    id: "send-message-reminders",
    name: "Send Message Reminders",
    retries: 3,
  },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    const now = new Date();

    // Étape 1: Trouver les rappels dus
    const dueReminders = await step.run("find-due-reminders", async () => {
      return prisma.messageReminder.findMany({
        where: {
          reminderAt: { lte: now },
          isCompleted: false,
        },
        include: {
          User: { select: { id: true, name: true, email: true } },
          Message: {
            include: {
              Conversation: true,
              User: { select: { name: true } },
            },
          },
        },
        take: 100,
      });
    });

    if (dueReminders.length === 0) {
      return { processed: 0 };
    }

    // Étape 2: Envoyer les notifications
    for (const reminder of dueReminders) {
      await step.run(`process-reminder-${reminder.id}`, async () => {
        // Créer notification in-app
        await prisma.notification.create({
          data: {
            id: nanoid(),
            userId: reminder.userId,
            title: "🔔 Rappel de message",
            message: `Rappel: ${reminder.Message.content.substring(0, 50)}...`,
            type: "message_reminder",
            link: `/dashboard/chat/${reminder.Message.conversationId}`,
          },
        });

        // Marquer comme complété
        await prisma.messageReminder.update({
          where: { id: reminder.id },
          data: { isCompleted: true, completedAt: now },
        });
      });
    }

    return { processed: dueReminders.length };
  }
);

// Export
export const chatFunctions = [sendScheduledMessages, sendMessageReminders];
```

### 2.2 Points d'attention

- Vérifier le schéma `MessageReminder` (champs `isCompleted`, `completedAt`)
- Optionnel : Envoyer aussi un push notification

---

## 📦 Phase 3 : Rappels Multi-Activités (`UserReminder`)

### 3.1 Créer `src/inngest/functions/user-reminders.ts`

```typescript
import { inngest } from '../client'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'

/**
 * Job: Traitement des rappels personnalisés multi-activités
 * Fréquence: Toutes les minutes
 * Cron: "* * * * *"
 */
export const processUserReminders = inngest.createFunction(
  {
    id: 'process-user-reminders',
    name: 'Process User Custom Reminders',
    retries: 3,
  },
  { cron: '* * * * *' },
  async ({ step }) => {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const dayOfWeek = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][now.getDay()]

    // Trouver les rappels actifs pour cette heure/jour
    const activeReminders = await step.run(
      'find-active-reminders',
      async () => {
        return prisma.userReminder.findMany({
          where: {
            isActive: true,
            time: currentTime,
            days: { has: dayOfWeek },
          },
          include: {
            User: { select: { id: true, name: true, email: true } },
          },
        })
      },
    )

    if (activeReminders.length === 0) {
      return { processed: 0, time: currentTime, day: dayOfWeek }
    }

    // Traiter chaque rappel selon son type
    for (const reminder of activeReminders) {
      await step.run(`process-${reminder.id}`, async () => {
        let title = ''
        let message = ''
        let link = ''

        switch (reminder.activityType) {
          case 'TIMESHEET':
            title = '📅 Rappel : Saisie de temps'
            message = "N'oubliez pas de saisir vos heures de travail."
            link = '/dashboard/hr-timesheet/new'
            break
          case 'TASKS':
            title = '✅ Rappel : Vos tâches'
            message = 'Consultez vos tâches en cours.'
            link = '/dashboard/tasks'
            break
          case 'HR_TIMESHEET':
            title = '📋 Rappel : Validation feuilles de temps'
            message = 'Des feuilles de temps sont en attente de validation.'
            link = '/dashboard/hr-timesheet'
            break
          case 'CUSTOM':
            title = reminder.customTitle || '🔔 Rappel'
            message = reminder.customMessage || ''
            link = reminder.customLink || '/dashboard'
            break
        }

        // Créer la notification
        await prisma.notification.create({
          data: {
            id: nanoid(),
            userId: reminder.userId,
            title,
            message,
            type: 'reminder',
            link,
          },
        })

        // Mettre à jour lastTriggeredAt
        await prisma.userReminder.update({
          where: { id: reminder.id },
          data: { lastTriggeredAt: now },
        })
      })
    }

    return { processed: activeReminders.length }
  },
)
```

### 3.2 Vérifier le schéma `UserReminder`

Champs nécessaires :

- `id`, `userId`, `isActive`
- `activityType` (enum: TIMESHEET, TASKS, HR_TIMESHEET, CUSTOM)
- `time` (format HH:MM)
- `days` (array: MONDAY, TUESDAY...)
- `customTitle`, `customMessage`, `customLink` (pour type CUSTOM)
- `lastTriggeredAt`

---

## 📦 Phase 4 : Intégration dans l'API Route

### 4.1 Modifier `src/app/api/inngest/route.ts`

```typescript
import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import {
  sendEmailNotification,
  sendTimesheetReminders,
} from '@/lib/inngest/functions'
import { inngestFunctions as taskFunctions } from '@/inngest'
// ✅ DÉCOMMENTER ET AJOUTER :
import {
  sendScheduledMessages,
  sendMessageReminders,
} from '@/lib/inngest/functions-chat'
import { processUserReminders } from '@/inngest/functions/user-reminders'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendEmailNotification,
    sendTimesheetReminders,
    ...taskFunctions,
    // ✅ AJOUTER :
    sendScheduledMessages,
    sendMessageReminders,
    processUserReminders,
  ],
})
```

### 4.2 Exporter dans `src/inngest/index.ts`

```typescript
// Ajouter l'export
import { processUserReminders } from './functions/user-reminders'

export const inngestFunctions = [
  // ... existants
  processUserReminders,
]
```

---

## ✅ Phase 5 : Tests et Validation

### 5.1 Tests locaux

```bash
# Terminal 1 : Dev server
pnpm dev

# Terminal 2 : Inngest dev server
pnpx inngest-cli@latest dev

# Ouvrir le dashboard
# http://localhost:8288
```

### 5.2 Checklist de validation

- [ ] Les 3 nouvelles fonctions apparaissent dans le dashboard Inngest
- [ ] `sendScheduledMessages` s'exécute chaque minute
- [ ] `sendMessageReminders` s'exécute toutes les 5 minutes
- [ ] `processUserReminders` s'exécute chaque minute
- [ ] Les notifications sont créées en base
- [ ] Les messages programmés sont bien envoyés

### 5.3 Tests manuels (SQL Supabase)

```sql
-- Créer un message programmé pour test
INSERT INTO "ScheduledMessage" (id, "userId", "conversationId", content, "scheduledAt", status)
VALUES (
  gen_random_uuid()::text,
  'votre-user-id',
  'votre-conversation-id',
  'Test message programmé',
  NOW() + INTERVAL '2 minutes',
  'PENDING'
);

-- Créer un rappel utilisateur pour test
INSERT INTO "UserReminder" (id, "userId", "isActive", "activityType", time, days)
VALUES (
  gen_random_uuid()::text,
  'votre-user-id',
  true,
  'TIMESHEET',
  TO_CHAR(NOW() + INTERVAL '2 minutes', 'HH24:MI'),
  ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
);
```

---

## 📊 Récapitulatif

| Phase     | Fichier                        | Temps estimé |
| --------- | ------------------------------ | ------------ |
| 1         | `functions-chat.ts` (messages) | 30 min       |
| 2         | `functions-chat.ts` (rappels)  | 20 min       |
| 3         | `user-reminders.ts`            | 30 min       |
| 4         | `route.ts` + `index.ts`        | 10 min       |
| 5         | Tests                          | 30 min       |
| **Total** |                                | **~2h**      |

---

**Créé le :** 2026-01-21 **Auteur :** Antigravity Assistant
