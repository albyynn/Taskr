# 🔔 Daily Reminder App - Capacitor Setup Guide

This guide will help you set up your Daily Reminder app as a hybrid mobile app using Capacitor.js, enabling true background notifications and alarm sounds.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Capacitor
```bash
npm run setup-capacitor
```

### 3. Build and Sync
```bash
npm run cap:build
```

### 4. Open in IDE
```bash
# For Android
npm run cap:android

# For iOS (macOS only)
npm run cap:ios
```

## 📱 Features Enabled

### ✅ Background Notifications
- **Works when app is closed** - Notifications trigger even when the app is not running
- **Native notification system** - Uses device's native notification API
- **Action buttons** - Complete/Snooze directly from notifications
- **Rich notifications** - Shows task title, description, and custom sounds

### ✅ Native Alarm Sounds
- **Custom sound upload** - Upload your own MP3 files as alarm sounds
- **Background audio** - Sounds play even when app is closed
- **Volume control** - Adjustable alarm volume
- **Sound testing** - Test sounds before setting them

### ✅ PWA + Mobile App
- **Progressive Web App** - Works in browsers with PWA installation
- **Native Mobile App** - Full native app for Android/iOS
- **Cross-platform** - Same codebase for web and mobile

## 🔧 Technical Details

### Capacitor Plugins Used
- `@capacitor/local-notifications` - Background notifications
- `@capacitor/filesystem` - Custom sound storage
- `@capacitor/haptics` - Vibration feedback
- `@capacitor/push-notifications` - Push notification support

### File Structure
```
src/lib/
├── native-notifications.ts    # Native notification manager
├── native-alarm-manager.ts    # Native alarm sound manager
└── alarm-manager.ts           # Web fallback alarm manager

src/components/
├── CustomSoundUpload.tsx      # Custom sound upload component
└── AlarmTestButton.tsx        # Enhanced alarm testing
```

## 🛠️ Development Workflow

### For Web Development
```bash
npm run dev
```
- App works as PWA in browser
- Uses web notifications and HTML5 audio
- Limited background capabilities

### For Mobile Development
```bash
# Build the web app
npm run build

# Sync with Capacitor
npm run cap:sync

# Open in Android Studio
npm run cap:android

# Open in Xcode (macOS only)
npm run cap:ios
```

## 📋 Platform-Specific Setup

### Android Setup
1. Install Android Studio
2. Set up Android SDK
3. Run `npm run cap:android`
4. Build and install on device/emulator

### iOS Setup (macOS only)
1. Install Xcode from App Store
2. Install Xcode command line tools: `xcode-select --install`
3. Run `npm run cap:ios`
4. Build and install on device/simulator

## 🔔 Notification Permissions

### Android
- `POST_NOTIFICATIONS` - Required for Android 13+
- `VIBRATE` - For vibration feedback
- `WAKE_LOCK` - For background processing

### iOS
- Notification permissions requested at runtime
- Background app refresh recommended

## 🎵 Custom Sound Upload

### Supported Formats
- MP3, WAV, M4A, AAC
- Maximum file size: 10MB
- Stored in device storage (Android) or app documents (iOS)

### Storage Locations
- **Android**: `/data/data/com.dailyreminder.app/files/sounds/`
- **iOS**: App Documents directory
- **Web**: IndexedDB (PWA mode)

## 🚨 Troubleshooting

### Common Issues

#### Notifications not working
1. Check notification permissions in device settings
2. Ensure app is not in battery optimization (Android)
3. Verify Capacitor plugins are properly installed

#### Sounds not playing
1. Check device volume settings
2. Ensure sound files are properly uploaded
3. Test with built-in sounds first

#### Build errors
1. Run `npm run cap:sync` after code changes
2. Clean and rebuild: `npx cap clean && npx cap sync`
3. Check Capacitor plugin versions

### Debug Commands
```bash
# Check Capacitor status
npx cap doctor

# Clean and resync
npx cap clean
npx cap sync

# Update Capacitor
npm update @capacitor/core @capacitor/cli
```

## 📱 Testing

### Web Testing
- Open in Chrome/Edge
- Install as PWA
- Test notifications and sounds

### Mobile Testing
- Install on physical device for best results
- Test background notifications
- Verify custom sound uploads
- Test alarm sounds when app is closed

## 🎯 Production Deployment

### Android
1. Build release APK in Android Studio
2. Sign with release keystore
3. Upload to Google Play Store

### iOS
1. Build release in Xcode
2. Archive and upload to App Store Connect
3. Submit for App Store review

### Web
1. Deploy to hosting service (Vercel, Netlify, etc.)
2. Ensure HTTPS for PWA features
3. Configure service worker caching

## 🔄 Updates and Maintenance

### Updating Capacitor
```bash
npm update @capacitor/core @capacitor/cli
npx cap sync
```

### Adding New Plugins
```bash
npm install @capacitor/plugin-name
npx cap sync
```

### Code Changes
1. Make changes to web app
2. Run `npm run build`
3. Run `npx cap sync`
4. Test on device

## 📞 Support

If you encounter issues:
1. Check Capacitor documentation: https://capacitorjs.com/docs
2. Verify plugin compatibility
3. Test on different devices
4. Check device permissions

---

**🎉 Your Daily Reminder app now has true mobile app capabilities with background notifications and custom alarm sounds!**
