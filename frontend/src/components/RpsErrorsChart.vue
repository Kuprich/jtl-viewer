<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TimeSeriesPoint } from '../types'
import { useLineChart } from '../composables/useLineChart'
import { chartColors, makeTooltipLabel, makeVuDataset } from '../utils/chartTheme'

const props = defineProps<{
  series: TimeSeriesPoint[]
  rateMode: boolean
  lineWidth: number
  pointSize: number
  fillOpacity: number
  showVu?: boolean
  vuData?: (number | null)[]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

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

const yMax = computed(() => (props.rateMode ? 100 : undefined))

function formatValue(v: number): string {
  return v.toFixed(2)
}

useLineChart({
  canvas,
  deps: () => [
    props.series,
    props.rateMode,
    props.lineWidth,
    props.pointSize,
    props.fillOpacity,
    props.showVu,
    props.vuData,
  ],
  render: () => {
    const alpha = props.fillOpacity / 100
    const fill = alpha > 0
    const errDs = {
      label: errLabel.value,
      data: props.rateMode ? data.value.errRate : data.value.err,
      borderColor: chartColors.error,
      backgroundColor: `rgba(245, 108, 108, ${alpha})`,
      borderWidth: props.lineWidth,
      pointRadius: props.pointSize,
      pointHoverRadius: 6,
      pointHitRadius: 8,
      tension: 0.25,
      fill,
    }
    const datasets: unknown[] = []
    if (!props.rateMode) {
      datasets.push({
        label: 'RPS',
        data: data.value.rps,
        borderColor: chartColors.rps,
        backgroundColor: `rgba(79, 195, 247, ${alpha})`,
        borderWidth: props.lineWidth,
        pointRadius: props.pointSize,
        pointHoverRadius: 6,
        pointHitRadius: 8,
        tension: 0.25,
        fill,
      })
    }
    datasets.push(errDs)
    if (props.showVu) datasets.push(makeVuDataset(props.vuData))
    return {
      labels: data.value.labels,
      datasets,
      yTitle: 'Значение',
      formatTick: formatValue,
      yMax: yMax.value,
      tooltipLabel: makeTooltipLabel(formatValue, props.rateMode ? '%' : ''),
      scales: { yVu: { display: props.showVu } },
    }
  },
})
</script>

<template>
  <div class="canvas-wrap">
    <canvas ref="canvas" />
    <div v-if="!series.length" class="chart-empty">Нет данных</div>
  </div>
</template>