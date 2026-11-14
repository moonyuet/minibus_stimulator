# Mobile deployment

This folder contains the mobile/PWA deployment assets for **紅VAN飛車 · Red Van Daredevil**.

The game is a static web app. It already supports touch controls, landscape play, safe-area padding and a fullscreen PWA install on both Android and iPhone.

## What is in this folder

| File | Purpose |
| --- | --- |
| `manifest.webmanifest` | App name, icons, display mode, orientation, theme and start URL |
| `sw.js` | Service-worker cache logic. Imported by the root-scoped `/sw.js` shim |
| `icons/icon-192.png` | Android/PWA icon |
| `icons/icon-512.png` | Large PWA icon |
| `icons/maskable-512.png` | Android adaptive launcher icon |
| `icons/apple-touch-icon-180.png` | iPhone/iPad home-screen icon |

The root `index.html` already loads the manifest, Apple touch icon and service worker registration.

## 1. Put it on HTTPS

PWA installation and service workers require **HTTPS** (localhost is the only HTTP exception). The simplest options:

### GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main** and folder **/ (root)**.
5. Save and wait for the site URL. It will be:

   `https://moonyuet.github.io/minibus_stimulator/`

### Other static hosts

- Netlify
- Cloudflare Pages
- Vercel
- Any static HTTPS host

Upload/publish the repository root, not just the `mobile/` folder. The game needs `index.html`, `styles/`, `js/`, `sw.js` and `mobile/`.

## 2. Install on Android

1. Open the HTTPS URL in **Chrome**.
2. Wait for the page to load, then tap the three-dot menu.
3. Choose **Install app** or **Add to Home screen**.
4. Launch from the home screen.

Android supports the full PWA install prompt, landscape display and offline caching after the first visit.

## 3. Install on iPhone / iPad

1. Open the HTTPS URL in **Safari** — not Chrome.
2. Tap the **Share** button.
3. Choose **Add to Home Screen**.
4. Name it **紅VAN飛車** and tap **Add**.
5. Launch from the home screen.

iOS uses Safari's standalone web-app mode. Audio starts after the **開車 / START ENGINE** tap because iOS requires a user gesture.

## 4. Test on a phone on your Wi-Fi

Start the local server on your computer:

```powershell
.\serve.ps1
```

Find your computer's LAN IP:

```powershell
ipconfig
```

On the phone, open:

```text
http://YOUR-COMPUTER-IP:8080
```

This is useful for testing touch controls. **PWA installation and offline caching will not work over plain LAN HTTP** — use an HTTPS deployment for that.

## Mobile behaviour

- Landscape layout with dedicated **GAS / BRAKE / N2O** touch buttons and on-screen steering.
- `viewport-fit=cover` plus safe-area padding for notches and rounded corners.
- Retina/DPR-aware canvas.
- Audio unlocks on the first tap.
- After the first HTTPS load, the service worker caches the game for offline play.
- The app uses `display: fullscreen` (with `standalone` fallback) and `orientation: landscape`.

## Updating the PWA cache

The cache name lives in [`sw.js`](sw.js):

```js
const CACHE = "redvan-v0.2.0";
```

Bump it whenever the game files change and you publish a new version, for example `redvan-v0.2.1`. Otherwise an installed PWA may keep serving the previous cached build.

## Optional native store builds

For Play Store / App Store distribution, the same web build can be wrapped with Capacitor or Cordova. That adds Android Studio/Xcode toolchains and is intentionally not included in this static repository. The PWA path above is the zero-install route for both Android and iPhone.

## Release archive

The `.github/workflows/release.yml` release ZIP includes `mobile/` and the root `sw.js` shim, so users who download a release have the complete PWA deployment.
