# Simplicity Client - Skin Swapper Documentation

## Overview

The Simplicity client is a low-latency Electron wrapper for deadshot.io with a built-in skin swapper feature. This document explains all changes made and how the skin swapping mechanism works.

---

## Changes Made

### 1. **Fixed package.json Build Configuration**

**Problem:** The original `package.json` had conflicting build configurations that caused the app to fail with "Cannot find module main.js" error.

**Changes:**
- Removed conflicting `asarUnpack` and `extraResources` configurations
- Simplified the `files` array to include only necessary files
- All files (main.js, preload.js, settings.json, skin-gui.js) are now properly packaged inside `app.asar`

**Before:**
```json
{
  "asar": true,
  "asarUnpack": ["settings.json", "main.js", "preload.js"],
  "extraResources": [
    {"from": "settings.json", "to": "settings.json"},
    {"from": "main.js", "to": "main.js"},
    {"from": "preload.js", "to": "preload.js"}
  ],
  "files": ["**/*", "!node_modules/**/*", "node_modules/electron/**/*"]
}
```

**After:**
```json
{
  "asar": true,
  "files": [
    "main.js",
    "preload.js",
    "settings.json",
    "skin-gui.js",
    "!node_modules/**/*",
    "!swap/**/*",
    "!skin-swapper.js",
    "!dist/**/*"
  ]
}
```

### 2. **Fixed preload.js Path Resolution**

**Problem:** The preload.js was looking for settings.json at `process.resourcesPath`, which was incorrect when files are inside `app.asar`.

**Solution:** Changed the path to use `__dirname` which correctly points to the location inside `app.asar`:

```javascript
if (isDev) {
  settingsPath = path.join(__dirname, 'settings.json');
} else {
  // When packaged, settings.json is inside app.asar
  settingsPath = path.join(__dirname, 'settings.json');
}
```

### 3. **Created Minimal Skin Swapper GUI**

**New File:** `E:\simplicity\skin-gui.js`

A minimal, beautiful GUI for selecting skins without the complexity of the omniverse client's full GUI system. Features:
- Clean, modern dark theme design
- Dropdown selectors for each weapon type (AR, SMG, AWP, Shotgun)
- Customizable toggle key
- Real-time saving to settings.json
- Helpful reload notice

---

## How the Skin Swapper Works

### Architecture

```
User loads game
     ↓
main.js creates BrowserWindow with preload.js
     ↓
preload.js reads settings.json and gets selectedSkins
     ↓
preload.js injects skin swapper into page context
     ↓
Skin swapper intercepts JSON.parse
     ↓
When player data loads, skins are injected
     ↓
Player sees equipped skins in-game
```

### Detailed Explanation

#### 1. **Settings Storage**

Skins are stored in `settings.json`:

```json
{
  "selectedSkins": {
    "ar": "ice",
    "smg": "ice",
    "awp": "matrix",
    "shotgun": "neon"
  }
}
```

#### 2. **Preload Script (preload.js)**

The preload script runs before the page loads and:

1. **Loads settings.json** from the file system
2. **Extracts selectedSkins** object
3. **Injects a script** into the page context that:
   - Overrides `JSON.parse`
   - Detects when player data loads (has `skins`, `equippedSkins`, `username` properties)
   - Adds the selected skins to the player's inventory
   - Equips those skins automatically

Key code snippet:
```javascript
window.JSON.parse = function (text, reviver) {
  const result = originalJSONParse.call(this, text, reviver);

  // Check if this is player data
  if (result && Array.isArray(result.skins) && 
      Array.isArray(result.equippedSkins) && 
      typeof result.username === 'string') {
    
    // Inject each selected skin
    for (const [weapon, skinName] of Object.entries(selectedSkins)) {
      if (!skinName || skinName === 'default') continue;

      const skinObj = { name: skinName, weapon, wear: 0 };

      // Add to inventory
      if (!result.skins.some(s => s.name === skinName && s.weapon === weapon)) {
        result.skins.push(skinObj);
      }

      // Equip the skin
      const idx = result.equippedSkins.findIndex(s => s.weapon === weapon);
      if (idx !== -1) {
        result.equippedSkins[idx] = skinObj;
      } else {
        result.equippedSkins.push(skinObj);
      }
    }
  }

  return result;
};
```

#### 3. **Skin GUI (skin-gui.js)**

The GUI provides an interface for users to:

1. **Select skins** from dropdown menus for each weapon
2. **Change the toggle key** (default: Insert)
3. **See available skins** with their display names
4. **Auto-save** changes to settings.json

