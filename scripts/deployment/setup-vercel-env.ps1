# Script PowerShell de configuration des variables d'environnement Vercel
# Chronodil App

Write-Host "🚀 Configuration des variables d'environnement Vercel" -ForegroundColor Cyan
Write-Host "==================================================`n" -ForegroundColor Cyan

# Générer BETTER_AUTH_SECRET
$BETTER_AUTH_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "✅ Clé secrète générée`n" -ForegroundColor Green

# Configuration
$VERCEL_URL = "https://chronodil-ck8g49sqt-dereck-danel-nexons-projects.vercel.app"
$NODE_ENV = "production"

Write-Host "📝 Variables à configurer :`n"
Write-Host "BETTER_AUTH_SECRET: $BETTER_AUTH_SECRET" -ForegroundColor Yellow
Write-Host "BETTER_AUTH_URL: $VERCEL_URL" -ForegroundColor Yellow
Write-Host "NEXT_PUBLIC_APP_URL: $VERCEL_URL" -ForegroundColor Yellow
Write-Host "NODE_ENV: $NODE_ENV`n" -ForegroundColor Yellow

# Demander la DATABASE_URL
Write-Host "⚠️  IMPORTANT : Vous devez créer une base de données PostgreSQL`n" -ForegroundColor Red
Write-Host "Options recommandées :"
Write-Host "1. Supabase : https://supabase.com (gratuit, recommandé)"
Write-Host "2. Vercel Postgres : https://vercel.com/dashboard/stores"
Write-Host "3. Neon : https://neon.tech (gratuit)`n"

$DATABASE_URL = Read-Host "Entrez votre DATABASE_URL (ou appuyez sur Entrée pour configurer plus tard)"

if ([string]::IsNullOrWhiteSpace($DATABASE_URL)) {
    Write-Host "`n⏭️  DATABASE_URL sera configurée plus tard`n" -ForegroundColor Yellow
    $DATABASE_URL = "postgresql://placeholder"
}

Write-Host "`n🔧 Configuration des variables dans Vercel...`n" -ForegroundColor Cyan

# Fonction pour ajouter une variable d'environnement
function Add-VercelEnv {
    param($Name, $Value)
    
    Write-Host "➕ Ajout de $Name..." -ForegroundColor Gray
    
    # Créer un fichier temporaire avec la valeur
    $tempFile = New-TemporaryFile
    Set-Content -Path $tempFile.FullName -Value $Value -NoNewline
    
    # Utiliser vercel env add avec redirection d'entrée
    $result = Get-Content $tempFile.FullName | vercel env add $Name production 2>&1
    
    # Nettoyer
    Remove-Item $tempFile.FullName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ $Name configuré" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Erreur lors de la configuration de $Name" -ForegroundColor Yellow
    }
}

# Configurer les variables
Add-VercelEnv "BETTER_AUTH_SECRET" $BETTER_AUTH_SECRET
Add-VercelEnv "BETTER_AUTH_URL" $VERCEL_URL
Add-VercelEnv "NEXT_PUBLIC_APP_URL" $VERCEL_URL
Add-VercelEnv "NODE_ENV" $NODE_ENV

if ($DATABASE_URL -ne "postgresql://placeholder") {
    Add-VercelEnv "DATABASE_URL" $DATABASE_URL
}

Write-Host "`n✅ Configuration terminée !`n" -ForegroundColor Green

Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "1. Si vous n'avez pas encore de base de données, créez-en une"
Write-Host "2. Mettez à jour DATABASE_URL avec : vercel env add DATABASE_URL production"
Write-Host "3. Téléchargez les vars : vercel env pull .env.production"
Write-Host "4. Exécutez les migrations : `$env:DATABASE_URL='votre-url'; pnpm prisma migrate deploy"
Write-Host "5. Redéployez : vercel --prod`n"

Write-Host "🌐 URL de votre application : $VERCEL_URL`n" -ForegroundColor Cyan


