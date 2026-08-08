<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart } from 'chart.js/auto'
import type { TimeSeriesPoint } from '../types'

const props = defineProps<{
  series: TimeSeriesPoint[]
  rateMode: boolean
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const data = computed(() => {
  const points = props.series
  const bucketMs = points.length > 1 ? points[1].bucket - points[0].bucket : 0
  const secPerBucket = bucketMs > 0 ? bucketMs / 1000 : 0
  return {
    labels: points.map((p) => new Date(p.bucket).toLocaleTimeString('ru-RU')),
    rps: points.map((p) => (p.calls > 0 ? p.throughput : null)),
    err: points.map((p) =>
      p.calls > 0 ? (secPerBucket > 0 ? Math.round((p.errors / secPerBucket) * 100) / 100 : 0) : null,
    ),
    errRate: points.map((p) => (p.calls > 0 ? (p.errors / p.calls) * 100 : null)),
  }
})

const errLabel = computed(() => (props.rateMode ? 'Errors %' : 'Errors/sec'))

function formatValue(v: number): string {
  return v.toFixed(2)
}

function buildDatasets() {
  const errDs = {
    label: errLabel.value,
    data: props.rateMode ? data.value.errRate : data.value.err,
    borderColor: '#f56c6c',
    backgroundColor: 'rgba(245, 108, 108, 0.1)',
    borderWidth: 2,
    pointRadius: 2,
    pointHoverRadius: 6,
    pointHitRadius: 8,
    tension: 0.25,
    fill: false,
  }
  if (props.rateMode) return [errDs]
  return [
    {
      label: 'RPS',
      data: data.value.rps,
      borderColor: '#4fc3f7',
      backgroundColor: 'rgba(79, 195, 247, 0.1)',
      borderWidth: 2,
      pointRadius: 2,
      pointHoverRadius: 6,
      pointHitRadius: 8,
      tension: 0.25,
      fill: false,
    },
    errDs,
  ]
}

const yMax = computed(() => (props.rateMode ? 100 : undefined))

function render() {
  if (!chart) return
  chart.data.labels = data.value.labels
  chart.data.datasets = buildDatasets() as never
  const y = chart.options.scales?.y
  if (y) y.max = yMax.value
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
              const v = ctx.parsed.y ?? 0
              const suffix = ctx.dataset.label === 'Errors %' ? '%' : ''
              return `${ctx.dataset.label}: ${formatValue(v)}${suffix}`
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
          title: { display: true, text: 'Значение', color: '#8b919a' },
        },
      },
    },
  })
  render()
})

watch([() => props.series, () => props.rateMode], render)

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
