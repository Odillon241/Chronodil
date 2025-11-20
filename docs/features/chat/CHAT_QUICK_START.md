# 🚀 Guide de Démarrage Rapide - Chat Chronodil

## Démarrage en 5 minutes

### 1. Prérequis ✅

Vérifiez que tout est prêt :

```bash
# Base de données à jour
pnpm prisma migrate dev

# Utilisateurs de test créés
pnpm tsx scripts/create-admin.ts
pnpm tsx scripts/create-test-users.ts

# Serveur lancé
pnpm dev
```

### 2. Connexion 🔐

Ouvrez votre navigateur à `http://localhost:3000` et connectez-vous avec :

**Admin :**
- Email: `admin@chronodil.com`
- Mot de passe: `Admin2025!`

**Manager :**
- Email: `manager@chronodil.com`
- Mot de passe: `Manager2025!`

**Employé :**
- Email: `employe@chronodil.com`
- Mot de passe: `Employe2025!`

**RH :**
- Email: `rh@chronodil.com`
- Mot de passe: `RHTest2025!`

### 3. Accéder au Chat 💬

1. Cliquer sur **"Chat"** dans la barre latérale gauche
2. Vous arrivez sur la page du chat

### 4. Créer votre première conversation 🎉

#### **Conversation Directe**

1. Cliquer sur le bouton **"+"** (Nouveau chat)
2. Rester sur l'onglet **"Direct"**
3. Sélectionner un utilisateur dans la liste
4. Cliquer sur **"Créer la conversation"**
5. Commencer à discuter !

#### **Groupe**

1. Cliquer sur le bouton **"+"**
2. Aller sur l'onglet **"Groupe"**
3. Entrer un nom de groupe (ex: "Équipe Marketing")
4. Sélectionner plusieurs utilisateurs
5. Cliquer sur **"Créer le groupe"**
6. Envoyez votre premier message !

#### **Conversation de Projet**

1. Cliquer sur le bouton **"+"**
2. Aller sur l'onglet **"Projet"**
3. Sélectionner un projet existant
4. Sélectionner les membres du projet
5. Cliquer sur **"Créer la conversation"**

### 5. Tester les Fonctionnalités 🧪

#### **A. Envoyer un message simple**
```
1. Sélectionner une conversation
2. Taper "Bonjour ! 👋" dans l'input
3. Appuyer sur Entrée
```

#### **B. Répondre à un message**
```
1. Survoler un message
2. Cliquer sur le menu "⋮"
3. Sélectionner "Répondre"
4. Taper votre réponse
5. Envoyer
```

#### **C. Ajouter une réaction**
```
1. Survoler un message
2. Cliquer sur l'icône smiley 😊
3. Choisir un emoji (👍 ❤️ 😂 😮 😢 🙏)
```

#### **D. Modifier un message**
```
1. Survoler VOTRE message
2. Cliquer sur "⋮"
3. Sélectionner "Modifier"
4. Changer le texte
5. Appuyer sur Entrée
```

#### **E. Rechercher dans les messages**
```
1. Cliquer sur l'icône de recherche 🔍
2. Taper votre recherche
3. Les résultats s'affichent en temps réel
```

#### **F. Joindre un fichier**
```
1. Cliquer sur l'icône trombone 📎
2. Sélectionner un ou plusieurs fichiers
3. Les fichiers apparaissent en preview
4. Ajouter un message (optionnel)
5. Envoyer
```

#### **G. Supprimer une conversation**
```
1. Dans la liste des conversations
2. Survoler une conversation
3. Cliquer sur "⋮"
4. Sélectionner "Supprimer" (si vous êtes admin/créateur)
5. Confirmer
```

### 6. Tester avec 2 utilisateurs 👥

Pour voir le chat en action, ouvrez deux navigateurs différents (ou utilisez le mode navigation privée) :

**Navigateur 1 - Admin:**
```
1. Se connecter comme admin
2. Créer une conversation avec Manager
3. Envoyer "Salut ! Comment ça va ?"
```

