# Installation du serveur MCP Supabase

## Configuration pour Claude Desktop

### Méthode 1 : Serveur officiel Supabase (Recommandé)

1. **Créer un token d'accès personnel Supabase**
   - Allez sur https://supabase.com/dashboard/account/tokens
   - Créez un nouveau token personnel
   - Copiez le token (vous ne pourrez le voir qu'une fois)

2. **Modifier le fichier de configuration Claude Desktop**

   Chemin Windows : `%APPDATA%\Claude\claude_desktop_config.json`

   Ajoutez cette configuration dans la section `mcpServers` :

   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": [
           "-y",
           "@supabase/mcp-server-supabase@latest",
           "--access-token",
           "VOTRE_TOKEN_ICI"
         ]
       }
     }
   }
   ```

3. **Redémarrer Claude Desktop**

### Méthode 2 : Serveur communautaire avec clés du projet

Cette méthode utilise directement les clés Supabase de votre projet :

```json
{
  "mcpServers": {
    "supabase-chronodil": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase@latest"
      ],
      "env": {
        "SUPABASE_URL": "https://ipghppjjhjbkhuqzqzyq.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ2hwcGpqaGpia2h1cXpxenlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzAzNSwiZXhwIjoyMDc2NTczMDM1fQ.bH-3bOcJfrdU66wCBYGV1v3yVnggn0KR9A2UHBcuGIs"
      }
    }
  }
}
```

## Informations de connexion Supabase (Chronodil App)

- **URL Projet**: https://ipghppjjhjbkhuqzqzyq.supabase.co
- **Reference ID**: ipghppjjhjbkhuqzqzyq
- **Service Role Key**: Disponible dans `.env` (clé avec privilèges élevés)
- **Anon Key**: Disponible dans `.env` (clé publique)

## Fonctionnalités disponibles avec MCP Supabase

Une fois installé, vous pourrez :

- 📊 **Requêtes SQL directes** sur votre base de données
- 🔍 **Explorer le schéma** (tables, colonnes, relations)
- 📝 **Créer/modifier des tables** et des données
- 🔐 **Gérer les politiques RLS** (Row Level Security)
- 🚀 **Déployer des Edge Functions**
- 📈 **Analyser les performances** des requêtes

## Sécurité

⚠️ **Important** : Le serveur MCP Supabase est conçu pour **développement et test uniquement**.

- N'utilisez PAS le `service_role_key` en production exposée
- Utilisez des tokens d'accès avec les permissions minimales nécessaires
- Ne commitez JAMAIS les tokens dans Git

## Vérification de l'installation

Après avoir redémarré Claude Desktop, vous devriez pouvoir :

1. Demander "Liste toutes les tables de ma base Supabase"
2. Exécuter des requêtes SQL : "Montre-moi les 10 dernières tâches créées"
3. Inspecter le schéma : "Quelle est la structure de la table Task ?"

## Ressources

- [Documentation officielle Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- [Guide MCP pour Claude](https://modelcontextprotocol.io/introduction)
- [GitHub @supabase/mcp-server-supabase](https://github.com/supabase/mcp-server-supabase)
