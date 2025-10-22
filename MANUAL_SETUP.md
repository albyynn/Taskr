# 🔧 Manual Capacitor Setup Guide

Since Capacitor is already partially configured, here's the manual setup process:

## Step 1: Clean and Initialize

```bash
# Remove existing Capacitor files if any
rm -rf android ios

# Remove the existing config temporarily
mv capacitor.config.ts capacitor.config.ts.backup

# Initialize Capacitor
npx cap init "Daily Reminder" "com.dailyreminder.app"

# Restore our custom config
rm capacitor.config.ts
mv capacitor.config.ts.backup capacitor.config.ts
```

## Step 2: Add Platforms

```bash
# Add Android platform
npx cap add android

# Add iOS platform (macOS only)
npx cap add ios
```

## Step 3: Install Required Plugins

```bash
# Install the required Capacitor plugins
npm install @capacitor/local-notifications @capacitor/filesystem @capacitor/push-notifications
```

## Step 4: Update Next.js Config

Make sure your `next.config.ts` includes:

```typescript
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // ... your existing config
};
```

## Step 5: Build and Sync

```bash
# Build the Next.js app
npm run build

# Sync with Capacitor
npx cap sync
```

## Step 6: Open in IDE

```bash
# For Android
npx cap open android

# For iOS (macOS only)
npx cap open ios
```

## Alternative: Quick Setup Script

If you prefer, you can run this one-liner:

```bash
rm -rf android ios && mv capacitor.config.ts capacitor.config.ts.backup && npx cap init "Daily Reminder" "com.dailyreminder.app" && rm capacitor.config.ts && mv capacitor.config.ts.backup capacitor.config.ts && npx cap add android && npm install @capacitor/local-notifications @capacitor/filesystem @capacitor/push-notifications && npm run build && npx cap sync
```

## Verification

After setup, you should have:
- `android/` folder with Android project
- `ios/` folder with iOS project (macOS only)
- All required plugins installed
- App ready for mobile development

## Next Steps

1. **Test on Android**: `npx cap open android`
2. **Test on iOS**: `npx cap open ios` (macOS only)
3. **Build and install** on device/emulator
4. **Test notifications** and custom sounds

Your app now has full mobile capabilities! 🎉
