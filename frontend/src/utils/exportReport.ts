import type { GroupBy, StatDto } from '../types'
import { formatBytes, formatMs, formatNumber, formatPercent, formatRps } from './format'
import { RATE_UNIT_FACTOR, RATE_UNIT_LABEL, type RateUnit } from './rateUnit'

export interface ReportChart {
  title: string
  dataUrl: string
}

export interface ReportKpi {
  label: string
  value: string
  danger: boolean
}

export interface ReportTable {
  groupBy: GroupBy
  title: string
  stats: StatDto[]
}

export interface ExportReportData {
  fileName: string
  uploadedAt: string
  testRange: { start: string; end: string; duration: string } | null
  kpis: ReportKpi[]
  charts: ReportChart[]
  tables: ReportTable[]
  rateUnit: RateUnit
  visibleCols: Set<string>
  theme: 'dark' | 'light'
  includeKpis: boolean
}

const STAT_COLUMNS = [
  { key: 'calls', label: 'Запросы', format: (s: StatDto) => formatNumber(s.calls) },
  { key: 'errors', label: 'Ошибки', format: (s: StatDto) => formatNumber(s.errors) },
  { key: 'errorRate', label: 'Errors %', format: (s: StatDto) => formatPercent(s.errorRate) },
  { key: 'min', label: 'Min', format: (s: StatDto) => formatMs(s.min) },
  { key: 'avg', label: 'Avg', format: (s: StatDto) => formatMs(s.avg) },
  { key: 'p50', label: 'p50', format: (s: StatDto) => formatMs(s.p50) },
  { key: 'p90', label: 'p90', format: (s: StatDto) => formatMs(s.p90) },
  { key: 'p95', label: 'p95', format: (s: StatDto) => formatMs(s.p95) },
  { key: 'p99', label: 'p99', format: (s: StatDto) => formatMs(s.p99) },
  { key: 'max', label: 'Max', format: (s: StatDto) => formatMs(s.max) },
  { key: 'throughput', label: null, format: (s: StatDto, rateUnit: RateUnit) => formatRps(s.throughput * RATE_UNIT_FACTOR[rateUnit]) },
  { key: 'avgBytes', label: 'Ср. байт', format: (s: StatDto) => formatBytes(s.avgBytes) },
] as const

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return map[c] ?? c
  })
}

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, '_').trim()
  return (cleaned || 'report').replace(/\.html$/i, '')
}

function statsTableHtml(table: ReportTable, rateUnit: RateUnit, visibleCols: Set<string>): string {
  const { stats, groupBy } = table
  const columns = STAT_COLUMNS.filter((c) => c.key === 'throughput' ? visibleCols.has('throughput') : visibleCols.has(c.key))
  const groupLabel = groupBy === 'errorMessage' ? 'Ошибка' : groupBy === 'responseCode' ? 'Код ответа' : 'Сценарий'

  const head = `<tr><th class="left">${groupLabel}</th>${columns
    .map((c) => `<th class="num">${escapeHtml(c.label ?? RATE_UNIT_LABEL[rateUnit])}</th>`)
    .join('')}</tr>`
  const body = stats
    .map(
      (s) =>
        `<tr><td class="left">${escapeHtml(s.group)}</td>${columns
          .map((c) => `<td class="num">${c.format(s, rateUnit)}</td>`)
          .join('')}</tr>`,
    )
    .join('')

  return `<table class="stats"><thead>${head}</thead><tbody>${body}</tbody></table>`
}

function buildHtml(data: ExportReportData): string {
  const date = new Date(data.uploadedAt)
  const uploaded = isNaN(date.getTime())
    ? ''
    : `<p class="uploaded">Загружен: ${escapeHtml(date.toLocaleString('ru-RU'))}</p>`

  const meta = data.testRange
    ? `<p class="meta">Тест: ${escapeHtml(data.testRange.start)} – ${escapeHtml(data.testRange.end)} (${escapeHtml(data.testRange.duration)})</p>`
    : ''

  const kpis = data.kpis
    .map((k) => `<div class="kpi"><div class="kpi-label">${escapeHtml(k.label)}</div><div class="kpi-value${k.danger ? ' danger' : ''}">${escapeHtml(k.value)}</div></div>`)
    .join('')

  const charts = data.charts
    .map(
      (c) =>
        `<section class="chart"><h2>${escapeHtml(c.title)}</h2><img src="${c.dataUrl}" alt="${escapeHtml(c.title)}" /></section>`,
    )
    .join('')

  const dark = data.theme === 'dark'
  const colorScheme = dark ? 'dark' : 'light'
  const bg = dark ? '#1b1d20' : '#ffffff'
  const text = dark ? '#e4e6ea' : '#1f2933'
  const muted = dark ? '#8b919a' : '#52606d'
  const border = dark ? '#33363b' : '#e4e7eb'
  const kpiBg = dark ? '#222529' : '#f7f9fb'
  const thBg = dark ? '#2a2d33' : '#f0f3f6'
  const altRow = dark ? '#202226' : '#fafbfc'

  const kpiBlock = data.includeKpis ? `<div class="kpis">${kpis}</div>` : ''
  const tableBlock = data.tables
    .map(
      (t) =>
        `<section class="chart"><h2>Группировка и статистика — ${escapeHtml(t.title)}</h2>${statsTableHtml(t, data.rateUnit, data.visibleCols)}</section>`,
    )
    .join('')

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(data.fileName)} — отчёт jtl-viewer</title>
<style>
  :root { color-scheme: ${colorScheme}; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px; background: ${bg}; color: ${text}; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .uploaded, .meta { margin: 2px 0; color: ${muted}; font-size: 13px; }
  .kpis { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; max-width: 1300px; }
  .kpi { flex: 1 1 150px; padding: 12px 16px; border: 1px solid ${border}; border-radius: 8px; background: ${kpiBg}; }
  .kpi-label { font-size: 12px; color: ${muted}; margin-bottom: 6px; }
  .kpi-value { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 22px; }
  .kpi-value.danger { color: #e63946; }
  section.chart { margin: 24px 0; page-break-inside: avoid; }
  section.chart h2 { font-size: 16px; margin: 0 0 10px; }
  section.chart img { width: 100%; max-width: 1300px; height: auto; border: 1px solid ${border}; border-radius: 8px; background: ${bg}; }
  .stats { width: 100%; max-width: 1300px; border-collapse: collapse; font-size: 13px; }
  .stats th, .stats td { padding: 6px 10px; border-bottom: 1px solid ${border}; text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space: nowrap; }
  .stats th { background: ${thBg}; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  .stats th.left, .stats td.left { text-align: left; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  .stats tbody tr:nth-child(even) { background: ${altRow}; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>${escapeHtml(data.fileName)}</h1>
  ${uploaded}
  ${meta}
  ${kpiBlock}
  ${charts}
  ${tableBlock}
</body>
</html>
`
}

export function downloadReportHtml(data: ExportReportData): void {
  const html = buildHtml(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFileName(data.fileName)}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
