<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TimeSeriesPoint } from '../types'
import { useLineChart } from '../composables/useLineChart'
import { chartColors, hexToRgba, makeTooltipLabel } from '../utils/chartTheme'

const props = defineProps<{
  series: TimeSeriesPoint[]
  lineWidth: number
  pointSize: number
  fillOpacity: number
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

const data = computed(() => ({
  labels: props.series.map((p) => new Date(p.bucket).toLocaleTimeString('ru-RU')),
  vu: props.series.map((p) => (p.calls > 0 ? p.threads : null)),
}))

function formatValue(v: number): string {
  return v >= 100 ? Math.round(v).toString() : Number(v.toFixed(2)).toString()
}

useLineChart({
  canvas,
  deps: () => [props.series, props.lineWidth, props.pointSize, props.fillOpacity],
  render: () => {
    const alpha = props.fillOpacity / 100
    return {
      labels: data.value.labels,
      datasets: [
        {
          label: 'Виртуальные пользователи',
          data: data.value.vu,
          borderColor: chartColors.vusers,
          backgroundColor: alpha > 0 ? hexToRgba(chartColors.vusers, alpha) : 'transparent',
          borderWidth: props.lineWidth,
          pointRadius: props.pointSize,
          pointHoverRadius: 6,
          pointHitRadius: 8,
          tension: 0.25,
          fill: alpha > 0,
        },
      ],
      yTitle: 'Виртуальные пользователи',
      formatTick: formatValue,
      tooltipLabel: makeTooltipLabel(formatValue),
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