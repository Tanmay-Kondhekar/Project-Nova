// Centralized configuration for all images, gifs, and visual assets
// Change values here and they will reflect across the entire project

export const ASSETS = {
  // Background decoration - floating GitHub Octocat animation
  // To change: replace 'url' with your own GIF/image path, or switch back to SVG
  backgroundDecoration: {
    type: 'gif', // 'svg', 'image', or 'gif'
    // GitHub Octocat GIF (you can replace this URL with your own)
    url: 'https://octodex.github.com/images/original.png', // Replace with your preferred GIF
    // For SVG alternative, use this:
    svg: `<svg viewBox="0 0 1024 1024" fill="currentColor"><path d="M512 0C229.12 0 0 229.12 0 512c0 226.432 146.688 418.176 350.144 486.048 25.6 4.736 34.944-11.104 34.944-24.64 0-12.192-0.448-44.512-0.672-87.392-142.464 30.944-172.544-68.64-172.544-68.64-23.296-59.136-56.832-74.88-56.832-74.88-46.464-31.776 3.52-31.136 3.52-31.136 51.392 3.616 78.464 52.768 78.464 52.768 45.664 78.24 119.84 55.616 149.024 42.528 4.608-33.088 17.856-55.616 32.48-68.384-113.728-12.928-233.28-56.864-233.28-253.056 0-55.872 19.968-101.568 52.768-137.408-5.28-12.96-22.848-64.992 5.024-135.52 0 0 42.976-13.76 140.768 52.48 40.832-11.36 84.64-17.024 128.16-17.248 43.488 0.224 87.328 5.888 128.256 17.248 97.728-66.24 140.64-52.48 140.64-52.48 27.936 70.528 10.368 122.56 5.088 135.52 32.864 35.84 52.704 81.536 52.704 137.408 0 196.672-119.712 240.032-233.76 252.672 18.368 15.808 34.72 47.04 34.72 94.816 0 68.448-0.608 123.648-0.608 140.48 0 13.632 9.216 29.6 35.136 24.576C877.44 930.048 1024 738.464 1024 512c0-282.88-229.12-512-512-512z"/></svg>`,
    styles: {
      position: 'fixed',
      top: '5%',
      right: '-8%',
      width: '700px',
      height: '700px',
      opacity: '0.08',
      zIndex: 0,
      pointerEvents: 'none',
      animation: 'float 20s ease-in-out infinite',
      filter: 'hue-rotate(200deg) saturate(0.8) brightness(1.2)',
      mixBlendMode: 'screen'
    }
  },

  // App logo/branding
  branding: {
    appName: 'Project Nova',
    tagline: 'Intelligent Code Analysis & Visualization',
    icon: {
      type: 'lucide', // 'lucide', 'svg', 'image'
      name: 'Sparkles', // Lucide icon name
      size: 32,
      color: '#a78bfa'
    }
  },

  // Elegant color scheme
  colors: {
    primary: '#a78bfa',      // Soft purple
    secondary: '#60a5fa',    // Sky blue
    accent: '#34d399',       // Emerald
    background: '#0f172a',   // Deep navy
    cardBackground: 'rgba(30, 41, 59, 0.6)',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
};

// Helper function to get background decoration props
// Use this in your component like: <div {...getBackgroundDecorationProps()} />
export const getBackgroundDecorationProps = () => {
  const { type, svg, url, styles } = ASSETS.backgroundDecoration;
  
  if (type === 'svg') {
    return {
      style: styles,
      dangerouslySetInnerHTML: { __html: svg }
    };
  } else if (type === 'image' || type === 'gif') {
    return {
      as: 'img',
      src: url,
      alt: 'background decoration',
      style: styles
    };
  }
  return null;
};

export default ASSETS;
