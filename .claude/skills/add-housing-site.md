---
name: add-housing-site
description: Adds full support for a new housing website (e.g., domclick.ru, realty.yandex.ru, airbnb.com) to the extension — manifest permissions, content script, parser, and Side Panel integration. Use when the user wants to extend the extension to a new site.
---

You are adding support for a new target housing website to the extension. This is a multi-file change. Follow each step in order.

## Step 1 — Research the target site

Read `agent_docs/housing-sites.md` to check if the site already has documented patterns.

If not documented, ask the user to provide (or investigate yourself):
1. What are the listing page URL patterns? (e.g., `domclick.ru/map/`, `domclick.ru/search/`)
2. Is it a React/Vue/Next.js SPA or server-rendered?
3. Are there any known XHR API endpoints (check Network tab)?
4. Is there `window.__NEXT_DATA__` or similar global with listing data?
5. Does the site use anti-scraping measures (Cloudflare, bot detection)?

## Step 2 — Plan the approach

Choose the scraping strategy based on findings:

| Site type | Strategy |
|---|---|
| Next.js / `window.__NEXT_DATA__` | MAIN world, read window object |
| React SPA + REST API calls | MAIN world, fetch interception |
| Server-rendered HTML | DOM scraping in Isolated world |
| Map with geospatial API | XHR/fetch interception for GeoJSON response |

## Step 3 — Update manifest.json

Read `manifest.json` first. Then add:

```json
{
  "host_permissions": [
    // добавить новый домен
    "*://*.NEW-SITE.ru/*"
  ],
  "content_scripts": [
    // добавить новую запись (или расширить существующую)
    {
      "matches": ["*://*.new-site.ru/LISTING_PATH/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["injected.js"],
      "matches": ["*://*.new-site.ru/*"]
    }
  ]
}
```

## Step 4 — Write the parser

Create `src/parsers/new-site.js` (или добавь в injected.js если MAIN world нужен).

Parser MUST return `ListingItem[]` — см. схему в `agent_docs/messages.md`.

Checklist для парсера:
- [ ] Возвращает массив (пустой если нет объявлений, не null/undefined)
- [ ] Каждый item имеет: `id` (string), `source` (site name), `url`, `price` (number), `currency`, `address`
- [ ] Обернут в try/catch — ошибка одной карточки не ломает весь парсинг
- [ ] Логирует количество найденных: `console.log('[HousingMap] Parsed N from SITE')`
- [ ] Не крашится если DOM изменился (используй `?.` optional chaining везде)
- [ ] Координаты: null если недоступны (геокодинг сделает SW)

## Step 5 — Wire parser into content.js / injected.js

В `content.js` (Isolated world) добавь детект URL нового сайта:

```javascript
const site = detectSite(window.location.href);
if (site === 'new-site') {
  // inject MAIN world script
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('injected.js');
  document.documentElement.appendChild(s);
}
```

В `injected.js` (MAIN world) добавь новую ветку:

```javascript
const site = detectSite(window.location.href);

if (site === 'new-site') {
  initNewSiteScraper();
}

function initNewSiteScraper() {
  // parse + MutationObserver
  function scrape() {
    const listings = parseNewSiteListings();
    if (listings.length === 0) return;
    window.postMessage({ __smf_source: 'injected', type: 'LISTINGS_UPDATE', listings }, '*');
  }
  
  window.addEventListener('load', scrape);
  
  const obs = new MutationObserver(debounce(scrape, 500));
  obs.observe(document.body, { childList: true, subtree: true });
  
  // SPA navigation detection
  const origPush = history.pushState;
  history.pushState = function(...args) {
    origPush.apply(this, args);
    setTimeout(scrape, 800); // дать React/Vue перерендериться
  };
  window.addEventListener('popstate', () => setTimeout(scrape, 800));
}
```

## Step 6 — Update background.js for new site

В `background.js` добавь tab detection для нового сайта:

```javascript
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  
  const url = tab.url || '';
  const isHousingPage = 
    url.includes('cian.ru') ||
    url.includes('avito.ru') ||
    url.includes('new-site.ru'); // ← добавь
  
  if (isHousingPage) {
    chrome.sidePanel.setOptions({ tabId, path: 'sidepanel.html', enabled: true });
  }
});
```

## Step 7 — Document the new site

Update `agent_docs/housing-sites.md` with:
- URL patterns
- Technologies used
- Scraping strategy chosen
- Key selectors / window properties used
- Known limitations or fragile parts

Also update `roadmap.md` — move the site from "backlog" to "done".

## Step 8 — Test

Manual test checklist:
- [ ] Open `chrome://extensions/` — нет ошибок после reload
- [ ] Navigate to a listing page on the new site
- [ ] SW console: `[HousingMap] Parsed N from new-site` (N > 0)
- [ ] Side Panel opens (or can be opened manually)
- [ ] Markers appear on map for parsed listings
- [ ] Clicking marker opens correct URL
- [ ] Navigate to next page on site — parser re-runs, markers update
- [ ] Navigate away from site — side panel hides or shows empty state
