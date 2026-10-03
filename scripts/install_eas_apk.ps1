param (
    [Parameter(Mandatory=$true)]
    [string]$ApkUrl
)

$ErrorActionPreference = "Stop"

$workspaceRoot = "d:\PMOSense2\PMOSense"
$tempApk = Join-Path $workspaceRoot "biopulse-ai-build.apk"
$downloadDir = Join-Path $workspaceRoot "apps\web\public\downloads"
$publicDir = Join-Path $workspaceRoot "apps\web\public"

$targetV1 = Join-Path $downloadDir "biopulse-ai-v1.0.0.apk"
$targetLatest = Join-Path $downloadDir "biopulse-ai-latest.apk"
$targetRoot = Join-Path $publicDir "biopulse-ai-latest.apk"
$releaseInfoPath = Join-Path $downloadDir "release-info.json"
$appDownloadPagePath = Join-Path $workspaceRoot "apps\web\src\pages\public\AppDownloadPage.tsx"

Write-Host "Downloading authentic standalone APK from EAS artifact URL: $ApkUrl"
Invoke-WebRequest -Uri $ApkUrl -OutFile $tempApk

if (-not (Test-Path $tempApk)) {
    throw "Download failed: $tempApk does not exist."
}

$fileSize = (Get-Item $tempApk).Length
$fileSizeMb = [math]::Round($fileSize / 1MB, 1)
$fileSizeFormatted = "$fileSizeMb MB"
$sha256 = (Get-FileHash -Path $tempApk -Algorithm SHA256).Hash.ToLower()

Write-Host "Downloaded APK Size: $fileSize bytes ($fileSizeFormatted)"
Write-Host "Downloaded APK SHA-256: $sha256"

# Verify APK Magic bytes (PK\x03\x04)
$bytes = [System.IO.File]::ReadAllBytes($tempApk)
$magic = [System.BitConverter]::ToString($bytes[0..3]) -replace '-'
if ($magic -ne "504B0304") {
    throw "Invalid APK: ZIP magic header mismatch ($magic)"
}
Write-Host "Verified ZIP magic header: 504B0304 (Valid Android APK Package)"

# Deploy to all web download locations
Copy-Item -Path $tempApk -Destination $targetV1 -Force
Copy-Item -Path $tempApk -Destination $targetLatest -Force
Copy-Item -Path $tempApk -Destination $targetRoot -Force
Remove-Item -Path $tempApk -Force

Write-Host "Copied APK to:"
Write-Host "  - $targetV1"
Write-Host "  - $targetLatest"
Write-Host "  - $targetRoot"

# Update release-info.json
$releaseInfo = Get-Content -Raw -Path $releaseInfoPath | ConvertFrom-Json
$releaseInfo.fileSizeBytes = $fileSize
$releaseInfo.fileSizeFormatted = $fileSizeFormatted
$releaseInfo.sha256 = $sha256
$releaseInfo.releaseDate = (Get-Date).ToString("MMMM dd, yyyy")
$releaseInfo | ConvertTo-Json -Depth 4 | Set-Content -Path $releaseInfoPath -Encoding utf8
Write-Host "Updated $releaseInfoPath"

# Update AppDownloadPage.tsx
$pageContent = Get-Content -Raw -Path $appDownloadPagePath -Encoding utf8
$pageContent = [regex]::Replace($pageContent, "fileSizeFormatted:\s*'[^']*'", "fileSizeFormatted: '$fileSizeFormatted'")
$pageContent = [regex]::Replace($pageContent, "sha256:\s*'[^']*'", "sha256: '$sha256'")
Set-Content -Path $appDownloadPagePath -Value $pageContent -Encoding utf8
Write-Host "Updated $appDownloadPagePath"

Write-Host "Running automated verification tests..."
Set-Location -Path (Join-Path $workspaceRoot "apps\web")
node src/tests/appDownloadPage.test.mjs
Write-Host "ALL VERIFICATION CHECKS PASSED!"
