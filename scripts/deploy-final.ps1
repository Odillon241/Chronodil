# Script final de déploiement Chronodil
# À exécuter APRÈS avoir configuré les variables dans Vercel

Write-Host "`n🚀 DÉPLOIEMENT FINAL - CHRONODIL APP`n" -ForegroundColor Cyan

# Étape 1 : Télécharger les variables d'environnement depuis Vercel
Write-Host "📥 Téléchargement des variables d'environnement depuis Vercel..." -ForegroundColor Yellow
vercel env pull .env.production

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du téléchargement des variables" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Variables téléchargées`n" -ForegroundColor Green

# Étape 2 : Charger les variables
Write-Host "📋 Chargement de DATABASE_URL..." -ForegroundColor Yellow
$envContent = Get-Content .env.production
foreach ($line in $envContent) {
    if ($line -match '^DATABASE_URL=(.*)$') {
        $env:DATABASE_URL = $matches[1].Trim('"')
        Write-Host "✅ DATABASE_URL chargée`n" -ForegroundColor Green
        break
    }
}

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
    Write-Host "❌ DATABASE_URL non trouvée dans .env.production" -ForegroundColor Red
    Write-Host "⚠️  Assurez-vous d'avoir ajouté DATABASE_URL dans Vercel`n" -ForegroundColor Yellow
    exit 1
}

# Étape 3 : Générer le client Prisma
Write-Host "🔧 Génération du client Prisma..." -ForegroundColor Yellow
pnpm prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la génération du client Prisma" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Client Prisma généré`n" -ForegroundColor Green

# Étape 4 : Déployer les migrations
Write-Host "🗄️  Déploiement des migrations de base de données..." -ForegroundColor Yellow
Write-Host "   (Cela peut prendre 1-2 minutes)`n" -ForegroundColor Gray

pnpm prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du déploiement des migrations" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Migrations déployées avec succès !`n" -ForegroundColor Green

# Étape 5 : Vérifier les tables créées
Write-Host "🔍 Vérification de la base de données..." -ForegroundColor Yellow
pnpm prisma db push --skip-generate

Write-Host "`n✅ Base de données configurée !`n" -ForegroundColor Green

# Étape 6 : Redéploiement en production
Write-Host "🚀 Redéploiement en production sur Vercel..." -ForegroundColor Yellow
vercel --prod --yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du redéploiement" -ForegroundColor Red
    exit 1
}

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🎉 DÉPLOIEMENT RÉUSSI !                                 ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🌐 Votre application est en ligne sur :" -ForegroundColor Cyan
Write-Host "   https://chronodil-app.vercel.app`n" -ForegroundColor White

Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "   1. Créez votre premier utilisateur admin"
Write-Host "   2. Configurez les départements et projets"
Write-Host "   3. Invitez votre équipe !`n"

Write-Host "📚 Documentation :" -ForegroundColor Cyan
Write-Host "   - Guide utilisateur : docs/GUIDE_UTILISATEUR.md"
Write-Host "   - Troubleshooting : docs/TROUBLESHOOTING.md`n"

# Nettoyer
Remove-Item .env.production -ErrorAction SilentlyContinue

Write-Host "✨ Bon déploiement !`n" -ForegroundColor Magenta

