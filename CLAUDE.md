# Housing Map — Chrome Extension

## WHAT
Chrome MV3 extension: интерактивная карта поиска жилья. Накладывает объявления с CIAN, Avito и других сайтов на карту, работает как оверлей на сайтах-агрегаторах и через Side Panel.

**Tech Stack**
- Manifest V3 · Service Worker · Content Scripts · Side Panel · Offscreen Document
- Map: Google Maps JS API (уже интегрирован) + Leaflet 2.x в Side Panel (без CDN)
- Build: нет (пока vanilla JS) → целевой: Vite + CRXJS
- Storage: `chrome.storage.local` (кэш) · `chrome.storage.sync` (настройки)
- Target sites: `cian.ru` · `avito.ru` · `google.com/maps`

## Project Structure
```
salary-maps/
├── manifest.json           # MV3 манифест — точка входа
├── background.js           # Service Worker: роутер, прокси API, tab-мониторинг
├── content.js              # Content Script: инжект injected.js в MAIN world
├── injected.js             # MAIN world: перехват Google Maps, DOM-скрапинг
├── popup.html              # Action popup: быстрые настройки
│
├── CLAUDE.md               # ← этот файл
├── agent_docs/             # Детальная документация для агентов
│   ├── architecture.md     # Архитектурные решения и data flow
│   ├── messages.md         # Контракты message passing (типы, схемы)
│   ├── data-sources.md     # Источники данных по жилью (CIAN, Avito, API)
│   ├── testing.md          # Unit, E2E, ручное тестирование
│   ├── csp-rules.md        # CSP для MV3: что можно, что нельзя, ошибки
│   ├── roadmap.md          # Фичи по фазам
│   └── housing-sites.md    # Селекторы и паттерны парсинга по сайтам
└── .claude/
    ├── settings.json       # Разрешения Claude Code для проекта
    └── skills/             # Переиспользуемые навыки
        ├── scaffold-mv3-component.md
        ├── debug-csp-error.md
        ├── implement-map-feature.md
        ├── scrape-listing-data.md
        └── add-housing-site.md
```

## WHY
Поиск жилья на CIAN/Avito неудобен: нет нормальной карты с фильтрами, нельзя видеть объявления на своей карте. Расширение решает это без отдельного приложения — прямо в браузере.

## HOW — Development Workflow

```bash
# Загрузить расширение
# chrome://extensions/ → Developer mode → Load unpacked → папка salary-maps/

# Посмотреть логи service worker
# chrome://extensions/ → "service worker" ссылка

# Дебаг content script
# DevTools целевой страницы → Sources → Content Scripts

# Дебаг Side Panel / Popup
# Правый клик → Inspect
```

## Key Rules — НИКОГДА не нарушать

1. **NO remote code** — никаких CDN, `eval()`, `new Function()`, dynamic `import()` из сети
2. **NO localStorage в service worker** — только `chrome.storage.*`
3. **State не живёт в глобальных переменных SW** — SW может завершиться в любой момент; восстанавливай из storage
4. **Event listeners в SW — только на верхнем уровне** — не внутри `async`, не в callbacks
5. **Offscreen doc — проверяй перед созданием** — максимум один на расширение; используй `ensureOffscreen()` паттерн
6. **Content script → SW только через `chrome.runtime.sendMessage`** — не напрямую к API
7. **MAIN world injection для чтения state страницы** — `window.__SMF_*` для передачи данных
8. **Читай файл перед изменением** — никогда не предполагай содержимое

## Message Flow (краткая схема)
```
Housing Site DOM
    ↓ (MutationObserver, __NEXT_DATA__ или direct DOM scrape)
content.js / injected.js  (MAIN world)
    ↓ window.postMessage / chrome.runtime.sendMessage
background.js (Service Worker)
    ↓ chrome.tabs.sendMessage
sidepanel.js / popup.js
    ↓ (рендер на Leaflet/Google Maps)
Карта с пинами объявлений
```

## Agent Docs — детали здесь
- Архитектура и решения: [agent_docs/architecture.md](agent_docs/architecture.md)
- Message contracts: [agent_docs/messages.md](agent_docs/messages.md)
- Данные по жилью: [agent_docs/data-sources.md](agent_docs/data-sources.md)
- Тестирование: [agent_docs/testing.md](agent_docs/testing.md)
- CSP справочник: [agent_docs/csp-rules.md](agent_docs/csp-rules.md)
- Роадмап: [agent_docs/roadmap.md](agent_docs/roadmap.md)
- Паттерны парсинга по сайтам: [agent_docs/housing-sites.md](agent_docs/housing-sites.md)
