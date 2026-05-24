# Progressive Web App (PWA) Implementation

## Overview
TuronMUN is now a fully installable Progressive Web App (PWA). This means users can install the website on their devices (desktop and mobile) and use it like a native application.

## PWA Features Implemented

### 1. **Installability** 📲
- **Manifest File**: `public/manifest.json` configured with:
  - App name and short name
  - Icons (192x192, 512x512)
  - Standalone display mode (removes browser UI)
  - Theme and background colors
  - Shortcuts to Dashboard and Committee pages

### 2. **Offline Support** 🔌
- **Service Worker**: `public/sw.js` implemented with:
  - **Pre-caching**: Essential assets (HTML, icons) cached on install
  - **Runtime Caching**: API requests and images cached as they are used
  - **Network-First Strategy**: Tries to fetch fresh content, falls back to cache if offline
  - **Offline Page**: Serves cached content when no internet connection is available

### 3. **Native-Like Experience** 🎨
- **Theme Color**: Browser address bar matches brand color (`#D4AF37`)
- **Apple Touch Icon**: High-res icon for iOS home screen
- **Splash Screen**: Generated from manifest settings
- **Smooth Transitions**: CSS optimizations for app-like feel

### 4. **Push Notifications Support** 🔔
- Service worker includes event listeners for push notifications
- Ready for backend integration to send updates to users

## How to Test

### Desktop (Chrome/Edge)
1. Open the website
2. Look for the "Install" icon in the address bar (right side)
3. Click "Install TuronMUN"
4. The app will open in its own window, separate from the browser

### Mobile (Android - Chrome)
1. Open the website
2. A banner may appear: "Add TuronMUN to Home screen"
3. If not, tap the menu (3 dots) -> "Install App" or "Add to Home screen"

### Mobile (iOS - Safari)
1. Open the website
2. Tap the "Share" button (bottom center)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

## Technical Details

### Service Worker Strategy
- **Stale-While-Revalidate**: For static assets
- **Network-First**: For API data (ensures fresh data when online)
- **Cache-First**: For images and fonts

### Manifest Configuration
- **Display**: `standalone` (hides browser URL bar)
- **Orientation**: `portrait-primary` (locks to portrait on mobile)
- **Scope**: `/` (covers entire site)

## Future Enhancements
- **Background Sync**: Retry failed form submissions when back online
- **Push Notifications**: Integrate with backend to send real alerts
- **Periodic Sync**: Update content in background

---

**Date Implemented**: 2025-11-29
**Implemented By**: Antigravity AI Assistant
**Status**: ✅ Active
