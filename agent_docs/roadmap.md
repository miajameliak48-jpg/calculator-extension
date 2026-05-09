# Roadmap

## Текущее состояние (v1.3 — salary-maps France)

Расширение работает как **оверлей зарплат на Google Maps** для Франции:
- Полигоны регионов/городов/районов Парижа с цветовой кодировкой зарплат
- Тултипы при hover
- Переключение ВКЛ/ВЫКЛ
- Автоматический смена слоёв по zoom уровню

---

## Фаза 2 — Housing MVP (ближайший спринт)

**Цель**: Показывать пины жилья на Google Maps при просмотре CIAN.

### Задачи

- [ ] Обновить `manifest.json`:
  - Добавить `host_permissions` для `cian.ru`, `avito.ru`
  - Добавить `sidePanel` permission
  - Добавить `content_scripts` секцию для cian/avito

- [ ] Реализовать `content.js` для CIAN:
  - MutationObserver на появление карточек объявлений
  - Парсинг: цена, адрес, URL объявления, площадь, комнатность
  - Передача через `postMessage` → content.js → SW

- [ ] Создать `sidepanel.html` + `sidepanel.js`:
  - Leaflet карта (добавить `lib/leaflet.js` локально)
  - Приём листингов от SW
  - Рендер маркеров с popup-карточкой (цена, адрес, фото)

- [ ] Обновить `background.js`:
  - Tab monitor: активировать Side Panel на cian.ru/avito.ru
  - Message router: LISTINGS_UPDATE → side panel
  - Кэширование в `chrome.storage.session`

- [ ] Геокодинг через Nominatim для объявлений без координат

**Критерий готовности**: Открываю список на cian.ru → Side Panel открывается → пины появляются на карте.

---

## Фаза 3 — Multi-site + Filters

- [ ] Поддержка Avito.ru (content script + парсер)
- [ ] Фильтры в Side Panel: цена мин/макс, площадь, комнатность, тип сделки
- [ ] Кластеризация маркеров (`leaflet.markercluster`)
- [ ] Popup-карточка объявления с фото (carousel)
- [ ] Синхронизация: hover по пину → подсветка карточки в списке и наоборот
- [ ] Настройки в popup: выбор сайтов, включить/выключить кластеры

---

## Фаза 4 — Analytics Layer

- [ ] Тепловая карта цен по районам (Leaflet.heat)
- [ ] Статистика по выделенной области: средняя цена/м², медиана, количество
- [ ] История цен (если доступно из DOM)
- [ ] Сравнение районов по инфраструктуре (метро, парки — OSM Overpass)
- [ ] Экспорт CSV/GeoJSON выбранных объявлений

---

## Фаза 5 — Расширение на другие рынки

- [ ] Добавить поддержку `domclick.ru`
- [ ] Добавить поддержку `realty.yandex.ru`
- [ ] Конфигурируемые target-сайты через popup
- [ ] Поддержка Zillow/Redfin (US рынок — `window.__NEXT_DATA__` паттерн)

---

## Технический долг

- [ ] Миграция на TypeScript + Vite + CRXJS для HMR при разработке
- [ ] Unit tests (Vitest) для парсеров
- [ ] E2E tests (Playwright) для основного флоу
- [ ] Заменить setTimeout-хаки в injected.js на более надёжный MutationObserver + Proxy паттерн (уже есть, но можно улучшить)
- [ ] Версионирование schema в chrome.storage с migration path

---

## Архивированные идеи (не в приоритете)

- Backend API для хранения истории цен — усложнит деплой
- ML-модель оценки адекватности цены — требует данные
- Уведомления о новых объявлениях в фильтре — нужен polling SW (скоро будет background fetch API)
