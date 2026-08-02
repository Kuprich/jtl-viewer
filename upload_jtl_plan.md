# План реализации: инкремент 1 — upload JTL

Один эндпоинт `POST /api/runs`: парсит JTL-файл, пишет данные в БД, возвращает общую статистику.

1. **`pom.xml`**: добавить `spring-boot-starter-data-jpa`, `org.postgresql:postgresql` (runtime, версия из BOM Spring Boot), `commons-csv:1.10.0`.
2. **`docker-compose.yml`** (корень проекта): Postgres 17, `POSTGRES_DB=jtlweb`, `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`, порт `5433:5432` (5432 занят другим проектом), volume `pgdata`. Запуск: `docker compose up -d`.
3. **`application.yml`**: `jdbc:postgresql://localhost:5433/jtlweb`, `username=postgres`, `password=postgres`, `ddl-auto=update`, `hibernate.jdbc.batch_size` + `order_inserts`.
4. **Модель**: `JtlRun` (id, fileName, uploadedAt, rows, errors), `JtlSample` (id, runId, 17 колонок JTL), индексы на `(run_id, label/success/response_code/thread_name/time_stamp)`, `@ManyToOne`/`@JoinColumn(run_id)`.
5. **Репозитории**: `JtlRunRepository`, `JtlSampleRepository` (`JpaRepository`).
6. **`JtlParseException`** (RuntimeException).
7. **`JtlParser`**: `PushbackInputStream` → первая строка → разделитель (таб/запятая) → парсинг шапки Commons CSV → `isKnownHeader` (нет → exception) → маппинг имени колонки в индекс → стрим чанков по 2000 в `sink`, возврат `(rows, errors)`; ошибка = `success` не пустой/не true/не 1.
8. **`JtlImportService`**: `@Transactional` — сохранить `JtlRun`, прогнать чанки через `saveAll`, обновить rows/errors.
9. **`UploadController`**: `POST /api/runs` (multipart `file`) → `{ runId, fileName, uploadedAt, rows, errors }`.
10. **`ApiExceptionHandler`**: `JtlParseException`→400, иначе→500.
11. **Тесты**: `JtlParserTest` (валидный/таб/кавычки/success/без шапки/пустой), `JtlImportServiceTest` с **Testcontainers (Postgres)** на `results.jtl` (1502/50), `UploadControllerTest` (200/400); фикстура `src/test/resources/results.jtl`.
12. Проверка: `./mvnw test` (нужен запущенный Docker для Testcontainers).
