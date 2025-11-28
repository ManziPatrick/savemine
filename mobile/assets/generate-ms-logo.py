#!/usr/bin/env python3
"""
Generate MS logo assets for SmartMoney app
Run: python generate-ms-logo.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Colors
GREEN = '#059669'
WHITE = '#FFFFFF'

def create_ms_logo(size, filename, is_splash=False):
    """Create MS logo image"""
    # Create image with green background
    img = Image.new('RGB', (size, size), GREEN)
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fallback to default if not available
    try:
        # Try different font paths
        font_paths = [
            '/System/Library/Fonts/Helvetica.ttc',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            'C:/Windows/Fonts/arial.ttf',
            'C:/Windows/Fonts/arialbd.ttf',
        ]
        font = None
        for path in font_paths:
            if os.path.exists(path):
                try:
                    font = ImageFont.truetype(path, int(size * 0.4))
                    break
                except:
                    continue
        
        if font is None:
            # Use default font
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Draw MS logo
    if is_splash:
        # Splash: Large MS centered
        text = "MS"
        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Center position
        x = (size - text_width) / 2
        y = (size - text_height) / 2
        
        draw.text((x, y), text, fill=WHITE, font=font)
    else:
        # Icon: M on left, S on right (or stacked)
        # Draw M
        text_m = "M"
        bbox_m = draw.textbbox((0, 0), text_m, font=font)
        text_width_m = bbox_m[2] - bbox_m[0]
        text_height_m = bbox_m[3] - bbox_m[1]
        
        # Draw S
        text_s = "S"
        bbox_s = draw.textbbox((0, 0), text_s, font=font)
        text_width_s = bbox_s[2] - bbox_s[0]
        text_height_s = bbox_s[3] - bbox_s[1]
        
        # Center both letters
        # M on left half, S on right half
        x_m = (size / 2 - text_width_m) / 2
        y_m = (size - text_height_m) / 2
        
        x_s = size / 2 + (size / 2 - text_width_s) / 2
        y_s = (size - text_height_s) / 2
        
        draw.text((x_m, y_m), text_m, fill=WHITE, font=font)
        draw.text((x_s, y_s), text_s, fill=WHITE, font=font)
    
    # Save image
    img.save(filename, 'PNG')
    print(f"✅ Created {filename} ({size}x{size})")

def main():
    """Generate all logo assets"""
    print("🎨 Generating MS logo assets...")
    print("=" * 50)
    
    # Create icon (1024x1024)
    create_ms_logo(1024, 'icon.png', is_splash=False)
    
    # Create adaptive icon (1024x1024)
    create_ms_logo(1024, 'adaptive-icon.png', is_splash=False)
    
    # Create splash (1242x2436 for iOS)
    create_ms_logo(1242, 'splash.png', is_splash=True)
    
    # Also create a square splash for Android (same size as icon)
    create_ms_logo(1024, 'splash-square.png', is_splash=True)
    
    print("=" * 50)
    print("✅ All logo assets generated successfully!")
    print("\n📝 Next steps:")
    print("   1. Rename splash-square.png to splash.png if needed")
    print("   2. Copy files to mobile/assets/ directory")
    print("   3. Run: npx expo start")

if __name__ == '__main__':
    main()



