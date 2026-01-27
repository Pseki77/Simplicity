# Settings Storage Location Fix 🔧

## Problem
When running the built app (`.exe`), settings couldn't be saved because `settings.json` was packed inside `app.asar` which is **read-only**.

## Solution
Settings are now stored in the **user's AppData folder** which is always writable!

## Settings Location

### Development (npm start)
```
E:\simplicity\settings.json
```

### Production (built .exe)
```
C:\Users\YourUsername\AppData\Roaming\deadshot-electron\settings.json
```

You can find your exact path by:
1. Opening DevTools (F12 or Ctrl+Shift+I)
2. Looking for this log:
   ```
   [Simplicity] Settings path: C:\Users\...\AppData\Roaming\deadshot-electron\settings.json
   ```

## What This Means

✅ **Settings persist** across app restarts
✅ **GUI saves work** in both dev and production
✅ **Skin swapper works** in the built executable
✅ **FPS toggle works** in the built executable
✅ **No permission issues** - AppData is always writable

## How It Works

1. **main.js** gets the user data path using `app.getPath('userData')`
2. Creates `settings.json` there if it doesn't exist (with defaults)
3. Passes the path to **preload.js** via command line args
4. **preload.js** reads/writes to this location
5. **GUI** saves changes via IPC to this location

## Testing

### Test in Development:
```bash
npm start
```
- Press O to open GUI
- Change settings
- Restart with npm start
- Settings should persist ✓

### Test in Production:
```bash
npm run build
```
- Run `dist\win-unpacked\Deadshot Client.exe`
- Press O to open GUI
- Change settings
- Close and reopen the .exe
- Settings should persist ✓

## Viewing Your Settings

You can manually view/edit your settings by opening the file at:
```
%APPDATA%\deadshot-electron\settings.json
```

Or paste this in Windows Explorer:
```
%APPDATA%\deadshot-electron
```

## Settings Format

```json
{
  "toggleKey": "o",
  "uncapFPS": false,
  "selectedSkins": {
    "ar": "ice",
    "smg": "ice",
    "awp": "matrix",
    "shotgun": "neon"
  }
}
```

## Troubleshooting

### Settings not saving in .exe?
1. Check DevTools console for errors
2. Look for the settings path in logs
3. Make sure the folder exists at `%APPDATA%\deadshot-electron`
4. Try deleting the folder and letting the app recreate it

### Want to reset to defaults?
Delete the settings file:
```
%APPDATA%\deadshot-electron\settings.json
```
The app will create a new one with defaults on next launch.

## Console Logs to Look For

When the app starts, you should see:
```
[Simplicity] Settings path: C:\Users\...\AppData\Roaming\deadshot-electron\settings.json
[Simplicity] FPS Uncap: false
[Simplicity] Loaded selected skins: {...}
[Simplicity] Loaded toggle key: o
```

When you save in the GUI:
```
[Skin GUI] Settings saved via IPC
[Simplicity] Settings saved: {...}
```

## Summary

**Before:** Settings were in `app.asar` (read-only) ❌
**After:** Settings are in `AppData` (writable) ✅

Now rebuild and test! 🚀
