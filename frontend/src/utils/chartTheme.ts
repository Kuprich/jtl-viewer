import type { ChartOptions, ScaleOptions } from 'chart.js'
import { t } from '../i18n'

function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export const chartColors = {
  get text() {
    return cssVar('--chart-text', '#e4e6ea')
  },
  get muted() {
    return cssVar('--chart-muted', '#8b919a')
  },
  get grid() {
    return cssVar('--chart-grid', '#33363b')
  },
  get faintGrid() {
    return cssVar('--chart-faint', 'rgba(255,255,255,0.04)')
  },
  get tooltipBg() {
    return cssVar('--chart-tooltip-bg', '#26282d')
  },
  get tooltipBorder() {
    return cssVar('--chart-tooltip-border', '#33363b')
  },
  rps: '#4fc3f7',
  error: '#f56c6c',
  get vu() {
    return cssVar('--chart-text', '#e4e6ea')
  },
  vusers: '#9c88ff',
}

export const percentilePalette = [
  { field: 'p50', label: 'p50', color: '#81c784' },
  { field: 'p90', label: 'p90', color: '#4fc3f7' },
  { field: 'p95', label: 'p95', color: '#ffd54f' },
  { field: 'p99', label: 'p99', color: '#f56c6c' },
] as const

export const opPalette = [
  '#4fc3f7',
  '#f56c6c',
  '#ffd54f',
  '#81c784',
  '#ba68c8',
  '#ff8a65',
  '#4dd0e1',
  '#aed581',
  '#f06292',
  '#fff176',
] as const

export function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function makeVuDataset(vuData: (number | null)[] = []) {
  return {
    label: 'VU',
    data: vuData,
    borderColor: chartColors.vu,
    backgroundColor: 'transparent',
    borderWidth: 1,
    pointRadius: 1,
    pointHoverRadius: 6,
    pointHitRadius: 8,
    tension: 0.25,
    spanGaps: false,
    fill: false,
    yAxisID: 'yVu',
  }
}

export interface ChartRender {
  labels: string[]
  datasets: unknown[]
  yTitle: string
  formatTick?: (v: number) => string
  yMax?: number
  tooltipLabel: TooltipLabel
  scales?: Record<string, Partial<ScaleOptions<'linear'>>>
}

interface TooltipCtx {
  parsed: { y?: number | null }
  dataset: { label?: string }
}

type TooltipLabel = (ctx: TooltipCtx) => string

export function makeTooltipLabel(format: (v: number) => string, suffix = ''): TooltipLabel {
  return (ctx) => {
    if (ctx.parsed.y == null) return ''
    const v = ctx.parsed.y ?? 0
    if (ctx.dataset.label === 'VU') return `VU: ${Math.round(v)}`
    return `${ctx.dataset.label}: ${format(v)}${suffix}`
  }
}

type LinearScales = NonNullable<ChartOptions<'line'>['scales']>

function mergeScales(overrides: ChartRender['scales'], scales: LinearScales): LinearScales {
  if (!overrides) return scales
  const out = scales as Record<string, Record<string, unknown>>
  for (const [id, partial] of Object.entries(overrides)) {
    out[id] = { ...out[id], ...partial }
  }
  return scales
}

export function buildOptions(r: ChartRender): ChartOptions<'line'> {
  const scales: LinearScales = {
    x: {
      ticks: { color: chartColors.muted, maxRotation: 0, autoSkipPadding: 24 },
      grid: { color: chartColors.faintGrid },
    },
    y: {
      beginAtZero: true,
      position: 'left',
      ticks: { color: chartColors.muted, callback: (v) => (r.formatTick ? r.formatTick(Number(v)) : String(v)) },
      grid: { color: chartColors.grid },
      title: { display: true, text: r.yTitle, color: chartColors.muted },
      max: r.yMax,
    },
    yVu: {
      position: 'right',
      beginAtZero: true,
      grid: { drawOnChartArea: false },
      ticks: { color: chartColors.muted },
      title: { display: true, text: t('chart.vu'), color: chartColors.muted },
    },
  }
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'bottom',
        align: 'start',
        labels: {
          color: chartColors.text,
          boxWidth: 12,
          boxHeight: 12,
          filter: (item, data) => {
            const ds = item.datasetIndex == null ? undefined : (data.datasets[item.datasetIndex] as { label?: unknown } | undefined)
            return ds?.label !== 'VU'
          },
        },
        onClick: (e, legendItem, legend) => {
          const chart = legend.chart
          const idx = legendItem.datasetIndex
          if (idx == null) return
          const datasets = chart.data.datasets as { label?: unknown }[]
          const isVu = (i: number) => datasets[i]?.label === 'VU'
          if (isVu(idx)) return
          const hidden = (i: number) => chart.getDatasetMeta(i).hidden === true
          const native = e.native as MouseEvent | null
          if (native && (native.ctrlKey || native.metaKey)) {
            chart.getDatasetMeta(idx).hidden = !hidden(idx)
            chart.update()
            return
          }
          const clickedHidden = hidden(idx)
          const othersVisible = datasets.some((_, i) => i !== idx && !isVu(i) && !hidden(i))
          const restore = !clickedHidden && !othersVisible
          datasets.forEach((_, i) => {
            if (isVu(i)) return
            chart.getDatasetMeta(i).hidden = restore ? false : i !== idx
          })
          chart.update()
        },
      },
      tooltip: {
        backgroundColor: chartColors.tooltipBg,
        titleColor: chartColors.text,
        bodyColor: chartColors.text,
        borderColor: chartColors.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        callbacks: { label: r.tooltipLabel },
      },
    },
    scales: mergeScales(r.scales, scales),
  }
}