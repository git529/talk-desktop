# Nextcloud Talk Desktop - Dual Instance Setup

This fork maintains custom branches to run two separate Nextcloud Talk Desktop instances (Work and Personal) simultaneously on macOS.

## 🎯 Purpose

This fork enables running two independent Talk Desktop apps:
- **Work App**: Purple theme, bundle ID: `com.nextcloud.talk.desktop.work`
- **Personal App**: Blue theme, bundle ID: `com.nextcloud.talk.desktop.personal`

## 📁 Repository Structure

```
git529/talk-desktop (fork)
├── main (synced with upstream)
├── custom/work-v2.0.3 (Work customizations)
├── custom/personal-v2.0.3 (Personal customizations)
└── custom/work-v2.1.1 (newer versions as they're created)
```

## 🔄 Update Workflow

### Automatic Update (Recommended)

Use the provided script to update to a new version:

```bash
# In talk-desktop-fork directory
./update-to-new-version.sh v2.1.1
```

This will:
1. Create new custom branches for the specified version
2. Apply basic customizations (package.json)
3. Push branches to your fork
4. Provide instructions for next steps

### Manual Update Process

1. **Fetch latest release**:
   ```bash
   git fetch upstream --tags
   git tag --sort=-version:refname | head -5  # Check available versions
   ```

2. **Create Work branch**:
   ```bash
   git checkout v2.1.1  # New version tag
   git checkout -b custom/work-v2.1.1
   
   # Edit package.json:
   # - productName: "Nextcloud Talk Work"
   # - desktopName: "com.nextcloud.talk.desktop.work"
   
   git add package.json
   git commit -m "feat: Customize for Work instance v2.1.1"
   ```

3. **Create Personal branch**:
   ```bash
   git checkout v2.1.1
   git checkout -b custom/personal-v2.1.1
   
   # Edit package.json:
   # - productName: "Nextcloud Talk Personal"
   # - desktopName: "com.nextcloud.talk.desktop.personal"
   
   git add package.json
   git commit -m "feat: Customize for Personal instance v2.1.1"
   ```

4. **Push to fork**:
   ```bash
   git push -u origin custom/work-v2.1.1
   git push -u origin custom/personal-v2.1.1
   ```

## 🛠️ Build Process

After creating custom branches, sync to build directories:

### Work Build
```bash
cd talk-desktop-fork
git checkout custom/work-v2.1.1
rsync -av --exclude='node_modules' --exclude='out' --exclude='.webpack' \
  --exclude='spreed' --exclude='.git' ./ ../talk-desktop-work/

cd ../talk-desktop-work
# Apply additional customizations (icons, colors, etc.)
./rebuild-complete.sh
./install-work.sh
```

### Personal Build
```bash
cd talk-desktop-fork
git checkout custom/personal-v2.1.1
rsync -av --exclude='node_modules' --exclude='out' --exclude='.webpack' \
  --exclude='spreed' --exclude='.git' ./ ../talk-desktop-personal/

cd ../talk-desktop-personal
# Apply additional customizations
./rebuild-complete.sh
./install-personal.sh
```

## 📝 Key Customizations

### Required Changes per Version

1. **package.json** - Unique app identifiers
2. **forge.config.js** - Ad-hoc code signing fix
3. **src/shared/setupWebPage.js** - Brand color application
4. **build/custom-{work|personal}.json** - Build configuration
5. **img/icons/icon.icns** - Custom app icons

### Files to Preserve

When updating, these custom files must be copied from previous version:
- `build/custom-work.json` (purple theme config)
- `build/custom-personal.json` (blue theme config)
- Work app's purple icon
- Shell scripts (`rebuild-complete.sh`, `install-*.sh`)

## 🚀 Quick Commands

```bash
# Check current setup
git remote -v
git branch | grep custom

# See available upstream versions
git fetch upstream --tags
git tag --sort=-version:refname | head -10

# Update to latest version
./update-to-new-version.sh

# Build both apps (after syncing code)
cd ../talk-desktop-work && ./rebuild-complete.sh && ./install-work.sh
cd ../talk-desktop-personal && ./rebuild-complete.sh && ./install-personal.sh
```

## 🔗 Links

- **Upstream**: https://github.com/nextcloud/talk-desktop
- **This Fork**: https://github.com/git529/talk-desktop
- **Official Docs**: https://github.com/nextcloud/talk-desktop#readme

## 📄 License

This fork maintains the same license as the upstream Nextcloud Talk Desktop project.