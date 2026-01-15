# Asset Configuration Guide

This directory contains centralized configuration for all visual assets used across the Project-Nova frontend.

## 📁 Files

- **`assets.js`** - Main configuration file for images, gifs, branding, and theme colors

## 🎨 How to Change Images/GIFs

### Background Decoration

The background decoration (currently a GitHub icon SVG) can be changed by editing `assets.js`:

#### Option 1: Use a different SVG
```javascript
backgroundDecoration: {
  type: 'svg',
  svg: `<svg viewBox="0 0 100 100">...your SVG code here...</svg>`,
  styles: { /* positioning styles */ }
}
```

#### Option 2: Use an image or GIF
```javascript
backgroundDecoration: {
  type: 'gif', // or 'image'
  url: '/path/to/your/awesome.gif',
  styles: {
    position: 'fixed',
    top: '10%',
    right: '-5%',
    width: '600px',
    height: '600px',
    opacity: '0.05',
    zIndex: 0,
    pointerEvents: 'none',
    animation: 'float 15s ease-in-out infinite'
  }
}
```

### App Branding

Change the app name, tagline, and icon:

```javascript
branding: {
  appName: 'Your App Name',
  tagline: 'Your awesome tagline',
  icon: {
    type: 'lucide',
    name: 'Zap', // Any Lucide icon name
    size: 32,
    color: '#ff6b6b'
  }
}
```

### Color Theme

Customize the color scheme:

```javascript
colors: {
  primary: '#60a5fa',    // Main accent color
  secondary: '#8b5cf6',  // Secondary accent
  accent: '#10b981',     // Additional accent
  background: '#0b0f1a', // Main background
  cardBackground: 'rgba(30, 41, 59, 0.4)', // Card backgrounds
  text: '#e2e8f0',       // Primary text
  textMuted: '#94a3b8'   // Muted text
}
```

## 📝 Usage in Components

The asset configuration is automatically imported in `App.jsx`:

```javascript
import { ASSETS, renderBackgroundDecoration } from './config/assets';

// Use branding
<h1>{ASSETS.branding.appName}</h1>

// Render background
{renderBackgroundDecoration()}

// Access colors
<div style={{ color: ASSETS.colors.primary }}>...</div>
```

## 🚀 Benefits

1. **Single Source of Truth** - Change assets in one place, reflects everywhere
2. **Easy Maintenance** - No need to hunt through multiple files
3. **Consistent Branding** - All components use the same configuration
4. **Quick Theme Changes** - Update colors across the app instantly

## 💡 Tips

- Keep image/gif files in the `frontend/public` directory
- Use relative paths like `/images/background.gif`
- Optimize images before adding them (compress, resize)
- Test different opacity values for background decorations
- SVGs are resolution-independent and generally preferred for icons

## 🔄 Future Extensions

You can extend this configuration to include:
- Multiple theme presets (light/dark mode)
- Logo variants (full, compact, monochrome)
- Loading animations
- Error state graphics
- Success/celebration animations
