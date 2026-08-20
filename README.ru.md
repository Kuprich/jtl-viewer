# jtl-viewer

[English](README.md) | [Русский](README.ru.md)

Веб-приложение для загрузки JTL-файлов JMeter и визуализации результатов нагрузочного тестирования: время отклика, пропускная способность, ошибки, трафик — с экспортом в HTML-отчёт и мультиязычным (RU/EN) интерфейсом.

## Возможности

- **Загрузка JTL-файлов** перетаскиванием (drag & drop) — автоматическое определение разделителя (таб/запятая), разбор CSV с поддержкой полей в кавычках, запись в базу данных пакетными транзакциями.
- **Дашборд запуска** — KPI-карточки: запросы, RPS, ошибки, доля ошибок, длительность, входящий/исходящий трафик.
- **Графики**:
  - Перцентили времени отклика (p50/p90/p95/p99) по всем операциям и по каждой операции
  - Пропускная способность (RPS/RPM/RPH) и ошибки (Errors/sec / Errors %)
  - Частота вызовов по операциям
  - Трафик в битах/сек (входящий/исходящий)
  - Наложение виртуальных пользователей (VU)
- **Фильтр операций** — двухпанельный выбор с перетаскиванием и мультивыбором; выбор сохраняется для каждого запуска.
- **Группировка статистики** — по сценарию / коду ответа / тексту ошибки, с настраиваемыми столбцами таблицы.
- **Зум выделением** на любом графике — двойной клик для сброса.
- **Настройки отображения** — тёмная/светлая тема, интервал агрегации (включая авто), толщина линии, размер точек, заливка области, порог ошибок, единицы нагрузки.
- **Экспорт в HTML-отчёт** — выбор включаемых панелей (KPI, графики, таблицы группировки), тема экспорта, всё рендерится в отдельный автономный HTML-файл.
- **Интерфейс RU/EN** — по умолчанию английский, выбор сохраняется в `localStorage`.
- **HTTP Basic auth** с кастомной формой входа.

<video src="https://github.com/user-attachments/assets/678af7a8-b066-4d9d-96dc-6d6970d55f15" controls width="100%"></video>

## Скриншоты

Тёмная тема:
![Тёмная тема](./docs/screenshots/dark.png)

Светлая тема:
![Светлая тема](./docs/screenshots/white.png)

<p>
  <img src="./docs/screenshots/display_settings.png" alt="Настройки отображения" width="48%">
  <img src="./docs/screenshots/export.png" alt="Параметры экспорта" width="48%">
</p>

## Пример отчёта

Откройте экспортированный HTML-отчёт и посмотрите, что получается на выходе: **[HTML-отчёт](./examples/jtl_report.html)** — кликните, и он откроется в браузере.

## Технологии

**Фронтенд**: Vue 3, TypeScript, Vite, Element Plus, Chart.js

**Бэкенд**: Java 21, Spring Boot 4.1 (Spring MVC, Data JPA, Security)

**База данных**: PostgreSQL 17, Apache Commons CSV, Lombok

**Развёртывание**: Docker (multi-stage build)

## Быстрый старт (Docker)

```bash
docker compose up -d
```

Откройте http://localhost:8080 — один контейнер обслуживает и фронтенд, и все эндпоинты `/api/**`.

