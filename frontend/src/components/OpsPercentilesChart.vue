<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TimeSeriesPoint } from '../types'
import { useLineChart, type ZoomRange } from '../composables/useLineChart'
import { useTheme } from '../composables/useTheme'
import { hexToRgba, makeTooltipLabel, makeVuDataset, opPalette } from '../utils/chartTheme'

const { theme } = useTheme()

export type Percentile = 'p50' | 'p90' | 'p95' | 'p99'

const props = withDefaults(
  defineProps<{
    axis: number[]
    series: { label: string; points: TimeSeriesPoint[] }[]
    percentile: Percentile
    lineWidth: number
    pointSize: number
    fillOpacity: number
    showVu?: boolean
    vuData?: (number | null)[]
    zoomEnabled?: boolean
    visibleRange?: ZoomRange | null
  }>(),
  { showVu: false, vuData: () => [], zoomEnabled: true, visibleRange: null },
)

const emit = defineEmits<{
  zoom: [range: ZoomRange | null]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

const labels = computed(() => props.axis.map((b) => new Date(b).toLocaleTimeString('ru-RU')))

const { selection } = useLineChart({
  canvas,
  deps: () => [
    props.axis,
    props.series,
    props.percentile,
    props.lineWidth,
    props.pointSize,
    props.fillOpacity,
    props.showVu,
    props.vuData,
    props.zoomEnabled,
    props.visibleRange,
    theme.value,
  ],
  render: () => {
    const alpha = props.fillOpacity / 100
    const datasets: unknown[] = props.series.map((s, i) => {
      const byBucket = new Map(s.points.map((p) => [p.bucket, p]))
      return {
        label: s.label,
        data: props.axis.map((b) => {
          const point = byBucket.get(b)
          return point && point.calls > 0 ? point[props.percentile] : null
        }),
        borderColor: opPalette[i % opPalette.length],
        backgroundColor: alpha > 0 ? hexToRgba(opPalette[i % opPalette.length], alpha) : 'transparent',
        borderWidth: props.lineWidth,
        pointRadius: props.pointSize,
        pointHoverRadius: 6,
        pointHitRadius: 8,
        tension: 0.25,
        spanGaps: false,
        fill: alpha > 0,
      }
    })
    if (props.showVu) datasets.push(makeVuDataset(props.vuData))
    const scales: Record<string, { min?: number; max?: number; display?: boolean }> = {
      yVu: { display: props.showVu },
    }
    if (props.visibleRange) scales.x = { min: props.visibleRange.min, max: props.visibleRange.max }
    return {
      labels: labels.value,
      datasets,
      yTitle: 'Время отклика',
      formatTick: msFormat,
      tooltipLabel: makeTooltipLabel(msFormat),
      scales,
    }
  },
  select: {
    enabled: () => props.zoomEnabled,
    onChange: (range) => emit('zoom', range),
  },
})

function msFormat(v: number): string {
  return `${Math.round(v)} ms`
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
  <div class="canvas-wrap" style="--chart-height: 320px">
    <canvas ref="canvas" />
    <div v-if="selection" class="zoom-band" :style="bandStyle" />
    <div v-if="!axis.length || !series.length" class="chart-empty">Нет данных</div>
  </div>
</template>