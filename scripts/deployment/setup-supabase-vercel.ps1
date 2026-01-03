# Script PowerShell de configuration Supabase + Vercel
# Chronodil App

Write-Host "🚀 Configuration Supabase + Vercel pour Chronodil" -ForegroundColor Cyan
Write-Host "==================================================`n" -ForegroundColor Cyan

Write-Host "📋 Ce script va :`n" -ForegroundColor Yellow
Write-Host "1. Vérifier que vous êtes connecté à Supabase et Vercel"
Write-Host "2. Télécharger les variables d'environnement depuis Vercel"
Write-Host "3. Tester la connexion à la base de données"
Write-Host "4. Exécuter les migrations Prisma`n"

# Vérifier que Supabase CLI est installé
Write-Host "🔍 Vérification des prérequis..." -ForegroundColor Cyan

try {
    $supabaseVersion = pnpm supabase --version 2>&1
    Write-Host "✅ Supabase CLI trouvé : $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI non trouvé. Installez-le avec : pnpm add -D supabase" -ForegroundColor Red
    exit 1
}

try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI trouvé : $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Vercel CLI non trouvé. Installez-le avec : npm i -g vercel" -ForegroundColor Yellow
    Write-Host "Vous pouvez continuer, mais certaines étapes nécessiteront Vercel CLI`n" -ForegroundColor Yellow
}

Write-Host "`n📝 Étapes de configuration :`n" -ForegroundColor Cyan

# Étape 1 : Vérifier la connexion à Supabase
Write-Host "1️⃣  Configuration Supabase`n" -ForegroundColor Yellow
Write-Host "Pour vous connecter à Supabase, utilisez :"
Write-Host "  pnpm supabase login`n" -ForegroundColor Gray

$loginChoice = Read-Host "Êtes-vous déjà connecté à Supabase ? (O/N)"
if ($loginChoice -eq "N") {
    Write-Host "Veuillez exécuter : pnpm supabase login" -ForegroundColor Red
    exit 1
}

# Étape 2 : Télécharger les variables depuis Vercel
Write-Host "`n2️⃣  Téléchargement des variables depuis Vercel`n" -ForegroundColor Yellow

try {
    vercel env pull .env.production 2>&1 | ForEach-Object { Write-Host $_ }
    Write-Host "✅ Variables téléchargées dans .env.production" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Impossible de télécharger les variables. Assurez-vous que :" -ForegroundColor Yellow
    Write-Host "  - Vous êtes connecté à Vercel (vercel login)"
    Write-Host "  - Vous avez lié le projet (vercel link)"
    Write-Host "  - DATABASE_URL est configurée dans Vercel"

    $continueChoice = Read-Host "Continuer quand même ? (O/N)"
    if ($continueChoice -ne "O") {
        exit 1
    }
}

# Étape 3 : Charger la DATABASE_URL
Write-Host "`n3️⃣  Chargement de DATABASE_URL`n" -ForegroundColor Yellow

if (Test-Path .env.production) {
    $envContent = Get-Content .env.production
    foreach ($line in $envContent) {
        if ($line -match '^DATABASE_URL=(.*)$') {
            $env:DATABASE_URL = $matches[1].Trim('"')
            Write-Host "✅ DATABASE_URL chargée" -ForegroundColor Green
            break
        }
    }
}

if (-not $env:DATABASE_URL) {
    Write-Host "❌ DATABASE_URL introuvable" -ForegroundColor Red
    $manualURL = Read-Host "Entrez votre DATABASE_URL manuellement"
    $env:DATABASE_URL = $manualURL
}

# Étape 4 : Tester la connexion
Write-Host "`n4️⃣  Test de connexion à la base de données`n" -ForegroundColor Yellow

Write-Host "Test de connexion avec Prisma..." -ForegroundColor Gray
try {
    $testResult = pnpm prisma db pull 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connexion réussie !" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Erreur de connexion :" -ForegroundColor Yellow
        Write-Host $testResult -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Erreur lors du test :" -ForegroundColor Yellow
    Write-Host $_ -ForegroundColor Yellow
}

# Étape 5 : Générer le client Prisma
Write-Host "`n5️⃣  Génération du client Prisma`n" -ForegroundColor Yellow

try {
    pnpm prisma generate
    Write-Host "✅ Client Prisma généré" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la génération du client" -ForegroundColor Red
    exit 1
}

# Étape 6 : Exécuter les migrations
Write-Host "`n6️⃣  Exécution des migrations`n" -ForegroundColor Yellow

$migrationChoice = Read-Host "Exécuter les migrations maintenant ? (O/N)"
if ($migrationChoice -eq "O") {
    try {
        pnpm prisma migrate deploy
        Write-Host "✅ Migrations exécutées avec succès" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Erreur lors des migrations" -ForegroundColor Yellow
        Write-Host "Vous pouvez les exécuter plus tard avec : pnpm prisma migrate deploy" -ForegroundColor Gray
    }
}

# Résumé
Write-Host "`n✅ Configuration terminée !`n" -ForegroundColor Green
Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "1. Vérifiez que DATABASE_URL est configurée dans Vercel"
Write-Host "2. Pushez vos changements sur GitHub"
Write-Host "3. Vercel redéploiera automatiquement"
Write-Host "4. Exécutez 'vercel logs --follow' pour voir les logs en direct`n"

Write-Host "🌐 URL de votre application :" -ForegroundColor Cyan
Write-Host "Accessible sur : https://chronodil-app.vercel.app ou votre domaine personnalisé`n"

Write-Host "📚 Ressources utiles :" -ForegroundColor Cyan
Write-Host "- Guide complet : docs/SUPABASE_SETUP.md"
Write-Host "- Documentation Supabase : https://supabase.com/docs"
Write-Host "- Documentation Prisma : https://www.prisma.io/docs`n"

Write-Host "Bon déploiement ! 🚀`n"
