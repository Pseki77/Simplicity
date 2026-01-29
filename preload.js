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
  adblock: true,
  disableFullscreen: false,
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
let adblock = defaultSettings.adblock;
let disableFullscreen = defaultSettings.disableFullscreen;

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
  if (parsed && typeof parsed.adblock !== 'undefined') {
    adblock = parsed.adblock;
    console.log('[Simplicity] Loaded Adblock:', adblock);
  }
  if (parsed && typeof parsed.disableFullscreen !== 'undefined') {
    disableFullscreen = parsed.disableFullscreen;
    console.log('[Simplicity] Loaded Disable Fullscreen:', disableFullscreen);
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
  },
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
});

// Inject script into page context (needed because of contextIsolation)
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Simplicity] DOM loaded, injecting skin selector...');
  
  // Inject title bar creation script into page context so it has access to electronAPI
  const titleBarScript = document.createElement('script');
  titleBarScript.textContent = `
    (function() {
      // Wait for page to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createTitleBar);
      } else {
        createTitleBar();
      }
      
      function createTitleBar() {
        // Create custom title bar
        const titleBar = document.createElement('div');
        titleBar.id = 'custom-title-bar';
        titleBar.style.cssText = \`
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 32px;
          background: transparent;
          border-bottom: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 9999999;
          -webkit-app-region: drag;
          user-select: none;
        \`;

        // Title
        const title = document.createElement('div');
        title.style.cssText = \`
          color: #fff;
          font-size: 13px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding-left: 12px;
          font-weight: 500;
        \`;
        title.textContent = 'Simplicity - deadshot.io';

        // Window controls container
        const controls = document.createElement('div');
        controls.style.cssText = \`
          display: flex;
          height: 100%;
          -webkit-app-region: no-drag;
        \`;

        // Minimize button
        const minimizeBtn = document.createElement('div');
        minimizeBtn.innerHTML = '−';
        minimizeBtn.style.cssText = \`
          width: 46px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.2s;
        \`;
        minimizeBtn.addEventListener('mouseenter', () => {
          minimizeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        minimizeBtn.addEventListener('mouseleave', () => {
          minimizeBtn.style.background = 'transparent';
        });
        minimizeBtn.addEventListener('click', () => {
          if (window.electronAPI && window.electronAPI.minimizeWindow) {
            window.electronAPI.minimizeWindow();
            console.log('[Simplicity] Minimize clicked');
          }
        });

        // Maximize button
        const maximizeBtn = document.createElement('div');
        maximizeBtn.innerHTML = '□';
        maximizeBtn.style.cssText = \`
          width: 46px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s;
        \`;
        maximizeBtn.addEventListener('mouseenter', () => {
          maximizeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        maximizeBtn.addEventListener('mouseleave', () => {
          maximizeBtn.style.background = 'transparent';
        });
        maximizeBtn.addEventListener('click', () => {
          if (window.electronAPI && window.electronAPI.maximizeWindow) {
            window.electronAPI.maximizeWindow();
            console.log('[Simplicity] Maximize clicked');
          }
        });

        // Close button
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = \`
          width: 46px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s;
        \`;
        closeBtn.addEventListener('mouseenter', () => {
          closeBtn.style.background = '#e81123';
        });
        closeBtn.addEventListener('mouseleave', () => {
          closeBtn.style.background = 'transparent';
        });
        closeBtn.addEventListener('click', () => {
          if (window.electronAPI && window.electronAPI.closeWindow) {
            window.electronAPI.closeWindow();
            console.log('[Simplicity] Close clicked');
          }
        });

        controls.appendChild(minimizeBtn);
        controls.appendChild(maximizeBtn);
        controls.appendChild(closeBtn);

        titleBar.appendChild(title);
        titleBar.appendChild(controls);

        document.body.appendChild(titleBar);
        
        // Add CSS - keep title bar as overlay without affecting game layout
        const style = document.createElement('style');
        style.textContent = \`
          #custom-title-bar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 9999999 !important;
            pointer-events: auto !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
        \`;
        document.head.appendChild(style);
        
        console.log('[Simplicity] ✓ Custom title bar created!');
      }
    })();
  `;
  document.head.appendChild(titleBarScript);
  
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
      adblock: ${JSON.stringify(adblock)},
      disableFullscreen: ${JSON.stringify(disableFullscreen)},
      selectedSkins: ${JSON.stringify(selectedSkins)}
    };
  `;
  document.head.appendChild(settingsScript);
  
  // Inject fullscreen disabler if enabled
  const fullscreenScript = document.createElement('script');
  fullscreenScript.textContent = `
    (function() {
      if (window.__SKIN_SETTINGS__ && window.__SKIN_SETTINGS__.disableFullscreen) {
        console.log('[Simplicity] Disabling forced fullscreen...');
        
        // Override fullscreen API
        const noOp = () => Promise.resolve();
        
        if (Element.prototype.requestFullscreen) {
          Element.prototype.requestFullscreen = noOp;
        }
        if (Element.prototype.webkitRequestFullscreen) {
          Element.prototype.webkitRequestFullscreen = noOp;
        }
        if (Element.prototype.mozRequestFullScreen) {
          Element.prototype.mozRequestFullScreen = noOp;
        }
        if (Element.prototype.msRequestFullscreen) {
          Element.prototype.msRequestFullscreen = noOp;
        }
        
        // Block fullscreen events
        document.addEventListener('fullscreenchange', (e) => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
        }, true);
        
        console.log('[Simplicity] ✓ Forced fullscreen disabled!');
      }
    })();
  `;
  document.head.appendChild(fullscreenScript);
  
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
