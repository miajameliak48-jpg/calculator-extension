---
name: scaffold-mv3-component
description: Creates a new Chrome MV3 extension component (service worker message handler, content script parser, side panel page, or offscreen document). Use when adding a new file to the extension or wiring a new message type.
---

You are scaffolding a new component for a Chrome Manifest V3 extension. Follow these steps exactly:

## Step 1 — Identify the component type

Ask (or infer from context) which component to create:
- **service-worker handler** — new message type handler in background.js
- **content-script parser** — new site scraper (content.js + injected.js pattern)
- **side-panel page** — new sidepanel.html + sidepanel.js with Leaflet map
- **offscreen document** — offscreen.html + offscreen.js for DOM tasks
- **popup page** — popup.html + popup.js for settings UI

## Step 2 — Read existing files first

Before writing ANY code, read these files in full:
- `manifest.json` — to understand current permissions and entries
- The specific file you will modify (background.js, content.js, etc.)
- `agent_docs/messages.md` — to use correct message type names and payload schemas
- `agent_docs/csp-rules.md` — to ensure no CSP violations

## Step 3 — Apply the correct pattern

### Service Worker message handler pattern:
```javascript
// In background.js — at top level, synchronous listener
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'NEW_MESSAGE_TYPE') {
    handleNewMessage(msg.payload, sender).then(sendResponse);
    return true; // async response
  }
});

async function handleNewMessage(payload, sender) {
  // implementation
  return { ok: true };
}
```

### Content Script parser pattern:
```javascript
// Runs in Isolated world — DOM access, no window.google, no chrome.scripting
(function() {
  if (window.__hm_content_loaded) return;
  window.__hm_content_loaded = true;

  // Inject MAIN world script for page JS access
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('injected.js');
  (document.head || document.documentElement).appendChild(s);

  // Listen for data from MAIN world
  window.addEventListener('message', (e) => {
    if (e.data?.__smf_source !== 'injected') return;
    chrome.runtime.sendMessage({ type: e.data.type, payload: e.data }).catch(() => {});
  });
})();
```

### Side Panel pattern:
- HTML must NOT have inline scripts (`<script>` tags with code — only `<script src="...">`)
- Load Leaflet from `../lib/leaflet.js` (local file, not CDN)
- Initialize map only after `DOMContentLoaded`
- Listen for messages via `chrome.runtime.onMessage`

### Offscreen document pattern:
- Declare reason in manifest: `"offscreen"` permission
- Use `ensureOffscreen()` idiom before sending messages to it
- Only one offscreen document per extension — reuse it

## Step 4 — Update manifest.json

For each new component, update `manifest.json`:
- New permission → `"permissions": [...]`
- New host → `"host_permissions": [...]`
- New content script → `"content_scripts": [...]`
- New web-accessible file → `"web_accessible_resources": [...]`

## Step 5 — Verify CSP compliance

Check your code against `agent_docs/csp-rules.md`. Specifically:
- No `eval()`, `new Function()`, `setTimeout(string)`
- No external script URLs
- All library files are local
- Inline event handlers use `addEventListener` not `onclick=""`

## Step 6 — Write the file

Write minimal, working code. No placeholder comments, no TODO sections — only what is needed for the component to function. If a feature is not yet implemented, omit it entirely rather than stub it.

## Step 7 — Report what was changed

State exactly:
1. Which files were created or modified
2. Which `manifest.json` keys were updated
3. How to test this component manually (chrome://extensions/ steps)
