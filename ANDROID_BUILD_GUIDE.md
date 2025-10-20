# 📱 Android APK Build Guide

## ✅ Recent Updates

**Native Notifications Implemented!** Your app now uses Capacitor's native notification system for reliable alarms on Android:
- ✅ Notifications work even when app is closed
- ✅ Native vibration support using Android's Haptics API
- ✅ Scheduled notifications persist across device reboots
- ✅ Better battery optimization
- ✅ Native Android notification UI

## Prerequisites

Before building the APK, ensure you have:

1. **Android Studio** installed (download from https://developer.android.com/studio)
2. **Java JDK 17** or higher installed
3. **Node.js** and npm installed

## 🚀 Step-by-Step Build Process

### Step 1: Build the Web App
```bash
npm run export
```
This creates the static export in the `out` folder.

### Step 2: Add Android Platform (First Time Only)
```bash
npm run cap:add:android
```
This creates the `android` folder with the native Android project and installs all Capacitor plugins.

**Note:** Only run this command ONCE. If the `android` folder already exists, skip to Step 3.

### Step 3: Sync Web Assets to Android
```bash
npm run cap:sync
```
This copies your web app to the Android project and syncs all plugins (including Local Notifications and Haptics).

### Step 4: Open in Android Studio
```bash
npm run cap:open:android
```
This opens the Android project in Android Studio.

**OR use the combined command:**
```bash
npm run android:build
```
This runs export + sync + open Android Studio in one command.

### Step 5: Build APK in Android Studio

Once Android Studio opens:

1. **Wait for Gradle sync** to complete (bottom status bar shows "Gradle sync finished")
2. **Build APK:**
   - Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Wait for build to complete (progress shown in bottom right)
   - Click **locate** in the notification to find your APK

**Debug APK Location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 6: Build Release APK (For Distribution)

For a production-ready signed APK:

1. In Android Studio, go to **Build → Generate Signed Bundle / APK**
2. Select **APK** → Click **Next**
3. **Create a new keystore** (first time only):
   - Click **Create new...**
   - **Keystore path**: Choose location (e.g., `my-release-key.keystore`)
   - **Password**: Create a strong password (remember this!)
   - **Key alias**: e.g., "dailyreminder"
   - **Key password**: Same as keystore password
   - Fill in certificate details:
     - First and Last Name
     - Organization Unit
     - Organization
     - City or Locality
     - State or Province
     - Country Code (XX)
   - Click **OK**
4. Select your keystore and enter passwords
5. Choose **release** build variant
6. Check **V1 (Jar Signature)** and **V2 (Full APK Signature)**
7. Click **Finish**

**Release APK Location:**
```
android/app/release/app-release.apk
```

**⚠️ IMPORTANT:** Keep your keystore file and passwords safe! You'll need them for all future updates.

## 🔧 Configuration

### App Details
The app is configured with:
- **App ID**: `com.dailyreminder.app`
- **App Name**: `Daily Reminder`
- **Theme Color**: #6366f1 (Indigo)
- **Web Directory**: `out` (Next.js static export)

### Native Features
- **Local Notifications**: Scheduled alarms that persist across reboots
- **Haptics**: Native vibration feedback
- **Background Processing**: Notifications trigger even when app is closed

### Permissions
The Android app includes these permissions in `AndroidManifest.xml`:
- `POST_NOTIFICATIONS` - Show notifications (Android 13+)
- `SCHEDULE_EXACT_ALARM` - Schedule exact-time alarms
- `VIBRATE` - Device vibration
- `RECEIVE_BOOT_COMPLETED` - Restart alarms after device reboot
- `INTERNET` - Web content loading
- `WAKE_LOCK` - Keep device awake for notifications

These are automatically added by Capacitor plugins.

### Icons & Splash Screen
Default Capacitor icons are used. To customize:

**Option 1: Auto-generate from your PWA icons**
```bash
npx @capacitor/assets generate --android
```
This uses icons in `public/` folder.

**Option 2: Manual replacement**
Replace files in `android/app/src/main/res/`:
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

## 🔄 Workflow for Updates

When you make changes to your web app:

```bash
# 1. Build the web app
npm run export

# 2. Sync changes to Android
npm run cap:sync

# 3. Build new APK in Android Studio
npm run cap:open:android
```

Then rebuild the APK in Android Studio (Build → Build APK).

## ⚡ Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm run export` | Build static web app to `out/` folder |
| `npm run cap:add:android` | Add Android platform (first time only) |
| `npm run cap:sync` | Sync web assets and plugins to Android |
| `npm run cap:open:android` | Open Android Studio |
| `npm run android:build` | Build + sync + open (all-in-one) |

## 📦 Testing the APK

### Install on Physical Device

1. **Enable Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times until you see "You are now a developer!"
   
2. **Enable USB Debugging**:
   - Settings → System → Developer Options → USB Debugging (toggle on)

3. **Connect phone to computer** via USB

4. **Install via ADB**:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Or drag the APK file to your phone and tap to install (you may need to enable "Install from Unknown Sources").

### Install on Emulator

1. In Android Studio, click **Device Manager** (phone icon on right side)
2. Create new virtual device or start existing emulator
3. Drag the APK onto the emulator window
4. App will install automatically

### Test Notifications

1. Open the installed app
2. Tap "Enable Notifications" and grant permission
3. Add a test task:
   - Title: "Test Reminder"
   - Time: 2 minutes from now
   - Recurrence: Daily
   - Enable vibration and sound
4. Close the app completely (swipe away from recent apps)
5. Wait for the scheduled time
6. You should receive a notification with vibration! 🎉

## 🐛 Troubleshooting

### Build Fails in Android Studio
- Ensure Android SDK is properly installed (Tools → SDK Manager)
- Check Java version: `java -version` (need JDK 17+)
- Clean build: **Build → Clean Project**, then rebuild

### Gradle Sync Fails
- Check internet connection (Gradle downloads dependencies)
- Update Gradle: File → Project Structure → Project → Gradle Version
- Invalidate caches: File → Invalidate Caches / Restart

### Notifications Not Working on Device
- **Android 13+**: Grant notification permission when prompted
- Check app notification settings: Settings → Apps → Daily Reminder → Notifications
- Ensure "Do Not Disturb" mode is off
- For exact alarms: Settings → Apps → Daily Reminder → Special permissions → Alarms & reminders

### Vibration Not Working
- Check device is not in Silent Mode
- Enable vibration in Android settings
- Some devices disable vibration to save battery

### App Crashes on Launch
- Check **Logcat** in Android Studio for error details
- Verify all assets synced: `npm run cap:sync`
- Rebuild the app after syncing

### Assets Not Loading
- Verify `out` folder exists after `npm run export`
- Check `capacitor.config.ts` has `webDir: 'out'`
- Run `npm run cap:sync` again
- Clear app data: Settings → Apps → Daily Reminder → Storage → Clear Data

### "Android folder not found"
- Run `npm run cap:add:android` first
- Ensure Capacitor is installed: `npm install`

## 🎨 Customization

### Change App Name
Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Your App Name</string>
<string name="title_activity_main">Your App Name</string>
```

### Change Package ID
Edit `capacitor.config.ts`:
```typescript
appId: 'com.yourcompany.yourapp'
```
Then run `npm run cap:sync` and rebuild.

### Change Theme/Colors
Edit `android/app/src/main/res/values/styles.xml`:
```xml
<item name="colorPrimary">#6366f1</item>
<item name="colorPrimaryDark">#4f46e5</item>
<item name="colorAccent">#818cf8</item>
```

### Notification Icon Color
Edit `capacitor.config.ts`:
```typescript
plugins: {
  LocalNotifications: {
    iconColor: "#6366f1", // Your custom color
  }
}
```

## 📱 App Size

Expected APK sizes:
- **Debug APK**: ~8-12 MB (includes debugging info)
- **Release APK (unsigned)**: ~6-8 MB  
- **Release APK (signed + minified)**: ~4-6 MB

To reduce size further:
- Enable ProGuard minification (already enabled in release builds)
- Use WebP images instead of PNG
- Remove unused dependencies

## ✅ Production Checklist

Before releasing to users or Google Play Store:

- [ ] Test on multiple Android versions (Android 8.0+)
- [ ] Test on different screen sizes (phone, tablet)
- [ ] Verify all notifications work when app is closed
- [ ] Test vibration and sound
- [ ] Test offline functionality
- [ ] Verify daily task reset works
- [ ] Build signed release APK
- [ ] Test release APK on real device
- [ ] Prepare app listing (icon, screenshots, description)
- [ ] Create privacy policy
- [ ] Set up Google Play Console account ($25 one-time fee)

## 📝 Publishing to Google Play Store

1. **Create Google Play Developer Account**
   - Visit https://play.google.com/console
   - Pay $25 one-time registration fee

2. **Prepare Assets**
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (at least 2, various sizes)
   - Privacy policy URL

3. **Upload APK**
   - Create new app in Play Console
   - Upload signed release APK
   - Fill in store listing details
   - Set content rating
   - Set target audience
   - Submit for review

4. **Review Process**
   - Typically takes 1-3 days
   - May require revisions

## 🔐 Security Notes

- **Keystore**: Store in a secure location, make backups
- **Passwords**: Keep keystore passwords safe (use password manager)
- **Permissions**: App requests minimal necessary permissions
- **Data**: All data stored locally on device (no server uploads)

## 📚 Additional Resources

- **Capacitor Docs**: https://capacitorjs.com/docs/android
- **Local Notifications**: https://capacitorjs.com/docs/apis/local-notifications
- **Haptics**: https://capacitorjs.com/docs/apis/haptics
- **Android Developer Guide**: https://developer.android.com/guide

---

## 💡 Pro Tips

1. **Always test on real device** - Emulators don't perfectly simulate notifications
2. **Keep Android Studio updated** - Helps avoid build issues
3. **Backup your keystore** - Store in cloud storage or password manager
4. **Test battery optimization** - Some manufacturers aggressively kill background apps
5. **Add to app store early** - Review process takes time

---

**Need help?** Common issues are covered in the Troubleshooting section above. For Capacitor-specific issues, check: https://capacitorjs.com/docs/android/troubleshooting