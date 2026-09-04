# Torn Attack Script

A lightweight Tampermonkey userscript for Torn City that places a single fixed attack button where "Start fight" normally sits, so you can spam clicks in one spot without moving the mouse.

## 🚀 Features

- **One-spot spam button** - the button stays where "Start fight"/"Join fight" is
- **One click = one action** - first click starts the fight, every following click attacks with your configured weapon (no automation, ToS-friendly)
- **Configurable target weapon** (Primary, Secondary, Melee, or Temporary)
- **Ctrl+Click slot selection** to change the target weapon on-the-fly
- **Persistent settings** - configuration saved in localStorage

## 📦 Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click to install: **[Install Torn Attack Script](https://github.com/xlemmingx/torn-attack-script/raw/main/torn-attack-script.user.js)**

## ⚡ Usage

### Basic Usage
- Start the fight with Torn's own "Start fight"/"Join fight" button
- Once the fight is running, an attack button appears in the same spot — keep clicking it to attack with your configured weapon
- The button hides itself again automatically when the fight is over

### Configuration
- **Ctrl+Click** on a weapon slot to set the main weapon (used for the rest of the fight)
- **Shift+Click** on a weapon slot to set an opener weapon, fired exactly once at the start of the fight (Shift+Click it again to disable)
- The button shows the weapon the next click will trigger (`⚔ 1× Tear Gas` while the opener is pending, then `⚔ M16 A2 Rifle`)
- Settings are automatically saved and persist across page reloads
- Visual feedback shows which slot is selected (red = main, blue = opener)

### Available Slots
- **Primary Weapon** (`weapon_main`) - Default
- **Secondary Weapon** (`weapon_second`)
- **Melee Weapon** (`weapon_melee`)
- **Temporary Weapon** (`weapon_temp`)

## 🐛 Debugging

Enable debug logs by setting:
```javascript
CONFIG.enableDebugLogs = true;
```

Or via browser console:
```javascript
CONFIG.enableDebugLogs = true;
```

## 🏆 Performance

- **No UI overhead** - No panels or visual elements
- **Cached DOM queries** - Minimal repeated lookups
- **Optimized event handling** - Capture phase, minimal timeouts
- **Zero logging** - No console output in production mode

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.