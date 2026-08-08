# Примеры API

Все ответы — JSON. Ошибки возвращаются в виде `{ "error": "..." }`.

## POST /api/runs — загрузка JTL-файла

Запрос (multipart, параметр `file`):

```bash
curl -F "file=@results.jtl" http://localhost:8080/api/runs
```

Ответ 200:

```json
{
  "id": 1,
  "fileName": "results.jtl",
  "uploadedAt": "2026-08-02T17:59:30.264550527Z",
  "rows": 1502,
  "errors": 50
}
```

Ошибки (400):

```json
{ "error": "Missing file part" }
```

```json
{ "error": "File is empty: expected a JTL header (timeStamp,elapsed,label,...)" }
```

## GET /api/runs — список прогонов

```bash
curl http://localhost:8080/api/runs
```

Ответ 200 (от новых к старым):

```json
{
  "items": [
    {
      "id": 1,
      "fileName": "results.jtl",
      "uploadedAt": "2026-08-02T17:59:30.264550527Z",
      "rows": 1502,
      "errors": 50
    }
  ],
  "total": 1
}
```

## GET /api/runs/{id} — один прогон

```bash
curl http://localhost:8080/api/runs/1
```

Ответ 200 (помимо общих полей — временной интервал теста в мс Unix-epoch; `null`, если сэмплов нет):

```json
{
  "id": 1,
  "fileName": "results.jtl",
  "uploadedAt": "2026-08-02T17:59:30.264550527Z",
  "rows": 1502,
  "errors": 50,
  "startTime": 1785667680000,
  "endTime": 1785667800000,
  "durationMs": 120000
}
```

Ошибка 404:

```json
{ "error": "Run 4 not found" }
```

## GET /api/runs/{id}/labels — список операций прогона

```bash
curl http://localhost:8080/api/runs/1/labels
```

Ответ 200:

```json
["TC_Controller", "UC01_Get_products", "UC02_Get_product", "UC03_Get_carts", "UC04_Get_cart"]
```

## GET /api/runs/{id}/stats — статистика по группам

`groupBy`: `label` (по умолчанию), `responseCode`, `errorMessage`.
`labels` — повторяемый параметр: учитывать только указанные операции (опционально; по умолчанию — все операции прогона).

```bash
curl http://localhost:8080/api/runs/1/stats
curl "http://localhost:8080/api/runs/1/stats?groupBy=responseCode"
curl "http://localhost:8080/api/runs/1/stats?labels=UC01_Get_products&labels=UC02_Get_product"
```

Ответ 200 (`groupBy=label`, elapsed в мс, группы отсортированы по `calls`):

```json
[
  {
    "group": "UC01_Get_products",
    "calls": 302,
    "errors": 0,
    "errorRate": 0.0,
    "min": 147,
    "max": 1195,
    "avg": 172.6,
    "p50": 162.5,
    "p90": 189.0,
    "p95": 196.0,
    "p99": 406.5,
    "throughput": 0.2,
    "totalBytes": 3445364,
    "avgBytes": 11408.5
  },
  {
    "group": "Transaction Controller",
    "calls": 300,
    "errors": 25,
    "errorRate": 8.3,
    "min": 569,
    "max": 1636,
    "avg": 616.2,
    "p50": 605.0,
    "p90": 633.3,
    "p95": 649.0,
    "p99": 860.1,
    "throughput": 0.2,
    "totalBytes": 4579227,
    "avgBytes": 15264.1
  },
  {
    "group": "UC02_Get_product",
    "calls": 300,
    "errors": 25,
    "errorRate": 8.3,
    "min": 70,
    "max": 330,
    "avg": 78.0,
    "p50": 76.0,
    "p90": 79.0,
    "p95": 80.1,
    "p99": 86.0,
    "throughput": 0.2,
    "totalBytes": 377055,
    "avgBytes": 1256.9
  },
  {
    "group": "UC03_Get_carts",
    "calls": 300,
    "errors": 0,
    "errorRate": 0.0,
    "min": 175,
    "max": 439,
    "avg": 182.9,
    "p50": 182.0,
    "p90": 187.0,
    "p95": 189.0,
    "p99": 197.0,
    "throughput": 0.2,
    "totalBytes": 510648,
    "avgBytes": 1702.2
  },
  {
    "group": "UC04_Get_cart",
    "calls": 300,
    "errors": 0,
    "errorRate": 0.0,
    "min": 174,
    "max": 295,
    "avg": 182.6,
    "p50": 181.0,
    "p90": 190.0,
    "p95": 194.0,
    "p99": 199.0,
    "throughput": 0.2,
    "totalBytes": 268964,
    "avgBytes": 896.5
  }
]
```

Пояснение полей:

- `calls` / `errors` — запросов и ошибок в группе
- `errorRate` — доля ошибок, %
- `min` / `max` / `avg` / `p50` / `p90` / `p95` / `p99` — время ответа (мс)
- `throughput` — запросов в секунду (RPS)
- `totalBytes` / `avgBytes` — объём ответов

Ошибки:

```bash
curl -w "\n%{http_code}" "http://localhost:8080/api/runs/1/stats?groupBy=bogus"
```

```json
{ "error": "Unsupported groupBy: bogus" }
```

```bash
curl -w "\n%{http_code}" http://localhost:8080/api/runs/999/stats
```

```json
{ "error": "Run 999 not found" }
```

## GET /api/runs/{id}/timeseries — временной ряд

Бакеты по времени. `bucketMs` — размер бакета в мс (опционально, по умолчанию подбирается автоматически под длительность прогона, ~100 точек). `label` — фильтр по сценарию (опционально). `labels` — повторяемый параметр: учитывать только указанные операции (опционально).

```bash
curl http://localhost:8080/api/runs/1/timeseries
curl "http://localhost:8080/api/runs/1/timeseries?bucketMs=1000"
curl "http://localhost:8080/api/runs/1/timeseries?bucketMs=60000&label=UC01_Get_products"
curl "http://localhost:8080/api/runs/1/timeseries?bucketMs=1000&labels=UC01_Get_products&labels=UC02_Get_product"
```

Ответ 200 (`bucketMs=1000`):

```json
[
  {
    "bucket": 1785667716000,
    "calls": 2,
    "errors": 0,
    "min": 358,
    "max": 784,
    "avg": 571.0,
    "p50": 571.0,
    "p90": 741.4,
    "p95": 762.7,
    "p99": 779.7,
    "throughput": 2.0,
    "totalBytes": 26654
  },
  {
    "bucket": 1785667717000,
    "calls": 1,
    "errors": 0,
    "min": 74,
    "max": 74,
    "avg": 74.0,
    "p50": 74.0,
    "p90": 74.0,
    "p95": 74.0,
    "p99": 74.0,
    "throughput": 1.0,
    "totalBytes": 1273
  }
]
```

Пояснение полей:

- `bucket` — начало интервала (мс, Unix-epoch)
- `calls` / `errors` — запросов и ошибок в бакете
- `min` / `max` / `avg` / `p50` / `p90` / `p95` / `p99` — время ответа (мс)
- `throughput` — запросов в секунду (RPS) в бакете
- `totalBytes` — объём ответов в бакете

Пустые интервалы возвращаются с нулями (непрерывный ряд для графика). Ошибки:

```bash
curl -w "\n%{http_code}" "http://localhost:8080/api/runs/1/timeseries?bucketMs=0"
```

```json
{ "error": "Invalid bucketMs: 0 (must be > 0)" }
```

```bash
curl -w "\n%{http_code}" http://localhost:8080/api/runs/999/timeseries
```

```json
{ "error": "Run 999 not found" }
```
