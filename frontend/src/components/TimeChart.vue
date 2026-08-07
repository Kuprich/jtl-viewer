<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart } from 'chart.js/auto'
import type { TimeSeriesPoint } from '../types'

const props = defineProps<{
  series: TimeSeriesPoint[]
  labels: string[]
  showScenario: boolean
  scenario: string
}>()

const emit = defineEmits<{
  'update:scenario': [value: string]
}>()

const metrics = [
  { value: 'avg', label: 'Avg' },
  { value: 'p50', label: 'p50' },
  { value: 'p90', label: 'p90' },
  { value: 'p95', label: 'p95' },
  { value: 'p99', label: 'p99' },
  { value: 'rps', label: 'RPS' },
  { value: 'errors', label: 'Ошибки' },
] as const

type MetricValue = (typeof metrics)[number]['value']

const metric = ref<MetricValue>('p95')

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const field = computed<keyof TimeSeriesPoint>(() => {
  switch (metric.value) {
    case 'p50':
      return 'p50'
    case 'p90':
      return 'p90'
    case 'p95':
      return 'p95'
    case 'p99':
      return 'p99'
    case 'rps':
      return 'throughput'
    case 'errors':
      return 'errors'
    default:
      return 'avg'
  }
})

const metricLabel = computed(() => metrics.find((m) => m.value === metric.value)?.label ?? '')

const data = computed(() => {
  const points = props.series
  return {
    labels: points.map((p) => new Date(p.bucket).toLocaleTimeString('ru-RU')),
    values: points.map((p) => p[field.value]),
  }
})

function formatValue(v: number): string {
  if (field.value === 'throughput') return v.toFixed(2)
  if (field.value === 'errors') return Math.round(v).toString()
  return `${Math.round(v)} ms`
}

function render() {
  if (!chart) return
  chart.data.labels = data.value.labels
  chart.data.datasets[0].data = data.value.values
  chart.data.datasets[0].label = metricLabel.value
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
          label: metricLabel.value,
          data: data.value.values,
          borderColor: '#4fc3f7',
          backgroundColor: 'rgba(79, 195, 247, 0.12)',
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 8,
          tension: 0.25,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
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
          ticks: { color: '#8b919a', callback: (v) => formatValue(Number(v)) },
          grid: { color: '#33363b' },
        },
      },
    },
  })
  render()
})

function onScenarioChange(v: string | number | boolean | undefined) {
  emit('update:scenario', typeof v === 'string' ? v : '')
}

watch([() => props.series, metric], render)

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="chart">
    <div class="chart-controls">
      <el-select v-model="metric" size="small" class="metric-select">
        <el-option v-for="m in metrics" :key="m.value" :label="m.label" :value="m.value" />
      </el-select>
      <el-select
        v-if="showScenario"
        :model-value="scenario"
        size="small"
        class="scenario-select"
        filterable
        clearable
        placeholder="Все сценарии"
        @update:model-value="onScenarioChange"
      >
        <el-option v-for="l in labels" :key="l" :label="l" :value="l" />
      </el-select>
    </div>
    <div class="canvas-wrap">
      <canvas ref="canvas" />
      <div v-if="!series.length" class="chart-empty">Нет данных</div>
    </div>
  </div>
</template>

<style scoped>
.chart-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.metric-select {
  width: 140px;
}

.scenario-select {
  width: 240px;
}

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
