<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart } from 'chart.js/auto'
import type { TimeSeriesPoint } from '../types'

const props = defineProps<{
  series: TimeSeriesPoint[]
  lineWidth: number
  pointSize: number
  fillOpacity: number
}>()

const PERCENTILES = [
  { field: 'p50', label: 'p50' },
  { field: 'p90', label: 'p90' },
  { field: 'p95', label: 'p95' },
  { field: 'p99', label: 'p99' },
] as const

const COLORS = ['#81c784', '#4fc3f7', '#ffd54f', '#f56c6c']

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const labels = computed(() => props.series.map((p) => new Date(p.bucket).toLocaleTimeString('ru-RU')))

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const datasets = computed(() =>
  PERCENTILES.map((p, i) => {
    const alpha = props.fillOpacity / 100
    return {
      label: p.label,
      data: props.series.map((point) => (point.calls > 0 ? point[p.field] : null)),
      borderColor: COLORS[i],
      backgroundColor: alpha > 0 ? hexToRgba(COLORS[i], alpha) : 'transparent',
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

watch([() => props.series, () => props.lineWidth, () => props.pointSize, () => props.fillOpacity], render)

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="canvas-wrap">
    <canvas ref="canvas" />
    <div v-if="!series.length" class="chart-empty">Нет данных</div>
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