#!/bin/bash

# Script de configuration Supabase + Vercel
# Chronodil App

echo "🚀 Configuration Supabase + Vercel pour Chronodil"
echo "=================================================="
echo ""

echo "📋 Ce script va :"
echo "1. Vérifier que vous êtes connecté à Supabase et Vercel"
echo "2. Télécharger les variables d'environnement depuis Vercel"
echo "3. Tester la connexion à la base de données"
echo "4. Exécuter les migrations Prisma"
echo ""

# Vérifier que Supabase CLI est installé
echo "🔍 Vérification des prérequis..."

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm n'est pas installé"
    exit 1
fi

echo "✅ pnpm trouvé"

if ! pnpm supabase --version &> /dev/null; then
    echo "❌ Supabase CLI non trouvé. Installez-le avec : pnpm add -D supabase"
    exit 1
fi

echo "✅ Supabase CLI trouvé: $(pnpm supabase --version)"

if command -v vercel &> /dev/null; then
    echo "✅ Vercel CLI trouvé: $(vercel --version)"
else
    echo "⚠️  Vercel CLI non trouvé. Installez-le avec : npm i -g vercel"
    echo "Vous pouvez continuer, mais certaines étapes nécessiteront Vercel CLI"
fi

echo ""
echo "📝 Étapes de configuration :"
echo ""

# Étape 1 : Vérifier la connexion à Supabase
echo "1️⃣  Configuration Supabase"
echo ""
echo "Pour vous connecter à Supabase, utilisez :"
echo "  pnpm supabase login"
echo ""

read -p "Êtes-vous déjà connecté à Supabase ? (O/N) : " login_choice
if [ "$login_choice" != "O" ] && [ "$login_choice" != "o" ]; then
    echo "Veuillez exécuter : pnpm supabase login"
    exit 1
fi

# Étape 2 : Télécharger les variables depuis Vercel
echo ""
echo "2️⃣  Téléchargement des variables depuis Vercel"
echo ""

if vercel env pull .env.production 2>/dev/null; then
    echo "✅ Variables téléchargées dans .env.production"
else
    echo "⚠️  Impossible de télécharger les variables. Assurez-vous que :"
    echo "  - Vous êtes connecté à Vercel (vercel login)"
    echo "  - Vous avez lié le projet (vercel link)"
    echo "  - DATABASE_URL est configurée dans Vercel"
    echo ""
    read -p "Continuer quand même ? (O/N) : " continue_choice
    if [ "$continue_choice" != "O" ] && [ "$continue_choice" != "o" ]; then
        exit 1
    fi
fi

# Étape 3 : Charger la DATABASE_URL
echo ""
echo "3️⃣  Chargement de DATABASE_URL"
echo ""

if [ -f .env.production ]; then
    export $(grep DATABASE_URL .env.production | xargs)
    echo "✅ DATABASE_URL chargée"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL introuvable"
    read -p "Entrez votre DATABASE_URL manuellement : " manual_url
    export DATABASE_URL="$manual_url"
fi

# Étape 4 : Tester la connexion
echo ""
echo "4️⃣  Test de connexion à la base de données"
echo ""

echo "Test de connexion avec Prisma..."
if pnpm prisma db pull &> /dev/null; then
    echo "✅ Connexion réussie !"
else
    echo "⚠️  Erreur de connexion. Vérifiez votre DATABASE_URL"
fi

# Étape 5 : Générer le client Prisma
echo ""
echo "5️⃣  Génération du client Prisma"
echo ""

if pnpm prisma generate; then
    echo "✅ Client Prisma généré"
else
    echo "❌ Erreur lors de la génération du client"
    exit 1
fi

# Étape 6 : Exécuter les migrations
echo ""
echo "6️⃣  Exécution des migrations"
echo ""

read -p "Exécuter les migrations maintenant ? (O/N) : " migration_choice
if [ "$migration_choice" == "O" ] || [ "$migration_choice" == "o" ]; then
    if pnpm prisma migrate deploy; then
        echo "✅ Migrations exécutées avec succès"
    else
        echo "⚠️  Erreur lors des migrations"
        echo "Vous pouvez les exécuter plus tard avec : pnpm prisma migrate deploy"
    fi
fi

# Résumé
echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Vérifiez que DATABASE_URL est configurée dans Vercel"
echo "2. Pushez vos changements sur GitHub"
echo "3. Vercel redéploiera automatiquement"
echo "4. Exécutez 'vercel logs --follow' pour voir les logs en direct"
echo ""
echo "🌐 URL de votre application :"
echo "Accessible sur : https://chronodil-app.vercel.app ou votre domaine personnalisé"
echo ""
echo "📚 Ressources utiles :"
echo "- Guide complet : docs/SUPABASE_SETUP.md"
echo "- Documentation Supabase : https://supabase.com/docs"
echo "- Documentation Prisma : https://www.prisma.io/docs"
echo ""
echo "Bon déploiement ! 🚀"
