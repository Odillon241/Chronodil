$filePath = "src/app/dashboard/hr-timesheet/[id]/page.tsx"
$content = (Get-Content -LiteralPath $filePath) -join "`n"
$content = $content -replace 'result\.data\.data\.fileData', 'result.data.fileData'
$content = $content -replace 'result\.data\.data\.mimeType', 'result.data.mimeType'
$content = $content -replace 'result\.data\.data\.fileName', 'result.data.fileName'
$content = $content -replace 'if \(result\?\.data\?\.data\)', 'if (result?.data)'
$content | Out-File -LiteralPath $filePath -Encoding UTF8
Write-Host "Fichier corrige avec succes"
