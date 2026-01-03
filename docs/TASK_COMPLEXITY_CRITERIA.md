# Système de Complexité des Tâches - Guide Complet

## 📋 Vue d'ensemble

Ce document définit le **système d'indicateur de degré de complexité** pour les tâches du système CHRONODIL. Il permet aux managers et directeurs d'attribuer des tâches spécifiques à chaque employé en fonction de leurs compétences et de leur niveau de maîtrise.

---

## 🎯 Trois Degrés de Complexité

### 1️⃣ **FAIBLE** (Low)

#### Définition
Tâches simples et répétitives qui ne demandent qu'une compréhension basique et peu de formation.

#### Critères d'évaluation

| Critère | Description |
|---------|------------|
| **Récurrence** | Très élevée (quotidienne/hebdomadaire, > 80% de la charge) |
| **Formation requise** | Minimale ou none; procédures standard bien documentées |
| **Maîtrise attendue** | De base; exécution correcte suffit (70-80% de performance) |
| **Compréhension requise** | Superficielle; suivi des instructions suffisant |
| **Temps d'apprentissage** | < 1 jour pour un nouveau collaborateur compétent |
| **Variabilité** | Très faible ou aucune variation |
| **Autonomie requise** | Faible; supervision régulière acceptable |
| **Risque d'erreur** | Faible; impact minime en cas d'erreur |

#### Exemples
- Saisie de données standard
- Tâches administratives de routine
- Suivi de checklist pré-établies
- Tâches de soutien administrative

#### Assignation recommandée
- Nouveaux collaborateurs
- Collaborateurs en period de probation
- Collaborateurs avec compétences limitées dans le domaine

---

### 2️⃣ **MOYEN** (Medium)

#### Définition
Tâches nécessitant une compréhension solide du domaine et une formation/expérience modérée.

#### Critères d'évaluation

| Critère | Description |
|---------|------------|
| **Récurrence** | Modérée (1-2x par semaine, 40-80% de la charge) |
| **Formation requise** | Modérée; formation structurée de 2-5 jours recommandée |
| **Maîtrise attendue** | Intermédiaire; 80-90% de performance attendue |
| **Compréhension requise** | Modérée; compréhension des principes et logiques |
| **Temps d'apprentissage** | 1-2 semaines pour maîtrise complète |
| **Variabilité** | Modérée; ajustements nécessaires selon contexte |
| **Autonomie requise** | Modérée; supervision hebdomadaire appropriée |
| **Risque d'erreur** | Modéré; impact acceptable avec corrections |

#### Exemples
- Gestion de projet standard
- Analyse de données routinière
- Rédaction de rapports avec modèles
- Coordination inter-départements
- Support client spécialisé

#### Assignation recommandée
- Collaborateurs avec 6-12 mois d'expérience
- Collaborateurs formés dans leur domaine
- Collaborateurs ayant démontré des compétences stables

---

### 3️⃣ **ÉLEVÉ** (High)

#### Définition
Tâches complexes nécessitant expertise, autonomie importante et jugement professionnel.

#### Critères d'évaluation

| Critère | Description |
|---------|------------|
| **Récurrence** | Faible à modérée (sporadique à 1-2x/mois, < 40% de la charge) |
| **Formation requise** | Importante; formation spécialisée de 2+ semaines, mentoring continu |
| **Maîtrise attendue** | Avancée; 90%+ de performance, excellence attendue |
| **Compréhension requise** | Approfondie; analyse critique et adaptation requises |
| **Temps d'apprentissage** | 1-3 mois pour maîtrise fonctionnelle |
| **Variabilité** | Élevée; chaque cas nécessite analyse et adaptation |
| **Autonomie requise** | Élevée; peu ou pas de supervision directe |
| **Risque d'erreur** | Élevé; impact significatif; nécessite vigilance |

#### Exemples
- Architecture de solutions complexes
- Prise de décision stratégique
- Gestion de crise
- Projets innovants
- Mentorat et formation d'autres
- Audit et assurance qualité
- Négociation commerciale majeure

