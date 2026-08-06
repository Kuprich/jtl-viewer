# jtl-viewer

Веб-приложение для загрузки JMeter JTL-файлов и хранения результатов нагрузочных тестов.

## Реализовано

### API

- `POST /api/runs` — загрузка JTL-файла (multipart `file`). Парсит файл, сохраняет строки в БД и возвращает общую статистику прогона: `{ id, fileName, uploadedAt, rows, errors }`.
- `GET /api/runs` — список прогонов (от новых к старым).
- `GET /api/runs/{id}` — информация о прогоне.
- `GET /api/runs/{id}/stats` — статистика по группам (`groupBy=label|threadName|responseCode`): счётчики, ошибки, перцентили, RPS, объём ответов.

Примеры запросов и ответов: [docs/api-examples.md](docs/api-examples.md).

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

- `jtl_run` — прогоны (fileName, uploadedAt, rows, errors)
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
- `JtlImportServiceTest` — интеграционный тест с Testcontainers (Postgres), включает проверку rollback

Запуск: `./mvnw test` (для интеграционного теста нужен запущенный Docker).

## Roadmap

- `GET /api/runs/{id}/samples` — строки прогона (пагинация, основные колонки)
- Фильтры в статистике (по времени, статусу, label/threadName/responseCode)
- Web-интерфейс
