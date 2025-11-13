# 🔷 Installation MCP Supabase pour Cursor

## 📋 Vue d'ensemble

Ce guide vous explique comment installer et configurer le serveur MCP (Model Context Protocol) Supabase dans Cursor IDE pour permettre à l'assistant IA d'interagir directement avec votre projet Supabase.

**Avantages :**
- ✅ Accès direct à votre base de données Supabase depuis Cursor
- ✅ Requêtes SQL assistées par IA
- ✅ Gestion des schémas et migrations
- ✅ Visualisation des données
- ✅ Génération de code basée sur votre structure de base de données

---

## 🚀 Installation

### Méthode 1 : Via l'interface Cursor (Recommandée)

1. **Ouvrir les paramètres MCP de Cursor**
   - Cliquez sur **Settings** (⚙️) dans Cursor
   - Naviguez vers **Features** → **MCP**
   - Cliquez sur **Add new MCP Server**

2. **Configurer le serveur Supabase**
   - **Nom** : `supabase` (ou un nom de votre choix)
   - **Type** : `http`
   - **URL** : `https://mcp.supabase.com/mcp`

3. **Configuration JSON complète**
   ```json
   {
     "mcpServers": {
       "supabase": {
         "type": "http",
         "url": "https://mcp.supabase.com/mcp"
       }
     }
   }
   ```

4. **Authentification OAuth**
   - Lors de la première connexion, Cursor ouvrira automatiquement une fenêtre de navigateur
   - Connectez-vous à votre compte Supabase
   - Sélectionnez l'organisation qui contient votre projet Chronodil
   - Autorisez l'accès au client MCP

5. **Sélection du projet**
   - Choisissez le projet : `ipghppjjhjbkhuqzqzyq` (Chronodil)
   - Les autorisations seront configurées automatiquement

---

### Méthode 2 : Configuration manuelle (Avancée)

Si vous préférez configurer manuellement, vous pouvez créer ou modifier le fichier de configuration MCP de Cursor.

**Emplacement du fichier de configuration :**
- Windows : `%APPDATA%\Cursor\User\globalStorage\mcp.json`
- macOS : `~/Library/Application Support/Cursor/User/globalStorage/mcp.json`
- Linux : `~/.config/Cursor/User/globalStorage/mcp.json`

**Contenu du fichier :**
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

---

## 🔑 Informations de votre projet Supabase

Pour référence lors de la configuration :

### Projet Chronodil
- **URL** : `https://ipghppjjhjbkhuqzqzyq.supabase.co`
- **Project ID** : `ipghppjjhjbkhuqzqzyq`
- **Région** : `us-east-2` (AWS)

### Clés API (déjà configurées dans votre `.env`)
- `NEXT_PUBLIC_SUPABASE_URL` : URL publique du projet
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé anonyme (publique)
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role (privée)

⚠️ **Note** : Les clés API ne sont pas nécessaires pour la configuration MCP. L'authentification se fait via OAuth.

---

## ✅ Vérification de l'installation

Après la configuration, vous pouvez vérifier que MCP Supabase fonctionne :

1. **Dans Cursor**
   - Ouvrez le chat avec l'assistant IA
   - Demandez : "Liste les tables de ma base de données Supabase"
   - L'assistant devrait pouvoir accéder à votre base de données

2. **Commandes MCP disponibles**
   - Requêtes SQL assistées
   - Visualisation des schémas
   - Génération de migrations
   - Analyse de la structure de la base de données

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Permissions limitées**
   - MCP Supabase utilise OAuth pour l'authentification
   - Les permissions sont limitées au projet sélectionné
   - Vous pouvez révoquer l'accès à tout moment depuis le dashboard Supabase

2. **Environnement de développement**
   - ⚠️ Ne connectez pas MCP à des projets de production contenant des données sensibles
   - Utilisez des projets de développement/staging pour les tests

3. **Révoquer l'accès**
   - Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
   - Naviguez vers **Settings** → **API** → **OAuth Applications**
   - Révoquez l'accès si nécessaire

---

## 🛠️ Dépannage

### Problème : "Cannot connect to MCP server"

**Solutions :**
1. Vérifiez votre connexion Internet
2. Vérifiez que l'URL est correcte : `https://mcp.supabase.com/mcp`
3. Redémarrez Cursor
4. Vérifiez les logs MCP dans les paramètres de Cursor

### Problème : "Authentication failed"

**Solutions :**
1. Réessayez la connexion OAuth
2. Vérifiez que vous êtes connecté au bon compte Supabase
3. Vérifiez que vous avez sélectionné la bonne organisation
4. Révoquez et réautorisez l'accès depuis le dashboard Supabase

### Problème : "Project not found"

**Solutions :**
1. Vérifiez que le Project ID est correct : `ipghppjjhjbkhuqzqzyq`
2. Vérifiez que vous avez accès au projet dans votre organisation Supabase
3. Vérifiez que le projet est actif (non suspendu)

---

## 📚 Ressources

- [Documentation Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- [Documentation Cursor MCP](https://docs.cursor.com/mcp)
- [Dashboard Supabase](https://supabase.com/dashboard/project/ipghppjjhjbkhuqzqzyq)

---

## 🎯 Utilisation

Une fois configuré, vous pouvez utiliser MCP Supabase pour :

1. **Requêtes SQL**
   ```
   "Montre-moi tous les utilisateurs créés cette semaine"
   "Combien de timesheets sont en attente d'approbation ?"
   ```

2. **Analyse de schéma**
   ```
   "Quelle est la structure de la table Timesheet ?"
   "Montre-moi les relations entre les tables"
   ```

3. **Génération de code**
   ```
   "Génère un composant React pour afficher les timesheets"
   "Crée une API route pour récupérer les projets d'un utilisateur"
   ```

4. **Migrations**
   ```
   "Génère une migration pour ajouter un champ 'status' à la table Task"
   "Crée une table pour les notifications"
   ```

---

## ✅ Checklist d'installation

- [ ] Cursor est installé et à jour
- [ ] Compte Supabase actif
- [ ] Accès au projet Chronodil (`ipghppjjhjbkhuqzqzyq`)
- [ ] Serveur MCP Supabase ajouté dans Cursor
- [ ] Authentification OAuth réussie
- [ ] Projet sélectionné dans MCP
- [ ] Test de connexion réussi

---

**Installation terminée ! 🎉**

Vous pouvez maintenant utiliser MCP Supabase dans Cursor pour interagir avec votre base de données Supabase directement depuis l'assistant IA.

