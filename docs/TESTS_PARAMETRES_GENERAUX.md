# Tests et Vérification - Paramètres Généraux Phase 1

## ✅ Tests Automatisés (Réussis)

### Test Base de Données
```bash
pnpm exec tsx scripts/test-general-settings.ts
```

**Résultats:**
- ✅ Colonnes créées avec succès
- ✅ Valeurs par défaut correctes
- ✅ Mise à jour fonctionne
- ✅ Persistance des données validée

**Valeurs par défaut confirmées:**
```javascript
{
  darkModeEnabled: true,
  accentColor: 'rusty-red',
  viewDensity: 'normal',
  fontSize: 16,
  language: 'fr',
  dateFormat: 'DD/MM/YYYY',
  hourFormat: '24',
  timezone: 'Africa/Libreville',
  highContrast: false,
  screenReaderMode: false,
  reduceMotion: false
}
```

---

## 🧪 Tests Manuels à Effectuer

### 1. Chargement de la Page
**URL:** http://localhost:3000/dashboard/settings

**Étapes:**
1. Se connecter avec un compte valide
2. Naviguer vers "Paramètres"
3. Cliquer sur l'onglet "Général"

**Attendu:**
- ✅ Trois sections s'affichent (Apparence, Localisation, Accessibilité)
- ✅ Toutes les valeurs par défaut sont visibles
- ✅ Pas de "Chargement des paramètres..." bloqué
- ✅ Console browser affiche: `🔍 Résultats chargés`

---

### 2. Section Apparence

#### Test A: Mode Sombre
**Action:** Toggle le switch "Mode sombre"

**Attendu:**
- ✅ Toast "Paramètre enregistré" apparaît
- ✅ Console: `✅ Mise à jour réussie`
- ✅ Le switch reste dans le nouvel état après rechargement (F5)

#### Test B: Couleur d'Accentuation
**Action:** Cliquer sur "Powder Blue"

**Attendu:**
- ✅ Toast de succès
- ✅ La carte "Powder Blue" est maintenant sélectionnée (bordure)
- ✅ Persiste après rechargement

#### Test C: Densité d'Affichage
**Action:** Sélectionner "Comfortable - Plus espacée"

**Attendu:**
- ✅ Le select affiche "Comfortable"
- ✅ Toast de succès
- ✅ Valeur sauvegardée

#### Test D: Taille de Police
**Action:** Déplacer le slider à 20px

**Attendu:**
- ✅ Le label affiche "Taille de police: 20px"
- ✅ Toast après relâchement
- ✅ Valeur persistante

---

### 3. Section Localisation

#### Test E: Langue
**Action:** Changer de "Français" à "English"

**Attendu:**
- ✅ Select affiche "English"
- ✅ Toast de succès
- ✅ Sauvegardé en BD

#### Test F: Format de Date
**Action:** Sélectionner "MM/JJ/AAAA"

**Attendu:**
- ✅ Nouvelle valeur affichée
- ✅ Persistance confirmée

#### Test G: Fuseau Horaire
**Action:** Changer pour "Europe/Paris (CET/CEST)"

**Attendu:**
- ✅ Dropdown fonctionne (scrollable)
- ✅ Sélection sauvegardée
- ✅ Valeur reste après F5

---

### 4. Section Accessibilité

#### Test H: Contraste Élevé
**Action:** Activer le switch

**Attendu:**
- ✅ Switch activé
- ✅ Toast de succès
- ✅ État persistant

#### Test I: Réduire les Animations
**Action:** Activer

**Attendu:**
- ✅ Fonctionne comme attendu
- ✅ Persistance OK

---

### 5. Réinitialisation

#### Test J: Bouton Réinitialiser
**Action:**
1. Modifier plusieurs paramètres
2. Cliquer "Réinitialiser"
3. Confirmer dans la dialog

**Attendu:**
- ✅ Dialog de confirmation apparaît
- ✅ Tous les paramètres reviennent aux valeurs par défaut
- ✅ Toast "Paramètres réinitialisés"
- ✅ Vérifier en BD que les valeurs sont bien réinitialisées

---

## 🐛 Tests d'Erreur

### Test K: Sans Connexion Internet
**Scénario:** Couper la connexion à la BD temporairement

**Attendu:**
- ✅ Message d'erreur dans toast
- ✅ Console log indique l'erreur
- ✅ Pas de crash de l'app

### Test L: Token Expiré
**Scénario:** Session expirée

**Attendu:**
- ✅ Redirection vers login
- ✅ OU message d'erreur "Non authentifié"

---

## 📊 Logs Console à Vérifier

### Au Chargement
```
🔍 Résultats chargés: {generalSettings: {...}}
✅ Paramètres généraux chargés: {darkModeEnabled: true, ...}
```

### À la Mise à Jour
```
📝 Mise à jour du paramètre: {key: "darkModeEnabled", value: false}
📋 Résultat de updateGeneralSettings: {data: {...}}
✅ Mise à jour réussie: {darkModeEnabled: false, ...}
```

### Côté Serveur (Terminal)
```
Mise à jour des paramètres pour l'utilisateur: clxxx...
Données reçues: {darkModeEnabled: false}
Mise à jour réussie: {darkModeEnabled: false, ...}
```

---

## 🎯 Critères de Succès Global

Pour considérer Phase 1 comme **100% fonctionnelle**:

- ✅ Tous les tests A-L passent
- ✅ Aucune erreur console
- ✅ Toutes les valeurs persistent après rechargement
- ✅ Performance acceptable (< 2s pour chaque update)
- ✅ UI responsive sur mobile
- ✅ Pas de régression sur les autres tabs (Notifications, Rappels, etc.)

---

## 🚀 Prochaines Étapes Après Validation

1. **Nettoyer les logs** - Retirer les `console.log` de débogage
2. **Appliquer les paramètres** - Utiliser `darkModeEnabled`, `fontSize`, etc. dans le thème global
3. **Phase 2** - Implémenter Préférences de Travail, Confidentialité
4. **Tests E2E** - Ajouter des tests Playwright/Cypress si nécessaire

---

**Date de création:** 2025-10-20
**Statut:** ✅ Prêt pour tests manuels
