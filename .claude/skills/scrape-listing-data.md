---
name: scrape-listing-data
description: Implements DOM scraping of housing listings from a target site (CIAN, Avito, etc.) in a content script or injected.js. Use when adding or fixing a listing parser for a specific website.
---

You are implementing a housing listing scraper for a Chrome extension content script. This runs in the browser on the target website. Follow this process carefully.

## Step 1 — Determine execution context

There are two worlds in Chrome extensions:
- **Isolated world** (content.js): Can access DOM but NOT page's JS variables (`window.foo`, `window.__data__`)
- **MAIN world** (injected.js): Can access everything — page JS, `window.google`, `window.__initialData__`, intercepted XHR

**Decision rule**:
- If you need `window.anything`, fetch interception, or `window.google` → use MAIN world (injected.js pattern)
- If DOM elements are sufficient → use content script isolated world

## Step 2 — Read existing code and housing site docs

Before writing the parser:
- Read `content.js` — understand current injection pattern
- Read `injected.js` — understand MAIN world patterns already in use
- Read `agent_docs/housing-sites.md` — selector reference for the target site
- Read `agent_docs/messages.md` — ListingItem schema (must return this structure)

## Step 3 — Inspect the target site

If you can see the user's DevTools output or HTML snippets, use them. Otherwise describe what to inspect:

```
In Chrome DevTools on the target site:
1. Right-click on a listing card → Inspect
2. Note the CSS selectors for: card container, price, address, title, link
3. Check Console: type `window.__initialData__` or `window.__NEXT_DATA__` — is there a JSON object?
4. Check Network tab: filter XHR/Fetch, look for JSON responses with listing arrays
```

## Step 4 — Write the parser

Follow the ListingItem schema from `agent_docs/messages.md`. Return `ListingItem[]`.

**Template for DOM-based parser**:

```javascript
function parseSiteListings(doc = document) {
  const listings = [];
  const SITE = 'cian'; // or 'avito'
  
  const cards = doc.querySelectorAll('CARD_SELECTOR');
  if (cards.length === 0) {
    console.log('[HousingMap] No cards found — selector may be outdated');
    return [];
  }
  
  cards.forEach((card, i) => {
    try {
      const id = card.dataset.id || card.id || `${SITE}-${i}-${Date.now()}`;
      const linkEl = card.querySelector('a[href]');
      const url = linkEl?.href || '';
      if (!url) return;
      
      const priceText = card.querySelector('PRICE_SELECTOR')?.textContent?.trim() || '';
      const { price, currency } = parsePrice(priceText);
      if (!price) return; // пропускаем без цены
      
      const address = card.querySelector('ADDRESS_SELECTOR')?.textContent?.trim() || '';
      const title = card.querySelector('TITLE_SELECTOR')?.textContent?.trim() || '';
      
      // Координаты — только если доступны в DOM/data-атрибутах
      const lat = card.dataset.lat ? +card.dataset.lat : null;
      const lng = card.dataset.lng ? +card.dataset.lng : null;
      
      listings.push({
        id,
        source: SITE,
        url,
        title,
        price,
        currency,
        address,
        coordinates: lat && lng ? { lat, lng } : null,
        scrapedAt: Date.now()
      });
    } catch (e) {
      console.warn('[HousingMap] Card parse error:', e, card);
    }
  });
  
  console.log(`[HousingMap] Parsed ${listings.length} listings from ${SITE}`);
  return listings;
}

function parsePrice(text) {
  if (!text) return { price: null, currency: 'RUB' };
  const currency = text.includes('$') ? 'USD' : text.includes('€') ? 'EUR' : 'RUB';
  const price = +text.replace(/[^\d]/g, '') || null;
  return { price, currency };
}
```

**Template for window.__initialData__ (MAIN world)**:

```javascript
function parseFromWindowData() {
  try {
    const raw = window.__initialData__ || window.__NEXT_DATA__?.props?.pageProps;
    if (!raw) return [];
    
    // Адаптируй путь к массиву объявлений под конкретный сайт
    const items = raw?.items || raw?.catalog?.items || [];
    
    return items.map(item => ({
      id: String(item.id),
      source: 'avito',
      url: `https://avito.ru${item.urlPath || ''}`,
      title: item.title || '',
      price: item.price?.value || null,
      currency: 'RUB',
      address: item.address || '',
      coordinates: item.coords ? { lat: item.coords.lat, lng: item.coords.lng } : null,
      area: item.params?.find(p => p.id === 'area')?.value || undefined,
      rooms: item.params?.find(p => p.id === 'rooms')?.value || undefined,
      scrapedAt: Date.now()
    })).filter(l => l.price && l.url);
  } catch (e) {
    console.warn('[HousingMap] window data parse error:', e);
    return [];
  }
}
```

## Step 5 — Wire MutationObserver for SPA navigation

Housing sites are SPAs — DOM changes without page reload. Watch for new cards:

```javascript
let parseTimeout = null;

const observer = new MutationObserver(() => {
  clearTimeout(parseTimeout);
  parseTimeout = setTimeout(() => {
    const listings = parseSiteListings();
    if (listings.length > 0) {
      window.postMessage({
        __smf_source: 'injected',
        type: 'LISTINGS_UPDATE',
        listings
      }, '*');
    }
  }, 500); // debounce — сайт может делать несколько DOM-изменений за раз
});

observer.observe(document.body, { childList: true, subtree: true });

// Первый парсинг при загрузке
window.addEventListener('load', () => {
  const listings = parseSiteListings();
  if (listings.length > 0) {
    window.postMessage({ __smf_source: 'injected', type: 'LISTINGS_UPDATE', listings }, '*');
  }
});
```

## Step 6 — Handle missing coordinates

Если координат нет — объявление всё равно добавляем, геокодинг делается в Service Worker:

```javascript
// В background.js — при получении LISTINGS_UPDATE
const listingsWithCoords = await Promise.all(
  payload.listings.map(async listing => {
    if (listing.coordinates) return listing;
    const coords = await geocodeAddress(listing.address);
    return { ...listing, coordinates: coords };
  })
);
```

## Step 7 — Add to manifest.json

```json
"content_scripts": [{
  "matches": ["*://*.cian.ru/cat.php*", "*://*.cian.ru/sale/*"],
  "js": ["content.js"],
  "run_at": "document_idle"
}],
"web_accessible_resources": [{
  "resources": ["injected.js"],
  "matches": ["*://*.cian.ru/*"]
}]
```

## Step 8 — Test the parser

```javascript
// В DevTools консоли на целевом сайте (после загрузки расширения):
// Если тестируешь content script:
// (запусти через chrome.scripting в SW или просто загрузи расширение и проверь консоль)

// В консоли SW (chrome://extensions/ → service worker):
// Проверь что LISTINGS_UPDATE приходит:
chrome.runtime.onMessage.addListener((msg) => console.log('[TEST]', msg));
```

**Признаки успешной работы**:
- Console в SW: `[HousingMap] Parsed N listings from cian`
- `N > 0` для страницы с объявлениями
- Все `ListingItem` имеют `id`, `url`, `price`, `address`
- Нет ошибок типа "Cannot read properties of undefined"