Учётные данные по умолчанию: `admin` / `admin` (см. [Конфигурация](#конфигурация)).

Попробуйте: загрузите пример [`examples/fakestore_v2.jtl`](./examples/fakestore_v2.jtl) через интерфейс (перетащите файл в панель списка запусков).

Чтобы остановить и полностью стереть все данные:

```bash
docker compose down -v
```

## Конфигурация

Приложение настраивается через переменные окружения:

| Переменная | Описание | По умолчанию |
| --- | --- | --- |
| `JTL_ADMIN_USERNAME` | Имя пользователя администратора | `admin` |
| `JTL_ADMIN_PASSWORD` | Пароль администратора (открытым текстом или `{bcrypt}$2a$12$...`) | `admin` |
| `SPRING_DATASOURCE_URL` | JDBC-URL PostgreSQL | `jdbc:postgresql://localhost:5432/jtlweb` |
| `SPRING_DATASOURCE_USERNAME` | Пользователь БД | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Пароль БД | `postgres` |

Для продакшена рекомендуется задавать пароль администратора с префиксом-кодировкой, например bcrypt:

```bash
JTL_ADMIN_PASSWORD='{bcrypt}$2a$12$...'
```

Изменения вступают в силу при следующем запуске приложения.

Лимиты загрузки: `max-file-size` и `max-request-size` установлены в 100 МБ.

Проверьте, что API работает:

```bash
curl -u admin:admin http://localhost:8080/api/runs
```

## Локальная разработка

1. Запустите PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

2. Запустите бэкенд (из `backend/jtlweb`):

   ```bash
   ./mvnw spring-boot:run
   ```

   По умолчанию он подключается к `localhost:5432/jtlweb`.

3. Запустите фронтенд (из `frontend`):

   ```bash
   npm install
   npm run dev
   ```

   Dev-сервер Vite проксирует запросы `/api/**` на `http://localhost:8080`.

## API

Все эндпоинты `/api/**` защищены HTTP Basic auth.

| Метод | Путь | Описание |
| --- | --- | --- |
| `POST` | `/api/runs` | Загрузка JTL-файла (multipart `file`). Разбирает файл, сохраняет строки, возвращает `{ id, fileName, uploadedAt, rows, errors }`. |
| `GET` | `/api/runs` | Список запусков (сначала новые). |
| `GET` | `/api/runs/{id}` | Информация о запуске. |
| `GET` | `/api/runs/{id}/labels` | Метки операций запуска. |
| `GET` | `/api/runs/{id}/stats` | Статистика с группировкой `groupBy=label\|responseCode\|errorMessage`: счётчики, ошибки, перцентили, RPS, объём ответов. Фильтрация по операциям через повторяемый параметр `labels`. |
| `GET` | `/api/runs/{id}/timeseries` | Временные ряды (бакеты с метриками на каждый бакет). Параметры: `bucketMs`, `label`, `labels`. |

Примеры запросов и ответов: [docs/api-examples.md](docs/api-examples.md).

### Поведение загрузки

- Проверяется обязательный заголовок (отсутствует → `400`); разделитель определяется автоматически (таб/запятая).
- Колонки сопоставляются по именам — порядок и отсутствие части колонок не критичны.
- Данные записываются порциями по 2000 строк в одной транзакции (при ошибке — полный откат).
- Ошибки считаются по колонке `success`.

### Модель данных

- `jtl_run` — запуски (fileName, uploadedAt, rows, errors)
- `jtl_sample` — строки JTL (17 колонок: timeStamp, elapsed, label, success, responseCode, threadName и т.д.), индексированы по label/success/responseCode/threadName/timeStamp

### Ошибки

- Отсутствующий файл / повреждённый файл / пустой файл без заголовка → `400` с указанием причины
- Всё остальное → `500`

## Структура проекта

```
.
├── backend/jtlweb     # Spring Boot-приложение
├── frontend           # приложение Vue 3 + Vite
├── examples/          # примеры JTL-файлов
├── docs/              # документация (примеры API)
├── Dockerfile         # multi-stage сборка (frontend → backend → runtime)
└── docker-compose.yml # postgres + app
```

## Тесты

- `JtlParserTest` — unit-тесты парсера (корректный / таб / кавычки / success / ошибки заголовка)
- `StatsServiceTest` — тесты агрегации статистики
- `RunStatsControllerTest` — WebMvcTest статистики (мокированный сервис)
- `SecurityConfigTest` — WebMvcTest авторизации (401 без учётных данных / 200 с `admin:admin` / 401 с неверным паролем)
- `JtlwebApplicationTests` — запуск контекста

Запуск:

```bash
./mvnw test
```

`JtlwebApplicationTests` требует запущенный PostgreSQL (`docker compose up -d postgres`).