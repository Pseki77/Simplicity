# 🚀 Quick Reference Card

## Building & Running

```bash
# Build the client
rmdir /s /q dist && npm run build

# Run the built client
.\dist\win-unpacked\"Deadshot Client.exe"
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Insert** | Toggle skin GUI |
| **Ctrl+R** | Reload client (apply skins) |
| **F12** | Open DevTools (debugging) |

## File Locations

```
E:\simplicity\
├── main.js              ← Electron main process
├── preload.js           ← Skin injection logic
├── skin-gui.js          ← GUI for skin selection
├── settings.json        ← Your selected skins & settings
└── dist\
    └── win-unpacked\
        └── Deadshot Client.exe  ← Run this!
```

## Settings.json Structure

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

## Quick Fixes

### Problem: Skin GUI won't open
**Solution:** Check `settings.json` → `toggleKey` field. Default is `"Insert"`.

### Problem: Skins not showing in game
**Solution:** After selecting skins, press **Ctrl+R** to reload the client.

### Problem: Build fails
```bash
# Clean reinstall
rmdir /s /q node_modules
rmdir /s /q dist
npm install
npm run build
```

## Console Debugging

Press **F12** in the client and look for these logs:

```
✅ Good logs:
[Simplicity] Preload starting...
[Simplicity] Loaded selected skins: {...}
[Simplicity] ✓ Player data detected, injecting skins...
[Simplicity] ✓ Equipped ice for ar
[Simplicity] ✓ Skin GUI script injected!

❌ Bad logs:
Error reading settings: ...
Cannot find module ...
```

## Available Skins (Quick List)

**Tier 1 (Popular):**
- `ice` (Frostbite)
- `matrix` (Matrix)
- `neon` (Neon)
- `vapor` (Vapor Wave)

**Tier 2 (Stylish):**
- `carbon` (Carbon Fiber)
- `tiger` (Tigris)
- `astro` (Astro)
- `horizon` (Horizon)

**Tier 3 (Camo):**
- `greencamo` (Green Camo)
- `redcamo` (Red Camo)
- `snowcamo` (Snow Camo)
- `safari` (Safari)

**Seasonal:**
- `winter` (Winter '22)
- `hlwn` (HLWN '23)
- `summer` (Summer '24)
- `birthday` (1st Birthday)

**Full list:** See [SKIN_SWAPPER_DOCS.md](SKIN_SWAPPER_DOCS.md)

## Common Tasks

### Change toggle key
1. Open GUI (Press Insert)
2. Scroll to bottom
3. Type new key in "Toggle Key" field
4. Done! (auto-saved)

### Select different skins
1. Open GUI (Press Insert)
2. Click dropdown for weapon
3. Select skin
4. Reload client (Ctrl+R)

### Reset to defaults
Edit `settings.json`:
```json
{
  "toggleKey": "Insert",
  "selectedSkins": {
    "ar": "default",
    "smg": "default",
    "awp": "default",
    "shotgun": "default"
  }
}
```

## Workflow Diagram

```
Select Skins (Insert)
       ↓
Changes Auto-Saved
       ↓
Reload Client (Ctrl+R)
       ↓
Skins Applied! ✅
```

## Documentation Files

- **README.md** - Quick start guide
- **SKIN_SWAPPER_DOCS.md** - Full documentation
- **CHANGELOG.md** - All changes made
- **QUICK_REFERENCE.md** - This file!

## Support & Help

### Check Console Logs
1. Press **F12**
2. Go to **Console** tab
3. Look for `[Simplicity]` messages

### Verify Settings File
1. Open `settings.json`
2. Check that `selectedSkins` has valid skin names
3. All skin names should be lowercase
4. Example: `"ar": "ice"` ✅, not `"ar": "Ice"` ❌

### Clean Rebuild
```bash
# Windows PowerShell
Remove-Item -Recurse -Force dist, node_modules
npm install
npm run build
```

---

**Pro Tip:** Keep DevTools (F12) open while testing to see logs in real-time!

**Remember:** Always reload (Ctrl+R) after changing skins! ⚡
