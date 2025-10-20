# Implémentation des Paramètres Généraux - Phase 1

## Vue d'ensemble

Les paramètres généraux permettent aux utilisateurs de personnaliser l'apparence, la localisation et l'accessibilité de l'application Chronodil.

## Fonctionnalités implémentées

### 1. Apparence

- **Mode sombre** : Active/désactive le thème sombre
- **Couleur d'accentuation** : Choix parmi 5 couleurs (Rusty Red, OU Crimson, Powder Blue, Forest Green, Golden Orange)
- **Densité d'affichage** : Compact, Normal, Comfortable
- **Taille de police** : De 12px à 24px (par défaut : 16px)

### 2. Localisation

- **Langue** : Français, English
- **Format de date** : JJ/MM/AAAA, MM/JJ/AAAA, AAAA-MM-JJ
- **Format d'heure** : 24 heures, 12 heures
- **Fuseau horaire** : Liste des principaux fuseaux (par défaut : Africa/Libreville)

### 3. Accessibilité

- **Contraste élevé** : Augmente le contraste pour une meilleure lisibilité
- **Mode lecteur d'écran** : Optimise pour les lecteurs d'écran
- **Réduire les animations** : Diminue les animations pour les personnes sensibles au mouvement

## Architecture

### Composants créés

1. **`src/components/features/general-settings/appearance-section.tsx`**
   - Interface pour les paramètres d'apparence
   - Sélection de couleur, mode sombre, densité, taille de police

2. **`src/components/features/general-settings/localization-section.tsx`**
   - Interface pour les paramètres de localisation
   - Langue, formats de date/heure, fuseau horaire

3. **`src/components/features/general-settings/accessibility-section.tsx`**
   - Interface pour les paramètres d'accessibilité
   - Contraste, lecteur d'écran, réduction d'animations

4. **`src/components/providers/settings-provider.tsx`**
   - Provider global qui charge et applique les paramètres au démarrage
   - S'exécute automatiquement lors de la connexion

5. **`src/hooks/use-general-settings.tsx`**
   - Hook personnalisé pour gérer les paramètres (futur usage)

### Actions serveur

**`src/actions/general-settings.actions.ts`**

- `getGeneralSettings()` : Récupère les paramètres de l'utilisateur
- `updateGeneralSettings(input)` : Met à jour un ou plusieurs paramètres
- `resetGeneralSettings()` : Réinitialise aux valeurs par défaut

### Base de données

**Colonnes ajoutées à la table `User`** :

```sql
-- Apparence
darkModeEnabled     BOOLEAN DEFAULT true
accentColor         TEXT DEFAULT 'rusty-red'
viewDensity         TEXT DEFAULT 'normal'
fontSize            INTEGER DEFAULT 16

-- Localisation
language            TEXT DEFAULT 'fr'
dateFormat          TEXT DEFAULT 'DD/MM/YYYY'
hourFormat          TEXT DEFAULT '24'
timezone            TEXT DEFAULT 'Africa/Libreville'

-- Accessibilité
highContrast        BOOLEAN DEFAULT false
screenReaderMode    BOOLEAN DEFAULT false
reduceMotion        BOOLEAN DEFAULT false
```

## Application des paramètres

### Au chargement de l'application

Le `SettingsProvider` dans `src/app/dashboard/layout.tsx` :
1. Charge les paramètres de l'utilisateur connecté
2. Applique automatiquement tous les paramètres au DOM

### Lors de la modification

Dans la page `/dashboard/settings?tab=general` :
1. L'utilisateur modifie un paramètre
2. La valeur est envoyée au serveur via `updateGeneralSettings()`
3. La base de données est mise à jour
4. Le paramètre est appliqué immédiatement via `applySettingsToUI()`

### Méthodes d'application

```typescript
// Mode sombre
document.documentElement.classList.add("dark"); // ou remove

// Taille de police
document.documentElement.style.fontSize = "16px";

// Contraste élevé
document.documentElement.classList.add("high-contrast");

// Réduction animations
document.documentElement.classList.add("reduce-motion");

// Densité d'affichage
document.documentElement.setAttribute("data-density", "compact");

// Couleur d'accentuation
document.documentElement.setAttribute("data-accent", "rusty-red");
```

## Styles CSS

**`src/app/globals.css`** contient les styles pour :

- **Contraste élevé** : Variables de couleur avec plus de contraste
- **Réduction animations** : Désactive/réduit toutes les animations
- **Densités** : Ajuste l'espacement avec des facteurs multiplicateurs

## Utilisation

### Pour l'utilisateur

1. Aller dans **Paramètres → Général**
2. Modifier les paramètres souhaités
3. Les changements sont appliqués **immédiatement**
4. Les paramètres sont **persistés en base de données**
5. Bouton **Réinitialiser** pour revenir aux valeurs par défaut

### Pour le développeur

```typescript
// Récupérer les paramètres (côté serveur)
const result = await getGeneralSettings({});
const settings = result?.data;

// Mettre à jour un paramètre (côté serveur)
await updateGeneralSettings({
  darkModeEnabled: true,
  fontSize: 18,
});

// Utiliser le hook (côté client - futur)
const { settings, updateSetting } = useGeneralSettings();
updateSetting("darkModeEnabled", true);
```

## Validation

Tous les paramètres sont validés avec **Zod** :

```typescript
const generalSettingsSchema = z.object({
  darkModeEnabled: z.boolean().optional(),
  accentColor: z.enum(["rusty-red", "ou-crimson", "powder-blue", "forest-green", "golden-orange"]).optional(),
  viewDensity: z.enum(["compact", "normal", "comfortable"]).optional(),
  fontSize: z.number().int().min(12).max(24).optional(),
  // ...
});
```

## Tests manuels

✅ **Mode sombre** : Switch fonctionnel, appliqué immédiatement
✅ **Couleur d'accentuation** : Sélection visuelle, appliquée
✅ **Taille de police** : Slider de 12 à 24px, effet visible
✅ **Formats** : Sélection persistée
✅ **Accessibilité** : Switches fonctionnels
✅ **Persistance** : Paramètres conservés après rechargement
✅ **Réinitialisation** : Retour aux valeurs par défaut

## Améliorations futures (Phase 2)

- [ ] Prévisualisation en temps réel dans un panneau dédié
- [ ] Thèmes personnalisés (couleurs custom)
- [ ] Export/Import de profils de paramètres
- [ ] Paramètres par défaut au niveau entreprise
- [ ] Synchronisation multi-appareils
- [ ] Mode haute accessibilité complet (WCAG AAA)

## Notes techniques

### Problèmes résolus

1. **Triggers PostgreSQL obsolètes** : Supprimés lors de l'implémentation
2. **Encodage** : Caractères accentués retirés du schéma Prisma
3. **Cache Next.js** : Nécessite un nettoyage après régénération Prisma
4. **Application des paramètres** : Nécessite `applySettingsToUI()` après chaque update

### Recommandations

- Toujours utiliser `pnpm prisma migrate dev` pour les changements de schéma
- Éviter les triggers manuels sur les tables Prisma
- Tester l'application des paramètres après chaque modification
- Documenter les nouvelles options ajoutées

## Date d'implémentation

20 octobre 2025

