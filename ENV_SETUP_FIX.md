# Environment Setup Fix

## Problem
You updated `.env` file with the correct API URL but the app is still accessing `localhost`.

## Cause
`react-native-dotenv` caches environment variables during build. Changing `.env` file requires a **full restart** and **cache clear**.

## Solution

### Step 1: Stop the Metro Bundler
Press `Ctrl + C` in the terminal running the app.

### Step 2: Clear All Caches

Run these commands in order:

```powershell
# Clear Metro bundler cache
npx expo start --clear

# Or if that doesn't work, clear everything:
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Clear Expo cache
npx expo start --clear
```

### Step 3: Verify .env File

Check that your `.env` file has the correct URL:

```powershell
Get-Content .env
```

You should see:
```
API_BASE_URL=https://royalapp.wayneesolutions.com/api/v1
```

### Step 4: Restart the App

```powershell
npx expo start
# Or use your preferred command:
npm start
```

### Step 5: Check Console Logs

When the app starts, you should see in the console:

```
🔍 Environment variables loaded: {
  API_BASE_URL: 'https://royalapp.wayneesolutions.com/api/v1',
  ...
}
```

## Quick Fix Command

Run this one-liner to clear cache and restart:

```powershell
npx expo start --clear
```

## Alternative: Use Script

Your environment files:
- `.env.development` - For development
- `.env.staging` - For staging
- `.env.production` - For production

Switch between environments:

```powershell
# Development
node scripts/set-env.js development

# Staging
node scripts/set-env.js staging

# Production
node scripts/set-env.js production

# Then restart
npx expo start --clear
```

## For APK Builds

When building APK with EAS, you need to set environment variables in `app.json` or use EAS secrets:

1. Create production `.env` file:
   ```bash
   node scripts/set-env.js production
   ```

2. Update `.env.production` with your actual production URL:
   ```
   API_BASE_URL=https://royalapp.wayneesolutions.com/api/v1
   ```

3. Build APK:
   ```bash
   eas build --platform android --profile production
   ```

The `.env` file content will be baked into the APK at build time.

## Troubleshooting

### Still showing localhost?

1. Check if multiple `.env` files exist
2. Make sure `.env` (not `.env.development`) has the correct URL
3. Look for console log: `🔍 Environment variables loaded`
4. Try deleting `.expo` folder and restart

### Variables are undefined?

1. Check `babel.config.js` has `react-native-dotenv` plugin configured
2. Check `env.d.ts` file exists in root
3. Restart TypeScript server in VS Code

### Build fails?

1. Make sure all required env vars have fallback values
2. Check `env.ts` has `|| 'fallback'` for each variable




