# Testing Guide

## Структура тестирования

```
Unit Tests (Vitest)     → бизнес-логика, парсеры, утилиты
E2E Tests (Playwright)  → полный флоу с реальным Chromium + расширением
Manual Checklist        → перед каждым релизом
```

## Unit Tests с Vitest

### Что тестировать

- Парсеры DOM (снимки HTML → ожидаемые ListingItem[])
- Утилиты (геокодинг, форматирование цен, фильтрация)
- Message handlers в service worker (mock chrome API)
- Схемы данных (валидация ListingItem)

### Setup

```bash
npm install -D vitest @types/chrome jsdom
```

```javascript
// vitest.config.js
export default {
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js']
  }
};
```

```javascript
// test/setup.js — mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
    session: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    }
  },
  runtime: {
    sendMessage: vi.fn().mockResolvedValue({ ok: true }),
    onMessage: { addListener: vi.fn() },
    getURL: vi.fn(path => `chrome-extension://test/${path}`),
    lastError: null,
  },
  tabs: {
    sendMessage: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
    onUpdated: { addListener: vi.fn() },
  },
  sidePanel: {
    setOptions: vi.fn().mockResolvedValue(undefined),
    setPanelBehavior: vi.fn().mockResolvedValue(undefined),
  }
};
```

### Пример теста парсера CIAN

```javascript
// test/parsers/cian.test.js
import { parseCianListings } from '../../src/parsers/cian.js';
import { readFileSync } from 'fs';

const html = readFileSync('./test/fixtures/cian-listing-page.html', 'utf8');

test('парсит цену и адрес из карточки CIAN', () => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const listings = parseCianListings(doc);
  
  expect(listings).toHaveLength(20);
  expect(listings[0]).toMatchObject({
    source: 'cian',
    price: expect.any(Number),
    currency: 'RUB',
    address: expect.stringContaining('Москва'),
  });
});
```

Сохраняй HTML-фикстуры с реальных страниц сайтов в `test/fixtures/` — они документируют ожидаемый DOM.

## E2E Tests с Playwright

### Setup

```bash
npm install -D @playwright/test playwright
npx playwright install chromium
```

```javascript
// playwright.config.js
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './test/e2e',
  use: { headless: false }, // расширения не работают в headless
  timeout: 30000,
});
```

### Загрузка расширения в тестах

```javascript
// test/e2e/fixtures.js
import { chromium } from '@playwright/test';
import path from 'path';

export async function launchWithExtension() {
  const extensionPath = path.join(process.cwd()); // папка salary-maps
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
  
  // Получить extensionId
  let extensionId;
  for (const page of context.pages()) {
    const url = page.url();
    if (url.startsWith('chrome-extension://')) {
      extensionId = url.split('/')[2];
      break;
    }
  }
  // Если не нашли — жди service worker
  if (!extensionId) {
    const sw = await context.waitForEvent('serviceworker');
    extensionId = sw.url().split('/')[2];
  }
  
  return { context, extensionId };
}
```

### Пример E2E теста

```javascript
// test/e2e/popup.spec.js
import { test, expect } from '@playwright/test';
import { launchWithExtension } from './fixtures.js';

test('popup открывается и показывает настройки', async () => {
  const { context, extensionId } = await launchWithExtension();
  
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  
  await expect(page.locator('h3')).toBeVisible();
  await expect(page.locator('#toggle-enabled')).toBeVisible();
  
  await context.close();
});

test('side panel рендерит карту', async () => {
  const { context, extensionId } = await launchWithExtension();
  
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  
  // Leaflet рендерит canvas/SVG
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 5000 });
  
  await context.close();
});
```

## Manual Testing Checklist

Перед каждым релизом проверить:

### Установка и базовая работа
- [ ] Расширение загружается без ошибок в `chrome://extensions/`
- [ ] Нет ошибок в "Errors" разделе (красный бейдж)
- [ ] Service Worker регистрируется (виден как "service worker" ссылка)
- [ ] Popup открывается, не падает

### Функционал на CIAN.ru
- [ ] Открыть `cian.ru/cat.php?deal_type=sale&...`
- [ ] Убедиться что content script инжектируется (console: `[HousingMap] attached`)
- [ ] Карточки объявлений парсятся (console SW: `[HousingMap] listings: N`)
- [ ] Side Panel открывается автоматически или по кнопке
- [ ] Пины появляются на карте в Side Panel

### Функционал на Avito.ru
- [ ] Аналогично CIAN

### Google Maps (оверлей зарплат)
- [ ] Открыть `google.com/maps` (убедиться что France в viewport)
- [ ] Полигоны зарплат появляются на карте
- [ ] Тултипы работают при hover
- [ ] Кнопка ВКЛ/ВЫКЛ работает

### Производительность
- [ ] Нет утечек памяти (DevTools Memory tab после 10 минут работы)
- [ ] Service Worker не держит CPU > 5% в idle

## Дебаг-команды

```javascript
// В консоли Service Worker (chrome://extensions/ → service worker)
// Посмотреть все хранимые листинги:
chrome.storage.session.get(null).then(console.log);

// Сбросить кэш:
chrome.storage.local.clear();

// Симулировать сообщение от content script:
chrome.runtime.sendMessage({ type: 'LISTINGS_UPDATE', payload: { siteId: 'cian', listings: [] } });

// Посмотреть активные contexts (side panel, popup):
chrome.runtime.getContexts({}).then(console.log);
```
