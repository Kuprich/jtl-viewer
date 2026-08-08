<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart } from 'chart.js/auto'
import type { TimeSeriesPoint } from '../types'

const props = defineProps<{
  series: TimeSeriesPoint[]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const data = computed(() => {
  const points = props.series
  const bucketMs = points.length > 1 ? points[1].bucket - points[0].bucket : 0
  const secPerBucket = bucketMs > 0 ? bucketMs / 1000 : 0
  return {
    labels: points.map((p) => new Date(p.bucket).toLocaleTimeString('ru-RU')),
    rps: points.map((p) => p.throughput),
    err: points.map((p) => (secPerBucket > 0 ? Math.round((p.errors / secPerBucket) * 100) / 100 : 0)),
  }
})

function formatValue(v: number): string {
  return v.toFixed(2)
}

function render() {
  if (!chart) return
  chart.data.labels = data.value.labels
  chart.data.datasets[0].data = data.value.rps
  chart.data.datasets[1].data = data.value.err
  chart.update()
}

onMounted(() => {
  if (!canvas.value) return
  chart = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: data.value.labels,
      datasets: [
        {
          label: 'RPS',
          data: data.value.rps,
          borderColor: '#4fc3f7',
          backgroundColor: 'rgba(79, 195, 247, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 8,
          tension: 0.25,
          fill: false,
          yAxisID: 'y',
        },
        {
          label: 'Errors/sec',
          data: data.value.err,
          borderColor: '#f56c6c',
          backgroundColor: 'rgba(245, 108, 108, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 8,
          tension: 0.25,
          fill: false,
        },
      ],
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
          title: { display: true, text: 'Значение', color: '#8b919a' },
        },
      },
    },
  })
  render()
})

watch(() => props.series, render)

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
