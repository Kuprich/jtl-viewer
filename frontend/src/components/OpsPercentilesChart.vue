<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart } from 'chart.js/auto'
import type { TimeSeriesPoint } from '../types'

export type Percentile = 'p50' | 'p90' | 'p95' | 'p99'

const props = defineProps<{
  axis: number[]
  series: { label: string; points: TimeSeriesPoint[] }[]
  percentile: Percentile
  lineWidth: number
  pointSize: number
  fillOpacity: number
}>()

const PALETTE = [
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
]

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const labels = computed(() => props.axis.map((b) => new Date(b).toLocaleTimeString('ru-RU')))

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const datasets = computed(() =>
  props.series.map((s, i) => {
    const byBucket = new Map(s.points.map((p) => [p.bucket, p]))
    const alpha = props.fillOpacity / 100
    return {
      label: s.label,
      data: props.axis.map((b) => {
        const point = byBucket.get(b)
        return point && point.calls > 0 ? point[props.percentile] : null
      }),
      borderColor: PALETTE[i % PALETTE.length],
      backgroundColor: alpha > 0 ? hexToRgba(PALETTE[i % PALETTE.length], alpha) : 'transparent',
      borderWidth: props.lineWidth,
      pointRadius: props.pointSize,
      pointHoverRadius: 6,
      pointHitRadius: 8,
      tension: 0.25,
      spanGaps: false,
      fill: alpha > 0,
    }
  }),
)

function formatValue(v: number): string {
  return `${Math.round(v)} ms`
}

function render() {
  if (!chart) return
  chart.data.labels = labels.value
  chart.data.datasets = datasets.value as never
  chart.update()
}

onMounted(() => {
  if (!canvas.value) return
  chart = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: labels.value,
      datasets: datasets.value as never,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: 'bottom',
          align: 'start',
          labels: {
            color: '#e4e6ea',
            boxWidth: 12,
            boxHeight: 12,
          },
        },
        tooltip: {
          backgroundColor: '#26282d',
          titleColor: '#e4e6ea',
          bodyColor: '#e4e6ea',
          borderColor: '#33363b',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatValue(ctx.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#8b919a', maxRotation: 0, autoSkipPadding: 24 },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          beginAtZero: true,
          position: 'left',
          ticks: { color: '#8b919a', callback: (v) => formatValue(Number(v)) },
          grid: { color: '#33363b' },
          title: { display: true, text: 'Время отклика', color: '#8b919a' },
        },
      },
    },
  })
  render()
})

watch(
  [
    () => props.axis,
    () => props.series,
    () => props.percentile,
    () => props.lineWidth,
    () => props.pointSize,
    () => props.fillOpacity,
  ],
  render,
)

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="canvas-wrap">
    <canvas ref="canvas" />
    <div v-if="!axis.length || !series.length" class="chart-empty">Нет данных</div>
  </div>
</template>

<style scoped>
.canvas-wrap {
  position: relative;
  height: 320px;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b919a;
  font-size: 13px;
}
</style>
