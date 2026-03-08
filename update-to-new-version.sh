#!/bin/bash

# Script to update custom Nextcloud Talk Desktop builds to a new version
# Usage: ./update-to-new-version.sh [version]
# Example: ./update-to-new-version.sh v2.1.1

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get version from argument or prompt
if [ -z "$1" ]; then
    echo "Available versions:"
    git tag --sort=-version:refname | head -10
    echo -e "\n${YELLOW}Enter the version to update to (e.g., v2.1.1):${NC}"
    read VERSION
else
    VERSION=$1
fi

echo -e "${GREEN}Updating to version ${VERSION}${NC}"

# Ensure we're in the right directory
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Fetch latest from upstream
echo -e "${YELLOW}Fetching latest from upstream...${NC}"
git fetch upstream --tags

# Check if version exists
if ! git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo -e "${RED}Error: Version $VERSION not found${NC}"
    exit 1
fi

# Get current version from branch names
CURRENT_VERSION=$(git branch | grep "custom/work" | sed 's/.*custom\/work-//' | head -1)
echo -e "Current version: ${CURRENT_VERSION}"

# Create new branches for Work and Personal
echo -e "${GREEN}Creating custom branches for ${VERSION}...${NC}"

# Create Work branch
echo -e "${YELLOW}Creating Work branch...${NC}"
git checkout "$VERSION"
git checkout -b "custom/work-${VERSION}"

# Apply Work customizations to package.json
echo -e "Applying Work customizations..."
jq '.productName = "Nextcloud Talk Work" | .desktopName = "com.nextcloud.talk.desktop.work"' package.json > package.tmp.json && mv package.tmp.json package.json

# Check if forge.config.js needs the ad-hoc signing fix
if ! grep -q "identity: '-'" forge.config.js; then
    echo -e "Applying ad-hoc code signing fix to forge.config.js..."
    # This would need to be more sophisticated in a real script
    echo -e "${YELLOW}Note: You may need to manually apply the forge.config.js fix${NC}"
fi

git add package.json
git commit -m "feat: Customize for Work instance ${VERSION}"

# Create Personal branch
echo -e "${YELLOW}Creating Personal branch...${NC}"
git checkout "$VERSION"
git checkout -b "custom/personal-${VERSION}"

# Apply Personal customizations to package.json
echo -e "Applying Personal customizations..."
jq '.productName = "Nextcloud Talk Personal" | .desktopName = "com.nextcloud.talk.desktop.personal"' package.json > package.tmp.json && mv package.tmp.json package.json

# Check if forge.config.js needs the ad-hoc signing fix
if ! grep -q "identity: '-'" forge.config.js; then
    echo -e "Applying ad-hoc code signing fix to forge.config.js..."
    echo -e "${YELLOW}Note: You may need to manually apply the forge.config.js fix${NC}"
fi

git add package.json
git commit -m "feat: Customize for Personal instance ${VERSION}"

# Push both branches to origin
echo -e "${GREEN}Pushing branches to your fork...${NC}"
git push -u origin "custom/work-${VERSION}"
git push -u origin "custom/personal-${VERSION}"

echo -e "${GREEN}✅ Custom branches created and pushed successfully!${NC}"
echo -e "\nNext steps:"
echo -e "1. Copy the updated code to your build directories:"
echo -e "   ${YELLOW}# For Work:${NC}"
echo -e "   git checkout custom/work-${VERSION}"
echo -e "   rsync -av --exclude='node_modules' --exclude='out' --exclude='.webpack' --exclude='spreed' --exclude='.git' ./ ../talk-desktop-work/"
echo -e ""
echo -e "   ${YELLOW}# For Personal:${NC}"
echo -e "   git checkout custom/personal-${VERSION}"
echo -e "   rsync -av --exclude='node_modules' --exclude='out' --exclude='.webpack' --exclude='spreed' --exclude='.git' ./ ../talk-desktop-personal/"
echo -e ""
echo -e "2. Apply any additional customizations (icons, build configs, etc.)"
echo -e "3. Build and test both versions"
echo -e ""
echo -e "${YELLOW}Note: Don't forget to:${NC}"
echo -e "- Apply the brand color modifications to src/shared/setupWebPage.js"
echo -e "- Copy your custom icons to img/icons/"
echo -e "- Copy your custom build configs (custom-work.json, custom-personal.json)"