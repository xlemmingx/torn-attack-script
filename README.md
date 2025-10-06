# Torn Attack Script

A high-performance Tampermonkey userscript for Torn City that enhances the attack interface by moving attack buttons to weapon slots for faster clicking.

## 🚀 Features

- **Ultra-fast button placement** on weapon slots
- **Configurable target slot** (Primary, Secondary, Melee, or Temporary weapon)
- **Ctrl+Click slot selection** to change target on-the-fly
- **Performance optimized** - zero UI overhead, cached DOM queries
- **Persistent settings** - configuration saved in localStorage

## 📦 Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click to install: **[Install Torn Attack Script](https://github.com/xlemmingx/torn-attack-script/raw/main/torn-attack-script.user.js)**

## ⚡ Usage

### Basic Usage
- The script automatically places attack buttons on your configured weapon slot
- Click the weapon slot to trigger the attack button

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