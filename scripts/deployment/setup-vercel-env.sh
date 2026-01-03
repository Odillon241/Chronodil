#!/bin/bash

# Script de configuration automatique des variables d'environnement Vercel
# Chronodil App

echo "🚀 Configuration des variables d'environnement Vercel"
echo "=================================================="
echo ""

# Générer BETTER_AUTH_SECRET
BETTER_AUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || powershell -Command "[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))")

echo "✅ Clé secrète générée"
echo ""

# URL du projet Vercel (à modifier après le premier déploiement)
VERCEL_URL="https://chronodil-app.vercel.app"

echo "📝 Variables à configurer :"
echo ""
echo "BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET"
echo "BETTER_AUTH_URL=$VERCEL_URL"
echo "NEXT_PUBLIC_APP_URL=$VERCEL_URL"
echo "NODE_ENV=production"
echo ""

# Demander la DATABASE_URL
echo "⚠️  IMPORTANT : Vous devez créer une base de données PostgreSQL"
echo ""
echo "Options recommandées :"
echo "1. Supabase : https://supabase.com (gratuit, recommandé)"
echo "2. Vercel Postgres : https://vercel.com/dashboard/stores"
echo "3. Neon : https://neon.tech (gratuit)"
echo ""
read -p "Entrez votre DATABASE_URL (ou appuyez sur Entrée pour configurer plus tard) : " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo ""
    echo "⏭️  DATABASE_URL sera configurée plus tard"
    DATABASE_URL="postgresql://placeholder"
fi

echo ""
echo "🔧 Configuration des variables dans Vercel..."
echo ""

# Configurer les variables (nécessite que l'utilisateur soit connecté via vercel login)
echo "$BETTER_AUTH_SECRET" | vercel env add BETTER_AUTH_SECRET production preview development
echo "$VERCEL_URL" | vercel env add BETTER_AUTH_URL production preview development
echo "$VERCEL_URL" | vercel env add NEXT_PUBLIC_APP_URL production preview development
echo "production" | vercel env add NODE_ENV production preview development
echo "$DATABASE_URL" | vercel env add DATABASE_URL production preview development

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Si vous n'avez pas encore de base de données, créez-en une"
echo "2. Mettez à jour DATABASE_URL avec : vercel env rm DATABASE_URL && vercel env add DATABASE_URL"
echo "3. Exécutez les migrations : vercel env pull && pnpm prisma migrate deploy"
echo "4. Redéployez : vercel --prod"
echo ""


