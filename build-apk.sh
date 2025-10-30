#!/bin/bash
# build-apk.sh
# Shell script to build APK for client testing

echo "========================================"
echo "  Royal Software APK Build Script"
echo "========================================"
echo ""

# Check if EAS CLI is installed
echo "Checking if EAS CLI is installed..."
if ! command -v eas &> /dev/null; then
    echo "EAS CLI is not installed. Installing..."
    npm install -g eas-cli
    if [ $? -ne 0 ]; then
        echo "Failed to install EAS CLI. Please install manually."
        exit 1
    fi
fi

echo "EAS CLI is installed."
echo ""

# Check if logged in to Expo
echo "Checking Expo login status..."
eas whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "Not logged in to Expo. Please login..."
    echo ""
    echo "You can login by running: eas login"
    read -p "Would you like to login now? (y/n): " response
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        eas login
        if [ $? -ne 0 ]; then
            echo "Login failed. Please try again."
            exit 1
        fi
    else
        echo "Please login first before building."
        exit 1
    fi
else
    echo "Logged in to Expo."
fi
echo ""

# Show build options
echo "Select build type:"
echo "1. Preview Build (for testing with clients)"
echo "2. Production Build (for release)"
echo ""
read -p "Enter choice (1 or 2): " buildType

case $buildType in
    1)
        echo ""
        echo "Starting PREVIEW build..."
        echo "This will create an APK for client testing."
        echo ""
        eas build --platform android --profile preview
        ;;
    2)
        echo ""
        echo "Starting PRODUCTION build..."
        echo "This will create a production APK."
        echo ""
        eas build --platform android --profile production
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "========================================"
echo "  Build process completed!"
echo "========================================"
echo ""
echo "Check the URL above to download your APK."
echo "You can also track progress at: https://expo.dev"
echo ""

