# build-apk.ps1
# PowerShell script to build APK for client testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Royal Software APK Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
Write-Host "Checking if EAS CLI is installed..." -ForegroundColor Yellow
$easInstalled = npm list -g eas-cli 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "EAS CLI is not installed. Installing..." -ForegroundColor Red
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install EAS CLI. Please install manually." -ForegroundColor Red
        exit 1
    }
}

Write-Host "EAS CLI is installed." -ForegroundColor Green
Write-Host ""

# Check if logged in to Expo
Write-Host "Checking Expo login status..." -ForegroundColor Yellow
$whoami = eas whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to Expo. Please login..." -ForegroundColor Red
    Write-Host ""
    Write-Host "You can login by running: eas login" -ForegroundColor Yellow
    Write-Host "Or I can help you login now? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "Y" -or $response -eq "y") {
        eas login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Login failed. Please try again." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Please login first before building." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Logged in as: $whoami" -ForegroundColor Green
}
Write-Host ""

# Show build options
Write-Host "Select build type:" -ForegroundColor Yellow
Write-Host "1. Preview Build (for testing with clients)" -ForegroundColor Cyan
Write-Host "2. Production Build (for release)" -ForegroundColor Cyan
Write-Host ""
$buildType = Read-Host "Enter choice (1 or 2)"

switch ($buildType) {
    "1" {
        Write-Host ""
        Write-Host "Starting PREVIEW build..." -ForegroundColor Green
        Write-Host "This will create an APK for client testing." -ForegroundColor Yellow
        Write-Host ""
        eas build --platform android --profile preview
    }
    "2" {
        Write-Host ""
        Write-Host "Starting PRODUCTION build..." -ForegroundColor Green
        Write-Host "This will create a production APK." -ForegroundColor Yellow
        Write-Host ""
        eas build --platform android --profile production
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build process completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check the URL above to download your APK." -ForegroundColor Green
Write-Host "You can also track progress at: https://expo.dev" -ForegroundColor Yellow
Write-Host ""

