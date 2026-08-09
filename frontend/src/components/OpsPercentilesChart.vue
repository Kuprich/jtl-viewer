<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TimeSeriesPoint } from '../types'
import { useLineChart } from '../composables/useLineChart'
import { hexToRgba, makeTooltipLabel, makeVuDataset, opPalette } from '../utils/chartTheme'

export type Percentile = 'p50' | 'p90' | 'p95' | 'p99'

const props = defineProps<{
  axis: number[]
  series: { label: string; points: TimeSeriesPoint[] }[]
  percentile: Percentile
  lineWidth: number
  pointSize: number
  fillOpacity: number
  showVu?: boolean
  vuData?: (number | null)[]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

const labels = computed(() => props.axis.map((b) => new Date(b).toLocaleTimeString('ru-RU')))

function msFormat(v: number): string {
  return `${Math.round(v)} ms`
}

useLineChart({
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
    <div v-if="!axis.length || !series.length" class="chart-empty">Нет данных</div>
  </div>
</template>