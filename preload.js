const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

console.log('[Simplicity] Preload starting...');

// Get settings path from command line args or use default
let settingsPath;
const args = process.argv;
const settingsArg = args.find(arg => arg.startsWith('--settings-path='));

if (settingsArg) {
  settingsPath = settingsArg.split('=')[1];
  console.log('[Simplicity] Settings path from args:', settingsPath);
} else {
  // Fallback to old behavior for development
  const isDev = process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath);
  if (isDev) {
    settingsPath = path.join(__dirname, 'settings.json');
  } else {
    settingsPath = path.join(__dirname, 'settings.json');
  }
  console.log('[Simplicity] Settings path (fallback):', settingsPath);
}

console.log('[Simplicity] __dirname:', __dirname);
console.log('[Simplicity] process.execPath:', process.execPath);

// Default settings
const defaultSettings = {
  toggleKey: 'o',
  uncapFPS: false,
  selectedSkins: {
    ar: 'ice',
    smg: 'ice',
    awp: 'matrix',
    shotgun: 'neon'
  }
};

let selectedSkins = defaultSettings.selectedSkins;
let toggleKey = defaultSettings.toggleKey;
let uncapFPS = defaultSettings.uncapFPS;

// Ensure settings file exists
if (!fs.existsSync(settingsPath)) {
  console.log('[Simplicity] Creating default settings file...');
  try {
    // Ensure directory exists
    const settingsDir = path.dirname(settingsPath);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf8');
    console.log('[Simplicity] Default settings created successfully');
  } catch (err) {
    console.error('[Simplicity] Error creating settings:', err);
  }
}

// Load settings
try {
  const raw = fs.readFileSync(settingsPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (parsed && parsed.selectedSkins) {
    selectedSkins = parsed.selectedSkins;
    console.log('[Simplicity] Loaded selected skins:', selectedSkins);
  }
  if (parsed && parsed.toggleKey) {
    toggleKey = parsed.toggleKey;
    console.log('[Simplicity] Loaded toggle key:', toggleKey);
  }
  if (parsed && typeof parsed.uncapFPS !== 'undefined') {
    uncapFPS = parsed.uncapFPS;
    console.log('[Simplicity] Loaded FPS uncap:', uncapFPS);
  }
} catch (err) {
  console.error('[Simplicity] Error reading settings:', err);
}

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  saveSettings: (settings) => {
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
      console.log('[Simplicity] Settings saved to:', settingsPath);
      console.log('[Simplicity] Settings content:', settings);
      return true;
    } catch (err) {
      console.error('[Simplicity] Error saving settings:', err);
      return false;
    }
  },
  getSettingsPath: () => {
    return settingsPath;
  }
});

// Inject script into page context (needed because of contextIsolation)
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Simplicity] DOM loaded, injecting skin selector...');
  
  // Inject skin swapper logic
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      const selectedSkins = ${JSON.stringify(selectedSkins)};
      console.log('[Simplicity] Injected skins:', selectedSkins);
      
      // Override JSON.parse to inject selected skins
      const originalJSONParse = JSON.parse;
      
      window.JSON.parse = function (text, reviver) {
        const result = originalJSONParse.call(this, text, reviver);

        // Check if this is player data (has skins, equippedSkins, username)
        if (
          result &&
          Array.isArray(result.skins) &&
          Array.isArray(result.equippedSkins) &&
          typeof result.username === 'string'
        ) {
          console.log('[Simplicity] ✓ Player data detected, injecting skins...');

          // Inject each selected skin
          for (const [weapon, skinName] of Object.entries(selectedSkins)) {
            if (!skinName || skinName === 'default') continue;

            const skinObj = { name: skinName, weapon, wear: 0 };

            // Add to skins collection if not already there
            if (!result.skins.some(s => s.name === skinName && s.weapon === weapon)) {
              result.skins.push(skinObj);
              console.log('[Simplicity] Added skin:', skinName, 'for', weapon);
            }

            // Set as equipped skin
            const idx = result.equippedSkins.findIndex(s => s.weapon === weapon);
            if (idx !== -1) {
              result.equippedSkins[idx] = skinObj;
            } else {
              result.equippedSkins.push(skinObj);
            }
            
            console.log('[Simplicity] ✓ Equipped', skinName, 'for', weapon);
          }
        }

        return result;
      };
      
      console.log('[Simplicity] ✓ Skin injector active!');
    })();
  `;
  
  document.head.appendChild(script);
  console.log('[Simplicity] ✓ Skin selector injected into page!');
  
  // Pass settings to page context
  const settingsScript = document.createElement('script');
  settingsScript.textContent = `
    window.__SKIN_SETTINGS__ = {
      toggleKey: ${JSON.stringify(toggleKey)},
      uncapFPS: ${JSON.stringify(uncapFPS)},
      selectedSkins: ${JSON.stringify(selectedSkins)}
    };
  `;
  document.head.appendChild(settingsScript);
  
  // Inject skin GUI - read from file system
  const skinGUIScript = document.createElement('script');
  try {
    const skinGUIPath = path.join(__dirname, 'skin-gui.js');
    console.log('[Simplicity] Reading skin-gui.js from:', skinGUIPath);
    const skinGUIContent = fs.readFileSync(skinGUIPath, 'utf8');
    console.log('[Simplicity] skin-gui.js size:', skinGUIContent.length, 'bytes');
    skinGUIScript.textContent = skinGUIContent;
    document.head.appendChild(skinGUIScript);
    console.log('[Simplicity] ✓ Skin GUI script injected!');
  } catch (err) {
    console.error('[Simplicity] Error loading skin-gui.js:', err);
    console.error('[Simplicity] Tried to load from:', path.join(__dirname, 'skin-gui.js'));
  }
});
