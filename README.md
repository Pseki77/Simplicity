# Simplicity Deadshot Client with Skin Swapper

A minimal, high-performance Electron wrapper for deadshot.io with an integrated skin swapper GUI.

## 🎨 Features

- **Skin Swapper GUI** - Beautiful, minimal interface to select skins for each weapon
- **Customizable Toggle Key** - Change which key opens the GUI (default: Insert)
- **Auto-Save** - Settings are saved automatically as you change them
- **All Omniverse Skins** - Access to 25+ premium skins without owning them
- **Low Latency** - Optimized for gaming performance

## 🚀 Quick Start

### Building

```bash
# Install dependencies (first time only)
npm install

# Build the app
rmdir /s /q dist
npm run build
```

The executable will be in `dist\win-unpacked\Deadshot Client.exe`

### Using the Skin Swapper

1. **Launch** the Deadshot Client
2. **Press Insert** to open the skin GUI
3. **Select skins** for each weapon
4. **Reload** the client (Ctrl+R) to apply changes

## 📖 Documentation

See [SKIN_SWAPPER_DOCS.md](SKIN_SWAPPER_DOCS.md) for complete documentation including:
- How the skin swapper works
- Available skins list
- Troubleshooting guide
- Technical details

## 🎯 Available Skins

Default, Bacon, Fresh Linen, Green Camo, Red Camo, Tigris, Carbon Fiber, Blossom, Gem Stone, Marble, Swirl, Vapor Wave, Astro, Pay Day, Safari, Snow Camo, Royal, Hydrodip, Frostbite, Silly, Alez, Horizon, QuaK, Matrix, Neon, Winter '22, HLWN '23, Summer '24, 1st Birthday

## ⚙️ Default Settings

```json
{
  "toggleKey": "Insert",
  "selectedSkins": {
    "ar": "ice",
    "smg": "ice",
    "awp": "matrix",
    "shotgun": "neon"
  }
}
```

## 🛠️ Troubleshooting

**Skins not working?**
- Make sure to reload the client (Ctrl+R) after changing skins
- Check that settings.json has your selected skins
- Press F12 and look for [Simplicity] logs in the console

**GUI not opening?**
- Check your toggle key in settings.json
- Default is "Insert" key
- Try rebuilding the app

**Build errors?**
- Delete `node_modules` and `dist` folders
- Run `npm install` again
- Make sure you're using Node.js 16+

## 📝 Files Structure

- `main.js` - Electron main process
- `preload.js` - Skin injection logic
- `skin-gui.js` - Minimal skin swapper GUI
- `settings.json` - User settings and selected skins
- `package.json` - Build configuration

## ⚡ Performance

The client includes these optimizations:
- Disabled background timer throttling
- Disabled renderer backgrounding
- Disabled frame rate limit
- Force high performance GPU

## 📄 License

Personal project for educational purposes. Deadshot.io and all game assets are property of their respective owners.

---

**Created with ❤️ using Omniverse client as reference**
