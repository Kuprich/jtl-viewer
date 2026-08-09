<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TimeSeriesPoint } from '../types'
import { useLineChart } from '../composables/useLineChart'
import { hexToRgba, makeTooltipLabel, makeVuDataset, percentilePalette } from '../utils/chartTheme'

const props = defineProps<{
  series: TimeSeriesPoint[]
  lineWidth: number
  pointSize: number
  fillOpacity: number
  showVu?: boolean
  vuData?: (number | null)[]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

const labels = computed(() => props.series.map((p) => new Date(p.bucket).toLocaleTimeString('ru-RU')))

function msFormat(v: number): string {
  return `${Math.round(v)} ms`
}

useLineChart({
  canvas,
  deps: () => [props.series, props.lineWidth, props.pointSize, props.fillOpacity, props.showVu, props.vuData],
  render: () => {
    const alpha = props.fillOpacity / 100
    const datasets: unknown[] = percentilePalette.map((p) => ({
      label: p.label,
      data: props.series.map((point) => (point.calls > 0 ? point[p.field] : null)),
      borderColor: p.color,
      backgroundColor: alpha > 0 ? hexToRgba(p.color, alpha) : 'transparent',
      borderWidth: props.lineWidth,
      pointRadius: props.pointSize,
      pointHoverRadius: 6,
      pointHitRadius: 8,
      tension: 0.25,
      spanGaps: false,
      fill: alpha > 0,
    }))
    if (props.showVu) datasets.push(makeVuDataset(props.vuData))
    return {
      labels: labels.value,
      datasets,
      yTitle: 'Время отклика',
      formatTick: msFormat,
      tooltipLabel: makeTooltipLabel(msFormat),
      scales: { yVu: { display: props.showVu } },
    }
  },
})
</script>

<template>
  <div class="canvas-wrap" style="--chart-height: 320px">
    <canvas ref="canvas" />
    <div v-if="!series.length" class="chart-empty">Нет данных</div>
  </div>
</template>