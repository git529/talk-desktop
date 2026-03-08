# Nextcloud Talk Desktop - Custom Work & Personal Builds Documentation

## Overview
This documentation explains how to maintain two separate Nextcloud Talk Desktop instances (Work and Personal) that can run simultaneously on macOS with different themes and configurations.

## Current Setup (as of Oct 30, 2024)
- **Current Version**: 2.0.3
- **Work App**: Purple icon & theme, bundle ID: `com.nextcloud.talk.desktop.work`
- **Personal App**: Blue icon & theme, bundle ID: `com.nextcloud.talk.desktop.personal`
- **Node Version Required**: 22+ (use Node 18 as default, Node 22 for builds)

## Directory Structure
```
~/Developer/
├── talk-desktop-fork/          # Git repository tracking official releases
│   ├── custom/work-v2.0.3      # Branch with Work customizations
│   └── custom/personal-v2.0.3  # Branch with Personal customizations
├── talk-desktop-work/          # Build directory for Work app
│   ├── build/
│   │   └── custom-work.json    # Custom configuration for Work
│   ├── img/icons/
│   │   └── icon.icns           # Purple app icon
│   ├── rebuild-complete.sh     # Build script
│   └── install-work.sh         # Install script
└── talk-desktop-personal/      # Build directory for Personal app
    ├── build/
    │   └── custom-personal.json # Custom configuration for Personal
    ├── img/icons/
    │   └── icon.icns           # Blue app icon
    ├── rebuild-complete.sh     # Build script
    └── install-personal.sh     # Install script
```

## How to Update to a New Version

### Step 1: Fetch the New Release
```bash
cd ~/Developer/talk-desktop-fork
git fetch upstream --tags
git checkout v2.0.4  # Replace with new version number
```

### Step 2: Create New Branches with Customizations
```bash
# Create Work branch
git checkout -b custom/work-v2.0.4
# Edit package.json to set:
#   "productName": "Nextcloud Talk Work"
#   "desktopName": "com.nextcloud.talk.desktop.work"
git add package.json
git commit -m "feat: Customize for Work instance v2.0.4"

# Create Personal branch
git checkout v2.0.4
git checkout -b custom/personal-v2.0.4
# Edit package.json to set:
#   "productName": "Nextcloud Talk Personal"
#   "desktopName": "com.nextcloud.talk.desktop.personal"
git add package.json
git commit -m "feat: Customize for Personal instance v2.0.4"
```

### Step 3: Update Work Build Directory
```bash
cd ~/Developer/talk-desktop-fork
git checkout custom/work-v2.0.4

# Copy updated code (excluding build artifacts)
rsync -av --exclude='node_modules' --exclude='out' --exclude='.webpack' \
  --exclude='spreed' --exclude='.git' ./ ../talk-desktop-work/

# Rebuild with Node 22
cd ../talk-desktop-work
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm ci
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm ci --prefix=spreed
```

### Step 4: Update Personal Build Directory
```bash
cd ~/Developer/talk-desktop-fork
git checkout custom/personal-v2.0.4

# Copy updated code (excluding build artifacts)
rsync -av --exclude='node_modules' --exclude='out' --exclude='.webpack' \
  --exclude='spreed' --exclude='.git' ./ ../talk-desktop-personal/

# Rebuild with Node 22
cd ../talk-desktop-personal
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm ci
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm ci --prefix=spreed
```

### Step 5: Build and Install
```bash
# Work
cd ~/Developer/talk-desktop-work
./rebuild-complete.sh
./install-work.sh

# Personal
cd ~/Developer/talk-desktop-personal
./rebuild-complete.sh
./install-personal.sh
```

## Key Customizations Applied

### 1. Package.json Customizations
Each app has unique identifiers to prevent conflicts:

**Work** (`talk-desktop-work/package.json`):
```json
{
  "productName": "Nextcloud Talk Work",
  "desktopName": "com.nextcloud.talk.desktop.work"
}
```

**Personal** (`talk-desktop-personal/package.json`):
```json
{
  "productName": "Nextcloud Talk Personal",
  "desktopName": "com.nextcloud.talk.desktop.personal"
}
```

### 2. Build Configuration Files
**Work** (`talk-desktop-work/build/custom-work.json`):
```json
{
  "applicationName": "Nextcloud Talk Work",
  "appleAppBundleId": "com.nextcloud.talk.desktop.work",
  "linuxAppId": "com.nextcloud.talk.desktop.work",
  "winAppId": "com.nextcloud.talk.desktop.work",
  "brandColor": "#7C3AED",
  "brandFontColor": "#FFFFFF"
}
```

