# jtl-viewer

Веб-приложение для загрузки JMeter JTL-файлов и хранения результатов нагрузочных тестов.

## Реализовано

### API

- `POST /api/runs` — загрузка JTL-файла (multipart `file`). Парсит файл, сохраняет строки в БД и возвращает общую статистику запуска: `{ id, fileName, uploadedAt, rows, errors }`.
- `GET /api/runs` — список запусков (от новых к старым).
- `GET /api/runs/{id}` — информация о запуске.
- `GET /api/runs/{id}/labels` — список операций (label) запуска.
- `GET /api/runs/{id}/stats` — статистика по группам (`groupBy=label|responseCode|errorMessage`): счётчики, ошибки, перцентили, RPS, объём ответов. Фильтр по операциям — повторяемый параметр `labels`.
- `GET /api/runs/{id}/timeseries` — временной ряд (бакеты, метрики в каждом бакете). Параметры `bucketMs`, `label`, `labels`.

Все эндпоинты `/api/**` защищены HTTP Basic auth (см. «Авторизация»).

Примеры запросов и ответов: [docs/api-examples.md](docs/api-examples.md).

## Авторизация

API защищено HTTP Basic auth. Один административный пользователь задаётся переменными окружения Spring:

- `JTL_ADMIN_USERNAME` — логин (по умолчанию `admin`)
- `JTL_ADMIN_PASSWORD` — пароль (по умолчанию `admin`)

Пароль можно указать в виде префикс-закодированного значения (рекомендуется для прод-деплоя, например bcrypt):

```bash
JTL_ADMIN_PASSWORD='{bcrypt}$2a$12$...'
```

или в открытом виде (удобно локально). Изменения применяются при перезапуске приложения.

Проверка: `curl -u admin:admin http://localhost:8080/api/runs`.

### Что происходит при загрузке

- Проверка обязательной шапки (нет → `400`); разделитель определяется автоматически (таб/запятая).
- CSV-токенизация через Apache Commons CSV (корректно с кавычками и запятыми внутри полей).
- Маппинг колонок по имени (порядок/отсутствие колонок не критичны).
- Данные записываются в БД чанками по 2000 строк в одной транзакции (ошибка → полный rollback).
- Ошибки считаются по колонке `success`.

### Стек

- Java 21, Spring Boot 4.1, Spring MVC + Spring Data JPA
- PostgreSQL 17 (Docker), Apache Commons CSV, Lombok

### Модель данных

- `jtl_run` — запуски (fileName, uploadedAt, rows, errors)
- `jtl_sample` — строки JTL (17 колонок: timeStamp, elapsed, label, success, responseCode, threadName и т.д.), индексы по label/success/responseCode/threadName/timeStamp

### Ошибки

- Нет файла / битый файл / пустой файл без шапки → `400` с текстом причины
- Прочие → `500`

## Запуск

1. `docker compose up -d` (Postgres 17 на `:5432`, БД `jtlweb`)
2. Запустить `JtlwebApplication` (IDEA или `./mvnw spring-boot:run`)
3. Загрузить файл: `curl -F "file=@results.jtl" http://localhost:8080/api/runs`

## Тесты

- `JtlParserTest` — unit-тесты парсера (валидный/таб/кавычки/success/ошибки шапки)
- `RunStatsControllerTest` — WebMvcTest статистики (мок сервиса)
- `SecurityConfigTest` — WebMvcTest авторизации (401 без кредов / 200 с `admin:admin` / 401 при неверном пароле)
- `JtlwebApplicationTests` — поднятие контекста

Запуск: `./mvnw test` (для `JtlwebApplicationTests` нужен запущенный Postgres: `docker compose up -d`).

## Roadmap

- `GET /api/runs/{id}/samples` — строки запуска (пагинация, основные колонки)
