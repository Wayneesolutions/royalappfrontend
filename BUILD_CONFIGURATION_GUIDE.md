# Frontend Build Configuration Guide

This document explains how this project's frontend build is configured and how to replicate it in another project, including solutions for common Gradle build errors.

## Project Build Architecture

This project uses **Expo Managed Workflow** with **EAS Build** for cloud-based builds. This means:
- No local Android/iOS native folders (they're generated during build)
- Expo handles all Gradle configuration automatically
- Builds happen on Expo's servers via EAS Build

## Key Configuration Files

### 1. `package.json` - Dependencies and Versions

**Critical Versions:**
```json
{
  "expo": "^54.0.0",
  "react-native": "0.81.4",
  "react": "19.1.0"
}
```

**Build Scripts:**
```json
{
  "build:android:preview": "eas build --platform android --profile preview",
  "build:android:production": "eas build --platform android --profile production"
}
```

### 2. `eas.json` - EAS Build Configuration

```json
{
  "cli": {
    "version": ">= 16.8.0",
    "appVersionSource": "remote"
  },
  "build": {
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
  }
}
```

### 3. `app.json` - Expo Configuration

```json
{
  "expo": {
    "android": {
      "package": "com.santkaur.royalsoftware"
    },
    "plugins": [
      "expo-font"
    ]
  }
}
```

## How to Replicate This Setup

### Step 1: Ensure Expo SDK Compatibility

Your other project should use compatible versions:
- **Expo SDK 54** (or latest stable)
- **React Native 0.81.4** (or compatible with your Expo SDK)
- **React 19.1.0** (or compatible)

### Step 2: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 3: Initialize EAS (if not already done)

```bash
eas build:configure
```

This will create/update your `eas.json` file.

### Step 4: Ensure Proper Expo Configuration

Make sure your `app.json` or `app.config.js` has:
- Proper Android package name
- Required plugins listed
- No conflicting native configurations

## Solutions for Your Gradle Errors

### Error 1: `Plugin with id 'org.jetbrains.kotlin.plugin.compose' not found`

**Root Cause:** Missing or incompatible Kotlin Compose plugin in Gradle configuration.

**Solution A: If using Expo Managed Workflow (Recommended)**

1. **Remove any custom Android folder** if you have one:
   ```bash
   # If you have an android/ folder, remove it
   rm -rf android/
   ```

2. **Ensure you're using EAS Build** (cloud builds):
   ```bash
   eas build --platform android --profile preview
   ```

3. **Check your Expo SDK version** matches this project:
   ```bash
   npx expo install --fix
   ```

**Solution B: If using Bare React Native Workflow**

1. **Update your project-level `build.gradle`** (usually at `android/build.gradle`):
   ```gradle
   buildscript {
       ext {
           kotlinVersion = "1.9.24"  // Use compatible version
           composeCompilerVersion = "1.5.8"  // Match with Kotlin version
       }
       dependencies {
           classpath("com.android.tools.build:gradle:8.1.1")
           classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
           classpath("org.jetbrains.kotlin:kotlin-serialization:$kotlinVersion")
       }
   }
   ```

2. **Update your app-level `build.gradle`** (usually at `android/app/build.gradle`):
   ```gradle
   plugins {
       id "com.android.application"
       id "org.jetbrains.kotlin.android"
       // Only add compose plugin if you're actually using Compose
       // id "org.jetbrains.kotlin.plugin.compose"
   }
   ```

3. **If you're NOT using Jetpack Compose**, remove the compose plugin entirely.

### Error 2: `SoftwareComponent with name 'release' not found`

**Root Cause:** Gradle configuration issue with publishing components, often related to Expo modules or React Native version mismatches.

**Solution A: If using Expo Managed Workflow**

1. **Prebuild and clean:**
   ```bash
   npx expo prebuild --clean
   ```

2. **Update all Expo packages:**
   ```bash
   npx expo install --fix
   ```

3. **Use EAS Build instead of local builds:**
   ```bash
   eas build --platform android --profile preview
   ```

**Solution B: If using Bare React Native**

1. **Update your `android/app/build.gradle`** to ensure proper component configuration:
   ```gradle
   android {
       // ... other config
       
       publishing {
           singleVariant("release") {
               withSourcesJar()
           }
       }
   }
   ```

2. **Or remove publishing block if not needed:**
   ```gradle
   android {
       // Remove or comment out any publishing {} blocks if causing issues
   }
   ```

3. **Update Gradle wrapper** to compatible version:
   ```bash
   cd android
   ./gradlew wrapper --gradle-version=8.3
   ```

## Recommended Approach: Migrate to Expo Managed Workflow

If your other project is having Gradle issues, consider migrating to Expo Managed Workflow like this project:

### Migration Steps:

1. **Install Expo CLI:**
   ```bash
   npm install -g expo-cli
   ```

2. **Initialize Expo in your project:**
   ```bash
   npx expo init
   ```

3. **Move your code** to the new Expo structure

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Configure EAS:**
   ```bash
   eas build:configure
   ```

6. **Build using EAS:**
   ```bash
   eas build --platform android --profile preview
   ```

## Build Commands Reference

### This Project's Build Commands:

```bash
# Preview build (for testing)
npm run build:android:preview
# or
eas build --platform android --profile preview

# Production build
npm run build:android:production
# or
eas build --platform android --profile production
```

### Local Development:

```bash
# Start Expo dev server
npm start

# Run on Android device/emulator
npm run android
```

## Key Differences: Managed vs Bare Workflow

| Aspect | This Project (Managed) | Bare React Native |
|--------|----------------------|-------------------|
| Native folders | Auto-generated, not in repo | Manual, in repo |
| Gradle config | Handled by Expo | Manual configuration |
| Build process | EAS Build (cloud) | Local or CI/CD |
| Updates | `npx expo install` | Manual dependency updates |
| Custom native code | Limited | Full access |

## Troubleshooting Checklist

- [ ] Expo SDK version matches (54.x)
- [ ] React Native version compatible (0.81.4)
- [ ] EAS CLI installed and logged in (`eas login`)
- [ ] `eas.json` properly configured
- [ ] No conflicting Android native folders
- [ ] All dependencies up to date (`npx expo install --fix`)
- [ ] Using EAS Build instead of local Gradle builds

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo SDK 54 Release Notes](https://expo.dev/changelog/2024/12-05-sdk-54/)
- [React Native 0.81 Documentation](https://reactnative.dev/docs/getting-started)

---

**Note:** This project successfully builds because it uses Expo's managed workflow, which handles all Gradle complexity automatically. If your other project has Gradle errors, the best solution is to either:
1. Fix the Gradle configuration manually (if using bare workflow)
2. Migrate to Expo managed workflow (recommended for simplicity)

