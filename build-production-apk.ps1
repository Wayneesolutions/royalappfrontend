# build-production-apk.ps1
# Script to build production APK with proper environment setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Royal Software Production APK Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Copy production env to .env
Write-Host "Step 1: Setting up production environment..." -ForegroundColor Yellow
if (Test-Path .env.production) {
    Copy-Item .env.production .env -Force
    Write-Host "✅ Using .env.production configuration" -ForegroundColor Green
    Get-Content .env | Select-String "API_BASE_URL"
} else {
    Write-Host "❌ Error: .env.production file not found!" -ForegroundColor Red
    Write-Host "Please create .env.production with your production API URL" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 2: Starting EAS build..." -ForegroundColor Yellow
Write-Host "This will take 10-20 minutes. Build progress will be shown below." -ForegroundColor Cyan
Write-Host ""

# Step 2: Run the build
try {
    # Use preview profile which creates APK (defined in eas.json)
    eas build --platform android --profile preview --non-interactive
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Build Completed Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Check https://expo.dev for your APK download link" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "❌ Build failed. Check the error above." -ForegroundColor Red
    exit 1
}

Write-Host ""




