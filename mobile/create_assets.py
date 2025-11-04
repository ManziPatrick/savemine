# Create placeholder assets for Expo app
# This creates simple placeholder images - replace with actual app icons later

import os
from PIL import Image

# Create assets directory
os.makedirs('assets', exist_ok=True)

# Create icon.png (1024x1024)
icon = Image.new('RGB', (1024, 1024), color='#2563eb')
icon.save('assets/icon.png')

# Create adaptive-icon.png (1024x1024)
adaptive_icon = Image.new('RGB', (1024, 1024), color='#2563eb')
adaptive_icon.save('assets/adaptive-icon.png')

# Create splash.png (1242x2436)
splash = Image.new('RGB', (1242, 2436), color='#ffffff')
splash.save('assets/splash.png')

# Create favicon.png (48x48)
favicon = Image.new('RGB', (48, 48), color='#2563eb')
favicon.save('assets/favicon.png')

# Create notification-icon.png (96x96)
notif_icon = Image.new('RGB', (96, 96), color='#2563eb')
notif_icon.save('assets/notification-icon.png')

print("Assets created successfully!")