#### Assignation recommandée
- Collaborateurs confirmés (2+ ans d'expérience dans le rôle)
- Collaborateurs avec expertise reconnue
- Collaborateurs ayant démontré jugement et autonomie
- Potentiellement futurs leaders/experts

---

## 📊 Matrice d'Évaluation Complète

### Tableau Récapitulatif

```
┌─────────────┬──────────────┬─────────────────┬──────────────┐
│ Critère     │ FAIBLE       │ MOYEN           │ ÉLEVÉ        │
├─────────────┼──────────────┼─────────────────┼──────────────┤
│ Récurrence  │ > 80%        │ 40-80%          │ < 40%        │
│ Formation   │ Minimale     │ Modérée (2-5j)  │ Importante   │
│ Maîtrise    │ 70-80%       │ 80-90%          │ 90%+         │
│ Compréhen.  │ Superficiel  │ Modérée         │ Approfondie  │
│ Apprenti.   │ < 1 jour     │ 1-2 semaines    │ 1-3 mois     │
│ Variabilité │ Très faible  │ Modérée         │ Élevée       │
│ Autonomie   │ Faible       │ Modérée         │ Élevée       │
│ Risque      │ Faible       │ Modéré          │ Élevé        │
└─────────────┴──────────────┴─────────────────┴──────────────┘
```

---

## 🎓 Niveaux de Formation, Maîtrise et Compréhension

### Niveaux de Formation (trainingLevel)

- **NONE** - Aucune formation requise
- **BASIC** - Formation basique (< 1 jour)
- **INTERMEDIATE** - Formation intermédiaire (1-5 jours)
- **ADVANCED** - Formation avancée (1-2 semaines)
- **EXPERT** - Formation experte (2+ semaines)

### Niveaux de Maîtrise (masteryLevel)

- **NOVICE** - Débutant, forte supervision requise
- **BEGINNER** - Compétences de base, supervision modérée
- **INTERMEDIATE** - Compétences solides, supervision légère
- **ADVANCED** - Haute compétence, autonome
- **EXPERT** - Maîtrise complète, expert en la matière

### Niveaux de Compréhension (understandingLevel)

- **NONE** - Pas de compréhension
- **SUPERFICIAL** - Compréhension superficielle des bases
- **WORKING** - Compréhension fonctionnelle pour exécuter
- **COMPREHENSIVE** - Compréhension complète des principes
- **EXPERT** - Compréhension approfondie et critique

---

## 🔍 Guide d'Attribution pour Managers/Directeurs

### Processus d'Attribution

1. **Analyser la tâche**
   - Évaluer chaque critère selon les grilles ci-dessus
   - Déterminer le degré de complexité adéquat
   - Documenter les justifications

2. **Sélectionner l'assigné**
   - Vérifier le niveau actuel de l'employé
   - S'assurer que la complexité correspond au profil
   - Considérer le développement professionnel souhaité

3. **Fixer les critères d'évaluation**
   - **Pour FAIBLE** : 70% de performance = succès
   - **Pour MOYEN** : 80% de performance = succès
   - **Pour ÉLEVÉ** : 90% de performance = succès

4. **Assigner et suivre**
   - Communiquer clairement le niveau de complexité
   - Prévoir les ressources/mentoring appropriées
   - Évaluer régulièrement (fin de tâche, fin de période)

### Cas d'Usage - Exemples

#### Exemple 1: Nouveau Collaborateur
```
Tâche: Saisie de données client
Complexité: FAIBLE
Raison: Tâche hautement récurrente, procédures standard
Formation: Documentation + 1 jour
Évaluation: 70% suffit
Supervison: Quotidienne first week, puis 2x/semaine
```

#### Exemple 2: Collaborateur Confirmé
```
Tâche: Gestion de projet client moyen
Complexité: MOYEN
Raison: Compétences confirmées, expérience suffisante
Formation: Formations produit/client spécifiques
Évaluation: 80% minimum
Supervision: Hebdomadaire
```

#### Exemple 3: Expert Domaine
```
Tâche: Architecture solution innovante
Complexité: ÉLEVÉ
Raison: Nécessite jugement critique, création
Formation: Mentoring pairs/réseau professionnel
Évaluation: 90%+ attendu
Supervision: Bi-mensuelle ou sur demande
```

---

## 📈 Utilisation pour Évaluation

### Évaluation de Performance

À la fin d'une tâche ou période :

1. **Compléter la fiche d'évaluation**
   - Niveau de complexité assigné
   - Performance réelle (%)
   - Temps réel vs estimé
   - Qualité du travail

2. **Documenter dans le système**
   - `evaluatedBy` : ID du manager/directeur
   - `evaluationNotes` : Commentaires détaillés
   - `evaluatedAt` : Date de l'évaluation
   - Mettre à jour les niveaux de formation/maîtrise/compréhension

3. **Utiliser pour la carrière**
   - Identification des points forts
   - Identification des domaines d'amélioration
   - Planification PDP (Plan de Développement Personnel)
   - Préparation promotions/changements de rôle

### Indicateurs de Succès

- ✅ Tâche complétée à X% minimum (selon complexité)
- ✅ Délais respectés (ou écarts justifiés)
- ✅ Qualité conforme aux standards
- ✅ Collaborateur montre progression
- ✅ Satisfaction client/utilisateur

---

## 🔄 Intégration avec la Gestion des Tâches

### Champs dans la Base de Données

```
Task {
  id
  name
  description

  # Complexité
  complexity: ENUM("FAIBLE" | "MOYEN" | "ÉLEVÉ")

  # Formation et Compétences
  trainingLevel: ENUM("NONE" | "BASIC" | "INTERMEDIATE" | "ADVANCED" | "EXPERT")
  masteryLevel: ENUM("NOVICE" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT")
  understandingLevel: ENUM("NONE" | "SUPERFICIAL" | "WORKING" | "COMPREHENSIVE" | "EXPERT")

  # Récurrence
  recurrence: STRING (ex: "DAILY", "WEEKLY", "MONTHLY")

  # Évaluation
  evaluatedBy: UUID (ID du manager)
  evaluationNotes: STRING
  evaluatedAt: DATETIME

  # Autres champs existants
  ...
}
```

### Actions et Workflows

- **Créer une tâche** : Manager définit la complexité, formation, maîtrise requises
- **Assigner** : TaskMember créé avec la tâche
- **Suivre** : Commentaires et activités tracées
- **Évaluer** : Remplir évaluatedBy, evaluationNotes, evaluatedAt
- **Analyser** : Rapport de performance par collaborateur et complexité

---

## 📱 Interface Utilisateur Attendue

### Pour les Managers/Directeurs

1. **Sélecteur de Complexité** lors de création/édition
   - Dropdown : Faible / Moyen / Élevé
   - Avec descriptions/aide contextuelle

2. **Indicateurs de Complexité**
   - Badge couleur dans liste des tâches
   - FAIBLE = Vert, MOYEN = Orange, ÉLEVÉ = Rouge

3. **Formulaire d'Évaluation**
   - Champs: Formation, Maîtrise, Compréhension (selects)
   - Champ Notes (textarea)
   - Auto-set evaluatedAt et evaluatedBy

4. **Rapports**
   - Performance par complexité
   - Distribution complexité par employé
   - Tendances de progression

### Pour les Employés

1. **Indicateur de Complexité**
   - Visible dans détail tâche
   - Aideline sur expectations

2. **Historique d'Évaluations**
   - Voir ses évaluations passées
   - Comprendre les domaines d'amélioration

---

## 🎯 Recommandations Finales

### Pour la Mise en Place
1. Former les managers aux critères
2. Débuter avec complexité simple (Faible/Moyen)
3. Augmenter progressivement
4. Recueillir feedback utilisateurs

### Pour le Suivi
- Revoir trimestrillement les attributions
- Ajuster formation/maîtrise basée sur évaluations
- Utiliser les données pour plans de carrière

### Avantages Attendus
✅ Meilleure allocation des ressources
✅ Clarté sur les expectations
✅ Données pour développement
✅ Traçabilité des compétences
✅ Succession planning amélioré

---

**Document Version:** 1.0
**Dernière mise à jour:** Octobre 2024
**Validé par:** Architecture CHRONODIL
