# Architecture — Housing Map Extension

## Компонентная схема

```
┌─────────────────────────────────────────────────────────────────┐
│  Chrome Browser                                                  │
│                                                                  │
│  ┌─────────────────────┐    ┌──────────────────────────────┐    │
│  │   Target Page       │    │  Extension Pages             │    │
│  │  (cian.ru/avito.ru) │    │                              │    │
│  │                     │    │  ┌────────────────────────┐  │    │
│  │  ┌───────────────┐  │    │  │   Side Panel           │  │    │
│  │  │ injected.js   │  │    │  │   (sidepanel.html)     │  │    │
│  │  │ (MAIN world)  │◄─┼────┼──┤   Leaflet map          │  │    │
│  │  │               │  │    │  │   Filter controls      │  │    │
│  │  │ - DOM scrape  │  │    │  └────────────────────────┘  │    │
│  │  │ - __NEXT_DATA │  │    │                              │    │
│  │  │ - postMessage │  │    │  ┌────────────────────────┐  │    │
│  │  └───────┬───────┘  │    │  │   Popup (popup.html)   │  │    │
│  │          │          │    │  │   Быстрые настройки    │  │    │
│  │  ┌───────▼───────┐  │    │  └────────────────────────┘  │    │
│  │  │ content.js    │  │    │                              │    │
│  │  │ (Isolated)    │  │    │  ┌────────────────────────┐  │    │
│  │  └───────┬───────┘  │    │  │   Offscreen Doc        │  │    │
│  └──────────┼──────────┘    │  │   (DOM parsing)        │  │    │
│             │               │  └────────────────────────┘  │    │
│             │               └──────────────────────────────┘    │
│             │  chrome.runtime.sendMessage                        │
│             ▼                                                    │
│  ┌──────────────────────────────────────────┐                   │
│  │         background.js (Service Worker)   │                   │
│  │                                          │                   │
│  │  - Message router                        │                   │
│  │  - chrome.storage manager               │                   │
│  │  - Fetch proxy (API calls)              │                   │
│  │  - Tab monitor (активация Side Panel)   │                   │
│  └──────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## Ключевые архитектурные решения

### 1. Google Maps vs Leaflet
**Текущее состояние**: Google Maps (хукаемся через `window.google` в MAIN world).  
**Для Side Panel**: Leaflet 2.x (бандлим локально — нет CSP-конфликтов, нет CDN).  
**Почему не Mapbox/MapLibre**: требуют `worker-src blob:` для GL JS; Leaflet — чистый DOM/SVG.

### 2. Injected.js в MAIN world
Нужен для чтения `window.google` (Google Maps instance), `window.__NEXT_DATA__` (Zillow/Redfin — Next.js apps), перехвата fetch() реакт-приложений.  
`content.js` в Isolated world не видит эти объекты — только DOM.

### 3. Side Panel как основной UI
Popup закрывается при любом клике вне — невозможно держать карту открытой при навигации.  
Side Panel (Chrome 114+) остаётся открытым при навигации между страницами сайта.

### 4. Offscreen Document для DOM-парсинга
Service Worker не имеет доступа к DOM → нельзя парсить HTML-ответы от API через `DOMParser`.  
Offscreen doc с reason `DOM_PARSER` решает это без content script.

### 5. Message passing через Service Worker
Все компоненты общаются только через SW — единый роутер. Прямой связи side panel ↔ content script нет (MV3 не поддерживает). SW создаёт декларативный data layer.

## Service Worker Lifecycle — что важно знать

SW может быть завершён браузером через ~30 секунд бездействия.

```
Старт SW:
1. chrome.runtime.onStartup → восстанови состояние из chrome.storage.session
2. chrome.runtime.onInstalled → инициализируй дефолтные настройки
3. Регистрируй ВСЕ event listeners синхронно на верхнем уровне — никогда внутри async/await

Во время работы:
4. Любой входящий message "будит" SW автоматически
5. Длинные операции (fetch, несколько storage) — используй chrome.storage.session как in-memory кэш
6. Не доверяй глобальным переменным — они могут быть сброшены

Смерть SW:
7. Состояние теряется, если не персистировать в storage
```

## Data Flow — Листинг от сайта до пина на карте

```
1. Пользователь открывает cian.ru/cat.php?...
2. background.js видит: tabs.onUpdated → url matches → chrome.sidePanel.setOptions(enabled:true)
3. content.js инжектирует injected.js в MAIN world
4. injected.js:
   a. MutationObserver следит за DOM появлением карточек объявлений
   b. Для каждой карточки: парсит цену, адрес, координаты (из data-атрибутов или JSON)
   c. Отправляет массив ListingItem[] через window.postMessage → content.js слышит
5. content.js: chrome.runtime.sendMessage({type:'LISTINGS_UPDATE', listings:[...]})
6. background.js: сохраняет в chrome.storage.session + chrome.tabs.sendMessage к Side Panel
7. sidepanel.js: получает listings → ставит пины на Leaflet карту
```

## CSS Isolation для контент-скрипта

Если инжектируем UI элементы (панель, тултипы) в страницу сайта — используем Shadow DOM:

```javascript
const host = document.createElement('div');
host.id = 'hm-ext-root';
document.body.appendChild(host);
const shadow = host.attachShadow({ mode: 'closed' });
// Всё UI — внутри shadow. Стили сайта не проникают, наши стили не утекают.
```

Исключение: Side Panel — это отдельная extension page, изоляция не нужна.
