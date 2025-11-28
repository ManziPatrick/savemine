# MS Logo Generation Guide

## Quick Start

### Option 1: Browser (Easiest)
1. Open `mobile/assets/create-ms-logo.html` in your browser
2. Click the download buttons for each image:
   - `icon.png` (1024x1024)
   - `adaptive-icon.png` (1024x1024)
   - `splash.png` (1242x2436)
3. Save all files to `mobile/assets/` directory
4. Restart Expo server: `npm start`

### Option 2: Python
```bash
cd mobile/assets
python generate-ms-logo.py
```

### Option 3: Node.js
```bash
cd mobile/assets
npm install canvas
node generate-ms-logo.js
```

## Logo Design

- **Icon**: Shows "M" and "S" side by side on green background (#059669)
- **Splash**: Shows large "MS" centered on green background
- **Colors**: Green (#059669) background, White (#FFFFFF) text

## Files Needed

1. `icon.png` - 1024x1024px (App icon)
2. `adaptive-icon.png` - 1024x1024px (Android adaptive icon)
3. `splash.png` - 1242x2436px (Splash screen)

## After Generation

1. Ensure all files are in `mobile/assets/` directory
2. Restart Expo server to see changes
3. The MS logo will appear when:
   - App starts (splash screen)
   - App icon on device home screen
   - App refreshes



