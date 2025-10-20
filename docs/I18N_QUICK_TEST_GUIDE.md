# 🧪 Guide de test rapide - Système i18n

## Test en 5 minutes ⚡

### 1. Démarrer l'application

```bash
pnpm dev
```

### 2. Se connecter

- Email : (votre compte existant)
- Mot de passe : (votre mot de passe)

### 3. Tester le changement de langue

#### Étape 1 : Aller dans les paramètres
1. Cliquer sur l'icône utilisateur en bas à gauche
2. Cliquer sur **"⚙️ Paramètres"**
3. Vous êtes sur l'onglet **"Général"**

#### Étape 2 : Changer la langue
1. Aller à la section **"Localisation"**
2. Trouver le champ **"Langue"**
3. Sélectionner **"English"** dans le dropdown
4. Attendre ~500ms (rafraîchissement automatique)

#### Étape 3 : Observer les changements
**Ce qui DOIT changer :**
- ✅ Titre de la page : "Paramètres" → "Settings"
- ✅ Onglet : "Général" → "General"
- ✅ Section : "Localisation" → "Localization"
- ✅ Champ : "Langue" → "Language"
- ✅ Sidebar (menu gauche) :
  - "Tableau de bord" → "Dashboard"
  - "Feuilles de temps" → "Timesheets"
  - "Projets" → "Projects"
  - "Tâches" → "Tasks"
  - etc.

#### Étape 4 : Naviguer dans l'app
1. Cliquer sur "Dashboard" dans la sidebar
2. Observer le titre : "Dashboard" (EN) au lieu de "Tableau de bord" (FR)
3. Cliquer sur "Projects"
4. Observer le titre : "Projects" (EN) au lieu de "Projets" (FR)

#### Étape 5 : Revenir au français
1. Retourner dans Settings → General → Localization
2. Sélectionner "Français"
3. Observer tout revenir en français

### 4. Vérifier la persistance

1. Après avoir changé la langue, **rafraîchir la page** (F5)
2. La langue choisie doit être conservée
3. La langue est sauvegardée en base de données

---

## ✅ Checklist de vérification

### Infrastructure

| Élément | Test | Résultat attendu |
|---------|------|------------------|
| next-intl installé | `grep "next-intl" package.json` | Doit apparaître |
| Config i18n | Fichier `i18n.ts` existe | ✅ Existe |
| Provider | `src/i18n/provider.tsx` existe | ✅ Existe |
| Dictionnaires | `src/i18n/messages/fr.json` et `en.json` existent | ✅ Existent |

### Traductions visibles

| Page/Composant | Élément | FR | EN |
|----------------|---------|----|----|
| **Sidebar** | Menu principal | ✅ Traduit | ✅ Traduit |
| **Dashboard** | Titre | ✅ "Tableau de bord" | ✅ "Dashboard" |
| **Projets** | Titre | ✅ "Projets" | ✅ "Projects" |
| **Paramètres** | Tous les labels | ✅ 100% traduit | ✅ 100% traduit |

### Fonctionnalités

| Fonctionnalité | Test | Résultat attendu |
|----------------|------|------------------|
| Changement de langue | Changer de FR à EN | Interface en anglais |
| Persistance | F5 après changement | Langue conservée |
| Chargement auto | Se reconnecter | Langue de l'utilisateur chargée |

---

## 🐛 Problèmes potentiels

### Problème 1 : La langue ne change pas
**Symptôme** : Sélectionner "English" mais rien ne change

**Solutions** :
1. Vérifier la console (F12) pour des erreurs
2. Vérifier que le serveur est lancé (`pnpm dev`)
3. Vider le cache : `rm -rf .next` puis `pnpm dev`
4. Vérifier que `next-intl` est installé : `pnpm install`

### Problème 2 : Erreur "Missing message"
**Symptôme** : Message "Missing message: navigation.dashboard" dans la console

**Solutions** :
1. Vérifier que la clé existe dans `fr.json` ET `en.json`
2. Vérifier l'orthographe de la clé
3. Redémarrer le serveur

### Problème 3 : La langue ne se sauvegarde pas
**Symptôme** : Après F5, la langue revient au français

**Solutions** :
1. Vérifier que la colonne `language` existe dans la table `User`
2. Exécuter `pnpm prisma generate` puis `pnpm prisma db push`
3. Vérifier que l'action `updateGeneralSettings` fonctionne

### Problème 4 : Certains textes restent en français
**Symptôme** : Certaines parties de l'interface ne changent pas

**Explication** : Toutes les pages ne sont pas encore traduites à 100%.

**Statut actuel** :
- ✅ Navigation : 100%
- ✅ Paramètres : 100%
- ⚡ Dashboard : 50%
- ⚡ Projets : 30%
- ⏳ Autres pages : 0%

---

## 📊 Résultats attendus

### Après avoir changé la langue en anglais

#### Sidebar (menu gauche)
```
FR                    →  EN
─────────────────────────────────────
Tableau de bord       →  Dashboard
Feuilles de temps     →  Timesheets
Feuilles RH           →  HR Timesheets
Projets               →  Projects
Tâches                →  Tasks
Chat                  →  Chat
Validation            →  Validation
Validations Manager   →  Manager Validations
Rapports              →  Reports
Paramètres            →  Settings
Audit                 →  Audit
```

#### Dashboard
```
FR                    →  EN
─────────────────────────────────────
Tableau de bord       →  Dashboard
Bienvenue             →  Welcome
Cette semaine         →  This Week
Ce mois               →  This Month
```

#### Paramètres
```
FR                    →  EN
─────────────────────────────────────
Paramètres            →  Settings
Général               →  General
Apparence             →  Appearance
Localisation          →  Localization
Accessibilité         →  Accessibility
Mode sombre           →  Dark Mode
Langue                →  Language
Format de date        →  Date Format
```

#### Projets
```
FR                    →  EN
─────────────────────────────────────
Projets               →  Projects
Nouveau projet        →  New Project
Gérez vos projets...  →  Manage your projects...
```

---

## 🎯 Test complet (10 minutes)

### Scénario 1 : Changement de langue de base
1. ✅ Se connecter
2. ✅ Aller dans Paramètres → Général → Localisation
3. ✅ Changer la langue pour "English"
4. ✅ Observer la sidebar changer
5. ✅ Observer les paramètres changer
6. ✅ Naviguer vers Dashboard → observe "Dashboard" au lieu de "Tableau de bord"
7. ✅ Revenir au français
8. ✅ Observer tout revenir en français

### Scénario 2 : Persistance
1. ✅ Changer la langue pour "English"
2. ✅ Rafraîchir la page (F5)
3. ✅ Observer que l'interface reste en anglais
4. ✅ Se déconnecter
5. ✅ Se reconnecter
6. ✅ Observer que l'interface est toujours en anglais

### Scénario 3 : Navigation complète
1. ✅ En anglais, naviguer vers chaque page :
   - Dashboard ✅ (titre en anglais)
   - Projects ✅ (titre en anglais)
   - Tasks ⏳ (partiellement)
   - Timesheets ⏳ (partiellement)
   - Reports ⏳ (partiellement)
   - Settings ✅ (100% anglais)

---

## ✨ Félicitations !

Si tous les tests passent, votre système i18n fonctionne parfaitement ! 🎉

**Le système est prêt pour être utilisé en production.**

Il ne reste que la traduction des pages restantes, mais l'infrastructure est 100% opérationnelle.

---

**Date de test** : _____________  
**Testeur** : _____________  
**Résultat** : ✅ PASS | ❌ FAIL  
**Notes** : _______________________________

