# System Architecture Diagram

## Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 1. Launches app
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                          main.js                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  • Creates BrowserWindow                                    │ │
│  │  • Sets fullscreen: true, frame: false                      │ │
│  │  • Applies performance optimizations:                       │ │
│  │    - disable-background-timer-throttling                    │ │
│  │    - disable-renderer-backgrounding                         │ │
│  │    - disable-frame-rate-limit                              │ │
│  │  • Loads preload.js                                         │ │
│  │  • Navigates to https://deadshot.io                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │ 2. Window created with preload
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         preload.js                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 1: Load Settings                                      │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  • Read settings.json from __dirname               │   │ │
│  │  │  • Extract selectedSkins object                    │   │ │
│  │  │  • Log loaded skins for debugging                  │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                              │ │
│  │  Step 2: Inject Skin Swapper                                │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  • Create <script> element                         │   │ │
│  │  │  • Override JSON.parse in page context             │   │ │
│  │  │  • Detect player data loading                      │   │ │
│  │  │  • Inject selected skins into:                     │   │ │
│  │  │    - skins[] array (inventory)                     │   │ │
│  │  │    - equippedSkins[] array (equipped)              │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                              │ │
│  │  Step 3: Inject GUI Script                                  │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  • Create <script> element                         │   │ │
│  │  │  • Load skin-gui.js                                │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────────┘
                         │ 3. Scripts injected
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PAGE CONTEXT (deadshot.io)                   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           OVERRIDDEN JSON.parse                           │  │
│  │                                                            │  │
│  │  Game calls JSON.parse(playerData)                        │  │
│  │           ↓                                               │  │
│  │  Our override intercepts it                               │  │
│  │           ↓                                               │  │
│  │  Checks if data has:                                      │  │
│  │    ✓ skins[] array                                        │  │
│  │    ✓ equippedSkins[] array                                │  │
│  │    ✓ username string                                      │  │
│  │           ↓                                               │  │
│  │  YES? → Inject selected skins                             │  │
│  │           ↓                                               │  │
│  │  Return modified data to game                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  SKIN GUI (skin-gui.js)                   │  │
│  │                                                            │  │
│  │  User presses toggle key (Insert)                         │  │
│  │           ↓                                               │  │
│  │  GUI appears with:                                        │  │
│  │    • AR dropdown                                          │  │
│  │    • SMG dropdown                                         │  │
│  │    • AWP dropdown                                         │  │
│  │    • Shotgun dropdown                                     │  │
│  │    • Toggle key input                                     │  │
│  │           ↓                                               │  │
│  │  User selects skins                                       │  │
│  │           ↓                                               │  │
│  │  Auto-saves to settings.json                              │  │
│  │           ↓                                               │  │
│  │  User reloads (Ctrl+R)                                    │  │
│  │           ↓                                               │  │
│  │  Preload re-reads settings                                │  │
│  │           ↓                                               │  │
│  │  New skins applied! ✅                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│ settings.json│
│              │
│ {            │
│   "toggleKey"│
│   "selected  │
│    Skins": { │
│     "ar":    │
│     "ice"    │
│   }          │
│ }            │
└──────┬───────┘
       │ Reads
       ▼
┌──────────────┐      Injects       ┌─────────────┐
│  preload.js  │ ──────────────────▶│  Page       │
│              │                     │  Context    │
│ • Loads skins│                     │             │
│ • Creates    │                     │ • JSON.parse│
│   scripts    │                     │   override  │
└──────┬───────┘                     │ • Skin GUI  │
       │                              └─────┬───────┘
       │ Injects GUI                        │
       │                                    │ User selects
       ▼                                    │ new skins
