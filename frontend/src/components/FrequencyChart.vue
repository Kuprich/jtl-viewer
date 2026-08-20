<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart } from 'chart.js/auto'
import type { StatDto } from '../types'
import { useTheme } from '../composables/useTheme'
import { useI18n } from '../i18n'
import { chartColors, hexToRgba } from '../utils/chartTheme'
import { formatNumber, formatPercent } from '../utils/format'

const { theme } = useTheme()
const { locale, t } = useI18n()

const props = withDefaults(
  defineProps<{
    stats: StatDto[]
    errorThreshold?: number
  }>(),
  { errorThreshold: 5 },
)

const SUCCESS_COLOR = '#81c784'
const LABEL_FONT = '12px system-ui, sans-serif'

const ROW_HEIGHT = 34
const EXTRA = 64

const chartHeight = computed(() => {
  const n = props.stats.length
  return n ? Math.max(180, n * ROW_HEIGHT + EXTRA) : 180
})

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'bar'> | null = null

interface LabelPart {
  text: string
  color: string
}

function labelParts(s: StatDto): LabelPart[] {
  const ratio = s.errors > 0 && s.errorRate > props.errorThreshold ? chartColors.error : SUCCESS_COLOR
  return [
    { text: formatNumber(s.calls - s.errors), color: SUCCESS_COLOR },
    { text: ' / ', color: chartColors.text },
    { text: formatNumber(s.errors), color: s.errors > 0 ? chartColors.error : SUCCESS_COLOR },
    { text: ' - ', color: chartColors.text },
    { text: formatPercent(s.errorRate), color: ratio },
  ]
}

function barLabelText(s: StatDto): string {
  return labelParts(s)
    .map((p) => p.text)
    .join('')
}

function maxLabelWidth(): number {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return 150
  ctx.font = LABEL_FONT
  let max = 0
  for (const s of props.stats) {
    max = Math.max(max, ctx.measureText(barLabelText(s)).width)
  }
  return max
}

const barLabelPlugin = {
  id: 'barLabelPlugin',
  afterDatasetsDraw(c: Chart<'bar'>) {
    const ctx = c.ctx
    const meta = c.getDatasetMeta(1)
    ctx.save()
    ctx.font = LABEL_FONT
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = chartColors.text
    props.stats.forEach((s, i) => {
      const el = meta.data[i] as unknown as { x: number; y: number; width: number }
      if (el == null || el.x == null) return
      let x = el.x + 6
      for (const part of labelParts(s)) {
        ctx.fillStyle = part.color
        ctx.fillText(part.text, x, el.y)
        x += ctx.measureText(part.text).width
      }
    })
    ctx.restore()
  },
}

function applyLabelPadding() {
  if (!chart) return
  chart.options.layout = { padding: { right: maxLabelWidth() + 16 } }
}

function refresh() {
  if (!chart) return
  chart.data.labels = props.stats.map((s) => s.group)
  chart.data.datasets[0].data = props.stats.map((s) => s.calls - s.errors)
  chart.data.datasets[1].data = props.stats.map((s) => s.errors)
  applyLabelPadding()
  chart.update()
}

function buildChart() {
  chart?.destroy()
  chart = null
  if (!canvas.value) return
  chart = new Chart<'bar'>(canvas.value, {
    type: 'bar',
    data: {
      labels: props.stats.map((s) => s.group),
      datasets: [
        {
          label: t('chart.successful'),
          data: props.stats.map((s) => s.calls - s.errors),
          backgroundColor: hexToRgba(SUCCESS_COLOR, 0.9),
          borderRadius: 3,
          barThickness: 'flex',
          maxBarThickness: 22,
        },
        {
          label: t('chart.errors'),
          data: props.stats.map((s) => s.errors),
          backgroundColor: hexToRgba(chartColors.error, 0.9),
          borderRadius: 3,
          barThickness: 'flex',
          maxBarThickness: 22,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: 'y',
      layout: { padding: { right: 60 } },
      scales: {
        x: {
          beginAtZero: true,
          stacked: true,
          ticks: { color: chartColors.muted },
          grid: { color: chartColors.grid },
        },
        y: {
          stacked: true,
          ticks: { color: chartColors.muted },
          grid: { color: chartColors.faintGrid },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          align: 'start',
          labels: { color: chartColors.text, boxWidth: 12, boxHeight: 12 },
          onHover: (e) => {
            const target = e.native?.target as HTMLElement | null
            if (target) target.style.cursor = 'pointer'
          },
          onLeave: (e) => {
            const target = e.native?.target as HTMLElement | null
            if (target) target.style.cursor = ''
          },
        },
        tooltip: {
          backgroundColor: chartColors.tooltipBg,
          titleColor: chartColors.text,
          bodyColor: chartColors.text,
          borderColor: chartColors.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => {
              const s = props.stats[ctx.dataIndex]
              if (!s) return ''
              return `${t('chart.freqTooltip', { ok: formatNumber(s.calls - s.errors), err: formatNumber(s.errors) })}`
            },
            footer: (items) => {
              const s = props.stats[items[0]?.dataIndex ?? -1]
              return s ? [`Error: ${formatPercent(s.errorRate)}`] : []
            },
          },
        },
      },
    },
    plugins: [barLabelPlugin],
  })
  applyLabelPadding()
  chart.update()
}

onMounted(buildChart)

watch(() => [props.stats, props.errorThreshold], refresh)

watch(theme, buildChart)
watch(locale, buildChart)

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="canvas-wrap" :style="{ '--chart-height': chartHeight + 'px' }">
    <canvas ref="canvas" />
    <div v-if="!stats.length" class="chart-empty">{{ t('chart.empty') }}</div>
  </div>
</template>