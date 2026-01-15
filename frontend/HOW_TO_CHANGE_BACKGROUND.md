# 🎨 How to Change the Background GIF

## Quick Guide

### Step 1: Find Your GIF
Find or create a cool floating GIF (squid, octopus, etc.) You can use:
- **GitHub Octodex**: https://octodex.github.com/
- **Giphy**: https://giphy.com/
- Your own custom GIF

### Step 2: Edit the Config File
Open: `frontend/src/config/assets.js`

Find this section:
```javascript
backgroundDecoration: {
  type: 'gif',
  url: 'YOUR_URL_HERE',  // ← CHANGE THIS LINE
  styles: { ... }
}
```

### Step 3: Update the URL

**Option A: Use an Online GIF**
```javascript
url: 'https://example.com/your-squid.gif',
```

**Option B: Use a Local File**
1. Put your GIF in `frontend/public/` (e.g., `squid.gif`)
2. Reference it:
```javascript
url: '/squid.gif',
```

### Step 4: Adjust Appearance (Optional)

In the `styles` section, you can tweak:

```javascript
styles: {
  opacity: '0.08',        // How visible (0.05-0.15 recommended)
  width: '700px',         // Size
  filter: 'hue-rotate(200deg)',  // Color tint (0-360)
  animation: 'float 20s ease-in-out infinite'  // Speed
}
```

## 🎨 Make it Look Cool

### For a Purple/Blue Squid:
```javascript
filter: 'hue-rotate(200deg) saturate(0.8) brightness(1.2)',
opacity: '0.08',
```

### For a Green Squid:
```javascript
filter: 'hue-rotate(90deg) saturate(1.2)',
opacity: '0.1',
```

### For Original Colors:
```javascript
filter: 'none',
opacity: '0.06',
```

## 💡 Pro Tips

✅ **DO:**
- Use transparent GIFs
- Keep file size under 2MB
- Use subtle, slow animations
- Test different opacity values

❌ **DON'T:**
- Use huge files (slow loading)
- Make it too bright (distracting)
- Use fast, jarring animations

## 🎯 Example Configuration

```javascript
backgroundDecoration: {
  type: 'gif',
  url: '/floating-squid.gif',  // Your GIF in public/ folder
  styles: {
    position: 'fixed',
    top: '5%',
    right: '-8%',
    width: '700px',
    height: '700px',
    opacity: '0.08',              // Nice subtle effect
    zIndex: 0,
    pointerEvents: 'none',
    animation: 'float 20s ease-in-out infinite',
    filter: 'hue-rotate(200deg) saturate(0.8) brightness(1.2)',  // Cool blue/purple
    mixBlendMode: 'screen'        // Elegant blending
  }
}
```

## 🚀 That's It!

Save the file and your new GIF will appear as a floating background decoration!

All changes in `assets.js` are automatically applied across the entire app - no need to edit anything else! ✨
