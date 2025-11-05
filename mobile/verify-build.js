#!/usr/bin/env node

/**
 * Build Verification Script
 * Checks for common issues before building APK
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

console.log('🔍 Verifying build configuration...\n');

// Check package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ package.json found');
  
  // Check critical dependencies
  const criticalDeps = [
    '@react-native-async-storage/async-storage',
    '@react-native-community/netinfo',
    '@react-native-community/datetimepicker',
    '@tanstack/react-query',
    'react-native-paper',
    'react-hook-form'
  ];
  
  const missingDeps = criticalDeps.filter(dep => !packageJson.dependencies[dep]);
  if (missingDeps.length > 0) {
    errors.push(`Missing dependencies: ${missingDeps.join(', ')}`);
  } else {
    console.log('✅ All critical dependencies found');
  }
} catch (e) {
  errors.push(`Error reading package.json: ${e.message}`);
}

// Check app.json
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  console.log('✅ app.json found');
  
  // Check Android configuration
  if (!appJson.expo.android) {
    errors.push('Android configuration missing in app.json');
  } else {
    if (!appJson.expo.android.package) {
      errors.push('Android package name missing');
    } else {
      console.log(`✅ Android package: ${appJson.expo.android.package}`);
    }
    
    if (!appJson.expo.android.permissions) {
      warnings.push('No Android permissions specified');
    } else {
      const requiredPerms = ['INTERNET', 'ACCESS_NETWORK_STATE'];
      const missingPerms = requiredPerms.filter(perm => 
        !appJson.expo.android.permissions.includes(perm)
      );
      if (missingPerms.length === 0) {
        console.log('✅ Required Android permissions found');
      } else {
        warnings.push(`Missing permissions: ${missingPerms.join(', ')}`);
      }
    }
  }
  
  // Check plugins
  if (!appJson.expo.plugins) {
    warnings.push('No plugins specified');
  } else {
    const requiredPlugins = ['@react-native-community/netinfo'];
    const hasNetInfo = appJson.expo.plugins.some(plugin => 
      plugin === '@react-native-community/netinfo' || 
      (typeof plugin === 'string' && plugin.includes('netinfo'))
    );
    if (hasNetInfo) {
      console.log('✅ NetInfo plugin configured');
    } else {
      warnings.push('NetInfo plugin not found in plugins array');
    }
  }
} catch (e) {
  errors.push(`Error reading app.json: ${e.message}`);
}

// Check App.js exists
try {
  if (fs.existsSync('App.js')) {
    console.log('✅ App.js found');
    const appContent = fs.readFileSync('App.js', 'utf8');
    if (appContent.includes('initializeSync')) {
      console.log('✅ Offline sync initialized');
    } else {
      warnings.push('Offline sync not initialized in App.js');
    }
  } else {
    errors.push('App.js not found');
  }
} catch (e) {
  errors.push(`Error checking App.js: ${e.message}`);
}

// Check critical source files
const criticalFiles = [
  'src/services/offlineSync.js',
  'src/services/api.js',
  'src/utils/errorHandler.js',
  'src/contexts/AuthContext.js',
  'src/navigation/AppNavigator.js'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} found`);
  } else {
    errors.push(`Critical file missing: ${file}`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Verification Summary\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Ready to build APK.\n');
  console.log('To build APK, run:');
  console.log('  npm install -g eas-cli');
  console.log('  eas build --platform android --profile preview\n');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log('❌ ERRORS (must fix):');
    errors.forEach(error => console.log(`  - ${error}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (recommended to fix):');
    warnings.forEach(warning => console.log(`  - ${warning}`));
    console.log('');
  }
  
  process.exit(errors.length > 0 ? 1 : 0);
}

