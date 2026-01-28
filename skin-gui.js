// Available skins
const AVAILABLE_SKINS = {
  "default": "Default",
  "bacon": "Bacon",
  "linen": "Fresh Linen",
  "greencamo": "Green Camo",
  "redcamo": "Red Camo",
  "tiger": "Tigris",
  "carbon": "Carbon Fiber",
  "cherry": "Blossom",
  "prism": "Gem Stone",
  "splatter": "Marble",
  "swirl": "Swirl",
  "vapor": "Vapor Wave",
  "astro": "Astro",
  "payday": "Pay Day",
  "safari": "Safari",
  "snowcamo": "Snow Camo",
  "rustic": "Royal",
  "hydro": "Hydrodip",
  "ice": "Frostbite",
  "silly": "Silly",
  "alez": "Alez",
  "horizon": "Horizon",
  "quackster": "QuaK",
  "matrix": "Matrix",
  "neon": "Neon",
  "winter": "Winter '22",
  "hlwn": "HLWN '23",
  "summer": "Summer '24",
  "birthday": "1st Birthday"
};

const WEAPONS = [
  { key: 'ar', label: 'Assault Rifle' },
  { key: 'smg', label: 'SMG' },
  { key: 'awp', label: 'AWP' },
  { key: 'shotgun', label: 'Shotgun' }
];

class SkinSwapperGUI {
  constructor() {
    // Since we're in browser context, we get settings from window
    this.settings = window.__SKIN_SETTINGS__ || {
      toggleKey: 'o',
      uncapFPS: false,
      selectedSkins: {
        ar: 'ice',
        smg: 'ice',
        awp: 'matrix',
        shotgun: 'neon'
      }
    };
    this.visible = false;
    this.gui = null;
    this.init();
  }

  saveSettings() {
    // Send settings to main process via IPC
    if (window.electronAPI && window.electronAPI.saveSettings) {
      window.electronAPI.saveSettings(this.settings);
      console.log('[Skin GUI] Settings saved via IPC');
    } else {
      console.warn('[Skin GUI] No IPC bridge available, cannot save settings');
    }
  }

  init() {
    this.createGUI();
    this.setupKeyListener();
    console.log('[Skin GUI] Initialized');
  }

