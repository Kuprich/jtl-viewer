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

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const data = computed(() => ({
  labels: props.series.map((p) => new Date(p.bucket).toLocaleTimeString('ru-RU')),
  vu: props.series.map((p) => (p.calls > 0 ? p.threads : null)),
}))

function formatValue(v: number): string {
  return v >= 100 ? Math.round(v).toString() : Number(v.toFixed(2)).toString()
}

function buildDatasets() {
  const alpha = props.fillOpacity / 100
  const fill = alpha > 0
  return [
    {
      label: 'Виртуальные пользователи',
      data: data.value.vu,
      borderColor: '#9c88ff',
      backgroundColor: `rgba(156, 136, 255, ${alpha})`,
      borderWidth: props.lineWidth,
      pointRadius: props.pointSize,
      pointHoverRadius: 6,
      pointHitRadius: 8,
      tension: 0.25,
      fill,
    },
  ]
}

function render() {
  if (!chart) return
  chart.data.labels = data.value.labels
  chart.data.datasets = buildDatasets() as never
  chart.update()
}

onMounted(() => {
  if (!canvas.value) return
  chart = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: data.value.labels,
      datasets: buildDatasets() as never,
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
            label: (ctx) => {
              if (ctx.parsed.y == null) return ''
              return `${ctx.dataset.label}: ${formatValue(ctx.parsed.y)}`
            },
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
          title: { display: true, text: 'Виртуальные пользователи', color: '#8b919a' },
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
  height: 260px;
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