# jtl-viewer

Web application for uploading JMeter JTL files and visualizing load test results: response times, throughput, errors, traffic — with HTML report export and a multilingual (RU/EN) interface.

## Features

- **Upload JTL files** via drag & drop — auto-detects the separator (tab/comma), CSV tokenization handles quoted fields, data is written to the database in batched transactions.
- **Run dashboard** — KPI cards: requests, RPS, errors, error rate, duration, incoming/outgoing traffic.
- **Charts**:
  - Response time percentiles (p50/p90/p95/p99) across all operations and per operation
  - Throughput (RPS/RPM/RPH) and errors (Errors/sec / Errors %)
  - Call frequency by operation
  - Traffic in bits/sec (incoming/outgoing)
  - Virtual users (VU) overlay
- **Operations filter** — dual-list picker with drag & drop and multi-select; the selection is saved per run.
- **Statistics grouping** — by scenario / response code / error message, with configurable table columns.
- **Zoom by selection** on any chart — double-click to reset.
- **Display settings** — dark/light theme, aggregation interval (including auto), line width, point size, area fill, error threshold, load units.
- **HTML report export** — pick the panels to include (KPI, charts, grouping tables), export theme, everything rendered as a standalone HTML file.
- **RU/EN interface** — English by default, the choice is persisted in `localStorage`.
- **HTTP Basic auth** with a custom login form.

<video src="https://github.com/user-attachments/assets/678af7a8-b066-4d9d-96dc-6d6970d55f15" controls width="100%"></video>

## Screenshots

Dark Theme:
![Dark Theme](./docs/screenshots/dark.png)

White Theme:
![White Theme](./docs/screenshots/white.png)

<p>
  <img src="./docs/screenshots/display_settings.png" alt="Display Settings" width="48%">
  <img src="./docs/screenshots/export.png" alt="Export parameters" width="48%">
</p>

## Tech stack

**Frontend**: Vue 3, TypeScript, Vite, Element Plus, Chart.js

**Backend**: Java 21, Spring Boot 4.1 (Spring MVC, Data JPA, Security)

**Database**: PostgreSQL 17, Apache Commons CSV, Lombok

**Deployment**: Docker (multi-stage build)

## Quick start (Docker)

```bash
docker compose up -d
```

Open http://localhost:8080 — a single container serves both the frontend and the `/api/**` endpoints.

Default credentials: `admin` / `admin` (see [Configuration](#configuration)).

Try it: upload the example file `examples/fakestore_v2.jtl` via the interface (drag & drop in the run list panel).

To stop and wipe all data:

```bash
docker compose down -v
```

## Configuration

The application is configured via environment variables:

| Variable | Description | Default |
| --- | --- | --- |
| `JTL_ADMIN_USERNAME` | Admin username | `admin` |
| `JTL_ADMIN_PASSWORD` | Admin password (plain or `{bcrypt}$2a$12$...`) | `admin` |
| `SPRING_DATASOURCE_URL` | JDBC URL of PostgreSQL | `jdbc:postgresql://localhost:5432/jtlweb` |
| `SPRING_DATASOURCE_USERNAME` | DB user | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | `postgres` |

For production, it is recommended to set the admin password as a prefixed-encoded value, e.g. bcrypt:

```bash
JTL_ADMIN_PASSWORD='{bcrypt}$2a$12$...'
```

Changes take effect on the next application start.

Multipart upload limits: `max-file-size` and `max-request-size` are set to 100 MB.

Check that the API works:

```bash
curl -u admin:admin http://localhost:8080/api/runs
```

## Local development

1. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

2. Run the backend (from `backend/jtlweb`):

   ```bash
   ./mvnw spring-boot:run
   ```

   By default it connects to `localhost:5432/jtlweb`.

3. Run the frontend (from `frontend`):

   ```bash
   npm install
   npm run dev
   ```

   Vite dev server proxies `/api/**` requests to `http://localhost:8080`.

## API

All `/api/**` endpoints are protected by HTTP Basic auth.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/runs` | Upload a JTL file (multipart `file`). Parses the file, stores rows, returns `{ id, fileName, uploadedAt, rows, errors }`. |
| `GET` | `/api/runs` | List of runs (newest first). |
| `GET` | `/api/runs/{id}` | Run info. |
| `GET` | `/api/runs/{id}/labels` | Operation labels of the run. |
| `GET` | `/api/runs/{id}/stats` | Stats grouped by `groupBy=label\|responseCode\|errorMessage`: counters, errors, percentiles, RPS, response volume. Filter by operations with repeatable `labels` param. |
| `GET` | `/api/runs/{id}/timeseries` | Time series (buckets with per-bucket metrics). Params: `bucketMs`, `label`, `labels`. |

Examples of requests and responses: [docs/api-examples.md](docs/api-examples.md).

### Upload behavior

- Mandatory header is checked (missing → `400`); the separator is auto-detected (tab/comma).
- Columns are mapped by name — order or missing columns are not critical.
- Data is written in chunks of 2000 rows in a single transaction (failure → full rollback).
- Errors are counted from the `success` column.

### Data model

- `jtl_run` — runs (fileName, uploadedAt, rows, errors)
- `jtl_sample` — JTL rows (17 columns: timeStamp, elapsed, label, success, responseCode, threadName, etc.), indexed by label/success/responseCode/threadName/timeStamp

### Errors

- Missing file / corrupted file / empty file without a header → `400` with a reason
- Everything else → `500`

## Project structure

```
.
├── backend/jtlweb     # Spring Boot application
├── frontend           # Vue 3 + Vite application
├── examples/          # sample JTL files
├── docs/              # documentation (API examples)
├── Dockerfile         # multi-stage build (frontend → backend → runtime)
└── docker-compose.yml # postgres + app
```

## Tests

- `JtlParserTest` — parser unit tests (valid / tab / quotes / success / header errors)
- `StatsServiceTest` — stats aggregation tests
- `RunStatsControllerTest` — WebMvcTest of stats (mocked service)
- `SecurityConfigTest` — WebMvcTest of auth (401 without credentials / 200 with `admin:admin` / 401 with wrong password)
- `JtlwebApplicationTests` — context startup

Run:

```bash
./mvnw test
```

`JtlwebApplicationTests` requires a running PostgreSQL (`docker compose up -d postgres`).

## Roadmap

- `GET /api/runs/{id}/samples` — run rows (pagination, core columns)
