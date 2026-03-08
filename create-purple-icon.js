#!/usr/bin/env node

/**
 * Script to convert blue Nextcloud Talk icon to purple for Work instance
 * This modifies PNG files which can then be converted to ICNS format
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if we're in the right directory
const currentDir = process.cwd();
const iconPath = path.join(currentDir, 'img/icons');

if (!fs.existsSync(iconPath)) {
    console.error('❌ Error: img/icons directory not found');
    console.error('Please run this script from the talk-desktop-work or talk-desktop-fork directory');
    process.exit(1);
}

// Function to create purple icon using Python (built-in on macOS)
function createPurpleIcon() {
    const pythonScript = `
import os
import sys
from PIL import Image
import numpy as np

def rgb_to_hsv(rgb):
    """Convert RGB to HSV color space"""
    rgb = rgb.astype(np.float32) / 255.0
    maxc = np.max(rgb, axis=-1)
    minc = np.min(rgb, axis=-1)
    v = maxc
    
    deltac = maxc - minc
    s = deltac / (maxc + 1e-10)
    
    # Hue calculation
    h = np.zeros_like(maxc)
    
    # Red is max
    idx = (rgb[..., 0] == maxc) & (deltac > 0)
    h[idx] = ((rgb[..., 1] - rgb[..., 2]) / deltac)[idx] % 6
    
    # Green is max
    idx = (rgb[..., 1] == maxc) & (deltac > 0)
    h[idx] = ((rgb[..., 2] - rgb[..., 0]) / deltac + 2)[idx]
    
    # Blue is max
    idx = (rgb[..., 2] == maxc) & (deltac > 0)
    h[idx] = ((rgb[..., 0] - rgb[..., 1]) / deltac + 4)[idx]
    
    h = h / 6.0
    
    return np.stack([h, s, v], axis=-1)

def hsv_to_rgb(hsv):
    """Convert HSV to RGB color space"""
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    
    h = h * 6.0
    i = np.floor(h).astype(int)
    f = h - i
    p = v * (1 - s)
    q = v * (1 - s * f)
    t = v * (1 - s * (1 - f))
    
    i = i % 6
    
    rgb = np.zeros_like(hsv)
    
    idx = (i == 0)
    rgb[idx] = np.stack([v[idx], t[idx], p[idx]], axis=-1)
    
    idx = (i == 1)
    rgb[idx] = np.stack([q[idx], v[idx], p[idx]], axis=-1)
    
    idx = (i == 2)
    rgb[idx] = np.stack([p[idx], v[idx], t[idx]], axis=-1)
    
    idx = (i == 3)
    rgb[idx] = np.stack([p[idx], q[idx], v[idx]], axis=-1)
    
    idx = (i == 4)
    rgb[idx] = np.stack([t[idx], p[idx], v[idx]], axis=-1)
    
    idx = (i == 5)
    rgb[idx] = np.stack([v[idx], p[idx], q[idx]], axis=-1)
    
    return (rgb * 255).astype(np.uint8)

def convert_blue_to_purple(input_path, output_path):
    """Convert blue icon to purple by shifting hue"""
    img = Image.open(input_path)
    
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Get image data as numpy array
    data = np.array(img)
    
    # Separate alpha channel
    rgb = data[..., :3]
    alpha = data[..., 3]
    
    # Convert to HSV
    hsv = rgb_to_hsv(rgb)
    
    # Shift hue from blue (around 0.55-0.7) to purple (around 0.75-0.85)
    # Only modify pixels that are somewhat blue
    hue = hsv[..., 0]
    saturation = hsv[..., 1]
    
    # Detect blue-ish pixels (hue between 0.5 and 0.7, with some saturation)
    blue_mask = (hue > 0.5) & (hue < 0.7) & (saturation > 0.3)
    
    # Shift blue to purple (shift by about 0.2 in hue)
    hsv[blue_mask, 0] = (hsv[blue_mask, 0] - 0.35) % 1.0
    
    # Convert back to RGB
    rgb_new = hsv_to_rgb(hsv)
    
    # Combine with original alpha channel
    data_new = np.concatenate([rgb_new, alpha[..., np.newaxis]], axis=-1)
    
    # Save the result
    img_new = Image.fromarray(data_new, 'RGBA')
    img_new.save(output_path)
    print(f"✅ Created: {output_path}")

# Process the main icon.png
if os.path.exists("img/icons/icon.png"):
    convert_blue_to_purple("img/icons/icon.png", "img/icons/icon_purple.png")
else:
    print("❌ icon.png not found")
`;

    // Write Python script to temp file
    const tempScript = path.join(currentDir, 'temp_icon_converter.py');
    fs.writeFileSync(tempScript, pythonScript);

    try {
        // First, check if PIL is available
        try {
            execSync('python3 -c "from PIL import Image; import numpy"', { stdio: 'ignore' });
        } catch {
            console.log('📦 Installing required Python packages...');
            execSync('pip3 install --user Pillow numpy', { stdio: 'inherit' });
        }

        // Run the Python script
        execSync(`python3 ${tempScript}`, { stdio: 'inherit' });

        // Convert PNG to ICNS using macOS tools
        if (fs.existsSync(path.join(iconPath, 'icon_purple.png'))) {
            console.log('🎨 Converting purple PNG to ICNS format...');
            
            // Create iconset directory
            const iconsetPath = path.join(currentDir, 'icon.iconset');
            if (!fs.existsSync(iconsetPath)) {
                fs.mkdirSync(iconsetPath);
            }

            // Copy and resize the purple icon for different sizes
            const sizes = [
                { size: 16, name: 'icon_16x16.png' },
                { size: 32, name: 'icon_16x16@2x.png' },
                { size: 32, name: 'icon_32x32.png' },
                { size: 64, name: 'icon_32x32@2x.png' },
                { size: 128, name: 'icon_128x128.png' },
                { size: 256, name: 'icon_128x128@2x.png' },
                { size: 256, name: 'icon_256x256.png' },
                { size: 512, name: 'icon_256x256@2x.png' },
                { size: 512, name: 'icon_512x512.png' },
                { size: 1024, name: 'icon_512x512@2x.png' }
            ];

            const purplePngPath = path.join(iconPath, 'icon_purple.png');
            
            sizes.forEach(({ size, name }) => {
                const outputPath = path.join(iconsetPath, name);
                execSync(`sips -z ${size} ${size} "${purplePngPath}" --out "${outputPath}"`, { stdio: 'ignore' });
            });

            // Convert iconset to icns
            const icnsPath = path.join(iconPath, 'icon.icns');
            execSync(`iconutil -c icns "${iconsetPath}" -o "${icnsPath}"`, { stdio: 'inherit' });
            
            console.log('✅ Purple ICNS icon created successfully!');
            
            // Clean up
            execSync(`rm -rf "${iconsetPath}"`, { stdio: 'ignore' });
            fs.unlinkSync(path.join(iconPath, 'icon_purple.png'));
        }

    } catch (error) {
        console.error('❌ Error creating purple icon:', error.message);
    } finally {
        // Clean up temp script
        if (fs.existsSync(tempScript)) {
            fs.unlinkSync(tempScript);
        }
    }
}

// Also update the Windows .ico file if it exists
if (fs.existsSync(path.join(iconPath, 'icon.ico'))) {
    console.log('📝 Note: Windows .ico file needs manual conversion');
}

createPurpleIcon();