# Message Passing Contracts

Все сообщения между компонентами расширения — через `chrome.runtime.sendMessage` / `chrome.tabs.sendMessage`.  
Структура сообщений: `{ type: MessageType, payload: ... }`.

## Типы сообщений

### Content Script → Service Worker

```typescript
// Найдены объявления на странице
interface ListingsUpdateMsg {
  type: 'LISTINGS_UPDATE';
  payload: {
    siteId: 'cian' | 'avito' | 'zillow' | 'google_maps';
    tabId: number;
    url: string;
    listings: ListingItem[];
  };
}

// Страница закончила навигацию, объявления сброшены
interface ListingsClearMsg {
  type: 'LISTINGS_CLEAR';
  payload: { tabId: number };
}

// Пользователь кликнул на объявление
interface ListingClickMsg {
  type: 'LISTING_CLICK';
  payload: { listingId: string };
}
```

### Service Worker → Side Panel / Popup

```typescript
// Обновление листингов для отображения на карте
interface MapUpdateMsg {
  type: 'MAP_UPDATE';
  payload: {
    listings: ListingItem[];
    center?: { lat: number; lng: number };
    zoom?: number;
  };
}

// Выделить конкретный листинг на карте
interface MapHighlightMsg {
  type: 'MAP_HIGHLIGHT';
  payload: { listingId: string | null };
}

// Обновление состояния настроек
interface SettingsUpdateMsg {
  type: 'SETTINGS_UPDATE';
  payload: ExtensionSettings;
}
```

### Popup → Service Worker

```typescript
// Изменение настроек пользователем
interface SettingsChangeMsg {
  type: 'SETTINGS_CHANGE';
  payload: Partial<ExtensionSettings>;
}

// Запрос текущих настроек
interface GetSettingsMsg {
  type: 'GET_SETTINGS';
  payload: null;
}

// Открыть Side Panel
interface OpenSidePanelMsg {
  type: 'OPEN_SIDE_PANEL';
  payload: null;
}
```

### Side Panel → Service Worker

```typescript
// Карта сдвинулась — запросить данные для новой области
interface MapBoundsChangeMsg {
  type: 'MAP_BOUNDS_CHANGE';
  payload: {
    bounds: { north: number; south: number; east: number; west: number };
    zoom: number;
  };
}

// Изменились фильтры (цена, площадь, комнаты)
interface FiltersChangeMsg {
  type: 'FILTERS_CHANGE';
  payload: FilterState;
}
```

### Service Worker → Offscreen Document

```typescript
// Запрос парсинга HTML-ответа
interface ParseHtmlMsg {
  type: 'PARSE_HTML';
  payload: { html: string; url: string };
}

// Ответ с распарсенными листингами
interface ParseHtmlResponseMsg {
  type: 'PARSE_HTML_RESPONSE';
  payload: { listings: ListingItem[]; error?: string };
}
```

## Схемы данных

```typescript
interface ListingItem {
  id: string;                    // уникальный ID объявления
  source: 'cian' | 'avito' | 'zillow' | 'other';
  url: string;                   // ссылка на объявление
  title: string;                 // заголовок
  price: number;                 // цена (в местной валюте)
  currency: 'RUB' | 'USD' | 'EUR';
  pricePerSqm?: number;          // цена за м²
  area?: number;                 // площадь м²
  rooms?: number;                // количество комнат (0 = студия)
  address: string;               // адрес текстом
  coordinates: {
    lat: number;
    lng: number;
  };
  floor?: number;
  totalFloors?: number;
  photos?: string[];             // URL фотографий (web_accessible_resources)
  description?: string;
  scrapedAt: number;            // timestamp
}

interface ExtensionSettings {
  enabled: boolean;              // расширение включено
  activeSites: string[];         // ['cian', 'avito']
  mapProvider: 'leaflet' | 'google';
  filters: FilterState;
  showSidePanel: boolean;
  clusterMarkers: boolean;
}

interface FilterState {
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  rooms?: number[];              // [1, 2, 3] — какие комнатности показывать
  dealType: 'sale' | 'rent' | 'all';
}
```

## Паттерн async response в Service Worker

Всегда возвращай `true` из `onMessage` если ответ асинхронный:

```javascript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(['settings']).then(({ settings }) => {
      sendResponse({ ok: true, data: settings });
    });
    return true; // ОБЯЗАТЕЛЬНО — иначе sendResponse будет недоступен
  }
});
```

## Паттерн window.postMessage (injected.js → content.js)

Используется когда нужно передать данные из MAIN world в Isolated world:

```javascript
// injected.js (MAIN world)
window.postMessage({
  __smf_source: 'injected',  // namespace чтобы не мешать с другими postMessage
  type: 'LISTINGS_UPDATE',
  listings: [...]
}, '*');

// content.js (Isolated world)
window.addEventListener('message', (event) => {
  if (event.data?.__smf_source !== 'injected') return;
  chrome.runtime.sendMessage({ type: event.data.type, payload: { listings: event.data.listings } });
});
```

## Обработка ошибок

```javascript
// Всегда оборачивай sendMessage в try/catch или проверяй lastError
try {
  await chrome.runtime.sendMessage({ type: 'LISTINGS_UPDATE', payload: data });
} catch (e) {
  // "Could not establish connection" — нормально, если SW не активен
  // Игнорируй или логируй только в debug режиме
}

// В Service Worker — проверяй что Side Panel открыт перед sendMessage
chrome.runtime.getContexts({ contextTypes: ['SIDE_PANEL'] }).then(contexts => {
  if (contexts.length > 0) {
    chrome.runtime.sendMessage({ type: 'MAP_UPDATE', payload: data });
  }
});
```
