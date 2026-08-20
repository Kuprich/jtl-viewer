<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TimeSeriesPoint } from '../types'
import { useLineChart, type ZoomRange } from '../composables/useLineChart'
import { useTheme } from '../composables/useTheme'
import { useI18n } from '../i18n'
import { chartColors, hexToRgba, makeTooltipLabel, makeVuDataset } from '../utils/chartTheme'
import { formatBits } from '../utils/format'

const { theme } = useTheme()
const { locale, t } = useI18n()

const props = withDefaults(
  defineProps<{
    series: TimeSeriesPoint[]
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

const labels = computed(() => props.series.map((p) => new Date(p.bucket).toLocaleTimeString('ru-RU')))

const bucketSec = computed(() => {
  const pts = props.series
  if (!pts.length) return 1
  if (pts.length < 2) return 1
  return Math.max(1, (pts[1].bucket - pts[0].bucket) / 1000)
})

const { selection } = useLineChart({
  canvas,
  deps: () => [
    props.series,
    props.lineWidth,
    props.pointSize,
    props.fillOpacity,
    props.showVu,
    props.vuData,
    props.zoomEnabled,
    props.visibleRange,
    theme.value,
    locale.value,
  ],
  render: () => {
    const alpha = props.fillOpacity / 100
    const sec = bucketSec.value
    const datasets: unknown[] = [
      {
        label: t('chart.incoming'),
        data: props.series.map((p) => (p.totalBytes > 0 ? p.totalBytes / sec : null)),
        borderColor: chartColors.rps,
        backgroundColor: alpha > 0 ? hexToRgba(chartColors.rps, alpha) : 'transparent',
        borderWidth: props.lineWidth,
        pointRadius: props.pointSize,
        pointHoverRadius: 6,
        pointHitRadius: 8,
        tension: 0.25,
        spanGaps: false,
        fill: alpha > 0,
      },
      {
        label: t('chart.outgoing'),
        data: props.series.map((p) => (p.sentBytes > 0 ? p.sentBytes / sec : null)),
        borderColor: chartColors.vusers,
        backgroundColor: alpha > 0 ? hexToRgba(chartColors.vusers, alpha) : 'transparent',
        borderWidth: props.lineWidth,
        pointRadius: props.pointSize,
        pointHoverRadius: 6,
        pointHitRadius: 8,
        tension: 0.25,
        spanGaps: false,
        fill: alpha > 0,
      },
    ]
    if (props.showVu) datasets.push(makeVuDataset(props.vuData))
    const scales: Record<string, { min?: number; max?: number; display?: boolean }> = {
      yVu: { display: props.showVu },
    }
    if (props.visibleRange) scales.x = { min: props.visibleRange.min, max: props.visibleRange.max }
    return {
      labels: labels.value,
      datasets,
      yTitle: t('chart.traffic'),
      formatTick: (v: number) => `${formatBits(v)}${t('format.perSec')}`,
      tooltipLabel: makeTooltipLabel((v) => formatBits(v), t('format.perSec')),
      scales,
    }
  },
  select: {
    enabled: () => props.zoomEnabled,
    onChange: (range) => emit('zoom', range),
  },
})

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
    <div v-if="!series.length" class="chart-empty">{{ t('chart.empty') }}</div>
  </div>
</template>