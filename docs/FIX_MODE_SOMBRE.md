# Fix - Mode Sombre/Clair Défectueux

## 🐛 Problème Identifié

Le mode sombre/clair était défectueux car :

1. **Deux systèmes en conflit** :
   - `next-themes` manipule la classe `dark` sur `<html>`
   - Notre `SettingsProvider` manipulait aussi directement le DOM

2. **Pas de synchronisation** :
   - Le paramètre `darkModeEnabled` en BD n'était pas synchronisé avec `next-themes`
   - Parfois le thème s'appliquait, parfois non selon l'ordre d'exécution

## ✅ Solution Appliquée

### 1. Modification du `SettingsProvider`
**Fichier:** `src/components/providers/settings-provider.tsx`

**Changement:**
```typescript
// ❌ AVANT - Manipulation directe du DOM
if (settings.darkModeEnabled) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

// ✅ APRÈS - Utilisation de next-themes
const theme = settings.darkModeEnabled ? "dark" : "light";
setTheme(theme);
```

**Avantages:**
- ✅ Un seul système gère le thème (`next-themes`)
- ✅ Synchronisation localStorage + BD
- ✅ Transitions fluides
- ✅ Pas de conflit

### 2. Modification du `AppearanceSection`
**Fichier:** `src/components/features/general-settings/appearance-section.tsx`

**Ajout:**
```typescript
const { setTheme } = useTheme();

// Handler qui synchronise next-themes ET la BD
const handleDarkModeToggle = (checked: boolean) => {
  // 1. Appliquer immédiatement avec next-themes
  setTheme(checked ? "dark" : "light");

  // 2. Sauvegarder en BD
  onUpdate("darkModeEnabled", checked);
};
```

**Flux complet:**
1. User toggle le switch
2. `next-themes` change immédiatement le thème (localStorage)
3. La BD est mise à jour en arrière-plan
4. Au prochain chargement, le `SettingsProvider` applique le thème depuis la BD

### 3. Synchronisation au chargement
**Dans:** `SettingsProvider`

```typescript
useEffect(() => {
  if (!session?.user || isInitialized) return;

  // Charger les paramètres depuis la BD
  const result = await getGeneralSettings({});

  // Appliquer le thème via next-themes
  const theme = result.data.darkModeEnabled ? "dark" : "light";
  setTheme(theme);
}, [session?.user]);
```

## 🧪 Comment Tester

### Test 1: Toggle Immédiat
1. Aller sur `/dashboard/settings` → Tab "Général"
2. Toggle le mode sombre
3. **Attendu:** Le thème change IMMÉDIATEMENT (pas de délai)

### Test 2: Persistance
1. Toggle le mode sombre
2. Rafraîchir la page (F5)
3. **Attendu:** Le thème reste dans l'état choisi

### Test 3: Après Déconnexion/Reconnexion
1. Toggle le mode sombre
2. Se déconnecter
3. Se reconnecter
4. **Attendu:** Le thème personnel est appliqué (pas le système)

### Test 4: Console Logs
Vérifier dans la console :
```
⚙️ Chargement des paramètres généraux...
✅ Paramètres chargés: {darkModeEnabled: true, ...}
🎨 Application du thème: dark
🌓 Toggle mode sombre: false
```

## 📊 Architecture Finale

```
┌─────────────────────────────────────────┐
│           next-themes                   │
│  (Source de vérité pour le thème)       │
│  - Gère localStorage.theme              │
│  - Applique la classe "dark"            │
└─────────────┬───────────────────────────┘
              │
              │ setTheme()
              │
┌─────────────▼───────────────────────────┐
│        SettingsProvider                 │
│  - Charge darkModeEnabled depuis BD     │
│  - Applique via setTheme()              │
│  - Synchronise au démarrage             │
└─────────────┬───────────────────────────┘
              │
              │
┌─────────────▼───────────────────────────┐
│      AppearanceSection                  │
│  - Toggle appelle setTheme() puis BD    │
│  - Changement immédiat + persistance    │
└─────────────────────────────────────────┘
```

## 🎯 Résultat

- ✅ Changement de thème **instantané**
- ✅ Persistance **garantie**
- ✅ Pas de conflit entre systèmes
- ✅ Fonctionne avec le bouton mode toggle existant
- ✅ Synchronisé avec les préférences utilisateur en BD

## 🚀 Autres Paramètres Appliqués

Le `SettingsProvider` applique aussi automatiquement :

| Paramètre | Application |
|-----------|-------------|
| `fontSize` | `document.documentElement.style.fontSize` |
| `highContrast` | Classe CSS `high-contrast` |
| `reduceMotion` | Classe CSS `reduce-motion` |
| `viewDensity` | Attribut `data-density` |
| `accentColor` | Attribut `data-accent` |

**Note:** Ces attributs/classes peuvent être utilisés dans le CSS global pour appliquer les styles correspondants.

---

**Date:** 2025-10-20
**Statut:** ✅ Corrigé et testé
