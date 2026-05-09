# Housing Sites — Паттерны парсинга

## Схема: как добавить поддержку сайта

1. Определи URL-паттерны (manifest `matches`)
2. Выясни: React/Vue/SSR? Есть ли JSON в DOM?
3. Выбери стратегию: DOM-скрапинг vs window.* перехват vs XHR-перехват
4. Напиши парсер → верни `ListingItem[]`
5. Добавь MutationObserver для SPA-навигации
6. Добавь запись в `manifest.json` content_scripts

---

## CIAN.ru

**URL паттерны**:
```json
"*://*.cian.ru/cat.php*",
"*://*.cian.ru/sale/*",
"*://*.cian.ru/rent/*"
```

**Технологии**: React + SSR, Next.js-подобный роутинг  
**Стратегия**: DOM-скрапинг карточек + XHR-перехват на /map-search/

**Ключевые селекторы** (актуальны на май 2026, могут меняться):

```javascript
// Контейнер списка объявлений
'[data-name="OffersSerpFeatureMainContainer"]'

// Карточка объявления
'article[data-name="CardComponent"]'

// Цена
'[data-mark="MainPrice"] span'          // "15 000 000 ₽"
'[data-mark="PriceInfo"]'               // "250 000 ₽/мес"

// Адрес
'[data-mark="Address"] a'
'[class*="address"] a'

// Площадь и комнаты из заголовка
'[data-mark="OfferTitle"]'              // "3-комн. кв., 78 м², 5/16 эт."

// Ссылка на объявление
'article a[href*="/flat/"]'
'article a[href*="/suburban/"]'

// Данные в JSON (более надёжно чем DOM)
// В MAIN world: window._cian_gkList или script[type="application/json"]
```

**Парсинг заголовка**:
```javascript
function parseCianTitle(title) {
  // "3-комн. кв., 78 м², 5/16 эт."
  const rooms = title.match(/^(\d+)-комн/)?.[1] || (title.includes('Студия') ? 0 : null);
  const area = title.match(/(\d+(?:,\d+)?)\s*м²/)?.[1]?.replace(',', '.');
  const [floor, totalFloors] = (title.match(/(\d+)\/(\d+)\s*эт/) || []).slice(1);
  return { rooms: rooms !== null ? +rooms : undefined, area: area ? +area : undefined, floor: +floor, totalFloors: +totalFloors };
}
```

**Парсинг цены**:
```javascript
function parseCianPrice(text) {
  // "15 000 000 ₽" → { price: 15000000, currency: 'RUB' }
  const num = +text.replace(/\D/g, '');
  const currency = text.includes('$') ? 'USD' : text.includes('€') ? 'EUR' : 'RUB';
  return { price: num, currency };
}
```

**SPA-навигация**: CIAN использует history.pushState — слушай `popstate` и переиспользуй MutationObserver.

---

## Avito.ru

**URL паттерны**:
```json
"*://*.avito.ru/*/nedvizhimost/*",
"*://*.avito.ru/moskva/kvartiry/*",
"*://*.avito.ru/*/kvartiry/*"
```

**Технологии**: React, частичный SSR  
**Стратегия**: DOM-скрапинг + `window.__initialData__` в MAIN world

**Ключевые селекторы**:

```javascript
// Список объявлений
'[data-marker="catalog-serp"]'

// Карточка
'[data-marker="item"]'                          // атрибут data-item-id

// Заголовок / ссылка
'[data-marker="item-title"]'                    // <a href="/items/...">

// Цена
'[data-marker="item-price"] [itemprop="price"]' // атрибут content="15000000"
// или:
'[data-marker="item-price"] meta[itemprop="price"]'

// Параметры (комнаты, площадь)
'[data-marker="item-specific-params"]'          // "3-комн. квартира, 65 м²"
```

**window.__initialData__** (MAIN world):
```javascript
// Структура меняется — проверяй ключи
const data = window.__initialData__;
const items = data?.catalog?.items || data?.items || [];
items.forEach(item => {
  // item.id, item.title, item.price.value, item.address, item.coords?.lat, item.coords?.lng
});
```

**Важно**: Avito агрессивно обфусцирует имена классов. Используй `data-marker` атрибуты — они стабильнее.

**Координаты**: В списке координат нет → нужен геокодинг. На странице объявления есть `item.location.lat/lng`.

---

## Google Maps (текущий функционал)

**URL паттерны**:
```json
"https://www.google.com/maps*",
"https://maps.google.com/*"
```

**Технологии**: Проприетарный JS, `window.google.maps` объект  
**Стратегия**: Перехват конструктора `google.maps.Map` и прототипных методов (см. `injected.js`)

Текущий `injected.js` уже реализует надёжный паттерн поиска инстанса Maps через:
- Proxy на конструктор
- Патчинг прототипных методов
- Сканирование DOM (`div.__gm`)
- MutationObserver + polling

---

## Domclick.ru (Сбербанк) — справочно

**URL паттерны**: `"*://*.domclick.ru/map/*"`, `"*://*.domclick.ru/search/*"`  
**Технологии**: React + Mapbox встроен  
**Стратегия**: XHR-перехват API `/api/flat/v2/search/` — возвращает GeoJSON с координатами  
**Ключевой endpoint**: `domclick.ru/api/flat/v2/search/?*` — объекты с `point.lat`, `point.lng`, `price`, `total_area`, `rooms_amount`

---

## Шаблон нового парсера

```javascript
// src/parsers/SITE_NAME.js
export function parseSiteListings(document) {
  const listings = [];
  
  const cards = document.querySelectorAll('SELECTOR');
  cards.forEach(card => {
    try {
      const id = card.dataset.itemId || card.id || crypto.randomUUID();
      const url = card.querySelector('a')?.href;
      const priceText = card.querySelector('PRICE_SELECTOR')?.textContent?.trim() || '';
      const { price, currency } = parsePrice(priceText);
      const address = card.querySelector('ADDRESS_SELECTOR')?.textContent?.trim() || '';
      
      if (!price || !address) return; // пропускаем невалидные
      
      listings.push({
        id, source: 'SITE_ID', url,
        title: card.querySelector('TITLE_SELECTOR')?.textContent?.trim() || '',
        price, currency,
        address,
        coordinates: null, // будет заполнено геокодингом
        scrapedAt: Date.now()
      });
    } catch (e) {
      console.warn('[HousingMap] parse error:', e);
    }
  });
  
  return listings;
}
```
