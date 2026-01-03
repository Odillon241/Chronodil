# Guide : Jours fériés du Gabon 🇬🇦

## Vue d'ensemble

Le système de jours fériés du Gabon est configuré dans l'interface des paramètres de l'application. Il supporte actuellement les années **2025-2030** avec mise à jour automatique des dates.

## Types de jours fériés

### 1. Dates fixes (8 jours)
Ces jours ont la même date chaque année :
- 1er janvier : Jour de l'An
- 17 avril : Journée des droits de la femme
- 1er mai : Fête du Travail
- 15 août : Assomption de Marie
- 16-17 août : Jour de l'Indépendance (2 jours)
- 1er novembre : Toussaint
- 25 décembre : Noël

### 2. Dates variables (5 jours)
Ces dates changent chaque année selon les calendriers religieux :
- Aïd al-Fitr (fin du Ramadan)
- Lundi de Pâques
- Ascension
- Aïd al-Adha (Fête du sacrifice)
- Lundi de Pentecôte

## Utilisation de l'interface

### Initialiser les jours fériés pour une année

1. Aller dans **Paramètres** → **Jours fériés**
2. Cliquer sur le bouton **🇬🇦 Initialiser jours fériés**
3. Choisir l'année souhaitée (2025-2030)
4. Confirmer l'ajout

💡 **Astuce** : Vous pouvez ajouter plusieurs années successivement pour planifier à l'avance.

## Ajouter de nouvelles années (pour les développeurs)

### Étape 1 : Ajouter les dates variables

Ouvrir le fichier `src/app/dashboard/settings/page.tsx` et localiser l'objet `variableHolidaysByYear`.

Ajouter une nouvelle entrée pour l'année souhaitée :

```typescript
const variableHolidaysByYear: Record<number, Array<{name: string, month: number, day: number, description: string}>> = {
  // ... années existantes ...
  
  2031: [
    { name: "Fête de fin du Ramadan (Aïd al-Fitr)", month: 2, day: 28, description: "Fête marquant la fin du mois de Ramadan" },
    { name: "Lundi de Pâques", month: 4, day: 14, description: "Lendemain du dimanche de Pâques" },
    { name: "Ascension", month: 5, day: 22, description: "Célébration de l'Ascension du Christ" },
    { name: "Fête du Sacrifice (Aïd al-Adha)", month: 5, day: 6, description: "Fête du sacrifice" },
    { name: "Lundi de Pentecôte", month: 6, day: 2, description: "Célébration de la Pentecôte" },
  ],
};
```

### Étape 2 : Mettre à jour la liste des années

Mettre à jour le tableau des années disponibles dans les deux emplacements :

```typescript
{[2025, 2026, 2027, 2028, 2029, 2030, 2031].map((year) => (
  // ...
))}
```

### Étape 3 : Tester

```bash
npm run build
```

## Ressources pour trouver les dates

### Dates variables chrétiennes (Pâques)
- [Date de Pâques par année](https://www.lecalendrier.fr/paques)
- Ascension : Pâques + 39 jours
- Pentecôte : Pâques + 50 jours

### Dates musulmanes
- [Calendrier hégirien](https://www.calendriergratuit.fr/fetes-musulmanes.htm)
- Les dates peuvent varier d'1-2 jours selon l'observation de la lune

### Calendrier officiel du Gabon
- [Jours fériés officiels](https://publicholidays.africa/gabon/fr/)

## Structure de la base de données

Les jours fériés sont stockés dans la table `Holiday` avec :
- `id` : Identifiant unique
- `name` : Nom du jour férié
- `date` : Date (format Date)
- `description` : Description optionnelle
- `createdAt` / `updatedAt` : Métadonnées

## Fonctionnalités

✅ Ajout en un clic pour une année complète  
✅ Ajout manuel de jours fériés personnalisés  
✅ Suppression individuelle  
✅ Affichage en tableau clair  
✅ Protection : seuls les ADMIN peuvent gérer les jours fériés via l'onglet Utilisateurs  

## Notes importantes

⚠️ **Pas de script seed** : Les jours fériés s'ajoutent uniquement via l'interface utilisateur.

⚠️ **Dates variables** : Les dates des fêtes musulmanes et chrétiennes doivent être vérifiées chaque année car elles suivent des calendriers lunaires/solaires.

⚠️ **Années futures** : Les dates variables pour les années non configurées (2031+) ne seront pas ajoutées automatiquement. Seules les 8 dates fixes seront disponibles jusqu'à ce qu'un développeur ajoute les dates variables.

## Support

Pour toute question ou problème, contacter l'équipe de développement.

