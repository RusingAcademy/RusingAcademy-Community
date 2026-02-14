# PWA Release Notes — RusingAcademy Community Hub

**Date:** 2026-02-14
**Branch:** `feat/pwa` (merged into `main`)
**Repository:** [RusingAcademy/RusingAcademy-Community](https://github.com/RusingAcademy/RusingAcademy-Community)

---

## Overview

The RusingAcademy Community Hub is now a fully installable Progressive Web App (PWA). Users can install it on desktop (Chrome, Edge) and mobile (Android Chrome, iOS Safari) for a native-like experience with offline resilience.

---

## Changes

### 1. Manifest (`client/public/manifest.json`)

| Field | Value |
|---|---|
| `name` | RusingAcademy Community |
| `short_name` | RA Community |
| `start_url` | `/` |
| `scope` | `/` |
| `display` | `standalone` |
| `orientation` | `portrait-primary` |
| `theme_color` | `#1B2A4A` (ecosystem navy) |
| `background_color` | `#0F1729` (dark background) |

### 2. Icons

| Size | Type | Purpose |
|---|---|---|
| 192x192 | PNG | Standard app icon |
| 512x512 | PNG | Standard + splash screen |
| 512x512 | PNG | Maskable (adaptive icon) |
| 180x180 | PNG | Apple Touch Icon |
| 32x32 | PNG | Favicon |
| 16x16 | PNG | Favicon |

All icons are hosted on S3 CDN for production safety. Source images derived from the RusingAcademy ecosystem branding (gold RA logo on navy background).

### 3. PWA Meta Tags (`client/index.html`)

```html
<link rel="manifest" href="/manifest.json" crossorigin="use-credentials">
<meta name="theme-color" content="#1B2A4A">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="RA Community">
<meta name="mobile-web-app-capable" content="yes">
<link rel="apple-touch-icon" href="[CDN URL]/apple-touch-icon.png">
```

### 4. Service Worker (`client/public/sw.js`)

**Caching Strategy:**

| Route Pattern | Strategy | Rationale |
|---|---|---|
| `/api/*` | Network-first | Never serve stale auth/data |
| `/api/oauth/*` | Network-only | Auth must always be live |
| `/ws` | Network-only | WebSocket connections |
| `*.js`, `*.css`, `*.woff2` | Cache-first | Static assets rarely change |
| Images | Cache-first | Performance optimization |
| HTML pages | Network-first | Always fresh content |
| Chrome extensions | Network-only | Excluded from caching |

**Features:**
- Versioned cache (`ra-community-v1`) with automatic cleanup on SW activation
- Offline fallback page for navigation requests
- `skipWaiting()` + `clients.claim()` for immediate activation

### 5. Install CTA (`PWAInstallBanner.tsx`)

**Chrome/Android:**
- Captures `beforeinstallprompt` event
- Shows a branded banner with "Install App" button
- Triggers native Chrome install dialog on click
- Auto-hides after successful installation

**iOS Safari:**
- Detects iOS via User Agent
- Shows step-by-step instructions: "Tap Share → Add to Home Screen"
- Includes visual share icon for clarity

**Dismissal:**
- Close button persists dismissal to `localStorage`
- 7-day cooldown before showing again
- Does not show if already in standalone mode

---

## Testing Results

| Metric | Result |
|---|---|
| Vitest tests | **234 passing** (12 PWA-specific) |
| TypeScript errors | **0** |
| Production build | **Verified** — manifest, sw.js, icons in dist/ |
| SW caching | **Verified** — API network-first, assets cache-first |

### PWA-Specific Tests (`server/pwa.test.ts`)
- Manifest structure validation (name, icons, display, colors)
- Service Worker file existence and content verification
- Cache strategy patterns (API exclusion, static asset caching)
- Install prompt hook logic
- iOS detection and A2HS instructions

---

## QA Steps

1. **Chrome Desktop Install:**
   - Navigate to the app URL
   - Look for install icon in Chrome address bar (or the in-app banner)
   - Click "Install" → verify standalone window opens
   - Verify app appears in OS app launcher

2. **Android Chrome Install:**
   - Open app in Chrome
   - Tap the install banner or browser menu → "Add to Home Screen"
   - Verify app icon on home screen
   - Open → verify standalone (no browser chrome)

3. **iOS Safari A2HS:**
   - Open app in Safari
   - Verify A2HS banner appears with instructions
   - Tap Share → "Add to Home Screen"
   - Verify app icon and standalone launch

4. **Offline Resilience:**
   - Install the app
   - Load a few pages (to populate cache)
   - Go offline (airplane mode or DevTools)
   - Verify cached pages still load
   - Verify API calls show appropriate error states

5. **DevTools Verification:**
   - Application → Manifest → all fields green
   - Application → Service Workers → status "activated and running"
   - Application → Cache Storage → `ra-community-v1` populated

---

## Branding Compatibility

All colors and tokens are derived from the [RusingAcademy-Ecosystem-Main-Repo](https://github.com/RusingAcademy/RusingAcademy-Ecosystem-Main-Repo):

| Token | Value | Source |
|---|---|---|
| Navy (theme) | `#1B2A4A` | Ecosystem `--primary` |
| Dark BG | `#0F1729` | Ecosystem `--background` |
| Gold accent | `#D4A853` | Ecosystem `--accent` |
| Font | Plus Jakarta Sans | Ecosystem typography |

The implementation is **100% compatible** with the central ecosystem repository for future merge/synchronization. No divergent patterns or conflicting integrations.

---

## Files Changed

```
client/index.html                          — PWA meta tags added
client/public/manifest.json                — NEW: Web App Manifest
client/public/sw.js                        — NEW: Service Worker
client/src/hooks/usePWAInstall.ts          — NEW: Install prompt hook
client/src/components/PWAInstallBanner.tsx  — NEW: Install CTA component
client/src/App.tsx                         — PWAInstallBanner wired in
client/src/main.tsx                        — SW registration added
server/pwa.test.ts                         — NEW: 12 PWA vitest tests
```
