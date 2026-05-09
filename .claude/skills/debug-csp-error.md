---
name: debug-csp-error
description: Diagnoses and fixes Content Security Policy errors in the Chrome MV3 extension. Use when seeing "Refused to execute", "Refused to load", or "Content Security Policy" errors in DevTools or chrome://extensions/.
---

You are debugging a CSP (Content Security Policy) error in a Chrome MV3 extension. Follow this investigation process:

## Step 1 — Read the error message exactly

Ask the user for the EXACT error text. CSP errors always follow this pattern:
```
Refused to [execute script | load script | load image | connect to] '[source]'
because it violates the following Content Security Policy directive: "[directive]"
```

The key information:
- **What was blocked**: `execute script`, `load script`, `load image`, `connect`
- **What URL/source was blocked**: the quoted URL or `'inline'`
- **Which directive**: `script-src`, `img-src`, `connect-src`, etc.

## Step 2 — Identify the error location

Ask: "Where did this error appear?"
- **`chrome://extensions/` → Errors tab**: manifest/SW level CSP error
- **DevTools Console on popup.html or sidepanel.html**: extension page CSP error
- **DevTools Console on target site (cian.ru etc)**: host page CSP blocking content script

These have DIFFERENT fixes.

## Step 3 — Read the relevant files

Before suggesting any fix, read:
- `manifest.json` — current `content_security_policy` section
- The file where the error originates (popup.html, sidepanel.html, background.js, content.js)
- `agent_docs/csp-rules.md` — reference guide

## Step 4 — Apply the correct fix

### "Refused to execute inline script"
The file has `<script>code here</script>` or `onclick="..."` or `onload="..."`.

Fix: Extract all inline JS to a separate `.js` file.
```html
<!-- BEFORE (bad) -->
<script>document.getElementById('btn').onclick = () => alert('hi');</script>

<!-- AFTER (good) -->
<script src="popup.js"></script>
```
```javascript
// popup.js
document.getElementById('btn').addEventListener('click', () => alert('hi'));
```

### "Refused to load script from 'https://...'"
External CDN script is being loaded (Leaflet, jQuery, etc from CDN).

Fix: Download the library and serve it locally.
1. Download `leaflet.js` and `leaflet.css` from leafletjs.com
2. Place in `lib/` folder of the extension
3. Update HTML to use relative path: `<script src="../lib/leaflet.js"></script>`
4. Add to `web_accessible_resources` if accessed from content scripts

### "Refused to execute script from 'blob:...'"
Library (usually MapLibre GL JS old versions) creates workers via blob: URL.

Fix option A: Update MapLibre to v4+ (uses URL-based workers).
Fix option B: Add `worker-src blob:` to CSP — this IS allowed in MV3 extension_pages:
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; worker-src blob:; object-src 'self'"
}
```

### "Refused to connect to 'https://api.example.com'"
Fetch to external API is blocked.

Fix: Add the domain to `host_permissions` (NOT to CSP — host_permissions is the MV3 way):
```json
"host_permissions": [
  "https://nominatim.openstreetmap.org/*",
  "https://geocode-maps.yandex.ru/*"
]
```

Do NOT add `connect-src https://...` to CSP — it's redundant with host_permissions.

### "Refused to load image from 'https://tile.openstreetmap.org'"
Map tiles are being blocked.

Fix: Add tile domains to `img-src` in CSP:
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com"
}
```

### eval() or new Function() error
Some library uses eval internally.

Fix option A: Find a newer version of the library that doesn't use eval.
Fix option B: Move the library to a sandboxed page:
```json
// manifest.json
"sandbox": { "pages": ["sandbox.html"] }
```
The sandboxed page can use `'unsafe-eval'` and communicates via `postMessage`.

## Step 5 — Verify the fix

After making changes:
1. Go to `chrome://extensions/`
2. Click the reload button (↺) on the extension
3. Check that "Errors" badge is gone
4. Re-test the failing scenario
5. Open DevTools Console — confirm no more CSP errors

## Step 6 — Prevent regression

After fixing, check:
- Does the `manifest.json` CSP change affect other extension pages?
- Are there other similar patterns in the codebase that might trigger the same error?
- Does `agent_docs/csp-rules.md` need updating with the new pattern?
