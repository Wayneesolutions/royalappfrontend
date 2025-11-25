# Configuration Files Comparison

This document shows all the configuration files used in this project's frontend build setup.

## 1. package.json

```json
{
  "name": "royalsoftware",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "build:android:preview": "eas build --platform android --profile preview",
    "build:android:production": "eas build --platform android --profile production"
  },
  "dependencies": {
    "expo": "^54.0.0",
    "react-native": "0.81.4",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

**Key Points:**
- Uses `eas build` commands (not local Gradle)
- Expo SDK 54
- React Native 0.81.4

## 2. eas.json

```json
{
  "cli": {
    "version": ">= 16.8.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Key Points:**
- EAS CLI version requirement
- APK build type for Android
- Auto-increment for production

## 3. app.json

```json
{
  "expo": {
    "name": "Royal Software",
    "slug": "royal-software",
    "version": "1.0.0",
    "scheme": "expo-nativewind-ts-app",
    "orientation": "portrait",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.santkaur.royalsoftware",
      "splash": {
        "image": "./assets/splash-logo.png",
        "resizeMode": "contain",
        "backgroundColor": "#077BC3"
      }
    },
    "plugins": [
      "expo-font"
    ],
    "extra": {
      "eas": {
        "projectId": "3e40e954-0a02-49a9-b03d-527a5f9aa53f"
      }
    }
  }
}
```

**Key Points:**
- Android package name defined
- Minimal plugins (only expo-font)
- EAS project ID for cloud builds

## 4. babel.config.js

```javascript
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          safe: false,
          allowUndefined: true,
          verbose: false,
        },
      ],
    ],
  };
};
```

**Key Points:**
- Uses `babel-preset-expo` with NativeWind support
- Includes `react-native-dotenv` for environment variables
- Standard Expo-compatible configuration

## 5. metro.config.js

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

**Key Points:**
- Uses Expo's default Metro config
- Only adds NativeWind for styling

## 6. .gitignore (Important!)

```
# Native
/android
/ios
```

**Key Points:**
- Android and iOS folders are NOT in the repository
- They're auto-generated during build
- This is why there are no Gradle files in this project

## What's NOT in This Project

❌ No `android/` folder
❌ No `android/build.gradle`
❌ No `android/app/build.gradle`
❌ No `android/gradle.properties`
❌ No manual Gradle configuration
❌ No Kotlin Compose plugin configuration
❌ No publishing components configuration

## Why This Works

1. **Expo Managed Workflow**: Expo generates native code automatically
2. **EAS Build**: Builds happen on Expo's servers with pre-configured Gradle
3. **No Local Native Code**: All native configuration is handled by Expo
4. **Version Compatibility**: Expo ensures all dependencies are compatible

## How to Replicate

### For Your Other Project:

1. **Ensure you have these files:**
   - `package.json` with Expo SDK 54
   - `eas.json` with build profiles
   - `app.json` with Android configuration
   - `.gitignore` excluding `android/` and `ios/`

2. **Remove local Android folder** (if exists):
   ```bash
   rm -rf android/
   ```

3. **Use EAS Build**:
   ```bash
   eas build --platform android --profile preview
   ```

4. **Never run local Gradle builds**:
   - ❌ Don't run: `cd android && ./gradlew assembleRelease`
   - ✅ Do run: `eas build --platform android --profile preview`

## Build Process Flow

```
Your Code
    ↓
EAS Build Command
    ↓
Expo Servers (Generate Android/iOS folders)
    ↓
Gradle Build (on Expo servers with correct config)
    ↓
APK/AAB Output
```

## Key Differences from Bare React Native

| This Project | Bare React Native |
|-------------|-------------------|
| No `android/` folder | Has `android/` folder |
| `eas build` command | `./gradlew` command |
| Expo manages Gradle | You manage Gradle |
| Cloud builds | Local/CI builds |
| No Gradle errors | Potential Gradle errors |

## Summary

This project avoids Gradle errors because:
- ✅ It doesn't have local Gradle files
- ✅ Expo generates them with correct configuration
- ✅ Builds happen on Expo's servers
- ✅ All versions are managed by Expo

To fix your other project, either:
1. **Migrate to Expo Managed Workflow** (recommended)
2. **Fix Gradle configuration manually** (if staying with bare workflow)

