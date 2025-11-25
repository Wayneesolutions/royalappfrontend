# Quick Fix Guide for Gradle Build Errors

## Your Errors:
1. `Plugin with id 'org.jetbrains.kotlin.plugin.compose' not found`
2. `SoftwareComponent with name 'release' not found`

## Fastest Solution: Use EAS Build (Like This Project)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure EAS in Your Project
```bash
cd /path/to/your/other/project
eas build:configure
```

### Step 4: Create/Update `eas.json`
Copy this configuration:
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

### Step 5: Build Using EAS (No Local Gradle!)
```bash
eas build --platform android --profile preview
```

This bypasses all local Gradle issues because the build happens on Expo's servers.

---

## Alternative: Fix Local Gradle Build

If you MUST build locally, here are the fixes:

### Fix Error 1: Kotlin Compose Plugin

**Option A: Remove Compose Plugin (if not using Compose)**

In `android/app/build.gradle`, remove or comment out:
```gradle
// Remove this line:
id "org.jetbrains.kotlin.plugin.compose"
```

**Option B: Add Compose Plugin Properly**

In `android/build.gradle` (project-level):
```gradle
buildscript {
    ext {
        kotlinVersion = "1.9.24"
        composeCompilerVersion = "1.5.8"
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.1.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}
```

In `android/app/build.gradle`:
```gradle
plugins {
    id "com.android.application"
    id "org.jetbrains.kotlin.android"
    id "org.jetbrains.kotlin.plugin.compose" version "1.9.24"
}
```

### Fix Error 2: Release Component

**Option A: Add Publishing Configuration**

In `android/app/build.gradle`:
```gradle
android {
    // ... existing config
    
    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
}
```

**Option B: Remove Publishing Block**

If you don't need publishing, remove any `publishing {}` blocks from `android/app/build.gradle`.

**Option C: Update Gradle Version**

```bash
cd android
./gradlew wrapper --gradle-version=8.3
```

---

## This Project's Exact Versions (Working)

```json
{
  "expo": "^54.0.0",
  "react-native": "0.81.4",
  "react": "19.1.0",
  "react-dom": "19.1.0"
}
```

**EAS CLI:** `>= 16.8.0`

---

## Recommended: Match This Project's Setup

1. **Use Expo SDK 54:**
   ```bash
   npx expo install expo@^54.0.0
   ```

2. **Update React Native:**
   ```bash
   npx expo install react-native@0.81.4
   ```

3. **Fix all dependencies:**
   ```bash
   npx expo install --fix
   ```

4. **Remove local Android folder** (if using managed workflow):
   ```bash
   rm -rf android/
   ```

5. **Use EAS Build:**
   ```bash
   eas build --platform android --profile preview
   ```

---

## Why This Project Works

- ✅ Uses Expo Managed Workflow
- ✅ No local Android folder (auto-generated)
- ✅ EAS Build handles all Gradle complexity
- ✅ Expo manages all native dependencies
- ✅ No manual Gradle configuration needed

---

## Still Having Issues?

1. Check Expo SDK compatibility: `npx expo doctor`
2. Clear cache: `npx expo start -c`
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Use EAS Build instead of local builds

