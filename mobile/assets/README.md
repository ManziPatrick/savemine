# Mobile App Assets Setup

The app requires the following assets in the `assets/` folder:

## Required Assets

1. **icon.png** - App icon (1024x1024px)
2. **splash.png** - Splash screen (1242x2436px recommended)
3. **adaptive-icon.png** - Android adaptive icon (1024x1024px)
4. **favicon.png** - Web favicon (48x48px)

## Quick Setup

You can create placeholder images using any image editor, or use online tools:

1. **Option 1: Use Expo Asset Generator**
   - Visit: https://www.favicon-generator.org/
   - Upload your logo and generate all sizes

2. **Option 2: Create Simple Placeholders**
   - Create a 1024x1024px image with your app logo/name
   - Copy it to all required filenames
   - For splash, use a 1242x2436px version

3. **Option 3: Use Expo's Default**
   - Temporarily comment out asset references in `app.json`
   - Expo will use default assets

## For Now

To get started quickly, you can create simple colored squares:
- Blue (#2563eb) for icon.png, adaptive-icon.png, favicon.png
- White for splash.png

These can be replaced later with proper branding.
