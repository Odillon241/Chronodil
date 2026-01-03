# Script de diagnostic pour la connexion Supabase
# Chronodil App

Write-Host "🔍 Diagnostic Supabase - Chronodil" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Configuration
$HOST = "db.ipghppjjhjbkhuqzqzyq.supabase.co"
$PORT = 6543
$USER = "postgres"
$DBNAME = "postgres"

Write-Host "📝 Configuration Supabase" -ForegroundColor Yellow
Write-Host "Host : $HOST"
Write-Host "Port : $PORT"
Write-Host "User : $USER"
Write-Host "Database : $DBNAME`n"

# Test 1 : Vérifier la connexion Internet
Write-Host "1️⃣  Test de connexion Internet" -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName $HOST -Count 1 -Quiet
    if ($ping) {
        Write-Host "✅ Host accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Host non accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur : $_" -ForegroundColor Red
}

# Test 2 : Vérifier le port TCP
Write-Host "`n2️⃣  Test du port TCP $PORT" -ForegroundColor Yellow
try {
    $socket = New-Object Net.Sockets.TcpClient
    $connect = $socket.BeginConnect($HOST, $PORT, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(5000, $false)

    if ($wait -and $socket.Connected) {
        Write-Host "✅ Port $PORT accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Port $PORT non accessible" -ForegroundColor Red
        Write-Host "   Le firewall bloque peut-être la connexion" -ForegroundColor Yellow
    }
    $socket.Close()
} catch {
    Write-Host "❌ Erreur : $_" -ForegroundColor Red
}

# Test 3 : Vérifier les variables d'environnement
Write-Host "`n3️⃣  Vérification des variables d'environnement" -ForegroundColor Yellow
if ($env:DATABASE_URL) {
    Write-Host "✅ DATABASE_URL configurée" -ForegroundColor Green
    Write-Host "   Valeur (censurée) : postgresql://postgres:***@.../$DBNAME" -ForegroundColor Gray
} else {
    Write-Host "❌ DATABASE_URL non configurée" -ForegroundColor Red
}

# Test 4 : Vérifier Prisma
Write-Host "`n4️⃣  Test Prisma" -ForegroundColor Yellow
try {
    $version = pnpm prisma --version 2>&1
    Write-Host "✅ Prisma : $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Prisma non trouvé" -ForegroundColor Red
}

# Test 5 : Vérifier psql
Write-Host "`n5️⃣  Vérification de psql (PostgreSQL CLI)" -ForegroundColor Yellow
try {
    $psqlVersion = psql --version 2>&1
    Write-Host "✅ psql installé : $psqlVersion" -ForegroundColor Green

    Write-Host "`n   Tentative de connexion avec psql..." -ForegroundColor Gray
    # Note : Cela peut demander un mot de passe interactivement
    # psql -U postgres -h $HOST -d postgres -p $PORT -c "SELECT 1"
} catch {
    Write-Host "⚠️  psql non trouvé (client PostgreSQL non installé)" -ForegroundColor Yellow
    Write-Host "   Installez avec : choco install postgresql" -ForegroundColor Gray
}

# Test 6 : Solutions possibles
Write-Host "`n6️⃣  Problèmes possibles et solutions" -ForegroundColor Yellow

Write-Host "`n   A) Firewall/VPN bloque le port 6543" -ForegroundColor Cyan
Write-Host "      → Essayez le port 5432 (Direct Connection)" -ForegroundColor Gray
Write-Host "      → DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

Write-Host "`n   B) Supabase est en limite gratuite" -ForegroundColor Cyan
Write-Host "      → Vérifiez le quota Supabase (max 2 projets gratuits)"

Write-Host "`n   C) Identifiants incorrects" -ForegroundColor Cyan
Write-Host "      → Vérifiez le mot de passe dans Supabase Settings"

Write-Host "`n   D) Projet Supabase suspendu" -ForegroundColor Cyan
Write-Host "      → Vérifiez le statut sur https://app.supabase.com"

# Solutions
Write-Host "`n📋 Solutions recommandées" -ForegroundColor Yellow

Write-Host "`n1️⃣  Essayer le port 5432 (Direct Connection)" -ForegroundColor Cyan
$tryDirect = Read-Host "Vouloir essayer le port 5432 ? (O/N)"
if ($tryDirect -eq "O") {
    Write-Host "Mise à jour de DATABASE_URL avec le port 5432..." -ForegroundColor Gray
    $env:DATABASE_URL = "postgresql://postgres:Reviti2025%40@db.ipghppjjhjbkhuqzqzyq.supabase.co:5432/postgres"
    Write-Host "Nouvelle URL configurée. Testez avec : pnpm prisma db pull" -ForegroundColor Green
}

Write-Host "`n2️⃣  Vérifier la configuration Supabase" -ForegroundColor Cyan
Write-Host "https://app.supabase.com/project/ipghppjjhjbkhuqzqzyq/settings/database" -ForegroundColor Cyan

Write-Host "`n3️⃣  Vérifier les logs Supabase" -ForegroundColor Cyan
Write-Host "https://app.supabase.com/project/ipghppjjhjbkhuqzqzyq/logs/database" -ForegroundColor Cyan

Write-Host "`n✅ Diagnostic terminé`n" -ForegroundColor Green
