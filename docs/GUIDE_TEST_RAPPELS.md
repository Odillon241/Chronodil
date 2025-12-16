# 🧪 Guide de Test Rapide - Système de Rappels

**Temps estimé** : 5-10 minutes

---

## 🚀 Démarrage rapide

### Étape 1 : Lancer Inngest Dev Server

```bash
# Dans un terminal séparé
pnpm dlx inngest-cli@latest dev
```

✅ Vous devriez voir :
```
✓ Inngest dev server running at http://localhost:8288
✓ Connected to Inngest Cloud
```

### Étape 2 : Lancer l'application

```bash
# Dans un autre terminal
pnpm dev
```

✅ L'application sera accessible sur http://localhost:3000

### Étape 3 : Configurer les préférences de rappel

1. **Se connecter** à l'application
2. Aller sur **Paramètres > Rappels** (`/dashboard/settings/reminders`)
3. **Activer** les rappels de saisie de temps
4. **Configurer** :
   - Heure : `17:00` (ou l'heure actuelle + 1 minute pour test rapide)
   - Jours : Cocher au moins le jour actuel (ex: Lundi si on est lundi)
5. **Sauvegarder**

### Étape 4 : Vérifier qu'aucun temps n'est saisi

1. Aller sur **Feuilles RH** (`/dashboard/hr-timesheet`)
2. Vérifier qu'**aucune activité** n'est enregistrée pour aujourd'hui
3. Si une activité existe, la supprimer temporairement pour le test

### Étape 5 : Déclencher le rappel manuellement

**Option A : Via le script de test**

```bash
pnpm tsx scripts/testing/test-reminders.ts
```

**Option B : Via Inngest Dashboard**

1. Ouvrir http://localhost:8288
2. Aller dans **Functions**
3. Trouver `send-timesheet-reminders`
4. Cliquer sur **Trigger** ou **Test**
5. Vérifier les logs

**Option C : Attendre l'heure configurée**

Si vous avez configuré l'heure actuelle, attendre que le cron se déclenche (toutes les heures à la minute 0).

### Étape 6 : Vérifier les résultats

1. **Notification in-app** :
   - Aller sur `/dashboard/notifications`
   - Vérifier qu'une notification "Rappel : Saisie de temps" apparaît
   - Type : `reminder`

2. **Email** (si activé) :
   - Vérifier votre boîte mail
   - Sujet : "Rappel : Saisie de temps"

3. **Inngest Dashboard** :
   - Ouvrir http://localhost:8288
   - Voir les exécutions de `send-timesheet-reminders`
   - Vérifier les logs et résultats

---

## 🔍 Vérifications détaillées

### Vérifier les préférences en base de données

```sql
SELECT 
  id, 
  email, 
  name,
  "enableTimesheetReminders",
  "reminderTime",
  "reminderDays"
FROM "User"
WHERE "enableTimesheetReminders" = true;
```

### Vérifier les notifications créées

```sql
SELECT 
  id,
  "userId",
  title,
  message,
  type,
  "createdAt"
FROM "Notification"
WHERE type = 'reminder'
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Vérifier les temps saisis aujourd'hui

```sql
SELECT 
  ha.id,
  ha."activityName",
  ha."startDate",
  ha."endDate",
  ha."totalHours",
  ht."userId"
FROM "HRActivity" ha
JOIN "HRTimesheet" ht ON ha."hrTimesheetId" = ht.id
WHERE ha."startDate" <= CURRENT_DATE + INTERVAL '1 day'
  AND ha."endDate" >= CURRENT_DATE
  AND ha."totalHours" > 0;
```

---

## 🐛 Dépannage

### Problème : Aucune notification reçue

**Vérifications** :
1. ✅ Inngest Dev Server est lancé
2. ✅ Les préférences sont bien sauvegardées
3. ✅ L'heure/jour correspondent à la configuration
4. ✅ Aucun temps n'est saisi pour aujourd'hui
5. ✅ L'utilisateur est actif (`isActive = true`)

**Solution** :
- Vérifier les logs Inngest : http://localhost:8288
- Exécuter le script de test : `pnpm tsx scripts/testing/test-reminders.ts`
- Vérifier la console du serveur Next.js pour les erreurs

### Problème : Email non reçu

**Vérifications** :
1. ✅ `RESEND_API_KEY` est configuré dans `.env`
2. ✅ `emailNotificationsEnabled` est activé pour l'utilisateur
3. ✅ Le domaine est vérifié dans Resend

**Solution** :
- Vérifier les logs Resend dans le dashboard
- Vérifier que `RESEND_FROM_EMAIL` est configuré
- Tester l'envoi d'email manuellement

### Problème : Fonction Inngest non déclenchée

**Vérifications** :
1. ✅ Inngest Dev Server est connecté
2. ✅ L'endpoint `/api/inngest` est accessible
3. ✅ Les fonctions sont bien enregistrées

**Solution** :
- Vérifier http://localhost:8288 → Functions
- Vérifier que `send-timesheet-reminders` apparaît dans la liste
- Vérifier les logs du serveur Next.js

---

## 📊 Exemple de résultat attendu

### Script de test

```
🧪 Test des rappels de saisie de temps

1️⃣ Recherche des utilisateurs avec rappels activés...
   ✅ 1 utilisateur(s) avec rappels activés

   1. John Doe
      - Heure: 17:00
      - Jours: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY
      - Email activé: Oui

2️⃣ Vérification des temps saisis aujourd'hui...
   John Doe: ❌ Aucun temps saisi

3️⃣ Déclenchement manuel des rappels...
   ✅ Rappels déclenchés avec succès
   📧 Vérifiez les notifications dans /dashboard/notifications
   📬 Vérifiez les emails (si activés)

4️⃣ Vérification des notifications créées...
   ✅ 1 notification(s) de rappel créée(s) récemment :

   - John Doe
     "Rappel : Saisie de temps"
     08/01/2025 17:00:00

✅ Test terminé !
```

### Inngest Dashboard

- **Function** : `send-timesheet-reminders`
- **Status** : ✅ Success
- **Result** : 
  ```json
  {
    "message": "Reminders sent to 1 users",
    "usersReminded": 1,
    "usersChecked": 1
  }
  ```

---

## ✅ Checklist de test

- [ ] Inngest Dev Server lancé
- [ ] Application Next.js lancée
- [ ] Préférences de rappel configurées
- [ ] Aucun temps saisi pour aujourd'hui
- [ ] Rappel déclenché (manuel ou automatique)
- [ ] Notification in-app reçue
- [ ] Email reçu (si activé)
- [ ] Logs Inngest vérifiés
- [ ] Script de test exécuté avec succès

---

## 🎯 Test en production

Pour tester en production :

1. **Configurer Inngest Cloud** :
   - Créer un compte sur https://app.inngest.com
   - Créer une application "Chronodil"
   - Configurer le webhook : `https://votre-app.vercel.app/api/inngest`

2. **Ajouter les variables d'environnement** dans Vercel :
   ```
   INNGEST_EVENT_KEY=evt_...
   INNGEST_SIGNING_KEY=signkey_...
   ```

3. **Tester** :
   - Configurer les préférences de rappel
   - Attendre l'heure configurée
   - Vérifier les notifications

---

**Bon test ! 🚀**

