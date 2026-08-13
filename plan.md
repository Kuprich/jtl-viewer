# jtl-viewer — план проекта

Веб-приложение: загрузи JTL-файл JMeter -> получи графики. Инструмент анализа результатов нагрузочного тестирования для инженеров по производительности.

## Цели

- Решение ежедневной задачи инженера нагрузочного тестирования: быстрый и удобный разбор запусков.
- Приватность: данные не покидают машину, файлы не хранятся — подходит для корпоративных окружений.
- Тесты, обработка больших файлов, документация.

## Стек

- Backend: Spring Boot 4.1 (Maven), Java 21, Jackson, JUnit 5 + AssertJ
- Frontend: Vue 3 + Vite + Chart.js
- Хранилище: in-memory (UUID -> AnalysisResult, TTL), без БД
- Docker: multi-stage, один образ

## Архитектура

```
Backend: Spring Boot 4.1 REST API          Frontend: Vue 3 + Vite + Chart.js
  POST /api/upload  <- multipart JTL -------  Upload view (drag&drop, прогресс)
  GET  /api/analysis/{id}  -- JSON --------  Report view (KPI + графики)
  GET  /api/analysis/{id}/labels/{l}       ->  фильтр по label
  DELETE /api/analysis/{id}  + TTL-джоб       бакет-селектор
```

### Бэкенд (пакеты)

```
com.jtlweb/
  controller/  — UploadController, AnalysisController (тонкие REST)
  service/     — AnalysisService (оркестрация), TtlCleanupJob
  parser/      — JtlParser: потоковый CSV (кавычки, разделители, стриминг)
  stats/       — Percentiles (in-memory + t-digest), Bucketizer, ErrorTaxonomy
  model/       — JtlRecord, LabelStats, TimeSeries, AnalysisResult
  storage/     — InMemoryStore (UUID -> AnalysisResult, TTL)
```

`AnalysisResult`: summary (запросы, ошибки, throughput, общие перцентили) + labels + timeSeries (бакеты: count/avg/min/max/p95/errors/threads) + таксономия ошибок.

### REST API

| Метод | Путь | Назначение |
|---|---|---|
| POST | /api/upload | multipart JTL -> UUID |
| GET | /api/analysis/{id} | Полный JSON результата |
| GET | /api/analysis/{id}/labels/{label} | Данные по одному label |
| DELETE | /api/analysis/{id} | Очистка |

## Графики (весь набор, Chart.js)

Временные ряды (бакеты по времени): response time, throughput, active threads, error rate, latency vs connect, bytes.
Распределения: гистограмма response time, cumulative percentile, перцентили по label, ошибки pie (по коду) + bar (по сообщению).

## Ключевые механики

- Потоковый парсинг JTL (не грузим гигабайтные файлы в память целиком).
- Перцентили: точные in-memory + аппроксимация t-digest для больших файлов.
- Бакетизация по времени: streaming, O(1)/бакет (count, avg, min, max, errors); перцентили по бакету — через t-digest.
- Приватность: in-memory + TTL, файлы удаляются после парсинга.
- Тесты парсера и статистики на сгенерённых демо-JTL.

## Docker (один контейнер)

Multi-stage:

```
Stage 1 (node):   npm ci && npm run build   -> dist/
Stage 2 (maven):  mvn package              -> jar (фронтенд в static/)
Stage 3 (runtime): eclipse-temurin:21-jre  -> java -jar app.jar
```

Запуск: `docker run -p 8080:8080 jtl-viewer`.

## Этапы

1. Скелет: Spring REST + Vue/Vite, загрузка файла, потоковый парсер, summary-JSON, первый график. Генератор демо-JTL.
2. Статистика: перцентили (in-memory + t-digest), бакетизация по времени, throughput, таксономия ошибок.
3. Отчёт: KPI-карточки + весь набор графиков, фильтр по label, селектор бакета.
4. Docker: multi-stage сборка, проверка запуска.
5. Полировка: большие файлы + прогресс загрузки, README, тесты.

## Отложено (потенциальные фичи)

- Экспорт HTML / PDF (печать через браузер, позже Playwright).
- Сравнение запусков old vs new.
- БД + история запусков (volume в Docker).
- Поддержка Gatling / k6.
- Авторизация и многопользовательский режим.
