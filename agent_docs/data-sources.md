# Data Sources — Housing Data

## Стратегия получения данных

Расширение работает на стороне клиента — никакого backend по умолчанию. Данные берём:
1. **DOM-скрапинг** целевых сайтов из content script (основной метод)
2. **window.__NEXT_DATA__** для Next.js сайтов (Zillow, Redfin — чистый JSON без парсинга DOM)
3. **XHR/fetch-перехват** для SPA-сайтов (опционально, для CIAN)
4. **Публичные API** для обогащения (геокодинг, районы)

---

## CIAN.ru

### Структура страниц

| URL-паттерн | Тип страницы | Данные |
|---|---|---|
| `cian.ru/cat.php?*` | Список объявлений | Карточки с ценой, адресом |
| `cian.ru/sale/flat/*/` | Страница объявления | Полная информация |
| `cian.ru/map/` | Карта CIAN | API-запросы с координатами |

### DOM-скрапинг (список объявлений)

```javascript
// CIAN использует React — данные в data-атрибутах и JSON в <script>
// Ищем script с данными листингов
const scripts = document.querySelectorAll('script[type="application/json"]');
// или ищем window._cian_gkList в MAIN world

// Альтернатива — DOM карточки
const cards = document.querySelectorAll('[data-name="OffersSerpFeatureMainContainer"]');
cards.forEach(card => {
  const price = card.querySelector('[data-mark="MainPrice"]')?.textContent;
  const address = card.querySelector('[data-mark="Address"]')?.textContent;
  const link = card.querySelector('a[href*="/flat/"]')?.href;
  const coords = card.dataset.lat && card.dataset.lng
    ? { lat: +card.dataset.lat, lng: +card.dataset.lng }
    : null; // может потребовать геокодинг
});
```

### XHR-перехват (координаты с карты CIAN)

CIAN карта делает запросы к `/api/map-search/` — в ответе объекты с `geo.coordinates`.  
Перехват в MAIN world:

```javascript
const _fetch = window.fetch;
window.fetch = async function(url, ...args) {
  const res = await _fetch(url, ...args);
  if (typeof url === 'string' && url.includes('/map-search/')) {
    const clone = res.clone();
    clone.json().then(data => {
      const listings = data.offersSerialized?.map(o => ({
        id: String(o.id),
        lat: o.geo.coordinates[1],
        lng: o.geo.coordinates[0],
        price: o.bargainTerms.price,
        // ...
      }));
      window.postMessage({ __smf_source: 'injected', type: 'LISTINGS_UPDATE', listings }, '*');
    });
  }
  return res;
};
```

### Apify API (альтернатива)

Если нужны данные без открытого сайта — Apify actor `igolaizola/cian-ru-scraper`:

```
GET https://api.apify.com/v2/acts/igolaizola~cian-ru-scraper/runs
Authorization: Bearer {APIFY_TOKEN}
Body: { "startUrls": [{"url": "https://cian.ru/cat.php?..."}] }
```

Возвращает структурированные данные: price, address, lat, lng, photos, area, rooms.  
Стоимость: ~$4/1000 объявлений.

---

## Avito.ru

### Структура страниц

| URL-паттерн | Тип страницы |
|---|---|
| `avito.ru/moskva/nedvizhimost/*` | Список объявлений |
| `avito.ru/*/item/*` | Страница объявления |

### DOM-скрапинг

```javascript
// Avito использует React + SSR — данные в window.__initialData__
// В MAIN world:
const initialData = window.__initialData__; // или window.__avito_data__
// Структура меняется — проверяй актуальность

// DOM fallback:
const cards = document.querySelectorAll('[data-marker="item"]');
cards.forEach(card => {
  const id = card.dataset.itemId;
  const price = card.querySelector('[data-marker="item-price"]')?.textContent;
  const title = card.querySelector('[itemprop="name"]')?.textContent;
  const link = card.querySelector('a[data-marker="item-title"]')?.href;
  // Координаты Avito не отдаёт в списке — нужен геокодинг по адресу
});
```

### Ограничения Avito

- Координаты в списке не передаются — нужен геокодинг
- Агрессивный anti-bot: rate limit, Cloudflare challenge
- Рекомендуется геокодинг через Nominatim (бесплатно) или Яндекс.Геокодер

---

## Zillow / Redfin (справочно, US рынок)

### window.__NEXT_DATA__ (самый простой метод)

Оба сайта — Next.js. Всё нужное есть в:

```javascript
// MAIN world:
const nextData = window.__NEXT_DATA__;
const listings = nextData?.props?.pageProps?.searchPageState?.cat1?.searchResults?.listResults;
listings?.forEach(l => {
  // l.zpid, l.price, l.address, l.latLng.latitude, l.latLng.longitude
});
```

Структура меняется с каждым деплоем — добавь version-check или catch.

---

## Геокодинг

Если у объявления есть адрес но нет координат:

### Nominatim (OpenStreetMap) — бесплатно
```javascript
// В service worker (через fetch):
const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
const resp = await fetch(url, { headers: { 'User-Agent': 'HousingMapExtension/1.0' } });
const [result] = await resp.json();
// result.lat, result.lon
```

Rate limit: 1 req/sec. Кэшируй результаты в `chrome.storage.local`.

### Яндекс.Геокодер — для РФ-адресов (точнее)
```
GET https://geocode-maps.yandex.ru/1.x/?apikey={KEY}&geocode={address}&format=json&results=1
```
Требует API-ключ. Лимит: 1000 запросов/день на бесплатном тарифе.

---

## Кэширование данных

```javascript
// Ключ кэша = хэш URL запроса
const CACHE_TTL = 5 * 60 * 1000; // 5 минут для листингов

async function getCached(key) {
  const { [key]: entry } = await chrome.storage.local.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

async function setCache(key, data) {
  await chrome.storage.local.set({ [key]: { data, ts: Date.now() } });
}
```

Лимит `chrome.storage.local` = 10MB. Для больших кэшей добавь LRU-eviction.

---

## Дополнительные данные для обогащения

| Источник | Данные | API |
|---|---|---|
| OpenStreetMap Overpass | Инфраструктура (метро, магазины, парки) | `overpass-api.de` |
| Яндекс Карты / 2GIS | Точные адреса РФ | платный |
| Росреестр ФИАС | Официальные адреса РФ | бесплатно, SOAP |
| Реформа ЖКХ | Данные о домах (год постройки, серия) | `reformagkh.ru` API |
| Рейтинг районов | Crime / Demographics | нет публичного РФ API |
