# Diagnostic - Erreur d'hydratation React

## Problème
Erreur d'hydratation causée par des attributs `data-cursor-ref` ajoutés par une extension de navigateur.

## Extensions courantes qui modifient le DOM
- Grammarly
- LastPass / gestionnaires de mots de passe
- Extensions de tracking de curseur
- Extensions d'analyse de page
- Extensions de capture d'écran
- React DevTools (dans certains cas)
- Extensions d'accessibilité

## Tests à effectuer

### Test 1: Mode navigation privée
1. Ouvrir l'application en mode incognito/navigation privée
2. Si l'erreur disparaît → C'est bien une extension

### Test 2: Désactiver les extensions une par une
1. Ouvrir chrome://extensions/ (Chrome) ou edge://extensions/ (Edge)
2. Désactiver toutes les extensions
3. Réactiver une par une jusqu'à identifier le coupable

## Solution de contournement (si nécessaire)

Si vous ne pouvez pas désactiver l'extension, vous pouvez supprimer l'avertissement en ajoutant `suppressHydrationWarning` sur les éléments racines affectés.

**Note**: Cette erreur est **non-critique** et n'affecte pas le fonctionnement de l'application. Elle génère simplement un avertissement dans la console.
