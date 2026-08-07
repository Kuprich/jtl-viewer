# Frontend — план разработки

Стек: **Vue 3 + Vite + TypeScript + Element Plus + Chart.js**. Тёмная тема, русский интерфейс, hash-роутинг. Бэкенд: Spring Boot REST на `localhost:8080`.

Разработка идёт **минимальными шагами** — каждый шаг маленький и проверяемый в браузере. Не переходим к следующему, пока текущий не работает.

---

## Шаг 1 — Каркас Vite + Vue + TS

```bash
npm create vite@latest frontend -- --template vue-ts
cd frontend && npm install && npm run dev
```

**Проверка:** на `http://localhost:5173` открывается дефолтная страница Vite (пустой шаблон с логотипом).

Что получаем: `src/main.ts`, `src/App.vue`, `vite.config.ts`, `tsconfig.json` — готовый рабочий каркас.

---

## Шаг 2 — Element Plus + иконки + тёмная тема

```bash
npm install element-plus @element-plus/icons-vue
```

- В `src/main.ts`: подключить `ElementPlus` (`app.use(ElementPlus)`), импортировать CSS:
  - `element-plus/dist/index.css`
  - `element-plus/theme-chalk/dark/css-vars.css`
- Добавить класс `dark` на `<html>`: `document.documentElement.classList.add('dark')`.
- В `App.vue` — тестовые `el-button` и `el-tag`.

**Проверка:** компоненты Element Plus рендерятся в тёмной теме (фон тёмный, не стандартно белый).

---

## Шаг 3 — Роутер + очистка шаблона

```bash
npm install vue-router
```

- Создать `src/router/index.ts`: `createWebHashHistory` (hash-роутинг, без SPA-fallback на бэке).
  - `/` → список прогонов
  - `/runs/:id` → детали прогона
- `App.vue` = шапка (`jtl-viewer`) + `<router-view>`. Удалить дефолтную витрину Vite.
- Временные заглушки для обоих маршрутов.

**Проверка:** страницы переключаются через `#/` и `#/runs/3`.

---

## Шаг 4 — Типы + API-клиент

- `src/types.ts` — типы, зеркалящие DTO бэка:
  - `RunSummary { id, fileName, uploadedAt, rows, errors }`
  - `Envelope<T> { items, total }`
  - `GroupBy = 'label' | 'threadName' | 'responseCode'`
  - `StatDto` (group, calls, errors, errorRate, min, max, avg, p50, p90, p95, p99, throughput, totalBytes, avgBytes)
  - `TimeSeriesPoint` (bucket, calls, errors, min, max, avg, p50, p90, p95, p99, throughput, totalBytes)
- `src/api.ts` — `fetch`-обёртка + методы:
  - `getRuns(): Promise<Envelope<RunSummary>>`
  - `getRun(id): Promise<RunSummary>`
  - `getStats(id, groupBy): Promise<StatDto[]>`
  - `getTimeseries(id, opts): Promise<TimeSeriesPoint[]>`
  - `uploadRun(file): Promise<RunSummary>`
- В `vite.config.ts` — proxy: `server.proxy: { '/api': 'http://localhost:8080' }`.

**Проверка:** временно вывести `getRuns()` на страницу — виден JSON из реального бэка (связка фронт→бэк работает).

---

## Шаг 5 — Экран «Прогоны» (загрузка + список)

`src/views/RunListView.vue`:
- `el-upload` (drag&drop) → `uploadRun(file)` → после успеха перезагрузить список.
- `el-table`: файл, дата (локальная), строки, ошибки (`el-tag`, красный при > 0).
- Клик по строке → переход на `/runs/:id`.

**Проверка:** перетащить `results.jtl` → появилась строка в таблице; клик по строке → переход на детали.

---

## Шаг 6 — Экран «Детали» (KPI + stats-таблица)

`src/views/RunDetailView.vue`:
- `getRun(id)` + `getStats(id, groupBy)`.
- KPI-карточки (`el-card`): запросы, ошибки, error rate, длительность.
- Переключатель `groupBy` (`el-radio-group`): label / threadName / responseCode.
- `el-table` со `sortable`-колонками, подсветка строк с ошибками.

**Проверка:** переключение группировки обновляет таблицу; сортировка по колонкам работает.

---

## Шаг 7 — График (Chart.js)

```bash
npm install chart.js
```

`src/components/TimeChart.vue`:
- `el-select` метрики: avg / p50 / p95 / p99 / rps / errors.
- `el-select` label: «Все» + список из stats.
- Линия по `/timeseries` (x = bucket → локальное время).

**Проверка:** график строится, переключение метрики и label меняет линию.

---

## Шаг 8 (позже) — Прод-сборка

- `npm run build` → копия `dist/*` в `backend/jtlweb/src/main/resources/static/`.
- Бэк отдаёт SPA на `:8080` (hash-роутинг работает без SPA-fallback).

---

## Стек

| Библиотека | Роль |
|---|---|
| Vite + @vitejs/plugin-vue | Билдер, dev-сервер, proxy `/api` → :8080 |
| Vue 3 + vue-router | Фреймворк, hash-роутинг |
| TypeScript + vue-tsc | Типизация |
| Element Plus + @element-plus/icons-vue | Компоненты, тёмная тема |
| Chart.js | График временных рядов |

Без: CSS-фреймворка (тёмная тема Element Plus штатная), axios (нативный fetch), Pinia (состояние локальное), тестов на фронте.

**Про логин/пользователей:** пока не делаем (решение — вариант C). Добавляется позже отдельно.
