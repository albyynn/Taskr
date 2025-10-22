const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Fixing Capacitor setup...');

try {
  // Step 1: Clean existing platforms
  if (fs.existsSync('android')) {
    console.log('🧹 Removing existing Android platform...');
    execSync('rm -rf android', { stdio: 'inherit' });
  }
  
  if (fs.existsSync('ios')) {
    console.log('🧹 Removing existing iOS platform...');
    execSync('rm -rf ios', { stdio: 'inherit' });
  }

  // Step 2: Backup and restore config
  const configExists = fs.existsSync('capacitor.config.ts');
  if (configExists) {
    console.log('💾 Backing up custom config...');
    fs.copyFileSync('capacitor.config.ts', 'capacitor.config.ts.backup');
  }

  // Step 3: Initialize Capacitor
  console.log('📱 Initializing Capacitor...');
  execSync('npx cap init "Daily Reminder" "com.dailyreminder.app"', { stdio: 'inherit' });

  // Step 4: Restore custom config
  if (configExists) {
    console.log('🔄 Restoring custom config...');
    if (fs.existsSync('capacitor.config.ts')) {
      fs.unlinkSync('capacitor.config.ts');
    }
    fs.renameSync('capacitor.config.ts.backup', 'capacitor.config.ts');
  }

  // Step 5: Add platforms
  console.log('🤖 Adding Android platform...');
  execSync('npx cap add android', { stdio: 'inherit' });

  if (process.platform === 'darwin') {
    console.log('🍎 Adding iOS platform...');
    execSync('npx cap add ios', { stdio: 'inherit' });
  }

  // Step 6: Install plugins
  console.log('📦 Installing required plugins...');
  execSync('npm install @capacitor/local-notifications @capacitor/filesystem @capacitor/push-notifications', { stdio: 'inherit' });

  // Step 7: Build and sync
  console.log('🔨 Building and syncing...');
  execSync('npm run build', { stdio: 'inherit' });
  execSync('npx cap sync', { stdio: 'inherit' });

  console.log('✅ Capacitor setup complete!');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('• Run: npx cap open android');
  console.log('• Run: npx cap open ios (macOS only)');
  console.log('• Build and test on device');

} catch (error) {
  console.error('❌ Error fixing Capacitor setup:', error.message);
  console.log('');
  console.log('🔧 Manual fix:');
  console.log('1. Run: rm -rf android ios');
  console.log('2. Run: mv capacitor.config.ts capacitor.config.ts.backup');
  console.log('3. Run: npx cap init "Daily Reminder" "com.dailyreminder.app"');
  console.log('4. Run: rm capacitor.config.ts && mv capacitor.config.ts.backup capacitor.config.ts');
  console.log('5. Run: npx cap add android');
  console.log('6. Run: npm install @capacitor/local-notifications @capacitor/filesystem @capacitor/push-notifications');
  console.log('7. Run: npm run build && npx cap sync');
  process.exit(1);
}
