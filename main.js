const { app, BrowserWindow, session } = require("electron");
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
  adblock: true,
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
let adblockEnabled = true;

try {
  const settingsData = fs.readFileSync(settingsPath, 'utf8');
  const settings = JSON.parse(settingsData);
  uncapFPS = settings.uncapFPS || false;
  adblockEnabled = settings.adblock !== undefined ? settings.adblock : true;
  console.log('[Simplicity] FPS Uncap:', uncapFPS);
  console.log('[Simplicity] Adblock:', adblockEnabled);
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

// Ad domains to block
const adDomains = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com',
  'googletagmanager.com',
  'googletagservices.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'tpc.googlesyndication.com',
  'facebook.com',
  'facebook.net',
  'fbcdn.net',
  'connect.facebook.net',
  'ad.doubleclick.net',
  'ads.pubmatic.com',
  'prebid.org',
  'serving-sys.com',
  'rubiconproject.com',
  'amazon-adsystem.com',
  'advertising.com',
  'criteo.com',
  'outbrain.com',
  'taboola.com',
  'media.net',
  'adnxs.com',
  'adsrvr.org',
  'quantserve.com',
  'scorecardresearch.com',
  'moatads.com',
  'adsafeprotected.com',
  'ads-twitter.com',
  'analytics.twitter.com',
  'static.ads-twitter.com',
  'openx.net',
  'contextweb.com',
  'advertising.yahoo.com',
  'bidswitch.net',
  'indexww.com',
  'smartadserver.com',
  'addthis.com',
  'sharethis.com'
];

app.whenReady().then(() => {
  // Setup adblock filter
  if (adblockEnabled) {
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
      const url = details.url;
      const shouldBlock = adDomains.some(domain => url.includes(domain));
      
      if (shouldBlock) {
        console.log('[Simplicity] Blocked:', url);
        callback({ cancel: true });
      } else {
        callback({ cancel: false });
      }
    });
    console.log('[Simplicity] Adblock enabled');
  } else {
    console.log('[Simplicity] Adblock disabled');
  }

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