**Navigateur 2 - Manager:**
```
1. Se connecter comme manager
2. Ouvrir la conversation avec Admin
3. Voir le message apparaître
4. Répondre "Très bien, merci !"
5. Ajouter une réaction 👍 au message d'Admin
```

**Retour au Navigateur 1:**
```
1. Rafraîchir ou attendre
2. Voir la réponse du Manager
3. Voir la réaction 👍
```

### 7. Scénarios de test complets 📋

#### **Scénario 1 : Discussion d'équipe**
```
1. Créer un groupe "Équipe Dev"
2. Ajouter 3 membres
3. Envoyer "Réunion demain à 14h ?"
4. Membres répondent avec des réactions
5. Quelqu'un répond avec un message
6. Rechercher "réunion" pour retrouver le message
```

#### **Scénario 2 : Gestion de projet**
```
1. Créer une conversation de projet
2. Discuter d'une tâche spécifique
3. Mentionner un utilisateur: "@[userId:nom]"
4. Joindre un document
5. Épingler le message important (à venir)
```

#### **Scénario 3 : Support client interne**
```
1. Conversation directe RH -> Employé
2. Question de l'employé
3. RH répond avec des détails
4. Employé réagit avec 🙏
5. RH envoie un document PDF
```

### 8. Vérification Complète ✓

Cochez chaque fonctionnalité testée :

- [ ] Créer une conversation directe
- [ ] Créer un groupe
- [ ] Créer une conversation de projet
- [ ] Envoyer un message
- [ ] Modifier un message
- [ ] Supprimer un message
- [ ] Répondre à un message
- [ ] Ajouter une réaction
- [ ] Retirer une réaction
- [ ] Rechercher dans les messages
- [ ] Joindre un fichier
- [ ] Quitter un groupe
- [ ] Supprimer une conversation
- [ ] Voir le compteur de messages non lus
- [ ] Voir les indicateurs de frappe

### 9. Tests Automatisés 🤖

Pour vérifier que tout fonctionne au niveau de la base de données :

```bash
pnpm tsx scripts/test-chat-system.ts
```

Vous devriez voir :
```
✅ ✅ ✅ TOUS LES TESTS SONT PASSÉS ! ✅ ✅ ✅
🎉 Le système de chat est entièrement fonctionnel !
```

### 10. Résolution de problèmes courants 🔧

#### **Problème : Les messages ne s'affichent pas**
```bash
# Vérifier la connexion à la DB
pnpm prisma studio

# Vérifier les logs du serveur
# Regarder la console du terminal où tourne pnpm dev
```

#### **Problème : "Aucun utilisateur trouvé"**
```bash
# Recréer les utilisateurs
pnpm tsx scripts/create-admin.ts
pnpm tsx scripts/create-test-users.ts
```

#### **Problème : Erreurs de migration**
```bash
# Réinitialiser proprement
pnpm prisma migrate reset --force
pnpm tsx scripts/create-admin.ts
pnpm tsx scripts/create-test-users.ts
```

#### **Problème : Le serveur ne démarre pas**
```bash
# Nettoyer et redémarrer
rm -rf .next
pnpm prisma generate
pnpm dev
```

### 11. Prochaines Étapes 🎯

Maintenant que le chat fonctionne, vous pouvez :

1. **Intégrer avec les tâches** - Créer des tâches depuis les messages
2. **Ajouter les notifications** - Push notifications temps réel
3. **Implémenter WebSocket** - Communication temps réel sans refresh
4. **Ajouter les appels vidéo** - Intégration avec WebRTC
5. **Personnaliser** - Adapter les couleurs, avatars, etc.

### 12. Documentation Complète 📚

Pour aller plus loin :
- `/docs/CHAT_SYSTEM.md` - Documentation technique complète
- `/src/actions/chat.actions.ts` - Toutes les actions disponibles
- `/scripts/test-chat-system.ts` - Exemples de code

---

## 🎉 Félicitations !

Vous avez maintenant un système de chat entièrement fonctionnel avec :
- ✅ Conversations multiples (direct, groupe, projet)
- ✅ Réponses et threading
- ✅ Réactions emoji
- ✅ Recherche
- ✅ Pièces jointes
- ✅ Et bien plus !

**Bon chat ! 💬**

