const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Capacitor for Daily Reminder App...');

try {
  // Check if Capacitor is already initialized
  if (!fs.existsSync('android') && !fs.existsSync('ios')) {
    console.log('📱 Initializing Capacitor...');
    
    // Temporarily rename existing config if it exists
    const configExists = fs.existsSync('capacitor.config.ts');
    if (configExists) {
      fs.renameSync('capacitor.config.ts', 'capacitor.config.ts.backup');
    }
    
    try {
      execSync('npx cap init "Daily Reminder" "com.dailyreminder.app"', { stdio: 'inherit' });
      
      // Restore our custom config
      if (configExists) {
        if (fs.existsSync('capacitor.config.ts')) {
          fs.unlinkSync('capacitor.config.ts');
        }
        fs.renameSync('capacitor.config.ts.backup', 'capacitor.config.ts');
        console.log('✅ Restored custom Capacitor configuration');
      }
    } catch (error) {
      // Restore backup if init failed
      if (configExists && fs.existsSync('capacitor.config.ts.backup')) {
        fs.renameSync('capacitor.config.ts.backup', 'capacitor.config.ts');
      }
      throw error;
    }
  }

  // Add Android platform
  if (!fs.existsSync('android')) {
    console.log('🤖 Adding Android platform...');
    execSync('npx cap add android', { stdio: 'inherit' });
  }

  // Add iOS platform (only on macOS)
  if (process.platform === 'darwin' && !fs.existsSync('ios')) {
    console.log('🍎 Adding iOS platform...');
    execSync('npx cap add ios', { stdio: 'inherit' });
  }

  // Update Next.js config for static export
  const nextConfigPath = 'next.config.ts';
  if (fs.existsSync(nextConfigPath)) {
    let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (!nextConfig.includes('output: "export"')) {
      nextConfig = nextConfig.replace(
        'const nextConfig = {',
        `const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },`
      );
      fs.writeFileSync(nextConfigPath, nextConfig);
      console.log('✅ Updated Next.js config for static export');
    }
  }

  // Create Android-specific configurations
  if (fs.existsSync('android')) {
    console.log('🔧 Configuring Android app...');
    
    // Update AndroidManifest.xml for notifications
    const manifestPath = 'android/app/src/main/AndroidManifest.xml';
    if (fs.existsSync(manifestPath)) {
      let manifest = fs.readFileSync(manifestPath, 'utf8');
      
      // Add notification permissions
      if (!manifest.includes('POST_NOTIFICATIONS')) {
        manifest = manifest.replace(
          '<uses-permission android:name="android.permission.INTERNET" />',
          `<uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />`
        );
        fs.writeFileSync(manifestPath, manifest);
        console.log('✅ Added notification permissions to AndroidManifest.xml');
      }
    }
  }

  console.log('🎉 Capacitor setup complete!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Run: npx cap sync');
  console.log('3. For Android: npx cap open android');
  console.log('4. For iOS (macOS only): npx cap open ios');
  console.log('');
  console.log('🔔 Your app will now support:');
  console.log('• Background notifications');
  console.log('• Native alarm sounds');
  console.log('• Custom sound uploads');
  console.log('• Works when app is closed');

} catch (error) {
  console.error('❌ Error setting up Capacitor:', error.message);
  process.exit(1);
}