**Personal** (`talk-desktop-personal/build/custom-personal.json`):
```json
{
  "applicationName": "Nextcloud Talk Personal",
  "appleAppBundleId": "com.nextcloud.talk.desktop.personal",
  "linuxAppId": "com.nextcloud.talk.desktop.personal",
  "winAppId": "com.nextcloud.talk.desktop.personal",
  "brandColor": "#0082C9",
  "brandFontColor": "#FFFFFF"
}
```

### 3. Code Modifications

#### forge.config.js
Modified to ensure ad-hoc code signing with correct bundle ID:
```javascript
osxSign: hasMacosSign ? {} : {
    // Ad-hoc sign with correct identifier when no Apple credentials
    identity: '-',
    identityValidation: false,
},
```

#### src/shared/setupWebPage.js
Added function to apply brand color as CSS variables:
```javascript
import { BUILD_CONFIG } from './build.config.ts'

function applyBrandColor() {
    if (BUILD_CONFIG.brandColor) {
        document.documentElement.style.setProperty('--color-primary', BUILD_CONFIG.brandColor, 'important')
        document.documentElement.style.setProperty('--color-primary-element', BUILD_CONFIG.brandColor, 'important')
        document.documentElement.style.setProperty('--color-primary-element-light', BUILD_CONFIG.brandColor + '20', 'important')
    }
}

// Called in setupWebPage() after applyHeaderHeight()
```

### 4. Icons
- **Work**: Purple icon stored in `talk-desktop-work/img/icons/icon.icns`
- **Personal**: Blue icon (default) in `talk-desktop-personal/img/icons/icon.icns`

## Scripts Explained

### rebuild-complete.sh
- Uses Node 22 temporarily (required for build)
- Sets CUSTOM_CONFIG environment variable
- Builds for macOS with proper signing
- Creates DMG package
- Verifies bundle ID and code signing

### install-work.sh / install-personal.sh
- Mounts the DMG
- Removes old app version
- Copies new app to /Applications
- **Removes quarantine flag**: `xattr -cr` (prevents "app cannot be opened" error)
- **Re-signs with correct bundle ID**: `codesign --force --deep --sign -`
- Verifies installation

## Troubleshooting

### "App cannot be opened" Error
Run after installing:
```bash
xattr -cr "/Applications/Nextcloud Talk Work.app"
codesign --force --deep --sign - "/Applications/Nextcloud Talk Work.app"
```

### Microphone/Camera Permissions Issues
1. Check code signing:
```bash
codesign -dv "/Applications/Nextcloud Talk Work.app" 2>&1 | grep "^Identifier"
# Should show: Identifier=com.nextcloud.talk.desktop.work
```

2. Reset permissions if needed:
```bash
tccutil reset All com.nextcloud.talk.desktop.work
tccutil reset All com.nextcloud.talk.desktop.personal
killall tccd
```

### Node Version Issues
The project requires Node 22+ but you use Node 18 by default:
```bash
# Temporary switch to Node 22 for builds
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build:mac

# Or use the rebuild scripts which handle this automatically
```

### Purple Theme Not Showing
Ensure `src/shared/setupWebPage.js` has the `applyBrandColor()` function and it's called in `setupWebPage()`.

## Quick Reference Commands

### Build Both Apps
```bash
# Work
cd ~/Developer/talk-desktop-work && ./rebuild-complete.sh && ./install-work.sh

# Personal
cd ~/Developer/talk-desktop-personal && ./rebuild-complete.sh && ./install-personal.sh
```

### Check Installed Versions
```bash
defaults read "/Applications/Nextcloud Talk Work.app/Contents/Info.plist" CFBundleShortVersionString
defaults read "/Applications/Nextcloud Talk Personal.app/Contents/Info.plist" CFBundleShortVersionString
```

### Launch Apps
```bash
open "/Applications/Nextcloud Talk Work.app"
open "/Applications/Nextcloud Talk Personal.app"
```

## Important Notes

1. **Always use the install scripts** - they handle quarantine removal and proper code signing
2. **Node 22 is required for building** but Node 18 can remain your default
3. **Purple icon for Work** must be preserved when updating (copy from existing if lost)
4. **Both apps store data separately** in `~/Library/Application Support/`
5. **Server theming** may override app colors after login, but initial screens use brand colors

## Files to Preserve When Updating

When updating to a new version, make sure these customizations are preserved:
1. `build/custom-work.json` and `build/custom-personal.json`
2. Work app's purple icon (`img/icons/icon.icns`)
3. Modified `forge.config.js` (for code signing)
4. Modified `src/shared/setupWebPage.js` (for brand colors)
5. All shell scripts (`rebuild-complete.sh`, `install-*.sh`)

---
Last updated: October 30, 2024 - Version 2.0.3