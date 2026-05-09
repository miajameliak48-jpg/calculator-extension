# CSP Rules — Content Security Policy для MV3

## Текущий манифест (что нужно добавить)

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; img-src 'self' data: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
  "sandbox": "sandbox allow-scripts allow-same-origin; script-src 'self' 'unsafe-eval'"
}
```

**`extension_pages`** — применяется к: popup.html, sidepanel.html, offscreen.html, background.js  
**`sandbox`** — применяется к HTML файлам задекларированным как sandboxed в manifest

## Ключевые правила

| Директива | Что делает | Для нашего расширения |
|---|---|---|
| `script-src 'self'` | Только локальные скрипты | **Обязательно** — нет CDN |
| `object-src 'self'` | Нет Flash/Applet | **Обязательно** |
| `img-src 'self' data:` | Разрешает data: URI для иконок/маркеров | **Нужно** для Leaflet маркеров |
| `img-src https://*.tile.openstreetmap.org` | Тайлы карты | **Нужно** для Leaflet |
| `worker-src blob:` | Web Workers через blob URL | Нужно для старых MapLibre GL JS |
| `connect-src *` | Fetch к внешним API | Нужно для геокодинга |

## Что СТРОГО ЗАПРЕЩЕНО в extension_pages

```
'unsafe-eval'   → eval(), new Function(), setTimeout('string')
'unsafe-inline' → <script>...</script> inline, onclick="..."
https://cdn.*   → любые внешние скрипты
data:           → data: URI для скриптов (но не для img)
```

Chrome **отклонит установку расширения** если обнаружит эти директивы.

## Типичные ошибки и решения

### Ошибка: "Refused to execute inline script"
**Причина**: Есть `<script>` инлайн в HTML или `onclick=""` атрибут.  
**Решение**: Вынеси весь JS в `.js` файлы. Используй `addEventListener`.

```html
<!-- ПЛОХО -->
<button onclick="doSomething()">Click</button>
<script>function doSomething() {}</script>

<!-- ХОРОШО -->
<button id="my-btn">Click</button>
<!-- в отдельном popup.js -->
<script src="popup.js"></script>
```

### Ошибка: "Refused to load script from https://cdn.jsdelivr.net"
**Причина**: Попытка загрузить Leaflet/другую библиотеку с CDN.  
**Решение**: Скачай библиотеку и положи в папку расширения.

```
salary-maps/
  lib/
    leaflet.js      ← скачать с leafletjs.com
    leaflet.css
    leaflet.markercluster.js
```

```html
<!-- sidepanel.html -->
<link rel="stylesheet" href="../lib/leaflet.css">
<script src="../lib/leaflet.js"></script>
```

### Ошибка: "Refused to connect to https://api.example.com"
**Причина**: `connect-src` не разрешает домен.  
**Решение**: Добавь в `host_permissions` в manifest.json, а не в CSP. Для MV3 host_permissions автоматически разрешают fetch.

```json
"host_permissions": [
  "https://nominatim.openstreetmap.org/*",
  "https://geocode-maps.yandex.ru/*"
]
```

### Ошибка: "Refused to load image from https://..."
**Причина**: Тайлы карты блокируются.  
**Решение**: Добавь в `img-src` CSP.

```json
"extension_pages": "script-src 'self'; object-src 'self'; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://*.otile1.mqcdn.com"
```

### Ошибка: eval() в библиотеке (старые версии)
**Причина**: Некоторые старые версии Handlebars, underscore template, Vue.js используют eval.  
**Решение**: Обнови до современных версий (или используй sandboxed page как escape-hatch).

```json
// manifest.json — sandboxed pages могут использовать 'unsafe-eval'
"sandbox": {
  "pages": ["sandbox.html"]
}
// sandbox.html живёт в отдельном iframe, общается только через postMessage
```

## CSP для content scripts

Content scripts **не подчиняются** CSP extension pages. Они подчиняются CSP **целевого сайта**.  
Это значит:
- Нельзя добавить `<script src="https://cdn...">` в страницу сайта — сайт заблокирует
- Внутренние файлы расширения доступны через `chrome.runtime.getURL('injected.js')`
- Для CSS — `chrome.scripting.insertCSS({ target: {tabId}, files: ['content.css'] })`

```javascript
// content.js — правильный способ инжектировать скрипт
const s = document.createElement('script');
s.src = chrome.runtime.getURL('injected.js'); // только файлы из web_accessible_resources
document.documentElement.appendChild(s);
```

Файлы должны быть в `web_accessible_resources`:
```json
"web_accessible_resources": [{
  "resources": ["injected.js", "lib/leaflet.js"],
  "matches": ["*://*.cian.ru/*", "*://*.avito.ru/*"]
}]
```

## Как дебажить CSP ошибки

1. Открой `chrome://extensions/` → найди расширение → "Errors" (красный бейдж)
2. Открой DevTools на странице с расширением → Console → фильтр "Content Security Policy"
3. Service Worker ошибки: `chrome://extensions/` → "service worker" → DevTools
4. Проверь: `chrome://extensions/` → Details → ищи "Content security policy" в деталях манифеста
