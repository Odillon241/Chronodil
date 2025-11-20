Write-Host "🛑 Arrêt de tous les processus Node.js sur le port 3000..." -ForegroundColor Yellow

# Trouver et tuer tous les processus sur le port 3000
$processIds = netstat -ano | findstr :3000 | findstr LISTENING | ForEach-Object {
    $_ -match '\s+(\d+)\s*$' | Out-Null
    $matches[1]
} | Select-Object -Unique

foreach ($pid in $processIds) {
    if ($pid) {
        Write-Host "  - Arrêt du processus PID: $pid" -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2

Write-Host "✅ Tous les processus ont été arrêtés" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Redémarrage du serveur Next.js..." -ForegroundColor Cyan
Write-Host ""

# Démarrer le serveur
pnpm dev
