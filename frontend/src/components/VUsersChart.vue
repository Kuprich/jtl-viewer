<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TimeSeriesPoint } from '../types'
import { useLineChart, type ZoomRange } from '../composables/useLineChart'
import { chartColors, hexToRgba, makeTooltipLabel } from '../utils/chartTheme'

const props = withDefaults(
  defineProps<{
    series: TimeSeriesPoint[]
    lineWidth: number
    pointSize: number
    fillOpacity: number
    zoomEnabled?: boolean
    visibleRange?: ZoomRange | null
  }>(),
  { zoomEnabled: true, visibleRange: null },
)

const emit = defineEmits<{
  zoom: [range: ZoomRange | null]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

const data = computed(() => ({
  labels: props.series.map((p) => new Date(p.bucket).toLocaleTimeString('ru-RU')),
  vu: props.series.map((p) => (p.calls > 0 ? p.threads : null)),
}))

const { selection } = useLineChart({
  canvas,
  deps: () => [props.series, props.lineWidth, props.pointSize, props.fillOpacity, props.zoomEnabled, props.visibleRange],
  render: () => {
    const alpha = props.fillOpacity / 100
    const scales: Record<string, { min?: number; max?: number; display?: boolean }> = { yVu: { display: false } }
    if (props.visibleRange) scales.x = { min: props.visibleRange.min, max: props.visibleRange.max }
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
      scales,
    }
  },
  select: {
    enabled: () => props.zoomEnabled,
    onChange: (range) => emit('zoom', range),
  },
})

function formatValue(v: number): string {
  return v >= 100 ? Math.round(v).toString() : Number(v.toFixed(2)).toString()
}

const bandStyle = computed(() => {
  const s = selection.value
  if (!s) return {}
  const left = Math.min(s.x1, s.x2)
  const width = Math.abs(s.x2 - s.x1)
  return { left: `${left}px`, width: `${width}px` }
})
</script>

<template>
  <div class="canvas-wrap">
    <canvas ref="canvas" />
    <div v-if="selection" class="zoom-band" :style="bandStyle" />
    <div v-if="!series.length" class="chart-empty">Нет данных</div>
  </div>
</template>