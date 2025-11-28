/**
 * Generate MS logo assets using Node.js
 * Run: node generate-ms-logo.js
 * Requires: npm install canvas
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const GREEN = '#059669';
const WHITE = '#FFFFFF';

function createMSLogo(size, filename, isSplash = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, size, size);

  // Set text properties
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (isSplash) {
    // Splash: Large MS centered
    ctx.font = `bold ${size * 0.3}px Arial`;
    ctx.fillText('MS', size / 2, size / 2);
  } else {
    // Icon: M on left, S on right
    const fontSize = size * 0.35;
    ctx.font = `bold ${fontSize}px Arial`;
    
    // Draw M on left half
    ctx.fillText('M', size / 4, size / 2);
    
    // Draw S on right half
    ctx.fillText('S', (size * 3) / 4, size / 2);
  }

  // Save image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`✅ Created ${filename} (${size}x${size})`);
}

function main() {
  console.log('🎨 Generating MS logo assets...');
  console.log('='.repeat(50));

  // Create icon (1024x1024)
  createMSLogo(1024, 'icon.png', false);

  // Create adaptive icon (1024x1024)
  createMSLogo(1024, 'adaptive-icon.png', false);

  // Create splash (1242x2436 for iOS)
  const splashCanvas = createCanvas(1242, 2436);
  const splashCtx = splashCanvas.getContext('2d');
  splashCtx.fillStyle = GREEN;
  splashCtx.fillRect(0, 0, 1242, 2436);
  splashCtx.fillStyle = WHITE;
  splashCtx.textAlign = 'center';
  splashCtx.textBaseline = 'middle';
  splashCtx.font = 'bold 400px Arial';
  splashCtx.fillText('MS', 1242 / 2, 2436 / 2);
  const splashBuffer = splashCanvas.toBuffer('image/png');
  fs.writeFileSync('splash.png', splashBuffer);
  console.log('✅ Created splash.png (1242x2436)');

  console.log('='.repeat(50));
  console.log('✅ All logo assets generated successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Files are in the current directory');
  console.log('   2. Copy to mobile/assets/ if needed');
  console.log('   3. Run: npx expo start');
}

main();