  createGUI() {
    // Main container
    this.gui = document.createElement('div');
    this.gui.id = 'skin-swapper-gui';
    this.gui.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(20, 20, 20, 0.95);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #ffffff;
      min-width: 350px;
      display: none;
      backdrop-filter: blur(10px);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>🎨 Skin Swapper</span>
      <span style="font-size: 12px; opacity: 0.6;">Toggle: ${this.settings.toggleKey.toUpperCase()}</span>
    `;

    // Notice
    const notice = document.createElement('div');
    notice.style.cssText = `
      background: rgba(255, 193, 7, 0.15);
      border: 1px solid rgba(255, 193, 7, 0.3);
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 15px;
      font-size: 12px;
      color: #ffc107;
    `;
    notice.textContent = '⚠️ Reload client (Ctrl+R) to apply changes';

    // Weapon selectors container
    const selectorsContainer = document.createElement('div');
    selectorsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 15px;
    `;

    // Create selectors for each weapon
    WEAPONS.forEach(weapon => {
      const row = this.createWeaponSelector(weapon);
      selectorsContainer.appendChild(row);
    });

    // Toggle key setting
    const keySettingRow = document.createElement('div');
    keySettingRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      margin-top: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 15px;
    `;

    const keyLabel = document.createElement('label');
    keyLabel.textContent = 'Toggle Key:';
    keyLabel.style.cssText = 'font-size: 14px; opacity: 0.9;';

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.value = this.settings.toggleKey;
    keyInput.maxLength = 1;
    keyInput.style.cssText = `
      padding: 5px 10px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: #ffffff;
      font-size: 13px;
      width: 100px;
      text-align: center;
      text-transform: uppercase;
    `;
    keyInput.addEventListener('change', (e) => {
      const newKey = e.target.value.trim().toLowerCase();
      if (newKey.length === 1) {
        this.settings.toggleKey = newKey;
        this.saveSettings();
        header.querySelector('span:last-child').textContent = `Toggle: ${newKey.toUpperCase()}`;
      } else {
        e.target.value = this.settings.toggleKey;
      }
    });

    keySettingRow.appendChild(keyLabel);
    keySettingRow.appendChild(keyInput);

    // FPS Uncap setting
    const fpsSettingRow = document.createElement('div');
    fpsSettingRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      margin-top: 10px;
    `;

    const fpsLabel = document.createElement('label');
    fpsLabel.textContent = 'Uncap FPS:';
    fpsLabel.style.cssText = 'font-size: 14px; opacity: 0.9;';

    const fpsToggle = document.createElement('input');
    fpsToggle.type = 'checkbox';
    fpsToggle.checked = this.settings.uncapFPS || false;
    fpsToggle.style.cssText = `
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: #4CAF50;
    `;
    fpsToggle.addEventListener('change', (e) => {
      this.settings.uncapFPS = e.target.checked;
      this.saveSettings();
      console.log('[Skin GUI] FPS Uncap set to:', e.target.checked);
      
      // Show notification that restart is required
      const restartNotice = document.createElement('div');
      restartNotice.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 87, 34, 0.95);
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      `;
      restartNotice.textContent = '⚠️ Restart the app to apply FPS changes';
      document.body.appendChild(restartNotice);
      
      setTimeout(() => {
        restartNotice.style.transition = 'opacity 0.3s';
        restartNotice.style.opacity = '0';
        setTimeout(() => restartNotice.remove(), 300);
      }, 3000);
    });

    fpsSettingRow.appendChild(fpsLabel);
    fpsSettingRow.appendChild(fpsToggle);

    // Assemble GUI
    this.gui.appendChild(header);
    this.gui.appendChild(notice);
    this.gui.appendChild(selectorsContainer);
    this.gui.appendChild(keySettingRow);
    this.gui.appendChild(fpsSettingRow);

    document.body.appendChild(this.gui);
  }

  createWeaponSelector(weapon) {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      transition: background 0.2s;
    `;
    row.addEventListener('mouseenter', () => {
      row.style.background = 'rgba(255, 255, 255, 0.08)';
    });
    row.addEventListener('mouseleave', () => {
      row.style.background = 'rgba(255, 255, 255, 0.05)';
    });

    const label = document.createElement('label');
    label.textContent = weapon.label;
    label.style.cssText = 'font-size: 14px; font-weight: 500;';

    const select = document.createElement('select');
    select.style.cssText = `
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: #ffffff;
      font-size: 13px;
      cursor: pointer;
      min-width: 150px;
      transition: all 0.2s;
    `;
    select.addEventListener('mouseenter', () => {
      select.style.borderColor = 'rgba(255, 255, 255, 0.4)';
    });
    select.addEventListener('mouseleave', () => {
      select.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });

    // Add options
    Object.entries(AVAILABLE_SKINS).forEach(([value, displayName]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = displayName;
      if (this.settings.selectedSkins[weapon.key] === value) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      this.settings.selectedSkins[weapon.key] = e.target.value;
      this.saveSettings();
      console.log(`[Skin GUI] Selected ${weapon.label}: ${e.target.value}`);
    });

    row.appendChild(label);
    row.appendChild(select);
    return row;
  }

  setupKeyListener() {
    document.addEventListener('keydown', (e) => {
      // Compare lowercase key
      if (e.key.toLowerCase() === this.settings.toggleKey.toLowerCase()) {
        this.toggle();
      }
    });
    console.log(`[Skin GUI] Key listener set up for: ${this.settings.toggleKey}`);
  }

  toggle() {
    this.visible = !this.visible;
    this.gui.style.display = this.visible ? 'block' : 'none';
    console.log(`[Skin GUI] Toggled: ${this.visible}`);
  }

  show() {
    this.visible = true;
    this.gui.style.display = 'block';
  }

  hide() {
    this.visible = false;
    this.gui.style.display = 'none';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Skin GUI] DOM ready, initializing...');
    window.skinSwapperGUI = new SkinSwapperGUI();
  });
} else {
  console.log('[Skin GUI] DOM already loaded, initializing...');
  window.skinSwapperGUI = new SkinSwapperGUI();
}