┌──────────────┐                            │
│  skin-gui.js │◀───────────────────────────┘
│              │
│ • Shows GUI  │
│ • Handles    │
│   selection  │
│ • Saves to   │──────┐
│   settings   │      │
└──────────────┘      │
                      │ Writes
                      ▼
               ┌──────────────┐
               │ settings.json│
               │ (updated)    │
               └──────────────┘
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────┐
│                    Electron App                          │
│                                                           │
│  ┌─────────────┐       ┌──────────────┐                 │
│  │   main.js   │───▶   │ BrowserWindow│                 │
│  │             │       │              │                 │
│  │ • Creates   │       │ • Fullscreen │                 │
│  │   window    │       │ • No frame   │                 │
│  │ • Sets      │       │ • Optimized  │                 │
│  │   preload   │       │              │                 │
│  └─────────────┘       └───────┬──────┘                 │
│                                 │                        │
│                                 │ Loads with preload     │
│                                 ▼                        │
│                        ┌────────────────┐               │
│                        │   preload.js   │               │
│                        │                │               │
│                        │ • Node.js APIs │               │
│                        │ • fs, path     │               │
│                        │ • Isolated     │               │
│                        └───────┬────────┘               │
│                                │                        │
│                                │ Injects                │
│                                ▼                        │
│                        ┌────────────────┐               │
│                        │  Page Scripts  │               │
│                        │                │               │
│                        │ • Skin swapper │               │
│                        │ • GUI          │               │
│                        └────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

## File Dependencies

```
package.json
    │
    ├─▶ main.js (entry point)
    │       │
    │       └─▶ BrowserWindow
    │               │
    │               └─▶ preload: preload.js
    │                       │
    │                       ├─▶ reads: settings.json
    │                       │
    │                       └─▶ injects: skin-gui.js
    │
    └─▶ build: { files: [...] }
            │
            └─▶ Packages all into app.asar:
                    • main.js
                    • preload.js
                    • settings.json
                    • skin-gui.js
```

## Build Process

```
Source Files                    Electron Builder
────────────                    ─────────────────
main.js          ┐
preload.js       │
settings.json    ├─────▶    electron-builder
skin-gui.js      │                  │
package.json     ┘                  │
                                    ▼
                            ┌──────────────┐
                            │   app.asar   │
                            │              │
                            │ Contains:    │
                            │ • main.js    │
                            │ • preload.js │
                            │ • settings   │
                            │ • skin-gui   │
                            └──────────────┘
                                    │
                                    ▼
                         dist/win-unpacked/
                               │
                               └─▶ Deadshot Client.exe
```

## Runtime Sequence

```
Time    Event                          Component
────    ─────                          ─────────
T0      User launches exe              main.js
T1      Create BrowserWindow           main.js
T2      Load preload script            Electron
T3      Read settings.json             preload.js
T4      Navigate to deadshot.io        main.js
T5      DOMContentLoaded event         preload.js
T6      Inject skin swapper script     preload.js
T7      Inject GUI script              preload.js
T8      Override JSON.parse            Page context
T9      Initialize GUI class           skin-gui.js
T10     Wait for user input            skin-gui.js
T11     User presses Insert            skin-gui.js
T12     Show GUI                       skin-gui.js
T13     User selects skins             skin-gui.js
T14     Save to settings.json          skin-gui.js
T15     User reloads (Ctrl+R)          Browser
T16     Cycle repeats from T2          ---
```

## Security Model

```
┌────────────────────────────────────────────────┐
│              Electron Security                  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │         Main Process (main.js)          │  │
│  │  • Full Node.js access                  │  │
│  │  • File system                          │  │
│  │  • Can create windows                   │  │
│  └─────────────────────────────────────────┘  │
│                    ▲                            │
│                    │                            │
│  ┌─────────────────────────────────────────┐  │
│  │      Preload Script (preload.js)        │  │
│  │  • Limited Node.js access               │  │
│  │  • Can read files                       │  │
│  │  • Context isolated                     │  │
│  │  • Bridge between main & renderer       │  │
│  └─────────────────────────────────────────┘  │
│                    ▲                            │
│                    │ Injected scripts           │
│  ┌─────────────────────────────────────────┐  │
│  │      Renderer Process (Page)            │  │
│  │  • No Node.js access                    │  │
│  │  • Regular web page                     │  │
│  │  • Can run injected scripts             │  │
│  └─────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

---

**Legend:**
- `───▶` : Direct dependency/flow
- `┌───┐` : Component box
- `• ` : Feature/property
- `▼` : Next step
