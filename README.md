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
- A button overlay appears over the "Start fight"/"Join fight" button
- Click it to start the fight, then keep clicking the same spot to attack with your configured weapon

### Configuration
- **Ctrl+Click** on any weapon slot to set it as the new target
- Settings are automatically saved and persist across page reloads
- Visual feedback shows which slot is selected

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