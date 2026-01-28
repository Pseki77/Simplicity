const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

// Determine if running from packaged app or development
const isDev = !app.isPackaged;

// Use userData directory for settings (writable location)
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');

console.log('[Simplicity] Settings path:', settingsPath);
console.log('[Simplicity] Is Dev:', isDev);

// Create default settings if not exists
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

// Ensure settings file exists
if (!fs.existsSync(settingsPath)) {
  console.log('[Simplicity] Creating default settings...');
  fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf8');
}

// Load settings to check FPS uncap
let uncapFPS = false;

try {
  const settingsData = fs.readFileSync(settingsPath, 'utf8');
  const settings = JSON.parse(settingsData);
  uncapFPS = settings.uncapFPS || false;
  console.log('[Simplicity] FPS Uncap:', uncapFPS);
} catch (err) {
  console.error('[Simplicity] Error reading settings for FPS:', err);
}

app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
app.commandLine.appendSwitch("force_high_performance_gpu");

// Conditionally disable frame rate limit based on settings
if (uncapFPS) {
  app.commandLine.appendSwitch("disable-frame-rate-limit");
  app.commandLine.appendSwitch("disable-gpu-vsync");
  console.log('[Simplicity] FPS uncapped - vsync disabled');
} else {
  console.log('[Simplicity] FPS capped - vsync enabled');
}

let win;

app.whenReady().then(() => {
  win = new BrowserWindow({
    fullscreen: true,
    frame: false,
    backgroundColor: "#000000",
    webPreferences: {
      // In production, preload.js is inside app.asar at __dirname
      // In development, it's in the root folder
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,  // Required for preload to use fs
      backgroundThrottling: false,
      additionalArguments: [`--settings-path=${settingsPath}`]
    }
  });

  win.loadURL("https://deadshot.io");
  
  // Open DevTools in development (disabled by default)
  // Uncomment the lines below if you need DevTools for debugging
  // if (isDev) {
  //   win.webContents.openDevTools();
  // }
});
