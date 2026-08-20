# jtl-viewer

[English](README.md) | [Русский](README.ru.md)

Веб-приложение для загрузки JTL-файлов JMeter и визуализации результатов нагрузочного тестирования: время отклика, пропускная способность, ошибки, трафик — с экспортом в HTML-отчёт и мультиязычным (RU/EN) интерфейсом.

## Демо

<video src="https://github.com/user-attachments/assets/678af7a8-b066-4d9d-96dc-6d6970d55f15" controls width="100%"></video>

<p>
  <img src="./docs/screenshots/dark.png" alt="Тёмная тема" width="48%">
  <img src="./docs/screenshots/white.png" alt="Светлая тема" width="48%">
</p>

<p>
  <img src="./docs/screenshots/display_settings.png" alt="Настройки отображения" width="48%">
  <img src="./docs/screenshots/export.png" alt="Параметры экспорта" width="48%">
</p>

## Возможности

- Загрузка JTL перетаскиванием — автоопределение разделителя (таб/запятая), пакетная запись в БД
- KPI-карточки и графики: перцентили (p50–p99), RPS, ошибки, частота, трафик, наложение VU
- Фильтр операций, группировка статистики по сценарию / коду ответа / тексту ошибки
- Настройки отображения: тема, интервал агрегации, стиль линий и точек, порог ошибок, единицы нагрузки
- Экспорт в HTML-отчёт с выбором панелей
- Интерфейс RU/EN, HTTP Basic auth

## Быстрый старт

```bash
docker compose up -d
```

Откройте http://localhost:8080 — вход `admin` / `admin` (см. [Конфигурация](#конфигурация)).

Попробуйте: загрузите [`examples/fakestore_v2.jtl`](./examples/fakestore_v2.jtl) в списке запусков или посмотрите готовый [HTML-отчёт](./examples/jtl_report.html).

## Конфигурация

Переменные окружения: `JTL_ADMIN_USERNAME` / `JTL_ADMIN_PASSWORD` (по умолчанию `admin`/`admin`, поддерживается bcrypt), `SPRING_DATASOURCE_URL` / `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` (по умолчанию `localhost:5432/jtlweb`, `postgres`/`postgres`). Лимит загрузки: 100 МБ. Изменения применяются при следующем запуске.

## API

Все эндпоинты `/api/**` защищены HTTP Basic auth. Примеры: [docs/api-examples.md](docs/api-examples.md).

| Метод | Путь | Описание |
| --- | --- | --- |
| `POST` | `/api/runs` | Загрузка JTL-файла (multipart `file`) |
| `GET` | `/api/runs` | Список запусков (сначала новые) |
| `GET` | `/api/runs/{id}` | Информация о запуске |
| `GET` | `/api/runs/{id}/labels` | Метки операций запуска |
| `GET` | `/api/runs/{id}/stats` | Статистика с группировкой `label\|responseCode\|errorMessage`, фильтр по `labels` |
| `GET` | `/api/runs/{id}/timeseries` | Временные ряды (параметры: `bucketMs`, `label`, `labels`) |

## Локальная разработка

```bash
docker compose up -d postgres            # запустить PostgreSQL
./mvnw spring-boot:run                   # бэкенд (из backend/jtlweb)
npm install && npm run dev               # фронтенд (из frontend), проксирует /api на :8080
```

## Технологии

Vue 3 + TypeScript + Vite + Element Plus + Chart.js | Java 21 + Spring Boot 4.1 + PostgreSQL 17 + Apache Commons CSV | Docker (multi-stage build)

## Тесты

Тесты бэкенда: `./mvnw test` (для `JtlwebApplicationTests` требуется PostgreSQL).