The GUI is styled with:
- Dark glassmorphism effect
- Smooth hover animations
- Responsive design
- Clean typography

---

## Available Skins

The following skins are available (based on the Omniverse client):

| Skin Key | Display Name | Skin Key | Display Name |
|----------|--------------|----------|--------------|
| default | Default | bacon | Bacon |
| linen | Fresh Linen | greencamo | Green Camo |
| redcamo | Red Camo | tiger | Tigris |
| carbon | Carbon Fiber | cherry | Blossom |
| prism | Gem Stone | splatter | Marble |
| swirl | Swirl | vapor | Vapor Wave |
| astro | Astro | payday | Pay Day |
| safari | Safari | snowcamo | Snow Camo |
| rustic | Royal | hydro | Hydrodip |
| ice | Frostbite | silly | Silly |
| alez | Alez | horizon | Horizon |
| quackster | QuaK | matrix | Matrix |
| neon | Neon | winter | Winter '22 |
| hlwn | HLWN '23 | summer | Summer '24 |
| birthday | 1st Birthday | | |

---

## Usage Guide

### Opening the Skin GUI

1. **Launch the Simplicity client**
2. **Press the toggle key** (default: `Insert`)
3. **Select skins** from the dropdowns
4. **Reload the client** (Ctrl+R) to apply changes

### Changing the Toggle Key

1. Open the skin GUI
2. Scroll to the bottom
3. Type a new key in the "Toggle Key" input
4. The change is saved automatically

### Building the App

```bash
# Delete old build
rmdir /s /q dist

# Build for Windows
npm run build
```

The executable will be in `dist\win-unpacked\Deadshot Client.exe`

---

## Troubleshooting

### Skins Not Applying

1. **Check settings.json** - Make sure your selected skins are saved
2. **Reload the client** - Press Ctrl+R
3. **Check console** - Press F12 and look for "[Simplicity]" logs
4. **Verify skin names** - Make sure you're using valid skin keys (lowercase)

### GUI Not Opening

1. **Check the toggle key** - Default is `Insert`
2. **Look at settings.json** - Verify the `toggleKey` field
3. **Rebuild the app** - Try a fresh build

### Build Errors

1. **Delete node_modules** and reinstall:
   ```bash
   rmdir /s /q node_modules
   npm install
   ```

2. **Delete dist folder** before building:
   ```bash
   rmdir /s /q dist
   npm run build
   ```

---

## File Structure

```
E:\simplicity\
├── main.js              # Electron main process
├── preload.js           # Preload script (skin injection)
├── skin-gui.js          # Skin swapper GUI
├── settings.json        # User settings + selected skins
├── package.json         # Build configuration
└── dist\                # Build output
    └── win-unpacked\
        └── Deadshot Client.exe
```

---

## Technical Details

### Context Isolation

The app uses Electron's context isolation for security. This means:
- The preload script runs in an isolated context
- It can access Node.js APIs (fs, path)
- But it cannot directly access the page's JavaScript

**Solution:** We inject a script tag into the page that overrides `JSON.parse`

### File Packaging

All files are packaged inside `app.asar`:
- `main.js` - Main process
- `preload.js` - Preload script
- `settings.json` - Settings file
- `skin-gui.js` - GUI script

When packaged, `__dirname` points to inside the asar: `resources/app.asar/`

### Skin Data Format

Player data from deadshot.io looks like:
```javascript
{
  username: "Player123",
  skins: [
    { name: "neon", weapon: "ar", wear: 0 },
    { name: "matrix", weapon: "awp", wear: 0 }
  ],
  equippedSkins: [
    { name: "neon", weapon: "ar", wear: 0 },
    { name: "matrix", weapon: "awp", wear: 0 }
  ],
  // ... other data
}
```

Our skin swapper:
1. Adds skins to the `skins` array (inventory)
2. Sets them in the `equippedSkins` array (equipped)

---

## Credits

- **Base client:** Simplicity Deadshot Wrapper
- **Skin mechanism inspiration:** Omniverse Client (E:\omniverse-win32-x64)
- **Build fixes & GUI:** Custom implementation

---

## Future Improvements

Possible enhancements:
1. Add skin preview images
2. Create profiles for different skin loadouts
3. Add hotkeys to quickly swap between presets
4. Add more customization options (GUI position, theme, etc.)
5. Auto-update skin list from deadshot.io API

---

## License

This is a personal project for educational purposes. Deadshot.io and all game assets are property of their respective owners.
